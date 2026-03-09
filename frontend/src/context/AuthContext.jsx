import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const ALL_PUBLIC_PATHS = [
  '/loginregister', '/auth/action', '/verifyemail',
  '/forgotpassword', '/resetpassword', '/otpverification',
  '/', '/home', '/foods', '/analyzer', '/recipes', '/community', 
  '/privacy', '/terms', '/profile'
];

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bypassSessionCheck, setBypassSessionCheck] = useState(false);

  // Helper to fetch CSRF token on demand
  const getCsrfToken = async () => {
    try {
      const res = await fetch(`${API_URL}/api/csrf-token`, { credentials: "include" });
      if (!res.ok) return "";
      const data = await res.json();
      return data.csrfToken;
    } catch (err) {
      console.error("Failed to fetch CSRF token", err);
      return "";
    }
  };

  const normalizeUser = useCallback((raw) => {
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
      viewMode: raw.viewMode || raw.role || "member",
    };
  }, []);

  const forceLogout = useCallback((shouldRedirect = false) => {
      setUser(null);
      const currentPath = window.location.pathname;
      if (shouldRedirect || !ALL_PUBLIC_PATHS.includes(currentPath)) {
          window.location.href = "/loginregister";
      }
  }, []);

  const isPublicPath = useCallback((path) => {
    return ALL_PUBLIC_PATHS.includes(path);
  }, []);

  // Removed 'user' from dependencies to prevent infinite loop.
  // We use the functional update pattern inside setUser instead.
  const checkSession = useCallback(async () => {
    if (bypassSessionCheck) {
      setBypassSessionCheck(false);
      setLoading(false);
      return;
    }

    const currentPath = window.location.pathname;

    try {
      const res = await fetch(`${API_URL}/api/auth/session`, {
        credentials: "include",
      });

      if (res.status === 401) {
        // We use functional state update to safely check current user state
        setUser((prevUser) => {
            const isCurrentlyGuest = prevUser?.role === 'guest';
            if (!ALL_PUBLIC_PATHS.includes(currentPath) && !isCurrentlyGuest) {
                forceLogout();
            }
            return prevUser;
        });
        setLoading(false);
        return; 
      }

      const data = await res.json();

      if (res.ok && data?.user) {
        setUser(prev => {
          const normalized = normalizeUser(data.user);
          if (JSON.stringify(prev) === JSON.stringify(normalized)) return prev;
          return normalized;
        });
      } else {
        setUser((prevUser) => {
            const isCurrentlyGuest = prevUser?.role === 'guest';
            if (!ALL_PUBLIC_PATHS.includes(currentPath) && !isCurrentlyGuest) {
                forceLogout();
            }
            return prevUser; // Keep existing state if any, let forceLogout handle redirect
        });
      }
    } catch (err) {
      console.error("Session check error:", err);
      setUser((prevUser) => {
          const isCurrentlyGuest = prevUser?.role === 'guest';
          if (!ALL_PUBLIC_PATHS.includes(currentPath) && !isCurrentlyGuest) {
              forceLogout();
          }
          return prevUser;
      });
    } finally {
      setLoading(false);
    }
  }, [bypassSessionCheck, forceLogout, normalizeUser]);

  const toggleRole = useCallback(async () => {
    setUser((prev) => {
        if (!prev || prev.role !== "admin") return prev;
        const newMode = prev.viewMode === "admin" ? "member" : "admin";
        return { ...prev, viewMode: newMode };
    });
  }, []);

  const login = async (email, password) => {
    try {
      const csrfToken = await getCsrfToken(); 

      const res = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken 
        },
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
    window.isLoggingOut = true;
    
    try {
      const csrfToken = await getCsrfToken(); 
      localStorage.removeItem("user");

      await fetch(`${API_URL}/api/logout`, {
        method: "POST",
        headers: { 
          "X-CSRF-Token": csrfToken 
        },
        credentials: "include",
        keepalive: true
      });
    } finally {
      window.location.href = "/loginregister";
    }
  };

  const loginAsGuest = () => setUser({ role: "guest", viewMode: "guest" });
  
  // This is now safe and will only run once on mount
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
        isPublicPath,
        setBypassSessionCheck,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);