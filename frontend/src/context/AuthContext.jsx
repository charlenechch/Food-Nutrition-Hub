import React, { createContext, useContext, useState, useEffect } from "react";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const normalizeUser = (raw) => {
    if (!raw) return null;
    return {
      ...raw,
      userID: raw.userID ?? raw.id ?? null,
      id: raw.id ?? raw.userID ?? null,
      role: raw.role || "member",
      email: raw.email ?? null,
      firstname: raw.firstname ?? raw.firstName ?? null,
      lastname: raw.lastname ?? raw.lastName ?? null,
      // ✅ Local-only view mode for admin toggling
      viewMode: raw.viewMode || raw.role || "member",
    };
  };

  const checkSession = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/session`, {
        credentials: "include",
      });
      const data = await res.json();

      if (res.ok && data?.user) {
        setUser(normalizeUser(data.user));
      } else if (res.status === 401) {
        setUser({ role: "guest", viewMode: "guest" });
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Session error:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Toggle view mode (admin can switch UI but stay admin)
  const toggleRole = async () => {
    if (!user) return;

    // If admin, just change their viewMode (not role)
    if (user.role === "admin") {
      const newMode = user.viewMode === "admin" ? "member" : "admin";
      setUser((prev) => ({ ...prev, viewMode: newMode }));
    }
  };

  const login = async (email, password) => {
    try {
      const res = await fetch(`${API_URL}/api/login`, {
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
      return { success: false, message: "Server error" };
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_URL}/api/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      setUser(null);
      // Force a redirect and full page reload to clear all stale state.
      window.location.href = '/loginregister';
    }
  };

  const loginAsGuest = () => setUser({ role: "guest", viewMode: "guest" });

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
        toggleRole,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
