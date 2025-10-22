// ✅ /src/context/AuthContext.jsx

import React, { createContext, useContext, useState, useEffect } from "react";
import { API_URL } from "../config/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Keeps user logged in after refresh
  useEffect(() => {
    checkSession();
  }, []);

  // ✅ Check if session exists
  const checkSession = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/session`, {
        credentials: "include",
      });
      const data = await res.json();

      if (res.ok && data?.user) {
        console.log("✅ Session Found:", data.user);
        setUser({
          ...data.user,
          role: data.user.role || "member",
          profileID: data.user.profileID || data.user.id || null, // ✅ ensure profileID exists
        });
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

  // ✅ Normal login
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
        setUser({
          ...data.user,
          role: data.user.role || "member",
          profileID: data.user.profileID || data.user.id || null,
        });
        return { success: true };
      } else {
        return { success: false, message: data?.message || "Login failed" };
      }
    } catch (err) {
      console.error("Login error:", err);
      return { success: false, message: "Server error" };
    }
  };

  // ✅ Logout
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

  // ✅ Guest login
  const loginAsGuest = () => {
    setUser({ role: "guest" }); // ✅ clearly defined guest
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        login,
        logout,
        checkSession,
        loginAsGuest,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
