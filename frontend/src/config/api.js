// frontend/src/config/api.js
import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ✅ Create a reusable Axios instance
const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true, // Send cookies for session authentication
});

// ✅ Fetch CSRF token once and store it in Axios defaults
export async function initCSRF() {
  try {
    const res = await api.get("/auth/csrf-token");
    api.defaults.headers.common["X-CSRF-Token"] = res.data.csrfToken;
    console.log("✅ CSRF token initialized");
  } catch (err) {
    console.error("⚠️ Failed to initialize CSRF token:", err.message);
  }
}

export default api;
