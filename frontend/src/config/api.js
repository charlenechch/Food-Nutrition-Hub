// frontend/src/config/api.js

const API_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : "http://localhost:5000/api";

let csrfToken = null;

// ✅ Fetch CSRF token (used for secure state-changing requests)
async function getCsrfToken() {
  const res = await fetch(`${API_URL}/csrf-token`, {
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

  if (needsCsrf) {
    if (!csrfToken) await getCsrfToken();
    headers["X-CSRF-Token"] = csrfToken;
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers,
  });

  return res;
}

export { API_URL };
