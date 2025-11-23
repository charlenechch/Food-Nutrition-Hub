import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
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
      userProfileID: raw.userProfileID ?? raw.profileID ?? null,
      role: raw.role || "member",
      email: raw.email ?? null,
      firstname: raw.firstname ?? raw.firstName ?? null,
      lastname: raw.lastname ?? raw.lastName ?? null,
      // ✅ Local-only view mode for admin toggling
      viewMode: raw.viewMode || raw.role || "member",
    };
  };

  // Log a user out on the frontend
  const forceLogout = useCallback(() => {
    setUser(null);

    const publicPaths = ['/loginregister', '/', '/home', '/recipe'];
    
    if (!publicPaths.includes(window.location.pathname)) {
        window.location.href = "/loginregister";
    }
  }, []);

  const checkSession = useCallback(async () => {
    const publicAuthPaths = [
      '/loginregister', '/auth/action', '/verifyemail',
      '/forgotpassword', '/resetpassword', '/otpverification'
    ];
    const currentPath = window.location.pathname;

    const isCurrentlyGuest = user?.role === 'guest';

    try {
      const res = await fetch(`${API_URL}/api/auth/session`, {
        credentials: "include",
      });
      const data = await res.json();

      if (res.ok && data?.user) {
        // Optimization: Only update state if data actually changed to prevent re-renders
        setUser(prev => {
          if (JSON.stringify(prev) === JSON.stringify(normalizeUser(data.user))) return prev;
          return normalizeUser(data.user);
        });
      } else {
        if (!publicAuthPaths.includes(currentPath) && !isCurrentlyGuest) {
          // Only force logout if on a protected page AND NOT already a guest
          forceLogout();
        } else if (isCurrentlyGuest) {
          // If the backend returned 401 but we're locally a guest, do nothing.
          setLoading(false);
        }
      }
    } catch (err) {
      console.error("Session error:", err);
      const isCurrentlyGuest = user?.role === 'guest';

      if (!publicAuthPaths.includes(currentPath) && !isCurrentlyGuest) {
        forceLogout();
      }
    } finally {
      setLoading(false);
    }
  }, [user, forceLogout]);

  const toggleRole = useCallback(async () => {
    if (!user) return;

     // If admin, just change their viewMode (not role
    if (user.role === "admin") {
      const newMode = user.viewMode === "admin" ? "member" : "admin";
      setUser((prev) => ({ ...prev, viewMode: newMode }));
    }
  }, [user]);

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
      forceLogout();
    }
  };

  const loginAsGuest = () => setUser({ role: "guest", viewMode: "guest" });
  
  // Initial check on mount
  useEffect(() => {
    checkSession();
  }, [checkSession]);

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
        forceLogout,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
