// frontend/src/config/api.js

// ✅ CORRECTED URL LOGIC:
// In Development (localhost): Use http://localhost:5000
// In Production (Vercel): Use "" (empty string). This forces the request to go to
// "your-app.vercel.app/api", which Vercel then proxies to Railway.
// This tricks Safari/iPhone into accepting the cookies.
const API_URL = import.meta.env.DEV ? "http://localhost:5000" : "";

let csrfToken = null;

// ✅ Fetch CSRF token (used for secure state-changing requests)
async function getCsrfToken() {
  // This will now request: /api/csrf-token (on Vercel)
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
  // On Vercel, this becomes "/api/login" -> Proxied to Railway
  const res = await fetch(`${API_URL}/api${endpoint}`, {
    ...options,
    credentials: "include",
    headers,
  });

  // Optional auto-refresh if CSRF token expired (403)
  if (res.status === 403 && csrfToken) {
    // Retry once if token failed
    csrfToken = await getCsrfToken();
    
    // update the header with the new token
    headers["X-CSRF-Token"] = csrfToken;
    
    return fetch(`${API_URL}/api${endpoint}`, {
        ...options,
        credentials: "include",
        headers,
      });
  }

  return res;
}

export { API_URL };