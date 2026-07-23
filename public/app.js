/* Settle frontend — vanilla JS, talks to the REST API. */

const $ = (id) => document.getElementById(id);
let group = null;

// ---------- api ----------

async function api(method, path, body) {
  const res = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

// ---------- rendering ----------

const fmt = (n) =>
  "₹" + Math.abs(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function renderGroup() {
  $("group-setup").hidden = true;
  $("group-info").hidden = false;
  $("expense-card").hidden = false;
  $("expenses-list-card").hidden = false;
  $("empty-state").hidden = true;
  $("group-name-display").textContent = group.name;

  $("member-list").innerHTML = group.members
    .map((m) => `<li>${esc(m.name)}</li>`)
    .join("");

  $("exp-paidby").innerHTML = group.members
    .map((m) => `<option value="${m.id}">${esc(m.name)}</option>`)
    .join("");

  $("exp-split").innerHTML = group.members
    .map(
      (m) =>
        `<label><input type="checkbox" value="${m.id}" checked /> ${esc(m.name)}</label>`
    )
    .join("");

  renderExpenses();
  renderSettlement();
}

function renderExpenses() {
  const nameOf = Object.fromEntries(group.members.map((m) => [m.id, m.name]));
  $("exp-count").textContent = group.expenses.length ? `· ${group.expenses.length}` : "";
  $("expense-list").innerHTML = group.expenses.length ? group.expenses.map(e => `
    <li>
      <div class="exp-main">
        <div class="exp-desc">${esc(e.description)}</div>
        <div class="exp-meta">${esc(nameOf[e.paidBy] || "?")} paid · split ${e.splitAmong.length} ways</div>
      </div>
      <span class="exp-amt">${fmt(e.amount)}</span>
      <button class="exp-del" data-id="${e.id}" aria-label="Delete expense">✕</button>
    </li>`).join("") : `<li><div class="exp-meta">No expenses yet. Add the first one!</div></li>`;
}

async function renderSettlement() {
  if (!group.expenses.length) {
    $("receipt").hidden = true;
    $("empty-state").hidden = false;
    return;
  }
  
  $("empty-state").hidden = true;
  
  try {
    const s = await api("GET", `/api/groups/${group.id}/settlement`);
    $("receipt").hidden = false;
    $("receipt-date").textContent = new Date().toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    });

    $("balances").innerHTML = s.balances
      .map((b) => {
        const isPos = b.balance > 0.004, isNeg = b.balance < -0.004;
        const cls = isPos ? "pos" : isNeg ? "neg" : "";
        const sign = isPos ? "+" : isNeg ? "−" : "";
        return `<div class="receipt-row"><span>${esc(b.name)}</span><span class="${cls}">${sign}${fmt(b.balance)}</span></div>`;
      })
      .join("");

    $("plan").innerHTML = s.plan.length ? s.plan.map((t) =>
      `<div class="plan-row"><span>${esc(t.fromName)} <span class="plan-arrow">→</span> ${esc(t.toName)}</span><span class="plan-amt">${fmt(t.amount)}</span></div>`)
      .join("") : `<div class="all-settled">✨ All settled — nobody owes anything!</div>`;

    const saved = s.naiveTransferCount - s.plan.length;
    $("receipt-stat").textContent =
      s.plan.length === 0
        ? "✅ 0 transfers needed"
        : `${s.plan.length} transfer${s.plan.length > 1 ? "s" : ""} needed · ${saved > 0 ? "💰 " + saved + " fewer than pairwise IOUs" : "already minimal"}`;
  } catch (err) {
    console.error("Settlement error:", err);
  }
}

// ---------- events ----------

$("create-group").addEventListener("click", async () => {
  const name = $("group-name").value.trim();
  const members = $("group-members").value.split(",").map((s) => s.trim()).filter(Boolean);
  if (!name) return toast("Give the group a name");
  if (members.length < 2) return toast("Add at least two members");
  try {
    group = await api("POST", "/api/groups", { name, members });
    renderGroup();
  } catch (e) { toast(e.message); }
});

$("add-member").addEventListener("click", async () => {
  const name = $("new-member").value.trim();
  if (!name) return;
  try {
    await api("POST", `/api/groups/${group.id}/members`, { name });
    group = await api("GET", `/api/groups/${group.id}`);
    $("new-member").value = "";
    renderGroup();
  } catch (e) { toast(e.message); }
});

$("add-expense").addEventListener("click", async () => {
  const description = $("exp-desc").value.trim();
  const amount = parseFloat($("exp-amount").value);
  const paidBy = $("exp-paidby").value;
  const splitAmong = [...$("exp-split").querySelectorAll("input:checked")].map((c) => c.value);
  if (!description) return toast("Describe the expense");
  if (!(amount > 0)) return toast("Enter a valid amount");
  if (!splitAmong.length) return toast("Pick who shares this expense");
  try {
    await api("POST", `/api/groups/${group.id}/expenses`, { description, amount, paidBy, splitAmong });
    group = await api("GET", `/api/groups/${group.id}`);
    $("exp-desc").value = "";
    $("exp-amount").value = "";
    renderExpenses();
    renderSettlement();
  } catch (e) { toast(e.message); }
});

$("expense-list").addEventListener("click", async (ev) => {
  const btn = ev.target.closest(".exp-del");
  if (!btn) return;
  try {
    await api("DELETE", `/api/groups/${group.id}/expenses/${btn.dataset.id}`);
    group = await api("GET", `/api/groups/${group.id}`);
    renderExpenses();
    renderSettlement();
  } catch (e) { toast(e.message); }
});

// ---------- utils ----------

function esc(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

let toastTimer;
function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.hidden = true), 3000);
}

// Show empty state initially
$("empty-state").hidden = false;
