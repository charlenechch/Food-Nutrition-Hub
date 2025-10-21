import React, { createContext, useContext, useState, useEffect } from "react";
import { API_URL } from "../config/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Check session on first page load
  useEffect(() => {
    checkSession();
  }, []);

  // ✅ Reusable session checker (used on load & after login)
  const checkSession = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/session`, {
        credentials: "include",
      });
      const data = await res.json();

      if (res.ok && data?.user) {
        console.log("✅ Session Found:", data.user);
        setUser(data.user);
      } else {
        console.log("❌ No session found");
        setUser(null);
      }
    } catch (err) {
      console.error("Session check error:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Login — Update UI instantly AND refresh session
  const login = async (email, password) => {
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data?.user) {
        console.log("✅ Login success:", data.user);
        setUser(data.user);      // ✅ Instantly update UI
        await checkSession();    // ✅ Sync with backend session
        return { success: true };
      }

      return { success: false, message: data?.message || "Login failed" };
    } catch (err) {
      console.error("Login error:", err);
      return { success: false, message: "Server error" };
    }
  };

  // ✅ Logout — Clear session + user state
  const logout = async () => {
    try {
      await fetch(`${API_URL}/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
