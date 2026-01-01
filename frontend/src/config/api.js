// frontend/src/config/api.js

// ✅ FIXED: If Env Var is missing: use localhost in DEV, but use relative path ("") in PROD.
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:5000" : "");

let csrfToken = null;

// ✅ Fetch CSRF token (used for secure state-changing requests)
async function getCsrfToken() {
  const res = await fetch(`${API_URL}/api/csrf-token`, {
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch CSRF token (status ${res.status})`);
  }
  const data = await res.json();
  csrfToken = data.csrfToken;
  return csrfToken;
}

// ✅ Wrapper that automatically attaches CSRF + cookies
export async function fetchWithCredentials(endpoint, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const needsCsrf = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  // Automatically attach CSRF for state-changing requests
  if (needsCsrf) {
    if (!csrfToken) await getCsrfToken();
    headers["X-CSRF-Token"] = csrfToken;
  }

  // ✅ Always prefix endpoints with "/api"
  const res = await fetch(`${API_URL}/api${endpoint}`, {
    ...options,
    credentials: "include",
    headers,
  });

  // Optional auto-refresh if CSRF token expired (403)
  if (res.status === 403 && csrfToken) {
    csrfToken = await getCsrfToken();
    return fetchWithCredentials(endpoint, options);
  }

  return res;
}

export { API_URL };