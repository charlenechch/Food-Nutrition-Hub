import React, { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { FaGlobe, FaSignOutAlt, FaUser } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { User } from "lucide-react";
import LoginPromptModal from "../components/LoginPromptModal";
import { useTranslation } from "react-i18next";
import "./Header.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Current language label derived from i18n state (no separate useState needed)
  const currentLang = i18n.language === "en" ? "EN" : "BM";

  React.useEffect(() => {
    if (user?.role === "admin" && location.pathname === "/home") {
      navigate("/admin");
    }
  }, [user, location.pathname]);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  // Toggle between EN and BM, persist to localStorage
  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "ms" : "en";
    i18n.changeLanguage(newLang);
    localStorage.setItem("sarawakeats_lang", newLang);
  };

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
          "X-CSRF-Token": csrfToken,
        },
        credentials: "include",
        keepalive: true,
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
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

  return (
    <>
      {isLoggingOut && (
        <div style={{
          position: "fixed", top: 0, left: 0,
          width: "100vw", height: "100vh",
          backgroundColor: "#ffffff", zIndex: 999999,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <h3 style={{ color: "#8B4513", fontFamily: "sans-serif" }}>Logging out...</h3>
        </div>
      )}

      <nav className="navbar">
        {/* Logo */}
        <div
          className="navbar-logo"
          onClick={() => navigate(user?.role === "admin" ? "/admin" : "/home")}
        >
          <span className="logo-icon">S</span>
          <span className="logo-text">SarawakEats</span>
        </div>

        {/* Hamburger (Mobile) */}
        <div className={`hamburger ${menuOpen ? "open" : ""}`} onClick={toggleMenu}>
          <span></span>
          <span></span>
          <span></span>
        </div>

        {/* Desktop Nav Links */}
        <ul className="navbar-links">
          <li><NavLink to={user?.role === "admin" ? "/admin" : "/home"}>{t("nav.home")}</NavLink></li>
          <li><NavLink to="/foods">{t("nav.explore")}</NavLink></li>
          <li><NavLink to="/analyzer">{t("nav.analyzer")}</NavLink></li>
          <li><NavLink to="/recipes">{t("nav.recipes")}</NavLink></li>
          <li><NavLink to="/community">{t("nav.community")}</NavLink></li>
        </ul>

        {/* Mobile Menu Drawer */}
        {menuOpen && (
          <div className="mobile-menu">
            <NavLink to={user?.role === "admin" ? "/admin" : "/home"} onClick={closeMenu}>{t("nav.home")}</NavLink>
            <NavLink to="/foods" onClick={closeMenu}>{t("nav.explore")}</NavLink>
            <NavLink to="/analyzer" onClick={closeMenu}>{t("nav.analyzer")}</NavLink>
            <NavLink to="/recipes" onClick={closeMenu}>{t("nav.recipes")}</NavLink>
            <NavLink to="/community" onClick={closeMenu}>{t("nav.community")}</NavLink>

            <button onClick={toggleLanguage} className="mobile-btn">
              <FaGlobe className="mobile-icon" /> {currentLang}
            </button>

            <button onClick={handleProfileClick} className="mobile-btn">
              <User className="mobile-icon" size={18} /> {t("nav.profile")}
            </button>

            {user && user.role !== "guest" ? (
              <button onClick={handleLogout} className="mobile-btn logout">
                <FaSignOutAlt className="mobile-icon" /> {t("nav.logout")}
              </button>
            ) : (
              <button onClick={() => navigate("/loginregister")} className="mobile-btn">
                <User size={16} /> {t("nav.login")}
              </button>
            )}
          </div>
        )}

        {/* Desktop Actions */}
        <div className="navbar-actions">
          <button className="lang-btn" onClick={toggleLanguage}>
            <FaGlobe className="icon" /> {currentLang}
          </button>

          <button onClick={handleProfileClick}>
            <User size={18} /> {t("nav.profile")}
          </button>

          {user && user.role !== "guest" ? (
            <button className="logout-btn" onClick={handleLogout}>
              <FaSignOutAlt /> {t("nav.logout")}
            </button>
          ) : (
            <button onClick={() => navigate("/loginregister")}>
              <FaUser size={16} /> {t("nav.login")}
            </button>
          )}
        </div>
      </nav>

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
