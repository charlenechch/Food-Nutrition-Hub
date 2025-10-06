// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // assumes you export useAuth

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading } = useAuth();

  // Ensure user object exists and has a role; use fallback guest
  const role = user?.role || "guest";

  // Show loading while checking session
  if (loading) {
    return <div>Loading...</div>; // Or your loading component
  }

  // If user not in allowedRoles, redirect to login/register page
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/loginregister" replace />;
  }

  // Otherwise render children
  return children;
}
