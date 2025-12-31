/* src/pages/UserHomepage.jsx */
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "../css/UserHomepage.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import axios from "axios"; 

// --- IMAGES ---
import LoginFood from "../assets/LoginFood.png"; 
import LaksaImg from "../assets/laksa.jpg";     
import KoloImg from "../assets/kolomee.jpg";   
import KekImg from "../assets/keklapis.jpg";    

// Icons
import { FaSearch, FaChevronLeft, FaChevronRight, FaStar } from "react-icons/fa";      
import { FaAnglesDown, FaUtensils } from "react-icons/fa6"; 

import { useAuth } from "../context/AuthContext";
import LoginPromptModal from "../components/LoginPromptModal";

// SLIDESHOW IMAGES
const HERO_IMAGES = [
  LoginFood, 
  LaksaImg,
  KoloImg
];

export default function UserHomepage({ recentFoods = [], stats = {} }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Database Data
  const [allFoods, setAllFoods] = useState([]); 
  
  const [suggestions, setSuggestions] = useState([]); 
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null); 

  // SLIDESHOW STATE
  const [currentSlide, setCurrentSlide] = useState(0);

  // --- 1. DEFINE SIGNATURE DISHES (Static Data + Images) ---
  const PRESET_SIGNATURES = [
    { name: "Sarawak Laksa", image: LaksaImg, tag: "Must Try" },
    { name: "Kolo Mee", image: KoloImg, tag: "Local Fav" },
    { name: "Kek Lapis", image: KekImg, tag: "Sweet" }
  ];

  // --- 2. CONNECT TO DATABASE (Find IDs) ---
  // This merges your pretty images with the real IDs from the database
  const signatureDishes = useMemo(() => {
    return PRESET_SIGNATURES.map(preset => {
      // Try to find this dish in the fetched database list (case-insensitive)
      const match = allFoods.find(f => f.name.toLowerCase() === preset.name.toLowerCase());
      
      return {
        ...preset,
        // If found, save the real ID. If not found, dbId will be null.
        dbId: match ? (match.foodID || match.id) : null
      };
    });
  }, [allFoods]);

  // --- 3. FETCH DATA ---
  useEffect(() => {
    const fetchFoods = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const res = await axios.get(`${API_BASE_URL}/api/exploreFood`); 
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

  // --- 4. SMART NAVIGATION HANDLER ---
  const handleDishClick = (dish) => {
    if (dish.dbId) {
      // ✅ SUCCESS: Found in DB, go to Detail Page
      navigate(`/fooddetail/${dish.dbId}`);
    } else {
      // ⚠️ FALLBACK: Not found in DB yet, go to Search Page
      navigate(`/foods?search=${encodeURIComponent(dish.name)}`);
    }
  };

  // Auto-play Logic
  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev === HERO_IMAGES.length - 1 ? 0 : prev + 1));
    }, 6000); 
    return () => clearInterval(slideInterval);
  }, [currentSlide]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === HERO_IMAGES.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? HERO_IMAGES.length - 1 : prev - 1));
  };

  // Search Logic
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (value.length > 0) {
      const matches = allFoods.filter(food => 
        food.name.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(matches.slice(0, 6)); 
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (foodId) => {
    if (foodId) navigate(`/fooddetail/${foodId}`);
    setShowSuggestions(false);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/foods?search=${encodeURIComponent(searchTerm)}`);
      setShowSuggestions(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      <Header transparent={true} /> 

      {/* HERO SECTION */}
      <header 
        className="hero-section"
        style={{ 
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${HERO_IMAGES[currentSlide]})` 
        }}
      >
        <button className="hero-arrow arrow-left" onClick={prevSlide}>
          <FaChevronLeft />
        </button>

        <div className="hero-content-wrapper">
          <h1 className="hero-title">
            {user ? `Welcome, ${user.firstname}!` : "Discover Sarawak's Culinary Heritage"}
          </h1>
          <p className="hero-subtitle">
            Preserving traditional dishes through AI-powered nutrition analysis and cultural storytelling.
          </p>

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

            {showSuggestions && suggestions.length > 0 && (
              <div className="search-dropdown">
                {suggestions.map((food) => (
                  <div 
                    key={food.foodID || food.id} 
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

        <button className="hero-arrow arrow-right" onClick={nextSlide}>
          <FaChevronRight />
        </button>

        <div className="hero-dots">
          {HERO_IMAGES.map((_, idx) => (
            <span 
              key={idx} 
              className={`hero-dot ${idx === currentSlide ? "active" : ""}`}
              onClick={() => setCurrentSlide(idx)}
            ></span>
          ))}
        </div>
      </header>

      <main className="features-layout-wrapper">
        
        {/* Core Features Grid */}
        <section className="features-grid">
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

        {/* --- CINEMATIC SHOWCASE (Connected to DB) --- */}
        <section className="showcase-section">
          <div className="section-header center-header">
            <h2>Taste of Sarawak</h2>
            <p className="section-subtext">Click a dish to uncover its history</p>
          </div>

          <div className="cinema-grid-wrapper">
            <div className="cinema-grid">
              {signatureDishes.map((dish) => (
                <div 
                  key={dish.name} // Use name as key since ID might be null initially
                  className="cinema-item" 
                  onClick={() => handleDishClick(dish)} // ✅ Use the new handler
                >
                  <div className="plate-container">
                    <img src={dish.image} alt={dish.name} className="real-plate-img" />
                    <div className="plate-glare"></div>
                  </div>
                  
                  <div className="floating-label">
                    <span className="dish-tag">
                      <FaStar className="star-icon"/> {dish.tag}
                    </span>
                    <h3>{dish.name}</h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Recent Foods */}
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