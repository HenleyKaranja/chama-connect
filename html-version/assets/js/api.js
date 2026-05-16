// API client — talks to the Node/Express backend.
// Cookies (httpOnly JWT) carry auth, but we also keep a fallback token in localStorage.
const API = (() => {
  const base = ""; // same origin
  const tokenKey = "mchama_token";
  const getToken = () => localStorage.getItem(tokenKey);
  const setToken = (t) => t ? localStorage.setItem(tokenKey, t) : localStorage.removeItem(tokenKey);

  async function req(method, path, body) {
    const headers = { "Content-Type": "application/json" };
    const t = getToken(); if (t) headers.Authorization = "Bearer " + t;
    const res = await fetch(base + path, {
      method, headers, credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    });
    const ct = res.headers.get("content-type") || "";
    const data = ct.includes("application/json") ? await res.json() : await res.text();
    if (!res.ok) throw new Error((data && data.error) || res.statusText);
    return data;
  }

  return {
    get: (p) => req("GET", p),
    post: (p, b) => req("POST", p, b),
    put: (p, b) => req("PUT", p, b),
    del: (p) => req("DELETE", p),
    setToken, getToken,
  };
})();
window.API = API;
