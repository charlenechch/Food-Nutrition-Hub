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

    React.useEffect(() => {
    if (user?.role === "admin" && location.pathname === "/home") {
      navigate("/admin");
    }
  }, [user, location.pathname]);

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

  return (
    <>
      <nav className="navbar">
        {/* === Logo === */}
        <div
          className="navbar-logo"
          onClick={() => {
            if (user?.role === "admin") {
              navigate("/admin");
            } else {
              navigate("/home");
            }
          }}
        >
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

        {/* === Desktop Nav Links === */}
        <ul className="navbar-links">
          <li>
            <NavLink
              to={user?.role === "admin" ? "/admin" : "/home"}
            >
              Home
            </NavLink>
          </li>
          <li><NavLink to="/foods">Explore Foods</NavLink></li>
          <li><NavLink to="/analyzer">Nutrition Analyzer</NavLink></li>
          <li><NavLink to="/recipes">Recipes</NavLink></li>
          <li><NavLink to="/community">Community</NavLink></li>
        </ul>

        {/* === MOBILE MENU (Hamburger Drawer) === */}
        {menuOpen && (
          <div className="mobile-menu">
            <NavLink to={user?.role === "admin" ? "/admin" : "/home"} onClick={closeMenu}>Home</NavLink>
            <NavLink to="/foods" onClick={closeMenu}>Explore Foods</NavLink>
            <NavLink to="/analyzer" onClick={closeMenu}>Nutrition Analyzer</NavLink>
            <NavLink to="/recipes" onClick={closeMenu}>Recipes</NavLink>
            <NavLink to="/community" onClick={closeMenu}>Community</NavLink>

            <hr />

            <button onClick={() => navigate("/language")} className="mobile-btn">
              <FaGlobe className="mobile-icon" /> EN
            </button>

            <button onClick={handleProfileClick} className="mobile-btn">
              <User className="mobile-icon" size={18} /> Profile
            </button>

            {user && user.role !== "guest" ? (
              <button onClick={handleLogout} className="mobile-btn logout">
                <FaSignOutAlt className="mobile-icon"/> Logout
              </button>
            ) : (
              <button onClick={() => navigate("/loginregister")} className="mobile-btn">
                <User size={16} /> Login / Register
              </button>
            )}
          </div>
        )}


        {/* === Desktop Actions === */}
        <div className="navbar-actions">
          {/* 🌐 Language */}
          <button className="lang-btn" onClick={() => navigate("/language")}>
            <FaGlobe  /> EN
          </button>

          
          {/* 👤 Profile */}
          <button onClick={handleProfileClick}>
            <User size={18} /> Profile
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
