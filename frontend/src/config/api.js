// frontend/src/config/api.js
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

let csrfToken = null;

// 🔹 Step 1: Fetch CSRF token from backend
async function getCsrfToken() {
  try {
    const res = await fetch(`${API_URL}/api/csrf-token`, {
      credentials: "include",
    });

    if (!res.ok) throw new Error("CSRF route returned " + res.status);
    const data = await res.json();

    if (!data.csrfToken) throw new Error("No CSRF token received");

    csrfToken = data.csrfToken;
    console.log("✅ CSRF token fetched:", csrfToken.substring(0, 10) + "...");
  } catch (err) {
    console.error("❌ Failed to fetch CSRF token:", err);
  }
}

// 🔹 Step 2: Wrapper for all fetch calls
export async function fetchWithCredentials(endpoint, options = {}) {
  // Ensure we have a CSRF token
  if (!csrfToken) await getCsrfToken();

  const headers = {
    "Content-Type": "application/json",
    "X-CSRF-Token": csrfToken, // ✅ Always attach CSRF token
    ...options.headers,
  };

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers,
  });

  return res;
}

export { API_URL, getCsrfToken };
