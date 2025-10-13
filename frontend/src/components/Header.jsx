import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FaGlobe, FaSignOutAlt } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../config/api";
import "./Header.css";

export default function Header() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  // Handle logout
  const handleLogout = async () => {
    try {
      // Call the backend to destroy the session
      await fetch(`${API_URL}/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      // Clear client-side user state
      logout();
      // Redirect to the login page
      navigate("/loginregister");
    }
  };

  return (
    <nav className="navbar">
      {/* Logo */}
      <div className="navbar-logo" onClick={() => navigate("/home")}>
        <span className="logo-icon">S</span>
        <span className="logo-text">SarawakEats</span>
      </div>

      {/* Hamburger Button (Visible on Mobile) */}
      <div
        className={`hamburger ${menuOpen ? "open" : ""}`}
        onClick={toggleMenu}
      >
        <span></span>
        <span></span>
        <span></span>
      </div>

      {/* Navigation Links */}
      <ul className={`navbar-links ${menuOpen ? "active" : ""}`}>
        <li>
          <NavLink to="/home" onClick={closeMenu}>Home</NavLink>
        </li>
        <li>
          <NavLink to="/foods" onClick={closeMenu}>Explore Foods</NavLink>
        </li>
        <li>
          <NavLink to="/analyzer" onClick={closeMenu}>Nutrition Analyzer</NavLink>
        </li>
        <li>
          <NavLink to="/recipes" onClick={closeMenu}>Recipes</NavLink>
        </li>
        <li>
          <NavLink to="/community" onClick={closeMenu}>Community</NavLink>
        </li>
      </ul>

      {/* Right Side Buttons */}
      <div className="navbar-actions">
        <button className="lang-btn" onClick={() => navigate("/language")}>
          <FaGlobe /> EN
        </button>
        <button className="logout-btn" onClick={handleLogout}>
          <FaSignOutAlt /> Logout
        </button>
      </div>
    </nav>
  );
}
