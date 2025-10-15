import { useEffect, useState } from "react";
import { API_URL } from "../config/api";

export default function useCsrfToken() {
  const [csrfToken, setCsrfToken] = useState(null);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const res = await fetch(`${API_URL}/csrf-token`, {
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
