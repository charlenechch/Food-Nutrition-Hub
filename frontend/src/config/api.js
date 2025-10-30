// frontend/src/config/api.js
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

let csrfToken = null;
let csrfFetching = null;

// Fetch or cache the CSRF token from backend
async function getCsrfToken() {
  if (csrfToken) return csrfToken;

  if (!csrfFetching) {
    csrfFetching = fetch(`${API_URL}/auth/csrf-token`, {
      credentials: "include",
    })
      .then(r => r.json())
      .then(data => {
        csrfToken = data?.csrfToken || null;
        return csrfToken;
      })
      .finally(() => {
        csrfFetching = null;
      });
  }

  return csrfFetching;
}

// Core fetch helper for authenticated API calls
export async function fetchWithCredentials(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const method = (options.method || "GET").toUpperCase();

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  // Attach CSRF for mutating requests
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    const token = await getCsrfToken();
    headers["X-CSRF-Token"] = token;
  }

  const doFetch = async () =>
    fetch(url, {
      ...options,
      method,
      headers,
      credentials: "include",
    });

  // Attempt request
  let res = await doFetch();

  // Auto-retry once if CSRF expired
  if (res.status === 403) {
    try {
      csrfToken = null;
      await getCsrfToken();
      res = await doFetch();
    } catch {
      // no retry
    }
  }

  return res;
}

export { API_URL, getCsrfToken };
