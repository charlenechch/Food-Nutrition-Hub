import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading, isPublicPath } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>;
  }

  // If the page is on the public list, allow access regardless of role.
  if (isPublicPath(location.pathname)) {
      return children;
  }

  // Not logged in or guest → force login/register page
  if (!user || user.role === "guest") {
    return <Navigate to="/loginregister" replace />;
  }

  // Logged in but not allowed (e.g. member trying to access admin)
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
