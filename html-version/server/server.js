const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const db = require("./db");
const { signToken, authRequired, requireRole, requireApproved } = require("./auth");

const app = express();
const uid = () => crypto.randomUUID();
const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// ---------- helpers ----------
const audit = (userId, action, entityType, entityId, details = {}, ip) =>
  db.prepare(`INSERT INTO audit_logs (id,user_id,action,entity_type,entity_id,details,ip_address) VALUES (?,?,?,?,?,?,?)`)
    .run(uid(), userId, action, entityType, entityId, JSON.stringify(details), ip || null);

const notify = (userId, title, message, type = "info", metadata = {}) =>
  db.prepare(`INSERT INTO notifications (id,user_id,title,message,type,metadata) VALUES (?,?,?,?,?,?)`)
    .run(uid(), userId, title, message, type, JSON.stringify(metadata));

// ============ AUTH ============
app.post("/api/auth/signup", (req, res) => {
  const { email, password, full_name, phone, role } = req.body || {};
  if (!email || !password || !full_name) return res.status(400).json({ error: "Missing fields" });
  if (db.prepare("SELECT 1 FROM users WHERE email = ?").get(email.toLowerCase())) return res.status(409).json({ error: "Email exists" });
  const id = uid();
  const tx = db.transaction(() => {
    db.prepare("INSERT INTO users (id,email,password_hash) VALUES (?,?,?)").run(id, email.toLowerCase(), bcrypt.hashSync(password, 10));
    db.prepare("INSERT INTO profiles (user_id,full_name,phone) VALUES (?,?,?)").run(id, full_name, phone || null);
    const finalRole = role === "admin" ? "admin" : "member";
    db.prepare("INSERT INTO user_roles (id,user_id,role) VALUES (?,?,?)").run(uid(), id, finalRole);
    db.prepare("INSERT INTO wallets (id,user_id) VALUES (?,?)").run(uid(), id);
  });
  tx();
  const token = signToken({ id, email });
  res.cookie("token", token, { httpOnly: true, sameSite: "lax", maxAge: 7 * 864e5 });
  audit(id, "signup", "auth", id, {}, req.ip);
  res.json({ token, user: { id, email } });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body || {};
  const ip = req.ip;
  const ua = req.headers["user-agent"] || "";
  // lockout check (5 fails / 15 min)
  const since = new Date(Date.now() - 15 * 60_000).toISOString().slice(0, 19).replace("T", " ");
  const recent = db.prepare(`SELECT success FROM login_attempts WHERE email=? AND attempted_at>=? ORDER BY attempted_at DESC LIMIT 20`).all((email || "").toLowerCase(), since);
  let fails = 0; for (const r of recent) { if (r.success) break; fails++; }
  if (fails >= 5) return res.status(429).json({ error: "Account locked. Try again in 15 minutes." });

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get((email || "").toLowerCase());
  const ok = user && bcrypt.compareSync(password || "", user.password_hash);
  db.prepare(`INSERT INTO login_attempts (id,email,success,user_agent,ip_address) VALUES (?,?,?,?,?)`).run(uid(), (email || "").toLowerCase(), ok ? 1 : 0, ua, ip);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });
  const token = signToken(user);
  res.cookie("token", token, { httpOnly: true, sameSite: "lax", maxAge: 7 * 864e5 });
  // session record
  db.prepare(`INSERT INTO user_sessions (id,user_id,device_label,user_agent,ip_address) VALUES (?,?,?,?,?)`).run(uid(), user.id, ua.slice(0, 40), ua, ip);
  audit(user.id, "login", "auth", user.id, {}, ip);
  res.json({ token, user: { id: user.id, email: user.email } });
});

app.post("/api/auth/logout", authRequired, (req, res) => {
  audit(req.user.id, "logout", "auth", req.user.id, {}, req.ip);
  res.clearCookie("token");
  res.json({ ok: true });
});

app.get("/api/auth/me", authRequired, (req, res) => {
  const profile = db.prepare("SELECT full_name,phone,avatar_url,is_approved,transaction_pin_hash IS NOT NULL AS has_pin FROM profiles WHERE user_id=?").get(req.user.id);
  res.json({ user: req.user, role: req.role, profile });
});

app.post("/api/auth/reset-pin", authRequired, (req, res) => {
  const { password } = req.body || {};
  const u = db.prepare("SELECT password_hash FROM users WHERE id=?").get(req.user.id);
  if (!bcrypt.compareSync(password || "", u.password_hash)) return res.status(401).json({ error: "Invalid password" });
  db.prepare("UPDATE profiles SET transaction_pin_hash=NULL,pin_attempts=0,pin_locked_until=NULL WHERE user_id=?").run(req.user.id);
  audit(req.user.id, "pin_reset", "profile", req.user.id, {}, req.ip);
  res.json({ ok: true });
});

app.post("/api/auth/set-pin", authRequired, (req, res) => {
  const { pin } = req.body || {};
  if (!/^\d{4,6}$/.test(pin || "")) return res.status(400).json({ error: "PIN must be 4-6 digits" });
  db.prepare("UPDATE profiles SET transaction_pin_hash=?, pin_set_at=datetime('now'), pin_attempts=0 WHERE user_id=?").run(sha256(pin), req.user.id);
  audit(req.user.id, "pin_set", "profile", req.user.id, {}, req.ip);
  res.json({ ok: true });
});

function verifyPin(userId, pin) {
  const p = db.prepare("SELECT transaction_pin_hash, pin_attempts, pin_locked_until FROM profiles WHERE user_id=?").get(userId);
  if (!p?.transaction_pin_hash) return { ok: false, error: "PIN not set" };
  if (p.pin_locked_until && new Date(p.pin_locked_until) > new Date()) return { ok: false, error: "PIN locked" };
  if (sha256(pin || "") !== p.transaction_pin_hash) {
    const attempts = (p.pin_attempts || 0) + 1;
    const lock = attempts >= 5 ? new Date(Date.now() + 15 * 60_000).toISOString() : null;
    db.prepare("UPDATE profiles SET pin_attempts=?, pin_locked_until=? WHERE user_id=?").run(attempts, lock, userId);
    return { ok: false, error: "Wrong PIN" };
  }
  db.prepare("UPDATE profiles SET pin_attempts=0, pin_locked_until=NULL WHERE user_id=?").run(userId);
  return { ok: true };
}

// ============ PROFILE ============
app.put("/api/profile", authRequired, (req, res) => {
  const { full_name, phone, avatar_url } = req.body || {};
  db.prepare("UPDATE profiles SET full_name=COALESCE(?,full_name), phone=COALESCE(?,phone), avatar_url=COALESCE(?,avatar_url), updated_at=datetime('now') WHERE user_id=?")
    .run(full_name, phone, avatar_url, req.user.id);
  res.json({ ok: true });
});

// ============ CHAMAS ============
app.get("/api/chamas", authRequired, (req, res) => {
  const rows = db.prepare(`SELECT c.*, EXISTS(SELECT 1 FROM chama_members m WHERE m.chama_id=c.id AND m.user_id=? AND m.status='active') AS is_member FROM chamas c ORDER BY c.created_at DESC`).all(req.user.id);
  res.json(rows);
});
app.post("/api/chamas", authRequired, requireRole("admin"), (req, res) => {
  const { name, description, contribution_amount, contribution_frequency } = req.body || {};
  const id = uid();
  db.prepare(`INSERT INTO chamas (id,name,description,contribution_amount,contribution_frequency,created_by) VALUES (?,?,?,?,?,?)`)
    .run(id, name, description || null, contribution_amount || 0, contribution_frequency || "monthly", req.user.id);
  res.json({ id });
});
app.post("/api/chamas/:id/join", authRequired, (req, res) => {
  try {
    db.prepare("INSERT INTO chama_members (id,user_id,chama_id) VALUES (?,?,?)").run(uid(), req.user.id, req.params.id);
    audit(req.user.id, "chama_join", "chama", req.params.id);
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});
app.delete("/api/chamas/:id/leave", authRequired, (req, res) => {
  const active = db.prepare(`SELECT 1 FROM merry_go_round_cycles WHERE chama_id=? AND status IN ('current','upcoming') LIMIT 1`).get(req.params.id);
  if (active && req.role !== "admin") return res.status(403).json({ error: "Cannot leave during active cycle" });
  db.prepare("DELETE FROM chama_members WHERE chama_id=? AND user_id=?").run(req.params.id, req.user.id);
  audit(req.user.id, "chama_leave", "chama", req.params.id);
  res.json({ ok: true });
});

// ============ CONTRIBUTIONS ============
app.get("/api/contributions", authRequired, (req, res) => {
  const all = req.query.all === "1" && req.role === "admin";
  const rows = all
    ? db.prepare(`SELECT c.*, p.full_name, ch.name AS chama_name FROM contributions c LEFT JOIN profiles p ON p.user_id=c.user_id LEFT JOIN chamas ch ON ch.id=c.chama_id ORDER BY c.created_at DESC LIMIT 200`).all()
    : db.prepare(`SELECT c.*, ch.name AS chama_name FROM contributions c LEFT JOIN chamas ch ON ch.id=c.chama_id WHERE c.user_id=? ORDER BY c.created_at DESC`).all(req.user.id);
  res.json(rows);
});
app.post("/api/contributions", authRequired, requireApproved, (req, res) => {
  const { chama_id, amount, payment_method, notes, pin } = req.body || {};
  if (payment_method !== "cash") {
    const v = verifyPin(req.user.id, pin); if (!v.ok) return res.status(401).json(v);
  }
  const id = uid();
  const status = payment_method === "cash" ? "pending" : "paid";
  db.prepare(`INSERT INTO contributions (id,user_id,chama_id,amount,payment_method,notes,status) VALUES (?,?,?,?,?,?,?)`)
    .run(id, req.user.id, chama_id, amount, payment_method || "mpesa", notes || null, status);
  if (status === "paid") {
    const w = db.prepare("SELECT id,balance,total_contributed FROM wallets WHERE user_id=? LIMIT 1").get(req.user.id);
    if (w) db.prepare("UPDATE wallets SET balance=balance+?, total_contributed=total_contributed+? WHERE id=?").run(amount, amount, w.id);
    db.prepare("UPDATE chamas SET total_savings=total_savings+? WHERE id=?").run(amount, chama_id);
  }
  audit(req.user.id, "contribution_submitted", "contribution", id, { amount, payment_method });
  res.json({ id, status });
});
app.put("/api/contributions/:id/approve", authRequired, requireRole("admin", "treasurer"), (req, res) => {
  const c = db.prepare("SELECT * FROM contributions WHERE id=?").get(req.params.id);
  if (!c) return res.status(404).json({ error: "Not found" });
  db.prepare("UPDATE contributions SET status='paid', approved_by=?, approved_at=datetime('now') WHERE id=?").run(req.user.id, req.params.id);
  const w = db.prepare("SELECT id FROM wallets WHERE user_id=? LIMIT 1").get(c.user_id);
  if (w) db.prepare("UPDATE wallets SET balance=balance+?, total_contributed=total_contributed+? WHERE id=?").run(c.amount, c.amount, w.id);
  db.prepare("UPDATE chamas SET total_savings=total_savings+? WHERE id=?").run(c.amount, c.chama_id);
  notify(c.user_id, "Contribution approved", `Your KES ${c.amount} contribution was approved.`, "success");
  res.json({ ok: true });
});
app.put("/api/contributions/:id/reject", authRequired, requireRole("admin", "treasurer"), (req, res) => {
  const { reason } = req.body || {};
  if (!reason) return res.status(400).json({ error: "Reason required" });
  db.prepare("UPDATE contributions SET status='rejected', notes=? WHERE id=?").run(reason, req.params.id);
  res.json({ ok: true });
});

// ============ WALLETS ============
app.get("/api/wallets", authRequired, (req, res) => {
  res.json(db.prepare("SELECT * FROM wallets WHERE user_id=? ORDER BY created_at").all(req.user.id));
});
app.post("/api/wallets", authRequired, (req, res) => {
  const { name, type } = req.body || {};
  const id = uid();
  db.prepare("INSERT INTO wallets (id,user_id,name,type) VALUES (?,?,?,?)").run(id, req.user.id, name || "Wallet", type || "savings");
  res.json({ id });
});
app.get("/api/wallet-transactions", authRequired, (req, res) => {
  res.json(db.prepare("SELECT * FROM wallet_transactions WHERE user_id=? ORDER BY created_at DESC LIMIT 100").all(req.user.id));
});
app.post("/api/wallets/:id/deposit", authRequired, (req, res) => {
  const { amount } = req.body || {};
  const w = db.prepare("SELECT * FROM wallets WHERE id=? AND user_id=?").get(req.params.id, req.user.id);
  if (!w) return res.status(404).json({ error: "Wallet not found" });
  db.prepare("UPDATE wallets SET balance=balance+? WHERE id=?").run(amount, w.id);
  db.prepare("INSERT INTO wallet_transactions (id,user_id,wallet_id,type,amount,description) VALUES (?,?,?,?,?,?)")
    .run(uid(), req.user.id, w.id, "deposit", amount, "Deposit");
  res.json({ ok: true });
});
app.post("/api/wallets/:id/withdraw", authRequired, (req, res) => {
  const { amount, pin } = req.body || {};
  const v = verifyPin(req.user.id, pin); if (!v.ok) return res.status(401).json(v);
  const w = db.prepare("SELECT * FROM wallets WHERE id=? AND user_id=?").get(req.params.id, req.user.id);
  if (!w || w.balance < amount) return res.status(400).json({ error: "Insufficient balance" });
  db.prepare("UPDATE wallets SET balance=balance-?, total_withdrawn=total_withdrawn+? WHERE id=?").run(amount, amount, w.id);
  db.prepare("INSERT INTO wallet_transactions (id,user_id,wallet_id,type,amount,description) VALUES (?,?,?,?,?,?)")
    .run(uid(), req.user.id, w.id, "withdrawal", amount, "Withdrawal");
  audit(req.user.id, "withdraw", "wallet", w.id, { amount });
  res.json({ ok: true });
});

// ============ LOANS ============
app.get("/api/loans", authRequired, (req, res) => {
  const rows = req.role === "admin" && req.query.all === "1"
    ? db.prepare(`SELECT l.*, p.full_name, ch.name AS chama_name FROM loans l LEFT JOIN profiles p ON p.user_id=l.user_id LEFT JOIN chamas ch ON ch.id=l.chama_id ORDER BY l.created_at DESC`).all()
    : db.prepare(`SELECT l.*, ch.name AS chama_name FROM loans l LEFT JOIN chamas ch ON ch.id=l.chama_id WHERE l.user_id=? ORDER BY l.created_at DESC`).all(req.user.id);
  res.json(rows);
});
app.post("/api/loans", authRequired, requireApproved, (req, res) => {
  const { chama_id, amount } = req.body || {};
  const id = uid();
  db.prepare("INSERT INTO loans (id,user_id,chama_id,amount,status) VALUES (?,?,?,?,'pending')").run(id, req.user.id, chama_id, amount);
  audit(req.user.id, "loan_application", "loan", id, { amount });
  res.json({ id });
});
app.put("/api/loans/:id/approve", authRequired, requireRole("admin", "treasurer"), (req, res) => {
  db.prepare("UPDATE loans SET status='active', approved_by=?, approved_at=datetime('now'), due_date=date('now','+90 days') WHERE id=?").run(req.user.id, req.params.id);
  res.json({ ok: true });
});
app.put("/api/loans/:id/reject", authRequired, requireRole("admin", "treasurer"), (req, res) => {
  db.prepare("UPDATE loans SET status='rejected', rejection_reason=? WHERE id=?").run(req.body?.reason || "Rejected", req.params.id);
  res.json({ ok: true });
});
app.post("/api/loans/:id/repay", authRequired, (req, res) => {
  const { amount, pin } = req.body || {};
  const v = verifyPin(req.user.id, pin); if (!v.ok) return res.status(401).json(v);
  const l = db.prepare("SELECT * FROM loans WHERE id=? AND user_id=?").get(req.params.id, req.user.id);
  if (!l) return res.status(404).json({ error: "Not found" });
  const w = db.prepare("SELECT * FROM wallets WHERE user_id=? LIMIT 1").get(req.user.id);
  if (!w || w.balance < amount) return res.status(400).json({ error: "Insufficient wallet balance" });
  const newRepaid = l.repaid_amount + amount;
  const done = newRepaid >= l.amount;
  db.prepare("UPDATE loans SET repaid_amount=?, status=? WHERE id=?").run(newRepaid, done ? "completed" : "active", l.id);
  db.prepare("UPDATE wallets SET balance=balance-? WHERE id=?").run(amount, w.id);
  db.prepare("INSERT INTO wallet_transactions (id,user_id,wallet_id,type,amount,description) VALUES (?,?,?,?,?,?)")
    .run(uid(), req.user.id, w.id, "loan_repayment", amount, "Loan repayment");
  audit(req.user.id, "loan_repayment", "loan", l.id, { amount, fully_repaid: done });
  res.json({ ok: true, fully_repaid: done });
});

// ============ PROJECTS / INVESTMENTS ============
app.get("/api/projects", authRequired, (req, res) => {
  res.json(db.prepare(`SELECT p.*, ch.name AS chama_name FROM projects p LEFT JOIN chamas ch ON ch.id=p.chama_id ORDER BY p.created_at DESC`).all());
});
app.post("/api/projects", authRequired, requireRole("admin"), (req, res) => {
  const { name, description, chama_id, target_amount } = req.body || {};
  const id = uid();
  db.prepare("INSERT INTO projects (id,name,description,chama_id,target_amount,created_by) VALUES (?,?,?,?,?,?)").run(id, name, description, chama_id, target_amount || 0, req.user.id);
  res.json({ id });
});
app.post("/api/projects/:id/contribute", authRequired, (req, res) => {
  const { amount, chama_id, pin } = req.body || {};
  const v = verifyPin(req.user.id, pin); if (!v.ok) return res.status(401).json(v);
  db.prepare("INSERT INTO investment_contributions (id,user_id,project_id,chama_id,amount) VALUES (?,?,?,?,?)").run(uid(), req.user.id, req.params.id, chama_id, amount);
  db.prepare("UPDATE projects SET current_amount=current_amount+? WHERE id=?").run(amount, req.params.id);
  res.json({ ok: true });
});

// ============ NOTIFICATIONS ============
app.get("/api/notifications", authRequired, (req, res) => {
  res.json(db.prepare("SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 50").all(req.user.id));
});
app.put("/api/notifications/:id/read", authRequired, (req, res) => {
  db.prepare("UPDATE notifications SET is_read=1 WHERE id=? AND user_id=?").run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// ============ PENALTIES ============
app.get("/api/penalties", authRequired, (req, res) => {
  const rows = req.role === "admin" && req.query.all === "1"
    ? db.prepare(`SELECT pe.*, p.full_name, ch.name AS chama_name FROM penalties pe LEFT JOIN profiles p ON p.user_id=pe.user_id LEFT JOIN chamas ch ON ch.id=pe.chama_id ORDER BY pe.created_at DESC`).all()
    : db.prepare(`SELECT pe.*, ch.name AS chama_name FROM penalties pe LEFT JOIN chamas ch ON ch.id=pe.chama_id WHERE pe.user_id=? ORDER BY pe.created_at DESC`).all(req.user.id);
  res.json(rows);
});
app.post("/api/penalties", authRequired, requireRole("admin", "treasurer"), (req, res) => {
  const { user_id, chama_id, amount, reason } = req.body || {};
  const id = uid();
  db.prepare("INSERT INTO penalties (id,user_id,chama_id,amount,reason) VALUES (?,?,?,?,?)").run(id, user_id, chama_id, amount, reason || "Missed contribution");
  res.json({ id });
});

// ============ ADMIN ============
app.get("/api/admin/members", authRequired, requireRole("admin"), (req, res) => {
  res.json(db.prepare(`SELECT u.id,u.email,p.full_name,p.phone,p.is_approved,r.role FROM users u LEFT JOIN profiles p ON p.user_id=u.id LEFT JOIN user_roles r ON r.user_id=u.id ORDER BY u.created_at DESC`).all());
});
app.put("/api/admin/members/:id/approve", authRequired, requireRole("admin"), (req, res) => {
  db.prepare("UPDATE profiles SET is_approved=1 WHERE user_id=?").run(req.params.id);
  notify(req.params.id, "Account approved", "Welcome! Your account has been approved.", "success");
  res.json({ ok: true });
});
app.put("/api/admin/members/:id/reject", authRequired, requireRole("admin"), (req, res) => {
  db.prepare("UPDATE profiles SET rejection_reason=? WHERE user_id=?").run(req.body?.reason || "Rejected", req.params.id);
  res.json({ ok: true });
});
app.put("/api/admin/members/:id/role", authRequired, requireRole("admin"), (req, res) => {
  db.prepare("UPDATE user_roles SET role=? WHERE user_id=?").run(req.body?.role || "member", req.params.id);
  res.json({ ok: true });
});
app.get("/api/admin/audit", authRequired, requireRole("admin"), (req, res) => {
  res.json(db.prepare(`SELECT a.*, p.full_name FROM audit_logs a LEFT JOIN profiles p ON p.user_id=a.user_id ORDER BY a.created_at DESC LIMIT 200`).all());
});
app.get("/api/admin/stats", authRequired, requireRole("admin"), (req, res) => {
  const get = (q) => db.prepare(q).get();
  res.json({
    members: get("SELECT COUNT(*) AS n FROM users").n,
    pending_members: get("SELECT COUNT(*) AS n FROM profiles WHERE is_approved=0").n,
    total_savings: get("SELECT COALESCE(SUM(total_savings),0) AS n FROM chamas").n,
    pending_loans: get("SELECT COUNT(*) AS n FROM loans WHERE status='pending'").n,
    pending_contributions: get("SELECT COUNT(*) AS n FROM contributions WHERE status='pending'").n,
    chamas: get("SELECT COUNT(*) AS n FROM chamas").n,
  });
});

// ============ CYCLES ============
app.get("/api/cycles", authRequired, (req, res) => {
  res.json(db.prepare(`SELECT c.*, p.full_name AS recipient_name, ch.name AS chama_name FROM merry_go_round_cycles c LEFT JOIN profiles p ON p.user_id=c.recipient_user_id LEFT JOIN chamas ch ON ch.id=c.chama_id ORDER BY payout_date`).all());
});
app.post("/api/cycles", authRequired, requireRole("admin"), (req, res) => {
  const { chama_id, cycle_number, recipient_user_id, payout_date, amount } = req.body || {};
  const id = uid();
  db.prepare(`INSERT INTO merry_go_round_cycles (id,chama_id,cycle_number,recipient_user_id,payout_date,amount,status) VALUES (?,?,?,?,?,?,'upcoming')`)
    .run(id, chama_id, cycle_number, recipient_user_id, payout_date, amount || 0);
  res.json({ id });
});

// ============ SESSIONS ============
app.get("/api/sessions", authRequired, (req, res) => {
  res.json(db.prepare("SELECT * FROM user_sessions WHERE user_id=? AND revoked_at IS NULL ORDER BY last_seen_at DESC").all(req.user.id));
});
app.delete("/api/sessions/:id", authRequired, (req, res) => {
  db.prepare("UPDATE user_sessions SET revoked_at=datetime('now') WHERE id=? AND user_id=?").run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// ============ STATIC ============
const root = path.join(__dirname, "..");
app.use(express.static(root));
app.get("/", (_req, res) => res.sendFile(path.join(root, "pages", "landing.html")));
app.get("/:page", (req, res, next) => {
  const f = path.join(root, "pages", req.params.page.endsWith(".html") ? req.params.page : `${req.params.page}.html`);
  if (require("fs").existsSync(f)) return res.sendFile(f);
  next();
});
app.use((req, res) => res.status(404).sendFile(path.join(root, "pages", "404.html")));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`M-Chama running at http://localhost:${PORT}`));
