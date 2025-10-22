// ✅ src/context/AuthContext.jsx (Fixed - keep UI/structure)
import React, { createContext, useContext, useState, useEffect } from "react";
import { API_URL } from "../config/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Normalize a user object coming from backend session/login
  const normalizeUser = (raw) => {
    if (!raw) return null;
    return {
      ...raw,
      // Accept multiple possible shapes from your backend
      id: raw.id ?? raw.userID ?? raw.userId ?? null,
      userID: raw.userID ?? raw.id ?? null,
      profileID: raw.profileID ?? raw.userProfileID ?? raw.profileId ?? null,
      role: raw.role || "member",
      email: raw.email ?? null,
      firstname: raw.firstname ?? raw.firstName ?? raw.given_name ?? null,
      lastname: raw.lastname ?? raw.lastName ?? raw.family_name ?? null,
    };
  };

  // ✅ Check existing server session
  const checkSession = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/session`, {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data?.user) {
        setUser(normalizeUser(data.user));
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Session check error:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Log in (session-based)
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
        setUser(normalizeUser(data.user));
        return { success: true };
      }
      return { success: false, message: data?.message || "Login failed" };
    } catch (err) {
      console.error("Login error:", err);
      return { success: false, message: "Server error" };
    }
  };

  // ✅ Log out
  const logout = async () => {
    try {
      await fetch(`${API_URL}/logout`, { method: "POST", credentials: "include" });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setUser(null);
    }
  };

  // ✅ Guest
  const loginAsGuest = () => setUser({ role: "guest" });

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        login,
        logout,
        loginAsGuest,
        checkSession,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}

// ✅ Custom hook
export const useAuth = () => useContext(AuthContext);
