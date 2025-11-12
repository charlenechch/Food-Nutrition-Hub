import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();

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

  // This is now the ONLY way to log a user out on the frontend
  const forceLogout = () => {
    setUser(null);
    
    // Check if already on the login page to avoid a redirect loop
    if (window.location.pathname !== "/loginregister") {
      window.location.href = "/loginregister";
    }
  };

  const checkSession = async () => {
    if (isLoggingOut) {
      setLoading(false);
      return;
    }

    // Define the public pages that don't need a redirect
    const publicAuthPaths = [
      '/loginregister',
      '/auth/action',
      '/verifyemail',
      '/forgotpassword',
      '/resetpassword',
      '/otpverification'
    ];
    const currentPath = window.location.pathname;

    try {
      const res = await fetch(`${API_URL}/api/auth/session`, {
        credentials: "include",
      });
      const data = await res.json();

      if (res.ok && data?.user) {
        setUser(normalizeUser(data.user));
      } else {
        // If session is not OK, only force logout if user is not on one of the public auth pages
        if (!publicAuthPaths.includes(currentPath)) {
          forceLogout();
        }
      }
    } catch (err) {
      console.error("Session error:", err);
      // If session check fails, only force logout if user is not on one of the public auth pages.
      if (!publicAuthPaths.includes(currentPath)) {
        forceLogout();
      }
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
    setIsLoggingOut(true); // Set the flag to stop checkSession
    try {
      await fetch(`${API_URL}/api/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout API call failed:", error);
    } finally {
      // Call the original forceLogout
      forceLogout();
    }
  }

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
