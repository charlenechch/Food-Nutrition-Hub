import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FaGlobe, FaSignOutAlt } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { User } from "lucide-react";
import LoginPromptModal from "../components/LoginPromptModal";
import "./Header.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false); // ✅ Control modal

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
      setShowLoginPrompt(true); // ✅ Show popup instead of redirect
    } else {
      navigate("/profile"); // ✅ Logged in → go to profile
    }
  };

  return (
    <>
      <nav className="navbar">
        {/* Logo */}
        <div className="navbar-logo" onClick={() => navigate("/home")}>
          <span className="logo-icon">S</span>
          <span className="logo-text">SarawakEats</span>
        </div>

         {/* Hamburger Menu (mobile) */}
        <div
          className={`hamburger ${menuOpen ? "open" : ""}`}
          onClick={toggleMenu}
        >
          <span></span><span></span><span></span>
        </div>

        {/* Navigation Links */}
        <ul className={`navbar-links ${menuOpen ? "active" : ""}`}>
          <li><NavLink to="/home" onClick={closeMenu}>Home</NavLink></li>
          <li><NavLink to="/foods" onClick={closeMenu}>Explore Foods</NavLink></li>
          <li><NavLink to="/analyzer" onClick={closeMenu}>Nutrition Analyzer</NavLink></li>
          <li><NavLink to="/recipes" onClick={closeMenu}>Recipes</NavLink></li>
          <li><NavLink to="/community" onClick={closeMenu}>Community</NavLink></li>

          {/* Mobile  */}
           <hr className="menu-divider" />
          <li className="mobile-action" onClick={handleProfileClick}>
             Profile
          </li>
          {user && (
            <li className="mobile-action logout" onClick={handleLogout}>
               Logout
            </li>
          )}
        </ul>

          {/* Desktop */}
        <div className="navbar-actions">
          <button className="lang-btn" onClick={() => navigate("/language")}>
            <FaGlobe /> EN
          </button>

          {user ? (
            <>
              <button onClick={handleProfileClick}>
                <User size={20} /> Profile
              </button>
              <button className="logout-btn" onClick={handleLogout}>
                <FaSignOutAlt /> Logout
              </button>
            </>
          ) : (
            <button onClick={handleProfileClick}>
              <User size={20} /> Profile
            </button>
          )}
        </div>
      </nav>

      {/* ✅ Show login modal when guest presses Profile */}
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
