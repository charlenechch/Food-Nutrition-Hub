import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const ALL_PUBLIC_PATHS = [
  '/loginregister', '/auth/action', '/verifyemail',
  '/forgotpassword', '/resetpassword', '/otpverification',
  '/', '/home', '/foods', '/analyzer', '/recipes', '/community', 
  '/privacy', '/terms', '/profile'
];

const AuthContext = createContext()

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
      viewMode: raw.viewMode || raw.role || "member",
    };
  };

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

  const checkSession = useCallback(async () => {
    if (bypassSessionCheck) {
      setBypassSessionCheck(false);
      setLoading(false);
      return;
    }

    const publicAuthPaths = ALL_PUBLIC_PATHS;
    const currentPath = window.location.pathname;
    const isCurrentlyGuest = user?.role === 'guest';

    try {
      const res = await fetch(`${API_URL}/api/auth/session`, {
        credentials: "include",
      });

      // Handle 401 (Not Logged In) gracefully
      if (res.status === 401) {
        if (!publicAuthPaths.includes(currentPath) && !isCurrentlyGuest) {
          forceLogout();
        }
        setLoading(false);
        return; // Stop here, do not parse JSON or log error
      }

      const data = await res.json();

      if (res.ok && data?.user) {
        setUser(prev => {
          if (JSON.stringify(prev) === JSON.stringify(normalizeUser(data.user))) return prev;
          return normalizeUser(data.user);
        });
      } else {
        if (!publicAuthPaths.includes(currentPath) && !isCurrentlyGuest) {
          forceLogout();
        }
      }
    } catch (err) {
      // Only log real errors (network issues), not 401s
      console.error("Session check error:", err);
      if (!publicAuthPaths.includes(currentPath) && !isCurrentlyGuest) {
        forceLogout();
      }
    } finally {
      setLoading(false);
    }
  }, [user, bypassSessionCheck, forceLogout]);

  const toggleRole = useCallback(async () => {
    if (!user) return;
    if (user.role === "admin") {
      const newMode = user.viewMode === "admin" ? "member" : "admin";
      setUser((prev) => ({ ...prev, viewMode: newMode }));
    }
  }, [user]);

  // Login with CSRF Token
  const login = async (email, password) => {
    try {
      const csrfToken = await getCsrfToken(); // Get Token

      const res = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken // Send Token
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

  // Logout with CSRF Token
  const logout = async () => {
    window.isLoggingOut = true;
    
    try {
      const csrfToken = await getCsrfToken(); // Get Token

      localStorage.removeItem("user");

      await fetch(`${API_URL}/api/logout`, {
        method: "POST",
        headers: { 
          "X-CSRF-Token": csrfToken // Send Token
        },
        credentials: "include",
        keepalive: true
      });
    } finally {
      window.location.href = "/loginregister";
    }
  };

  const loginAsGuest = () => setUser({ role: "guest", viewMode: "guest" });
  
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