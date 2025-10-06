import React, { createContext, useContext, useState, useEffect } from "react";

// Create the Auth Context
export const AuthContext = createContext();

// Create a custom hook for easier access
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Load user from localStorage on startup
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
