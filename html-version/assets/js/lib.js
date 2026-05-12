// Shared utilities: formatters, layout shell, modals, idle logout, rate limit
const fmtKES = (n) => "KES " + Number(n || 0).toLocaleString();
const fmtDate = (s) => s ? new Date(s.replace(" ", "T") + (s.includes("T") ? "" : "Z")).toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" }) : "—";
const fmtDateTime = (s) => s ? new Date(s.replace(" ", "T") + (s.includes("T") ? "" : "Z")).toLocaleString("en-KE") : "—";
const escapeHtml = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const badge = (status) => `<span class="badge badge-${status}">${escapeHtml(status)}</span>`;

// Rate limit (client-side UX guard)
const RATE = {};
function checkRate(key, max, windowMs) {
  const now = Date.now();
  const b = RATE[key] || { count: 0, reset: now + windowMs };
  if (now > b.reset) { b.count = 0; b.reset = now + windowMs; }
  b.count++; RATE[key] = b;
  if (b.count > max) return { ok: false, retry: Math.ceil((b.reset - now) / 1000) };
  return { ok: true };
}

// Idle logout (15 min)
let idleTimer;
function resetIdle() {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => { showToast("Logged out due to inactivity.", "info"); Auth.logout(); }, 15 * 60_000);
}
["mousedown", "keydown", "scroll", "touchstart"].forEach(e => window.addEventListener(e, resetIdle, { passive: true }));

// Sidebar shell — injected on every authed page
async function mountShell(active) {
  const me = Auth.user(); if (!me) return;
  const isAdmin = me.role === "admin";
  const links = [
    ["dashboard", "🏠 Dashboard"],
    ["chamas", "👥 Chamas"],
    ["contributions", "💰 Contributions"],
    ["loans", "🏦 Loans"],
    ["wallet", "💳 Wallet"],
    ["investments", "📈 Investments"],
    ["reports", "📊 Reports"],
    ["notifications", "🔔 Notifications"],
    ["settings", "⚙️ Settings"],
  ];
  if (isAdmin) links.push(["admin", "🛡️ Admin"]);
  const initials = (me.profile?.full_name || me.user.email).split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase();

  document.body.insertAdjacentHTML("afterbegin", `
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-logo">
          <div class="sidebar-logo-icon">M</div>
          <div class="sidebar-logo-text">M-Chama</div>
        </div>
      </div>
      <nav class="sidebar-nav">
        ${links.map(([slug, label]) => `<a href="/${slug}.html" class="sidebar-nav-item ${slug === active ? "active" : ""}">${label}</a>`).join("")}
      </nav>
      <div class="sidebar-footer">
        <div class="sidebar-user">
          <div class="sidebar-user-avatar">${initials}</div>
          <div class="sidebar-user-info">
            <div class="sidebar-user-name">${escapeHtml(me.profile?.full_name || "User")}</div>
            <div class="sidebar-user-role">${me.role}</div>
          </div>
        </div>
        <button class="btn btn-outline btn-sm" style="width:100%;margin-top:.5rem" onclick="Auth.logout()">Sign out</button>
      </div>
    </aside>
    <button class="sidebar-toggle" onclick="document.querySelector('.sidebar').classList.toggle('active')">☰</button>
  `);
  resetIdle();
}

// PIN prompt helper — resolves with the entered pin or null
function askPin(title = "Enter Transaction PIN") {
  return new Promise(resolve => {
    showDetails(title, `
      <p style="margin-bottom:1rem;color:var(--muted-foreground);font-size:.875rem">Required to authorize this action.</p>
      <input id="__pinInput" type="password" inputmode="numeric" maxlength="6" class="form-input" placeholder="••••" style="font-size:1.5rem;text-align:center;letter-spacing:.5rem" />
    `, [
      { label: "Cancel", onClick: "document.getElementById('__detailsModal').style.display='none';window.__pinResolve&&window.__pinResolve(null)" },
      { label: "Confirm", primary: true, onClick: "const v=document.getElementById('__pinInput').value;document.getElementById('__detailsModal').style.display='none';window.__pinResolve&&window.__pinResolve(v)" },
    ]);
    window.__pinResolve = resolve;
    setTimeout(() => document.getElementById("__pinInput")?.focus(), 50);
  });
}

window.fmtKES = fmtKES; window.fmtDate = fmtDate; window.fmtDateTime = fmtDateTime;
window.escapeHtml = escapeHtml; window.badge = badge;
window.checkRate = checkRate; window.mountShell = mountShell; window.askPin = askPin;
