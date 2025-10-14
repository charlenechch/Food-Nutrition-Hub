// src/components/api.js
const isDevelopment = import.meta.env.MODE === 'development';


export const API_URL = isDevelopment
  ? "http://localhost:5000/api"
  : "https://food-nutrition-hub-production.up.railway.app/api";

// ---- Fetch CSRF token once per request when needed ----
async function getCsrfToken() {
  try {
    const res = await fetch(`${API_URL}/auth/csrf-token`, {
      credentials: "include",
    });
    const data = await res.json();
    return data?.csrfToken;
  } catch (err) {
    console.error("❌ Failed to fetch CSRF token:", err);
    return null;
  }
}

// ---- Main wrapper function ----
export const fetchWithCredentials = async (endpoint, options = {}) => {
  const method = options.method?.toUpperCase() || "GET";
  const requiresCsrf = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // Only fetch token if needed
  if (requiresCsrf) {
    const token = await getCsrfToken();
    if (token) headers["X-CSRF-Token"] = token;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers,
  });

  return response.json();
};
