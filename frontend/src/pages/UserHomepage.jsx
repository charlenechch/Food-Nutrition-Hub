/* src/pages/UserHomepage.jsx */
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../css/UserHomepage.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import axios from "axios"; // ✅ Added Axios for fetching foods

// Icons
import { FaSearch } from "react-icons/fa";      
import { FaAnglesDown, FaUtensils } from "react-icons/fa6"; 

import { useAuth } from "../context/AuthContext";
import LoginPromptModal from "../components/LoginPromptModal";

export default function UserHomepage({ recentFoods = [], stats = {} }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Modal State
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  // Search Logic States
  const [searchTerm, setSearchTerm] = useState("");
  const [allFoods, setAllFoods] = useState([]); // Stores the full list from DB
  const [suggestions, setSuggestions] = useState([]); // Stores filtered results
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null); // Used to detect clicks outside

  // 1. Fetch All Foods on Page Load (Linked to ExploreFood Database)
  useEffect(() => {
    const fetchFoods = async () => {
      try {
        // ✅ CORRECTED: Use the same endpoint as ExploreFoodPage
        const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const res = await axios.get(`${API_BASE_URL}/api/exploreFood`); 
        
        // Handle response structure
        if (Array.isArray(res.data)) {
           setAllFoods(res.data);
        } else if (res.data && res.data.success) {
           setAllFoods(res.data.data);
        }
      } catch (err) {
        console.error("Failed to load search index:", err);
      }
    };
    fetchFoods();
  }, []);

  // 2. Handle Typing in Search Bar
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value.length > 0) {
      // Filter foods based on name (case-insensitive)
      const matches = allFoods.filter(food => 
        food.name.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(matches.slice(0, 6)); // Show top 6 results
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // 3. Handle Clicking a Dropdown Item (Direct Redirect)
  const handleSuggestionClick = (foodId) => {
    // Navigate to food detail directly
    if (foodId) {
      navigate(`/fooddetail/${foodId}`);
    } else {
      console.error("Invalid Food ID");
    }
    setShowSuggestions(false);
  };

  // 4. Handle "Enter" Key (Standard Search)
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      // Redirect to Explore page with search query
      navigate(`/foods?search=${encodeURIComponent(searchTerm)}`);
      setShowSuggestions(false);
    }
  };

  // 5. Close Dropdown if clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handler for gated features
  const handleProtectedAction = (path, featureName) => {
    if (!user || user.role === "guest") {
      setModalMessage(`Please login or register to use the ${featureName}.`);
      setShowLoginPrompt(true);
    } else {
      navigate(path);
    }
  };

  return (
    <div className="homepage">
      <Header />

      {/* HERO SECTION */}
      <header className="hero-section">
        <div className="hero-content-wrapper">
          
          <h1 className="hero-title">
            {user ? `Welcome back, ${user.firstname}!` : "Discover Sarawak's Culinary Heritage"}
          </h1>
          
          <p className="hero-subtitle">
            Preserving traditional dishes through AI-powered nutrition analysis and cultural storytelling.
          </p>

          {/* === SMART SEARCH BAR CONTAINER === */}
          <div className="hero-search-container" ref={searchRef}>
            <form className="hero-search-form" onSubmit={handleSearchSubmit}>
              <div className="search-input-wrapper">
                <FaSearch className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Search for a dish (e.g., Laksa, Kolo Mee)..." 
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onFocus={() => searchTerm && setShowSuggestions(true)}
                  autoComplete="off"
                />
              </div>
              <button type="submit" className="search-button">Search</button>
            </form>

            {/* === DROPDOWN RESULTS === */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="search-dropdown">
                {suggestions.map((food) => (
                  <div 
                    key={food.foodID || food.id} // Handle potential ID naming differences
                    className="search-suggestion-item"
                    onClick={() => handleSuggestionClick(food.foodID || food.id)}
                  >
                    <div className="suggestion-icon"><FaUtensils /></div>
                    <div className="suggestion-text">
                      <span className="suggestion-name">{food.name}</span>
                      <span className="suggestion-category">{food.category || "Traditional Dish"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="scroll-hint-container">
             <FaAnglesDown className="bounce-icon" />
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="features-layout-wrapper">
        <section className="features-grid">
          {/* Card 1: Explore */}
          <div className="feature-card public-card">
            <div className="card-content-top">
                <div className="feature-icon">🔍</div>
                <h3>Explore Foods</h3>
                <p>Discover traditional Sarawakian dishes and the unique stories behind them.</p>
            </div>
            <button className="feature-btn" onClick={() => navigate("/foods")}>
              Explore Now
            </button>
          </div>

          {/* Card 2: Analyzer */}
          <div className="feature-card restricted-card">
            <div className="card-content-top">
                {(!user || user.role === "guest") && (
                  <div className="lock-badge">🔒 Member Only</div>
                )}
                <div className="feature-icon">🧠</div>
                <h3>Nutrition Analyzer</h3>
                <p>Get AI-powered nutrition analysis and healthy traditional alternatives.</p>
            </div>
            <button 
              className="feature-btn btn-accent" 
              onClick={() => handleProtectedAction("/analyzer", "Nutrition Analyzer")}
            >
              Start Analysis
            </button>
          </div>

          {/* Card 3: Profile */}
          <div className="feature-card restricted-card">
            <div className="card-content-top">
                {(!user || user.role === "guest") && (
                  <div className="lock-badge">🔒 Member Only</div>
                )}
                <div className="feature-icon">👤</div>
                <h3>My Profile</h3>
                <p>Manage your dietary preferences and keep track of your saved heritage foods.</p>
            </div>
            <button 
              className="feature-btn" 
              onClick={() => handleProtectedAction("/profile", "Profile")}
            >
              View Profile
            </button>
          </div>
        </section>

        {/* Fresh from the Kitchen Section */}
        {recentFoods && recentFoods.length > 0 && (
          <section className="recent-section">
            <div className="section-header">
              <h2>Fresh from the Kitchen</h2>
              <button className="view-all-link" onClick={() => navigate('/foods')}>View All &rarr;</button>
            </div>
            
            <div className="food-carousel">
              {recentFoods.slice(0, 4).map((food) => (
                <div 
                  key={food.id} 
                  className="mini-food-card" 
                  onClick={() => navigate(`/fooddetail/${food.id}`)}
                >
                  <div className="mini-card-image" style={{backgroundImage: `url(${food.imageUrl})`}}></div>
                  <div className="mini-card-info">
                    <h4>{food.name}</h4>
                    <span className="category-tag">{food.category}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Heritage Fact Banner */}
        <section className="heritage-fact-banner">
          <div className="fact-content">
            <span className="fact-label">Did You Know?</span>
            <p>"Manok Pansoh" is a traditional Iban delicacy where chicken is cooked inside bamboo over an open fire, sealing in moisture and flavor without using oil.</p>
          </div>
        </section>

      </main>

      {showLoginPrompt && (
        <LoginPromptModal
          message={modalMessage}
          onClose={() => setShowLoginPrompt(false)}
          onLogin={() => navigate("/loginregister")}
        />
      )}
      <Footer />
    </div>
  );
}