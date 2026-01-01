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
import { FaSearch, FaChevronLeft, FaChevronRight, FaStar, FaLightbulb, FaSyncAlt } from "react-icons/fa";      
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

  // FACTS STATE
  const [currentFact, setCurrentFact] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // --- HERITAGE FACTS DATA ---
  const heritageFacts = [
    {
      title: "Bamboo Cooking",
      text: "\"Manok Pansoh\" is a traditional Iban delicacy where chicken is cooked inside freshly cut bamboo over an open fire, sealing in moisture and flavor."
    },
    {
      title: "Melanau Sushi?",
      text: "\"Umai\" is a traditional Melanau dish of raw sliced fish marinated with limau kasturi, onions, and chilies—Sarawak's ancient answer to ceviche."
    },
    {
      title: "The Red Noodles",
      text: "The red color in traditional Kuching Kolo Mee often comes from 'Char Siu' oil, giving it a distinct savory sweetness compared to the white version."
    },
    {
      title: "Liquid Gold",
      text: "\"Gula Apong\" is a natural palm sugar made from the Nipah palm found in Sarawak's coastal areas. It has a unique caramel-salty flavor profile."
    }
  ];

  // --- SIGNATURE DISHES (Static + DB Connection) ---
  const PRESET_SIGNATURES = [
    { name: "Sarawak Laksa", image: LaksaImg, tag: "Must Try" },
    { name: "Kolo Mee", image: KoloImg, tag: "Local Fav" },
    { name: "Kek Lapis", image: KekImg, tag: "Sweet" }
  ];

  const signatureDishes = useMemo(() => {
    return PRESET_SIGNATURES.map(preset => {
      const match = allFoods.find(f => f.name.toLowerCase() === preset.name.toLowerCase());
      return { ...preset, dbId: match ? (match.foodID || match.id) : null };
    });
  }, [allFoods]);

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchFoods = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const res = await axios.get(`${API_BASE_URL}/api/exploreFood`); 
        if (Array.isArray(res.data)) setAllFoods(res.data);
        else if (res.data && res.data.success) setAllFoods(res.data.data);
      } catch (err) {
        console.error("Failed to load search index:", err);
      }
    };
    fetchFoods();
  }, []);

  // --- HANDLERS ---
  const handleDishClick = (dish) => {
    if (dish.dbId) navigate(`/fooddetail/${dish.dbId}`);
    else navigate(`/foods?search=${encodeURIComponent(dish.name)}`);
  };

  const handleNextFact = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentFact((prev) => (prev + 1) % heritageFacts.length);
      setIsAnimating(false);
    }, 300);
  };

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
      setSuggestions([]); setShowSuggestions(false);
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

  // ✅ FIXED: Helper to safely determine the Hero Title
  const getHeroTitle = () => {
    if (!user) return "Discover Sarawak's Culinary Heritage";
    // Check if role is guest OR if firstname is missing (common for guest objects)
    if (user.role === "guest" || !user.firstname) return "Welcome, Guest!";
    return `Welcome back, ${user.firstname}!`;
  };

  // Slideshow
  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev === HERO_IMAGES.length - 1 ? 0 : prev + 1));
    }, 6000); 
    return () => clearInterval(slideInterval);
  }, [currentSlide]);

  const nextSlide = () => setCurrentSlide((prev) => (prev === HERO_IMAGES.length - 1 ? 0 : prev + 1));
  const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? HERO_IMAGES.length - 1 : prev - 1));

  // Click Outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) setShowSuggestions(false);
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
          {/* ✅ FIXED TITLE CALL */}
          <h1 className="hero-title">{getHeroTitle()}</h1>
          
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

        {/* --- CINEMATIC SHOWCASE --- */}
        <section className="showcase-section">
          <div className="section-header center-header">
            <h2>Taste of Sarawak</h2>
            <p className="section-subtext">Click a dish to uncover its history</p>
          </div>

          <div className="cinema-grid-wrapper">
            <div className="cinema-grid">
              {signatureDishes.map((dish) => (
                <div 
                  key={dish.name} 
                  className="cinema-item" 
                  onClick={() => handleDishClick(dish)}
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

        {/* --- ✅ UPDATED: INTERACTIVE TRIVIA CARD --- */}
        <section className="heritage-fact-banner">
          <div className="fact-decoration-circle"></div>
          
          <div className="fact-content-wrapper">
            <div className="fact-icon-box">
              <FaLightbulb />
            </div>
            
            <div className={`fact-text-area ${isAnimating ? "fade-out" : "fade-in"}`}>
              <span className="fact-label">Did You Know?</span>
              <h3 className="fact-title">{heritageFacts[currentFact].title}</h3>
              <p className="fact-body">{heritageFacts[currentFact].text}</p>
            </div>

            <button className="fact-refresh-btn" onClick={handleNextFact} aria-label="Next Fact">
              <FaSyncAlt className={isAnimating ? "spin-icon" : ""} />
              <span>Next Fact</span>
            </button>
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