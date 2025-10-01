import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FaGlobe, FaSignOutAlt } from "react-icons/fa";
import "./Header.css";

export default function Header() {
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      {/* Logo */}
      <div className="navbar-logo" onClick={() => navigate("/home")}>
        <span className="logo-icon">S</span>
        <span className="logo-text">SarawakEats</span>
      </div>

      {/* Links */}
      <ul className="navbar-links">
        <li>
          <NavLink to="/home" className={({ isActive }) => (isActive ? "active" : "")}>
            Home
          </NavLink>
        </li>
        <li>
          <NavLink to="/foods" className={({ isActive }) => (isActive ? "active" : "")}>
            Explore Foods
          </NavLink>
        </li>
        <li>
          <NavLink to="/analyzer" className={({ isActive }) => (isActive ? "active" : "")}>
            Nutrition Analyzer
          </NavLink>
        </li>
        <li>
          <NavLink to="/recipes" className={({ isActive }) => (isActive ? "active" : "")}>
            Recipes
          </NavLink>
        </li>
        <li>
          <NavLink to="/community" className={({ isActive }) => (isActive ? "active" : "")}>
            Community
          </NavLink>
        </li>
      </ul>

      {/* Right side */}
      <div className="navbar-actions">
      <button className="lang-btn" onClick={() => navigate("/language")}>
        <FaGlobe /> EN
      </button>

      <button className="logout-btn" onClick={() => navigate("/loginregister")}>
        <FaSignOutAlt /> Logout
      </button>
    </div>
    </nav>
  );
}
