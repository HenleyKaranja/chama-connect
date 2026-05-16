# M-Chama — HTML/CSS/JS + Node/SQLite version

A full functional clone of the M-Chama React app, rebuilt with vanilla HTML/CSS/JS on the frontend and Node.js + Express + SQLite on the backend. Runs entirely on your local machine.

## Run it

```bash
cd html-version/server
npm install
npm run seed     # creates data/mchama.db with demo accounts
npm start        # http://localhost:3000
```

Open http://localhost:3000 in your browser.

### Demo accounts

| Role   | Email                   | Password    |
|--------|-------------------------|-------------|
| Admin  | admin@mchama.test       | admin1234   |
| Member | member@mchama.test      | member1234  |

## What's included

- **14 pages** — landing, auth, dashboard, chamas, contributions, loans, wallet, investments, reports, notifications, settings, admin, sidebar, 404
- **Auth** — email/password with bcrypt + JWT (httpOnly cookie + Bearer fallback). 5-fail / 15-min login lockout.
- **RBAC** — admin / treasurer / member, enforced server-side
- **Approvals** — member, contribution, loan, cash-payment workflows
- **Wallets** — multi-wallet, deposit, withdraw (PIN-gated), transactions
- **Loans** — apply, approve/reject, repay (PIN-gated, deducts from wallet)
- **Chamas** — list/join/leave (blocked during active merry-go-round cycle)
- **Investments** — chama-scoped projects with progress tracking
- **Penalties** — admin can bill missed contributions
- **Cycles** — merry-go-round payout schedule
- **Audit log** — every sensitive action recorded
- **Sessions** — list/revoke active devices
- **Transaction PIN** — SHA-256 hashed, 5-fail lockout, password-reset flow
- **Idle logout** — 15 min inactivity
- **Rate limits** — client-side UX guard on login/contribute/loan/withdraw
- **Reports** — CSV exports for contributions, loans, transactions

## Project layout

```
html-version/
├── pages/                  # 14 HTML pages
├── assets/
│   ├── css/style.css
│   └── js/
│       ├── api.js          # fetch wrapper + JWT
│       ├── auth.js         # session + page guards
│       ├── lib.js          # formatters, sidebar shell, PIN, idle, rate limit
│       └── app.js          # toasts, modals, theme
└── server/
    ├── server.js           # Express app + all REST routes
    ├── db.js               # SQLite schema (14 tables)
    ├── auth.js             # JWT middleware
    ├── seed.js             # demo data
    └── data/mchama.db      # created on first run
```

## API surface (selected)

```
POST   /api/auth/signup        POST   /api/auth/login
POST   /api/auth/logout        GET    /api/auth/me
POST   /api/auth/set-pin       POST   /api/auth/reset-pin
PUT    /api/profile

GET    /api/chamas             POST   /api/chamas (admin)
POST   /api/chamas/:id/join    DELETE /api/chamas/:id/leave

GET    /api/contributions      POST   /api/contributions
PUT    /api/contributions/:id/approve|reject (admin/treasurer)

GET    /api/wallets            POST   /api/wallets
GET    /api/wallet-transactions
POST   /api/wallets/:id/deposit|withdraw

GET    /api/loans              POST   /api/loans
PUT    /api/loans/:id/approve|reject  POST /api/loans/:id/repay

GET    /api/projects           POST   /api/projects (admin)
POST   /api/projects/:id/contribute

GET    /api/notifications      PUT    /api/notifications/:id/read
GET    /api/penalties          POST   /api/penalties (admin/treasurer)
GET    /api/cycles             POST   /api/cycles (admin)
GET    /api/sessions           DELETE /api/sessions/:id

GET    /api/admin/members      PUT    /api/admin/members/:id/approve|reject|role
GET    /api/admin/audit        GET    /api/admin/stats
```

## Notes

- This runs **only on your machine** (the Lovable preview can't host Node servers). Deploy elsewhere if you need it online.
- The React/Lovable Cloud version of the app continues to live in `src/` and is unaffected.
- For production: change `JWT_SECRET` env var, enable HTTPS, add proper rate limiting at the edge, move SQLite to Postgres .
