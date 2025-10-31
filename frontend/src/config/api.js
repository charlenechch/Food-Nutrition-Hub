// frontend/src/config/api.js

// ✅ Base API URL for both local and production
export const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ✅ Fetch CSRF token from backend
async function getCsrfToken() {
  try {
    // 👇 Directly call the proper /api/csrf-token route (no replace logic)
    const res = await fetch(`${API_URL}/csrf-token`, {
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error(`CSRF route returned ${res.status}`);
    }

    const data = await res.json();
    if (!data.csrfToken) throw new Error("No CSRF token received");

    return data.csrfToken;
  } catch (error) {
    console.error("❌ Failed to fetch CSRF token:", error);
    return null;
  }
}

// ✅ Helper for all API calls (adds CSRF token to POST/PUT/PATCH/DELETE)
export async function fetchWithCredentials(endpoint, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const isProtected = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

  let headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (isProtected) {
    const csrfToken = await getCsrfToken();
    if (csrfToken) headers["CSRF-Token"] = csrfToken;
  }

  // 🔐 Always include credentials (cookies / session)
  return fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers,
  });
}
