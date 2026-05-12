const jwt = require("jsonwebtoken");
const db = require("./db");

const SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, SECRET, { expiresIn: "7d" });
}

function getUserFromToken(token) {
  try {
    const p = jwt.verify(token, SECRET);
    return db.prepare("SELECT id, email FROM users WHERE id = ?").get(p.sub);
  } catch { return null; }
}

function authRequired(req, res, next) {
  const token = req.cookies?.token || (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  const user = token ? getUserFromToken(token) : null;
  if (!user) return res.status(401).json({ error: "Not authenticated" });
  req.user = user;
  const role = db.prepare("SELECT role FROM user_roles WHERE user_id = ?").get(user.id);
  req.role = role?.role || "member";
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.role)) return res.status(403).json({ error: "Forbidden" });
    next();
  };
}

function requireApproved(req, res, next) {
  const p = db.prepare("SELECT is_approved FROM profiles WHERE user_id = ?").get(req.user.id);
  if (!p?.is_approved && req.role !== "admin") return res.status(403).json({ error: "Account pending approval" });
  next();
}

module.exports = { signToken, authRequired, requireRole, requireApproved, SECRET };
