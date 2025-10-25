import { useEffect, useState } from "react";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function useCsrfToken() {
  const [csrfToken, setCsrfToken] = useState(null);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const res = await fetch(`${API_URL}/api/csrf-token`, {
          credentials: "include",
        });
        const data = await res.json();
        setCsrfToken(data.csrfToken);
        localStorage.setItem("csrfToken", data.csrfToken);
      } catch (err) {
        console.error("❌ Failed to fetch CSRF token:", err);
      }
    };
    fetchToken();
  }, []);

  return csrfToken;
}
