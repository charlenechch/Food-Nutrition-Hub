import React, { createContext, useContext, useState, useEffect } from "react";

// Create the Auth Context
export const AuthContext = createContext();

// Create a custom hook for easier access
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

// Check session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        // First check localStorage for quick restore
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }

        // Then verify with backend that session is still valid
        const response = await fetch('http://localhost:5000/api/auth/check-session', {
          credentials: 'include'
        });
        const data = await response.json();
        
        if (data.authenticated) {
          setUser(data.user);
          localStorage.setItem("user", JSON.stringify(data.user));
        } else {
          // Session expired, clear localStorage
          setUser(null);
          localStorage.removeItem("user");
        }
      } catch (error) {
        console.error('Session check failed:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkSession();
  }, []);

  // Save user to state + localStorage
  const login = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  // Clear user
  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  const value = {
    user: user || { role: "guest" }, // default to guest
    login,
    logout,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
