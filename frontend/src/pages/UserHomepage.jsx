import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "../css/UserHomepage.css";
import Header from "../components/Header";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { translateTexts } from "../hooks/useAITranslation";

import LoginFood from "../assets/LoginFood.png";
import KoloImg from "../assets/kolomee.jpg";

import { FaSearch, FaStar, FaLightbulb, FaSyncAlt, FaUserEdit, FaDice } from "react-icons/fa";
import { FaAnglesDown, FaUtensils, FaWandMagicSparkles } from "react-icons/fa6";

import { useAuth } from "../context/AuthContext";
import LoginPromptModal from "../components/LoginPromptModal";

const HERO_IMAGES = [LoginFood, KoloImg];

// ── Dish Spotlight Component — DB driven ──
function DishSpotlight({ allFoods, navigate, t, translatedFoods = {} }) {
  const [active, setActive] = React.useState(0);
  const timerRef = React.useRef(null);

  const SPOTLIGHT_IDS = [2, 10, 11];

  const spotlightDishes = React.useMemo(() => {
    if (!allFoods || allFoods.length === 0) return [];
    return SPOTLIGHT_IDS
      .map(id => allFoods.find(f => (f.foodID || f.id) === id))
      .filter(f => f && (f.imageUrl || f.image));
  }, [allFoods]);

  const startTimer = React.useCallback(() => {
    clearInterval(timerRef.current);
    if (spotlightDishes.length < 2) return;
    timerRef.current = setInterval(() => {
      setActive(prev => (prev + 1) % spotlightDishes.length);
    }, 5000);
  }, [spotlightDishes.length]);

  React.useEffect(() => {
    setActive(0);
    startTimer();
    return () => clearInterval(timerRef.current);
  }, [startTimer]);

  const goTo = (idx) => { setActive(idx); startTimer(); };

  if (spotlightDishes.length === 0) return null;

  const dish = spotlightDishes[active];
  const dishImg = dish.imageUrl || dish.image;
  const dishId = dish.foodID || dish.id;
  const dishCategory = dish.category || "Traditional";
  const dishOrigin = dish.ethnicity || dish.origin || "Sarawak";

  return (
    <section className="home-dish-spotlight-section">
      <div className="home-dish-spotlight-card">
        <div className="home-dish-spotlight-img" style={{ backgroundImage: `url(${dishImg})` }}>
          <div className="home-dish-img-overlay" />
          <span className="home-dish-origin-badge">{dishOrigin}</span>
        </div>
        <div className="home-dish-spotlight-content">
          <span className="home-dish-tag-pill">
            {t(`explore.cat_${dishCategory.toLowerCase().replace(" ", "_")}`, dishCategory)}
          </span>
          <h2 className="home-dish-spotlight-title">
            {translatedFoods[`name_${dish.foodID}`] || dish.name}
          </h2>
          <p className="home-dish-spotlight-quote">
            {translatedFoods[`desc_${dish.foodID}`] || dish.description || t("home.dishDefaultDesc")}
          </p>
          <div className="home-dish-spotlight-actions">
            <button
              className="home-dish-btn-primary lrp-no-outline"
              onClick={() => navigate(dishId ? `/fooddetail/${dishId}` : `/foods?search=${encodeURIComponent(dish.name)}`)}
            >
              {t("home.exploreDish", "Explore this dish")}
            </button>
            <button className="home-dish-btn-link lrp-no-outline" 
            onClick={() => navigate(dishId ? `/recipes/${dishId}` : `/recipes?search=${encodeURIComponent(dish.name)}`)}>
              {t("home.viewNutrition", "View Recipe →")}
            </button>
          </div>
          <div className="home-dish-dots">
            {spotlightDishes.map((_, i) => (
              <span key={i} className={`home-dish-dot${i === active ? " active" : ""}`} onClick={() => goTo(i)} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function UserHomepage({ recentFoods = [], stats = {} }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const isGuest = !user || user?.role === "guest";
  const [translatedFoods, setTranslatedFoods] = useState({});
  const [isTranslating, setIsTranslating] = useState(false);

  const [modalMessage, setModalMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [allFoods, setAllFoods] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);
  const heroRef = useRef(null);
  const snapContainerRef = useRef(null);
  const isSnappingRef = useRef(false);
  const isMobileRef = useRef(false);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);
  const [activeDot, setActiveDot] = useState(0);
  const statsGridRef = useRef(null);
  const [isRandomizing, setIsRandomizing] = useState(false);
  const [randomizerText, setRandomizerText] = useState("");
  const [randomizerResult, setRandomizerResult] = useState(null);

  // Dot indicator tracking for stat card carousel
  useEffect(() => {
    const grid = statsGridRef.current;
    if (!grid) return;
    const handleScroll = () => {
      const index = Math.round(grid.scrollLeft / grid.offsetWidth);
      setActiveDot(index);
    };
    grid.addEventListener("scroll", handleScroll, { passive: true });
    return () => grid.removeEventListener("scroll", handleScroll);
  }, []);

  // Track mobile breakpoint
  useEffect(() => {
    const check = () => { isMobileRef.current = window.innerWidth <= 768; };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

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

  // True when a real named user is logged in (not guest)
  const isLoggedInUser = user && user.role !== "guest" && user.firstname;

  // Guard guest users from accessing login-only features
  const requireLogin = (message = "") => {
    if (isGuest) {
      setModalMessage(message);
      setShowModal(true);
      return true;
    }
    return false;
  };

  const handleDailyQuiz = () => {
    if (requireLogin(t("modal.loginQuizMessage", "Please log in to access the Daily Quiz."))) return;
    navigate("/daily-quiz");
  };

  const getWelcomeTitle = () => {
    if (isLoggedInUser) return t("home.heroUser", { name: user.firstname });
    return t("home.mainHeadline", "Discover Sarawak's Heritage and Food");
  };

  const nextSlide = () => setCurrentSlide((prev) => (prev === HERO_IMAGES.length - 1 ? 0 : prev + 1));
  const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? HERO_IMAGES.length - 1 : prev - 1));

  useEffect(() => {
    if (isCarouselPaused) return;
    const slideInterval = setInterval(nextSlide, 6000);
    return () => clearInterval(slideInterval);
  }, [currentSlide, isCarouselPaused]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === "ArrowLeft") prevSlide();
      if (e.key === "ArrowRight") nextSlide();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.key === "/" && e.target.tagName !== "INPUT" && e.target.tagName !== "TEXTAREA") {
        e.preventDefault();
        searchRef.current?.querySelector("input")?.focus();
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) setShowSuggestions(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Snap scroll — desktop only, touch/mobile uses normal scroll
  useEffect(() => {
    const container = snapContainerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      if (document.body.classList.contains("notification-panel-open")) return;
      e.preventDefault();
      if (isSnappingRef.current) return;
      const sections = container.querySelectorAll(".home-snap-section");
      const currentIndex = Math.round(container.scrollTop / window.innerHeight);
      let nextIndex = currentIndex;
      if (e.deltaY > 0 && currentIndex < sections.length - 1) nextIndex = currentIndex + 1;
      else if (e.deltaY < 0 && currentIndex > 0) nextIndex = currentIndex - 1;
      if (nextIndex !== currentIndex) {
        isSnappingRef.current = true;
        container.scrollTo({ top: nextIndex * window.innerHeight, behavior: "smooth" });
        setTimeout(() => { isSnappingRef.current = false; }, 800);
      }
    };

    let touchStartY = 0;
    const handleTouchStart = (e) => { touchStartY = e.touches[0].clientY; };
    const handleTouchEnd = (e) => {
      if (document.body.classList.contains("notification-panel-open")) return;
      if (isSnappingRef.current) return;
      const delta = touchStartY - e.changedTouches[0].clientY;
      if (Math.abs(delta) < 50) return;
      const sections = container.querySelectorAll(".home-snap-section");
      const currentIndex = Math.round(container.scrollTop / window.innerHeight);
      let nextIndex = currentIndex;
      if (delta > 0 && currentIndex < sections.length - 1) nextIndex = currentIndex + 1;
      else if (delta < 0 && currentIndex > 0) nextIndex = currentIndex - 1;
      if (nextIndex !== currentIndex) {
        isSnappingRef.current = true;
        container.scrollTo({ top: nextIndex * window.innerHeight, behavior: "smooth" });
        setTimeout(() => { isSnappingRef.current = false; }, 800);
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  const handleRandomize = () => {
    if (!allFoods || allFoods.length === 0) return;
    setIsRandomizing(true);
    setRandomizerResult(null);
    let ticks = 0;
    const maxTicks = 20;
    const interval = setInterval(() => {
      const randomFood = allFoods[Math.floor(Math.random() * allFoods.length)];
      setRandomizerText(randomFood.name);
      ticks++;
      if (ticks >= maxTicks) {
        clearInterval(interval);
        const finalFood = allFoods[Math.floor(Math.random() * allFoods.length)];
        setRandomizerText(finalFood.name);
        setTimeout(() => { setRandomizerResult(finalFood); }, 300);
      }
    }, 100);
  };

  useEffect(() => {
    if (!allFoods.length || i18n.language === "en") {
      setTranslatedFoods({});
      return;
    }

    const cacheKey = `translations_${i18n.language}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      setTranslatedFoods(JSON.parse(cached));
      return;
    }

    setIsTranslating(true);
    const texts = {};
    allFoods.forEach(f => {
      texts[`name_${f.foodID}`] = f.name;
      texts[`desc_${f.foodID}`] = f.description;
    });
    translateTexts(texts, i18n.language).then(result => {
      setTranslatedFoods(result);
      localStorage.setItem(cacheKey, JSON.stringify(result));
      setIsTranslating(false);
    });
  }, [allFoods, i18n.language]);

  return (
    <div className="homepage home-snap-container" ref={snapContainerRef}>
      <Header transparent={true} />

      {/* ── SECTION 1: Hero ── */}
      <header
        ref={heroRef}
        className="hero-section home-snap-section"
        style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url(${HERO_IMAGES[currentSlide]})` }}
      >
        <button className="hero-arrow arrow-left" onClick={prevSlide} aria-label="Previous image"></button>

        <div className="home-hero-content-wrapper">
          <div className="hero-sdg-badges">
            <span className="sdg-badge">🌿 {t("home.sdg3", "SDG 3 · Good Health")}</span>
            <span className="sdg-badge">🏙️ {t("home.sdg11", "SDG 11 · Sustainable Communities")}</span>
          </div>
          <h1 className="hero-title">{getWelcomeTitle()}</h1>
          {!isLoggedInUser && (
            <p className="hero-subtitle">{t("home.heroSubtitle")}</p>
          )}

          <div className="hero-search-container" ref={searchRef}>
            {/* SEARCH BAR — temporarily disabled */}
            {/*
            <form className="hero-search-form" onSubmit={handleSearchSubmit}>
              <div className="unified-search-pill">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder={t("home.searchPlaceholder")}
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onFocus={() => {
                    if (searchTerm) setShowSuggestions(true);
                    setIsCarouselPaused(true);
                  }}
                  onBlur={() => setIsCarouselPaused(false)}
                  autoComplete="off"
                />
                <button type="submit" className="search-button lrp-no-outline">{t("home.searchBtn")}</button>
              </div>
            </form>
            */}

            <div className="hero-pill-row">
              <button className="randomizer-btn" onClick={handleRandomize} type="button">
                <FaDice className="dice-icon" /> {t("home.randomizerBtn")}
              </button>

              <button
                className="randomizer-btn daily-quiz-btn"
                onClick={handleDailyQuiz}
                type="button"
              >
                <FaLightbulb className="dice-icon" /> {t("home.dailyQuizBtn", "Daily Quiz")}
              </button>
            </div>

            {/* SEARCH SUGGESTIONS — disabled with search bar */}
            {/*
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
                      <span className="suggestion-category">{food.category || t("home.traditionalDish")}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            */}
          </div>
        </div>

        <div
          className="home-scroll-hint hero-scroll-hint"
          onClick={() => snapContainerRef.current?.scrollTo({ top: window.innerHeight, behavior: "smooth" })}
        >
          <span className="home-scroll-text">{t("home.scrollExplore", "Explore")}</span>
          <FaAnglesDown className="home-bounce-icon" />
        </div>

        <button className="hero-arrow arrow-right" onClick={nextSlide} aria-label="Next image"></button>

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

      {/* ── SECTION 2: Stats ── */}
      <section className="home-snap-section home-stats-section">
        <div className="home-stats-inner">
          <div className="home-stats-intro">
            <p className="home-stats-eyebrow">{t("home.statsEyebrow", "What is SarawakEats?")}</p>
            <h2 className="home-stats-headline">{t("home.statsHeadline", "Where food becomes a story worth preserving.")}</h2>
            <p className="home-stats-subtext">{t("home.statsSubtext", "SarawakEats is a centralised, community-driven platform that documents, analyses, and celebrates the nutritional heritage of Sarawak's foods by supporting healthier communities and the cultural identity of Borneo's people.")}</p>
          </div>
          <div className="home-stats-grid" ref={statsGridRef}>
            <div className="home-stat-item">
              <span className="home-stat-num">27+</span>
              <div className="home-stat-divider" />
              <span className="home-stat-title">{t("home.stat1Title", "Ethnic groups")}</span>
              <span className="home-stat-desc">{t("home.stat1Desc", "Each with their own culinary traditions passed down through generations.")}</span>
            </div>
            <div className="home-stat-item">
              <span className="home-stat-num">100+</span>
              <div className="home-stat-divider" />
              <span className="home-stat-title">{t("home.stat2Title", "Traditional dishes")}</span>
              <span className="home-stat-desc">{t("home.stat2Desc", "From Laksa to Umai, flavours unique to the Land of the Hornbills.")}</span>
            </div>
            <div className="home-stat-item">
              <span className="home-stat-num">400+</span>
              <div className="home-stat-divider" />
              <span className="home-stat-title">{t("home.stat3Title", "Years of heritage")}</span>
              <span className="home-stat-desc">{t("home.stat3Desc", "Centuries of trade, migration, and culture woven into every recipe.")}</span>
            </div>
          </div>
          <div className="home-stats-dots">
            {[0,1,2].map(i => (
              <span
                key={i}
                className={`home-stats-dot${activeDot === i ? " active" : ""}`}
                onClick={() => statsGridRef.current?.scrollTo({ left: i * statsGridRef.current.offsetWidth, behavior: "smooth" })}
              />
            ))}
          </div>
        </div>
        {/* Explore hint — direct child of section so it anchors bottom-right */}
        <div
          className="home-scroll-hint home-stats-scroll-hint"
          onClick={() => snapContainerRef.current?.scrollTo({ top: window.innerHeight * 2, behavior: "smooth" })}
        >
          <span className="home-scroll-text">{t("home.scrollExplore", "Explore")}</span>
          <FaAnglesDown className="home-bounce-icon" />
        </div>
      </section>

      {/* ── SECTION 3: Dish Spotlight ── */}
      <section className="home-snap-section home-dish-snap-section">
        <DishSpotlight allFoods={allFoods} navigate={navigate} t={t} translatedFoods={translatedFoods} /> 
      </section>

      {isRandomizing && (
        <div className="randomizer-overlay">
          <div className="randomizer-content">
            {!randomizerResult ? (
              <>
                <FaDice className="spinning-dice" />
                <h3>{t("home.randomizerFinding")}</h3>
                <div className="slot-machine-text">{randomizerText}</div>
              </>
            ) : (
              <div className="result-reveal slide-up">
                <h3>{t("home.randomizerHowAbout")}</h3>
                <div className="slot-machine-text highlight-winner">{randomizerResult.name}</div>
                <div className="randomizer-actions">
                  <button
                    className="feature-btn btn-accent map-btn"
                    onClick={() => {
                      setIsRandomizing(false);
                      navigate(`/map?q=${encodeURIComponent(randomizerResult.name)}`);
                    }}
                  >
                    {t("home.randomizerFindOnMap")}
                  </button>
                  <div className="secondary-actions">
                    <button className="text-btn" onClick={handleRandomize}>{t("home.randomizerSpinAgain")}</button>
                    <button className="text-btn close-btn" onClick={() => setIsRandomizing(false)}>{t("home.randomizerCancel")}</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <LoginPromptModal
        show={showModal}
        message={modalMessage}
        onClose={() => setShowModal(false)}
      />
    </div>
  );
}