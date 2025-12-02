import React, { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { FaGlobe, FaSignOutAlt, FaUser, FaCrown } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { User } from "lucide-react";
import LoginPromptModal from "../components/LoginPromptModal";
import "./Header.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [currentLang, setCurrentLang] = useState("EN");

  const getCsrfToken = async () => {
    try {
      const res = await fetch(`${API_URL}/api/csrf-token`, { credentials: "include" });
      if (!res.ok) return "";
      const data = await res.json();
      return data.csrfToken;
    } catch (err) {
      console.error("Failed to fetch CSRF token", err);
      return "";
    }
  };

    React.useEffect(() => {
    if (user?.role === "admin" && location.pathname === "/home") {
      navigate("/admin");
    }
  }, [user, location.pathname]);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

const handleLogout = async () => {
    setIsLoggingOut(true);
    window.isLoggingOut = true;

    try {
      const csrfToken = await getCsrfToken();
      localStorage.removeItem("user");

      await fetch(`${API_URL}/api/logout`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken 
        },
        credentials: "include",
        keepalive: true
      });

    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Hard Redirect
      window.location.href = "/loginregister";
    }
  };

  const handleProfileClick = () => {
    if (!user || user.role === "guest") {
      setShowLoginPrompt(true);
    } else {
      navigate("/profile");
    }
  };

  // === Google Translate Handler ===
  const TranslateButton = () => {
    const changeLanguage = (lang) => {
      const select = document.querySelector("#google_translate_element select");
      if (!select) {
        console.warn("Google Translate not loaded yet");
        return;
      }
      select.value = lang;
      select.dispatchEvent(new Event("change"));
    };

    return (
      <div className="flex items-center gap-2 lang-switch">
        <button
          onClick={() => changeLanguage("en")}
          className="px-2 py-1 border rounded text-sm hover:bg-gray-100"
        >
          EN
        </button>

        <button
          onClick={() => changeLanguage("ms")}
          className="px-2 py-1 border rounded text-sm hover:bg-gray-100"
        >
          BM
        </button>
      </div>
    );
  };

  // === Language Toggle using Google Translate ===
  const toggleLanguage = () => {
    const select = document.querySelector("#google_translate_element select");
    if (!select) return;

    const newLang = currentLang === "EN" ? "ms" : "en";
    const newLabel = currentLang === "EN" ? "BM" : "EN";

    select.value = newLang;
    select.dispatchEvent(new Event("change"));
    setCurrentLang(newLabel);
  };


  return (
    <>
    {isLoggingOut && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: '#ffffff',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
           <h3 style={{ color: '#8B4513', fontFamily: 'sans-serif' }}>Logging out...</h3>
        </div>
      )}
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

            <button onClick={toggleLanguage} className="mobile-btn">
              {/* <FaGlobe className="mobile-icon" /> {currentLang} */}
            </button>

            <button onClick={handleProfileClick} className="mobile-btn">
              {/* <User className="mobile-icon" size={18} /> Profile */}
            </button>

            {user && user.role !== "guest" ? (
              <button onClick={handleLogout} className="mobile-btn logout">
                {/* <FaSignOutAlt className="mobile-icon"/> Logout */}
              </button>
            ) : (
              <button onClick={() => navigate("/loginregister")} className="mobile-btn">
                {/* <User size={16} /> Login / Register */}
              </button>
            )}
          </div>
        )}


        {/* === Desktop Actions === */}
        <div className="navbar-actions">
          {/* 🌐 Language */}
          <button className="lang-btn" onClick={toggleLanguage}>
            <FaGlobe className="icon" /> {currentLang}
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
