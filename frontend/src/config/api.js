// frontend/src/config/api.js

// ✅ UNIVERSAL URL:
// We set this to "" (Empty String) for EVERYONE.
// - On PC: Vite config (above) forwards "/api" -> localhost:5000
// - On iPhone: Vercel config forwards "/api" -> Railway
const API_URL = ""; 

let csrfToken = null;

// ✅ CSRF Token Fetcher
async function getCsrfToken() {
  try {
    const res = await fetch(`${API_URL}/api/csrf-token`, {
      credentials: "include",
    });
    
    if (!res.ok) {
      console.warn(`Failed to fetch CSRF token (status ${res.status})`);
      return null;
    }
    
    const data = await res.json();
    csrfToken = data.csrfToken;
    return csrfToken;
  } catch (error) {
    console.error("Error fetching CSRF token:", error);
    return null;
  }
}

// ✅ Main Fetch Wrapper
export async function fetchWithCredentials(endpoint, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const needsCsrf = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
  
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  // Attach CSRF if needed
  if (needsCsrf) {
    if (!csrfToken) await getCsrfToken();
    if (csrfToken) headers["X-CSRF-Token"] = csrfToken;
  }

  // Build the URL: "" + "/api" + "/endpoint"
  const url = `${API_URL}/api${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

  let res = await fetch(url, {
    ...options,
    credentials: "include",
    headers,
  });

  // Retry logic: If backend says "Invalid CSRF" (403), get a new token and retry
  if (res.status === 403 && needsCsrf) {
    console.log("CSRF token invalid or expired. Retrying...");
    await getCsrfToken();
    if (csrfToken) headers["X-CSRF-Token"] = csrfToken;
    
    res = await fetch(url, {
      ...options,
      credentials: "include",
      headers,
    });
  }

  return res;
}

export { API_URL };