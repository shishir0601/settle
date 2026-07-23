const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const fs = require("fs");

// Isolated DB for tests
process.env.SETTLE_DB = path.join(__dirname, "test-data.json");
const server = require("../server");

let base;

test.before(async () => {
  await new Promise((r) => server.listen(0, r));
  base = `http://localhost:${server.address().port}`;
});

test.after(() => {
  server.close();
  fs.rmSync(process.env.SETTLE_DB, { force: true });
});

async function api(method, p, body) {
  const res = await fetch(base + p, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json() };
}

test("full flow: group -> expenses -> optimal settlement", async () => {
  const { status, data: g } = await api("POST", "/api/groups", {
    name: "Goa Trip",
    members: ["Aarav", "Diya", "Kabir", "Meera"],
  });
  assert.equal(status, 201);
  const [a, d, k, m] = g.members.map((x) => x.id);

  await api("POST", `/api/groups/${g.id}/expenses`, {
    description: "Villa", amount: 8000, paidBy: a, splitAmong: [a, d, k, m],
  });
  await api("POST", `/api/groups/${g.id}/expenses`, {
    description: "Dinner", amount: 2400, paidBy: d, splitAmong: [d, k, m],
  });
  await api("POST", `/api/groups/${g.id}/expenses`, {
    description: "Scooters", amount: 1500, paidBy: k, splitAmong: [a, k],
  });

  const { data: s } = await api("GET", `/api/groups/${g.id}/settlement`);

  // Balances must sum to ~0
  const sum = s.balances.reduce((t, b) => t + b.balance, 0);
  assert.ok(Math.abs(sum) < 0.005, `balances sum to ${sum}`);

  // Optimal plan for 4 people: at most 3 transfers
  assert.ok(s.plan.length <= 3, `expected <=3 transfers, got ${s.plan.length}`);

  // Applying the plan zeroes everyone out
  const after = Object.fromEntries(s.balances.map((b) => [b.id, b.balance]));
  for (const t of s.plan) {
    after[t.from] += t.amount;
    after[t.to] -= t.amount;
  }
  for (const id of Object.keys(after)) {
    assert.ok(Math.abs(after[id]) < 0.005, `${id} left with ${after[id]}`);
  }
});

test("validation: rejects bad expenses with 400", async () => {
  const { data: g } = await api("POST", "/api/groups", { name: "V", members: ["X", "Y"] });
  const bad = await api("POST", `/api/groups/${g.id}/expenses`, {
    description: "x", amount: -5, paidBy: "nobody", splitAmong: [],
  });
  assert.equal(bad.status, 400);
});

test("unknown group returns 404", async () => {
  const res = await api("GET", "/api/groups/doesnotexist/settlement");
  assert.equal(res.status, 404);
});

test("expense delete works and updates settlement", async () => {
  const { data: g } = await api("POST", "/api/groups", { name: "Del", members: ["P", "Q"] });
  const [p, q] = g.members.map((x) => x.id);
  const { data: e } = await api("POST", `/api/groups/${g.id}/expenses`, {
    description: "Cab", amount: 300, paidBy: p, splitAmong: [p, q],
  });
  await api("DELETE", `/api/groups/${g.id}/expenses/${e.id}`);
  const { data: s } = await api("GET", `/api/groups/${g.id}/settlement`);
  assert.equal(s.plan.length, 0);
});
