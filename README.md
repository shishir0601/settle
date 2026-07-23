# Settle

Split group expenses and pay each other back in the **fewest possible transfers**.

Add a trip or flat's expenses, and Settle computes everyone's net balance, then generates a minimal settlement plan — for *n* people it needs at most *n − 1* payments instead of up to *n(n−1)/2* pairwise IOUs.

**Zero runtime dependencies.** The backend is pure Node.js (`http` module), the frontend is vanilla JS. Nothing to install.

![Settle UI](docs/screenshot.png)

## Run it

```bash
node server.js
# → http://localhost:3000
```

Requires Node 18+. That's it — no `npm install`.

## Run the tests

```bash
npm test          # 12 unit + integration tests via node:test
```

## How the settlement optimizer works

1. **Net balances.** For every expense, credit the payer and debit each participant's share. All arithmetic happens in integer paise (minor units), so floating-point never drifts money — `0.1 + 0.2` bugs can't happen. Equal splits distribute remainder paise deterministically so shares always sum to the exact total.
2. **Greedy min cash flow.** Sort creditors and debtors by size, then repeatedly match the largest creditor with the largest debtor. Each match fully zeroes at least one person, so the loop terminates in at most *n − 1* transfers.
3. The API also reports how many pairwise IOUs existed before optimization, so the UI can show how many transfers you saved.

Core logic lives in [`lib/settle.js`](lib/settle.js) (~100 lines, fully unit-tested).

## API

| Method | Route | Purpose |
|---|---|---|
| `POST` | `/api/groups` | Create group `{ name, members: [...] }` |
| `GET` | `/api/groups` | List groups |
| `GET` | `/api/groups/:id` | Group details |
| `POST` | `/api/groups/:id/members` | Add member `{ name }` |
| `POST` | `/api/groups/:id/expenses` | Add expense `{ description, amount, paidBy, splitAmong, exactSplits? }` |
| `DELETE` | `/api/groups/:id/expenses/:eid` | Remove expense |
| `GET` | `/api/groups/:id/settlement` | Balances + minimal transfer plan |

All endpoints validate input and return proper status codes (`400` bad input, `404` missing resources).

## Architecture

```
server.js        pure-Node HTTP server: routing, validation, static files
lib/settle.js    settlement algorithm (balances + min cash flow)
lib/store.js     JSON-file persistence (atomic writes; swap for a DB later)
public/          vanilla JS single-page frontend
test/            unit + integration tests (node:test, no framework)
```

Persistence is a JSON file behind a four-function interface (`load/save/newId`) — deliberately simple, and swappable for SQLite/Postgres without touching route logic.

## Design notes

- **Money as integers.** Amounts are converted to minor units at the boundary and only formatted back for display.
- **Deterministic rounding.** ₹100 split 3 ways becomes ₹33.34 + ₹33.33 + ₹33.33 — never ₹99.99 or ₹100.02.
- **Exact splits supported.** An expense can carry `exactSplits` (e.g. one person's share is bigger) and the optimizer handles it identically.
- **No frameworks** — the point of this project is to show the underlying mechanics: HTTP routing, REST semantics, input validation, and an algorithm with a provable bound.

## Roadmap

- [ ] Multi-group switcher in the UI
- [ ] SQLite storage adapter
- [ ] Auth + shareable group links
- [ ] Currency selection

## License

MIT
