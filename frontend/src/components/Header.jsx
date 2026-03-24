import React, { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { FaGlobe, FaSignOutAlt, FaUser } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { User, Bell } from "lucide-react";
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
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Current language label derived from i18n state (no separate useState needed)
  const currentLang = i18n.language === "en" ? "EN" : "BM";

  const fetchNotifications = async () => {
    if (!user || user.role === "guest") return;
    try {
      const res = await fetch(`${API_URL}/api/notifications`, {
        credentials: "include",
      });
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
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

  const handleBellClick = () => {
    setShowNotifications(prev => !prev);
  };

  const handleMarkAllRead = async () => {
    try {
      const csrfToken = await getCsrfToken();
      await fetch(`${API_URL}/api/notifications/read-all`, {
        method: "PATCH",
        headers: { "X-CSRF-Token": csrfToken },
        credentials: "include",
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleDismissNotification = async (notificationID) => {
    try {
      const csrfToken = await getCsrfToken();
      await fetch(`${API_URL}/api/notifications/${notificationID}`, {
        method: "DELETE",
        headers: { "X-CSRF-Token": csrfToken },
        credentials: "include",
      });
      setNotifications(prev => prev.filter(n => n.notificationID !== notificationID));
      setUnreadCount(prev => {
        const dismissed = notifications.find(n => n.notificationID === notificationID);
        return dismissed && dismissed.is_read === 0 ? prev - 1 : prev;
      });
    } catch (err) {
      console.error("Failed to dismiss notification:", err);
    }
  };

  const handleMarkOneRead = async (notificationID) => {
    try {
      const csrfToken = await getCsrfToken();
      await fetch(`${API_URL}/api/notifications/${notificationID}/read`, {
        method: "PATCH",
        headers: { "X-CSRF-Token": csrfToken },
        credentials: "include",
      });
      setNotifications(prev =>
        prev.map(n => n.notificationID === notificationID ? { ...n, is_read: 1 } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const getNotificationLink = (type) => {
    switch (type) {
      case "recipe_approved":
      case "recipe_rejected":
      case "recipe_feedback":
      case "post_approved":
      case "post_rejected":
      case "post_feedback":     return "/profile?tab=status";
      case "account_updated":   return "/profile";
      default:                  return null;
    }
  };

  const handleNotificationClick = async (n) => {
    if (n.is_read === 0) await handleMarkOneRead(n.notificationID);
    const link = getNotificationLink(n.type);
    if (link) {
      setShowNotifications(false);
      navigate(link);
    }
  }

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
          <li><NavLink to="/map">{t("nav.map")}</NavLink></li>
        </ul>

        {/* Mobile Menu Drawer */}
        {menuOpen && (
          <div className="mobile-menu">
            <NavLink to={user?.role === "admin" ? "/admin" : "/home"} onClick={closeMenu}>{t("nav.home")}</NavLink>
            <NavLink to="/foods" onClick={closeMenu}>{t("nav.explore")}</NavLink>
            <NavLink to="/analyzer" onClick={closeMenu}>{t("nav.analyzer")}</NavLink>
            <NavLink to="/recipes" onClick={closeMenu}>{t("nav.recipes")}</NavLink>
            <NavLink to="/community" onClick={closeMenu}>{t("nav.community")}</NavLink>
            <NavLink to="/map" onClick={closeMenu}>{t("nav.map")}</NavLink>

            <button onClick={toggleLanguage} className="mobile-btn">
              <FaGlobe className="mobile-icon" /> {currentLang}
            </button>

            {user && user.role !== "guest" && (
              <button className="mobile-btn" onClick={handleBellClick}>
                <Bell className="mobile-icon" size={18} />
                Notifications {unreadCount > 0 && `(${unreadCount})`}
              </button>
            )}

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

          {user && user.role !== "guest" && (
            <div className="notification-wrapper" ref={notificationRef}>
              <button className="bell-btn" onClick={handleBellClick}>
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
                )}
              </button>

              {showNotifications && (
                <div className="notification-panel">
                  <div className="notification-panel-header">
                    <span className="notification-panel-title">Notifications</span>
                    {unreadCount > 0 && (
                      <button className="mark-all-read-btn" onClick={handleMarkAllRead}>
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="notification-list">
                    {notifications.length === 0 ? (
                      <p className="notification-empty">No notifications yet.</p>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.notificationID}
                          className={`notification-item ${n.is_read === 0 ? "unread" : ""}`}
                          onClick={() => handleNotificationClick(n)}
                        >
                          <p className="notification-message">{n.message}</p>
                          <span className="notification-time">
                            {new Date(n.created_at).toLocaleDateString("en-GB", {
                              day: "2-digit", month: "short", year: "numeric",
                              hour: "2-digit", minute: "2-digit"
                            })}
                          </span>
                          <button
                            className="notification-dismiss"
                            onClick={(e) => { e.stopPropagation(); handleDismissNotification(n.notificationID); }}
                          >
                            ×
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

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
