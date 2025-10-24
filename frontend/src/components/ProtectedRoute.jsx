// ✅ ProtectedRoute.jsx — Blocks unauthorized + redirects to loginregister

import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  // ✅ Not logged in → force login/register page
  if (!user) {
    return <Navigate to="/loginregister" replace />;
  }

  // ✅ Logged in but not allowed (e.g. member trying to access admin)
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />; // You can change to /home if you want
  }

  return children;
}
