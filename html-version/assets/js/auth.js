// Auth state + page guards
const Auth = (() => {
  let me = null;

  async function load() {
    try { me = await API.get("/api/auth/me"); return me; }
    catch { me = null; return null; }
  }

  async function requireAuth(redirect = "/auth.html") {
    if (!me) await load();
    if (!me) { location.href = redirect; throw new Error("redirect"); }
    return me;
  }

  async function requireRole(role) {
    const m = await requireAuth();
    if (m.role !== role && m.role !== "admin") { location.href = "/dashboard.html"; throw new Error("forbidden"); }
    return m;
  }

  async function login(email, password) {
    const r = await API.post("/api/auth/login", { email, password });
    API.setToken(r.token); me = null;
    return r;
  }
  async function signup(payload) {
    const r = await API.post("/api/auth/signup", payload);
    API.setToken(r.token); me = null;
    return r;
  }
  async function logout() {
    try { await API.post("/api/auth/logout"); } catch {}
    API.setToken(null); me = null;
    location.href = "/auth.html";
  }

  function user() { return me; }

  return { load, requireAuth, requireRole, login, signup, logout, user };
})();
window.Auth = Auth;
