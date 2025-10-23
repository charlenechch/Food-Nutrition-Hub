import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/UserHomepage.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { FaAnglesDown } from "react-icons/fa6";
import { useAuth } from "../context/AuthContext";
import LoginPromptModal from "../components/LoginPromptModal"; // ✅ Add this

export default function UserHomepage({ recentFoods = [], stats = {} }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false); // ✅ Modal state

  const handleProfileClick = () => {
    if (!user || user.role === "guest") {
      setShowLoginPrompt(true); // ✅ Guests → popup
    } else {
      navigate("/profile"); // ✅ Logged in → go to profile
    }
  };

  return (
    <div className="homepage">
      <Header />

      <header className="hero">
        <h1 className="userh1">Welcome to SarawakEats</h1>
        <p>Discover and preserve Sarawak's rich culinary heritage</p>

        <section className="features">
          <div className="feature-card">
            <div className="feature-icon">🔍</div>
            <h3>Explore Foods</h3>
            <p>Discover traditional Sarawakian dishes and their stories</p>
            <button className="feature-btn" onClick={() => navigate("/foods")}>
              Explore Now
            </button>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🧠</div>
            <h3>Nutrition Analyzer</h3>
            <p>Get AI-powered nutrition analysis and healthy alternatives</p>
            <button className="feature-btn" onClick={() => navigate("/analyzer")}>
              Start Analysis
            </button>
          </div>

          <div className="feature-card">
            <div className="feature-icon">👤</div>
            <h3>My Profile</h3>
            <p>Manage your preferences, dietary restrictions, and saved foods</p>
            <button className="feature-btn" onClick={handleProfileClick}>
              View Profile
            </button>
          </div>
        </section>
      </header>

      {/* ✅ Show Login Modal for guests */}
      {showLoginPrompt && (
        <LoginPromptModal
          message="Please login or register to view your profile."
          onClose={() => setShowLoginPrompt(false)}
          onLogin={() => navigate("/loginregister")}
        />
      )}
    </div>
  );
}
