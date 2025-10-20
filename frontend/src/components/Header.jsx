import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FaGlobe, FaSignOutAlt } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../config/api";
import "./Header.css";
import { User } from "lucide-react";

export default function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
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

  // Get the current logged-in user data
  const getCurrentUser = () => {
    try {
      // Check different storage locations
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        console.log('📋 User data from localStorage:', user);
        return user;
      }
      
      const sessionData = sessionStorage.getItem('user');
      if (sessionData) {
        const user = JSON.parse(sessionData);
        console.log('📋 User data from sessionStorage:', user);
        return user;
      }
      
      console.log('❌ No user data found in storage');
      return null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  };

  const handleProfileClick = () => {
    console.log('🎯 Profile button clicked');
    
    const currentUser = getCurrentUser();
    console.log('👤 Current user:', currentUser);
    
    if (currentUser && currentUser.userProfileID) {
      // Use the actual userProfileID
      console.log('✅ Navigating with userProfileID:', currentUser.userProfileID);
      navigate(`/profile/${currentUser.userProfileID}`);
    } else if (currentUser && currentUser.userID) {
      // Fallback: use userID
      console.log('🔄 Navigating with userID:', currentUser.userID);
      navigate(`/profile/${currentUser.userID}`);
    } else {
      //  Use a valid ID for testing
      console.log('🚨 No user ID found, using test ID 1');
      navigate('/profile/1'); // Use ID 1 which exists in database
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
        <button onClick={handleProfileClick}>
          <User size={20}/> Profile
        </button>
        <button className="logout-btn" onClick={handleLogout}>
          <FaSignOutAlt /> Logout
        </button>
      </div>
    </nav>
  );
}
