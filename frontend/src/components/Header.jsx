import React, { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { FaGlobe, FaSignOutAlt, FaUser, FaCrown } from "react-icons/fa"; // 👑 Added icons
import { useAuth } from "../context/AuthContext";
import { User } from "lucide-react";
import LoginPromptModal from "../components/LoginPromptModal";
import "./Header.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/api/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      logout();
      navigate("/loginregister");
    }
  };

  const handleProfileClick = () => {
    if (!user || user.role === "guest") {
      setShowLoginPrompt(true);
    } else {
      navigate("/profile");
    }
  };

  // ✅ Smart toggle logic
  const handleSmartToggle = () => {
    if (location.pathname.startsWith("/admin")) {
      navigate("/home"); // admin → user
    } else {
      navigate("/admin"); // user → admin
    }
  };

  // ✅ Determine label + icon
  const isAdminView = location.pathname.startsWith("/admin");
  const toggleLabel = isAdminView ? "User View" : "Admin View";
  const toggleIcon = isAdminView ? <FaUser size={14} /> : <FaCrown size={14} />;

  return (
    <>
      <nav className="navbar">
        {/* === Logo === */}
        <div className="navbar-logo" onClick={() => navigate("/home")}>
          <span className="logo-icon">S</span>
          <span className="logo-text">SarawakEats</span>
        </div>

        {/* === Hamburger Menu (Mobile) === */}
        <div
          className={`hamburger ${menuOpen ? "open" : ""}`}
          onClick={toggleMenu}
        >
          <span></span>
          <span></span>
          <span></span>
        </div>

        {/* === Navigation Links === */}
        <ul className={`navbar-links ${menuOpen ? "active" : ""}`}>
          <li><NavLink to="/home" onClick={closeMenu}>Home</NavLink></li>
          <li><NavLink to="/foods" onClick={closeMenu}>Explore Foods</NavLink></li>
          <li><NavLink to="/analyzer" onClick={closeMenu}>Nutrition Analyzer</NavLink></li>
          <li><NavLink to="/recipes" onClick={closeMenu}>Recipes</NavLink></li>
          <li><NavLink to="/community" onClick={closeMenu}>Community</NavLink></li>

          <hr className="menu-divider" />
          <li className="mobile-action" onClick={handleProfileClick}>
            Profile
          </li>

          {user?.role === "admin" && (
            <li className="mobile-action" onClick={handleSmartToggle}>
              {toggleLabel}
            </li>
          )}

          {user && user.role !== 'guest' ? (
            <li className="mobile-action logout" onClick={handleLogout}>
              Logout
            </li>
          ) : (
            <li className="mobile-action" onClick={() => { navigate("/loginregister"); closeMenu(); }}>
              Login / Register
            </li>
          )}
        </ul>

        {/* === Desktop Actions === */}
        <div className="navbar-actions">
          {/* 🌐 Language */}
          <button className="lang-btn" onClick={() => navigate("/language")}>
            <FaGlobe /> EN
          </button>

          {/* 🟤 Capsule Toggle */}
          {user?.role === "admin" && (
            <button
              className={`role-toggle-capsule ${
                isAdminView ? "admin-mode" : "user-mode"
              }`}
              onClick={handleSmartToggle}
              title={`Switch to ${isAdminView ? "User" : "Admin"} view`}
            >
              {toggleIcon}
              <span>{toggleLabel}</span>
            </button>
          )}

          {/* 👤 Profile */}
          <button onClick={handleProfileClick}>
            <User size={20} /> Profile
          </button>

          {/* 🚪 Logout / Login */}
          {user && user.role !== 'guest' ? (
            <button className="logout-btn" onClick={handleLogout}>
              <FaSignOutAlt /> Logout
            </button>
          ) : (
            <button onClick={() => navigate("/loginregister")}>
              <FaUser size={16} /> Login
            </button>
          )}
        </div>
      </nav>

      {/* ✅ Login Modal */}
      {showLoginPrompt && (
        <LoginPromptModal
          message="Please login or register to access your profile."
          onClose={() => setShowLoginPrompt(false)}
          onLogin={() => navigate("/loginregister")}
        />
      )}
    </>
  );
}
