// ✅ AuthContext.jsx – Final Updated Version
// - Loads user from backend session on refresh (/auth/session)
// - Keeps user in React state globally
// - Works with login & logout properly
// - Ensures /profile loads real session user data

import React, { createContext, useContext, useState, useEffect } from "react";
import { API_URL } from "../config/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Check session once when app starts (refresh or page load)
  useEffect(() => {
    checkSession();
  }, []);

  // ✅ Session check function (used on load + after login)
  const checkSession = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/session`, {
        credentials: "include", // ✅ include session cookies
      });

      const data = await res.json();

      if (res.ok && data?.user) {
        console.log("✅ Session found:", data.user);
        setUser(data.user); // ✅ Store user to context
      } else {
        console.log("❌ No active session");
        setUser(null);
      }
    } catch (error) {
      console.error("❌ Session check error:", error);
      setUser(null);
    } finally {
      setLoading(false); // ✅ allow UI to render after session check
    }
  };

  // ✅ Login function (calls backend + stores to session + context)
  const login = async (email, password) => {
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data?.user) {
        console.log("✅ Login successful:", data.user);
        setUser(data.user);
        await checkSession(); // ✅ ensure session stored backend-side
        return { success: true };
      }

      return { success: false, message: data?.message || "Login failed" };
    } catch (err) {
      console.error("❌ Login error:", err);
      return { success: false, message: "Server error" };
    }
  };

  // ✅ Logout function (destroys session on backend + clear context)
  const logout = async () => {
    try {
      await fetch(`${API_URL}/logout`, {
        method: "POST",
        credentials: "include",
      });
      console.log("✅ Logged out");
    } catch (err) {
      console.error("❌ Logout error:", err);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,          // ✅ logged-in user info
        login,         // ✅ login function
        logout,        // ✅ logout function
        loading,       // ✅ used to delay UI until session checked
        checkSession,  // ✅ optional manual re-check
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
