// frontend/src/config/api.js

// ✅ 1. THE SMART SWITCH (Crucial for iPhone Fix)
// Development (PC): Use http://localhost:5000 so your PC talks to the backend directly.
// Production (Vercel): Use "" (Empty string). This forces requests to go to "/api/..." 
// on your own domain, which triggers the "Vercel Proxy" we set up.
const API_URL = import.meta.env.DEV ? "http://localhost:5000" : "";

let csrfToken = null;

// ✅ 2. CSRF Token Fetcher
async function getCsrfToken() {
  try {
    // In Production, this becomes: "https://your-app.vercel.app/api/csrf-token"
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

// ✅ 3. Main Fetch Wrapper (Use this instead of normal fetch)
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

  // ✅ THE URL BUILDER:
  // We combine API_URL (empty in prod) + "/api" + endpoint
  // Example Prod: "" + "/api" + "/otp/verifyLogin" = "/api/otp/verifyLogin"
  const url = `${API_URL}/api${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

  let res = await fetch(url, {
    ...options,
    credentials: "include",
    headers,
  });

  // Auto-retry logic: If backend says "Invalid CSRF" (403), get a new token and try one more time
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