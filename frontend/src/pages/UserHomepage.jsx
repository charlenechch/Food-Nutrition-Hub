/* src/pages/UserHomepage.jsx */
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "../css/UserHomepage.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import axios from "axios";
import { useTranslation } from "react-i18next";

import LoginFood from "../assets/LoginFood.png";
import KoloImg from "../assets/kolomee.jpg";
import KekImg from "../assets/keklapis.jpg";

import { FaSearch, FaStar, FaLightbulb, FaSyncAlt, FaUserEdit, FaDice } from "react-icons/fa";
import { FaAnglesDown, FaUtensils, FaWandMagicSparkles } from "react-icons/fa6";

import { useAuth } from "../context/AuthContext";
import LoginPromptModal from "../components/LoginPromptModal";

const HERO_IMAGES = [LoginFood, KoloImg];


// ── Dish Spotlight Component — DB driven ──
function DishSpotlight({ allFoods, navigate, t }) {
  const [active, setActive] = React.useState(0);
  const timerRef = React.useRef(null);

  const spotlightDishes = React.useMemo(() => {
    if (!allFoods || allFoods.length === 0) return [];
    return allFoods.filter(f => f.imageUrl || f.image).slice(0, 4);
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
    <section className="dish-spotlight-section">
      <div className="dish-spotlight-card">
        <div className="dish-spotlight-img" style={{ backgroundImage: `url(${dishImg})` }}>
          <div className="dish-img-overlay" />
          <span className="dish-origin-badge">{dishOrigin}</span>
        </div>
        <div className="dish-spotlight-content">
          <span className="dish-tag-pill">{dishCategory}</span>
          <h2 className="dish-spotlight-title">{dish.name}</h2>
          <p className="dish-spotlight-quote">
            {dish.description || t("home.dishDefaultDesc", "A beloved traditional dish from the rich culinary heritage of Sarawak.")}
          </p>
          <div className="dish-spotlight-actions">
            <button
              className="dish-btn-primary"
              onClick={() => navigate(dishId ? `/fooddetail/${dishId}` : `/foods?search=${encodeURIComponent(dish.name)}`)}
            >
              {t("home.exploreDish", "Explore this dish")}
            </button>
            <button className="dish-btn-link" onClick={() => navigate("/analyzer")}>
              {t("home.viewNutrition", "View nutrition →")}
            </button>
          </div>
          <div className="dish-dots">
            {spotlightDishes.map((_, i) => (
              <span key={i} className={`dish-dot${i === active ? " active" : ""}`} onClick={() => goTo(i)} />
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
  const { t } = useTranslation();

  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [allFoods, setAllFoods] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);
  const heroRef = useRef(null);
  const snapContainerRef = useRef(null);
  const isSnappingRef = useRef(false);
  
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentFact, setCurrentFact] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false); 

  const [isRandomizing, setIsRandomizing] = useState(false);
  const [randomizerText, setRandomizerText] = useState("");
  const [randomizerResult, setRandomizerResult] = useState(null);

  const heritageFacts = [
    { titleKey: "home.fact1Title", textKey: "home.fact1Text" },
    { titleKey: "home.fact2Title", textKey: "home.fact2Text" },
    { titleKey: "home.fact3Title", textKey: "home.fact3Text" },
    { titleKey: "home.fact4Title", textKey: "home.fact4Text" },
  ];

  const PRESET_SIGNATURES = [
    { name: "Kolo Mee",      image: KoloImg,  tagKey: "home.tagLocalFav" },
    { name: "Kek Lapis",     image: KekImg,   tagKey: "home.tagSweet" },
  ];

  const signatureDishes = useMemo(() => {
    return PRESET_SIGNATURES.map(preset => {
      const match = allFoods.find(f => f.name.toLowerCase() === preset.name.toLowerCase());
      return { ...preset, dbId: match ? (match.foodID || match.id) : null };
    });
  }, [allFoods]);

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

  const getHeroTitle = () => {
    if (!user) return t("home.heroTitle", "Welcome, Guest!");
    if (user.role === "guest" || !user.firstname) return t("home.heroGuest", "Welcome, Guest!");
    return t("home.heroUser", { name: user.firstname });
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

  const handleProtectedAction = (path, featureKey) => {
    if (!user || user.role === "guest") {
      setModalMessage(t("home.loginPrompt", { feature: t(featureKey) }));
      setShowLoginPrompt(true);
    } else {
      navigate(path);
    }
  };

  // Snap scroll
  useEffect(() => {
    const container = snapContainerRef.current;
    if (!container) return;
    const handleWheel = (e) => {
      e.preventDefault();
      if (isSnappingRef.current) return;
      const sections = container.querySelectorAll('.snap-section');
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
      if (isSnappingRef.current) return;
      const delta = touchStartY - e.changedTouches[0].clientY;
      if (Math.abs(delta) < 30) return;
      const sections = container.querySelectorAll('.snap-section');
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

  // Parallax on snap container scroll
  useEffect(() => {
    const container = snapContainerRef.current;
    if (!container) return;
    const handleParallax = () => {
      if (!heroRef.current) return;
      heroRef.current.style.backgroundPosition = `center ${container.scrollTop * 0.4}px`;
    };
    container.addEventListener("scroll", handleParallax, { passive: true });
    return () => container.removeEventListener("scroll", handleParallax);
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
        setTimeout(() => {
          setRandomizerResult(finalFood);
        }, 300);
      }
    }, 100); 
  };

  return (
    <div className="homepage snap-container" ref={snapContainerRef}>
      <Header transparent={true} />

      <header
        ref={heroRef}
        className="hero-section snap-section"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url(${HERO_IMAGES[currentSlide]})`
        }}
      >
        <button className="hero-arrow arrow-left" onClick={prevSlide} aria-label="Previous image"></button>

        <div className="hero-content-wrapper">
          <div className="hero-sdg-badges">
            <span className="sdg-badge">🌿 SDG 3 · Good Health</span>
            <span className="sdg-badge">🏙️ SDG 11 · Sustainable Communities</span>
          </div>
          <span className="hero-greeting">{getHeroTitle()}</span>
          <h1 className="hero-title">{t("home.mainHeadline", "Sarawak's Food. Documented. Preserved. For Everyone.")}</h1>
          <p className="hero-subtitle">{t("home.heroSubtitle", "A community-driven hub preserving the nutritional heritage of Sarawak's traditional foods — for healthier communities and richer cultural identity.")}</p>

          <div className="hero-search-container" ref={searchRef}>
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
                <button type="submit" className="search-button">{t("home.searchBtn")}</button>
              </div>
            </form>

            <button className="randomizer-btn" onClick={handleRandomize} type="button">
              <FaDice className="dice-icon" /> {t("home.randomizerBtn")}
            </button>

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
          </div>
        </div>

        <div className="scroll-hint-container" onClick={() => snapContainerRef.current?.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}>
          <span className="scroll-text">{t("home.scrollExplore")}</span>
          <FaAnglesDown className="bounce-icon" />
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
      <section className="snap-section stats-snap-section">
        <div className="stats-snap-inner">
          <div className="stats-intro">
            <p className="stats-eyebrow">{t("home.statsEyebrow", "What is SarawakEats?")}</p>
            <h2 className="stats-headline">{t("home.statsHeadline", "Where food becomes a story worth preserving.")}</h2>
            <p className="stats-subtext">{t("home.statsSubtext", "SarawakEats is a centralised, community-driven platform that documents, analyses, and celebrates the nutritional heritage of Sarawak's traditional foods by supporting healthier communities and the cultural identity of Borneo's people.")}</p>
          </div>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-num">27+</span>
              <div className="stat-divider" />
              <span className="stat-title">{t("home.stat1Title", "Ethnic groups")}</span>
              <span className="stat-desc">{t("home.stat1Desc", "Each with their own culinary traditions passed down through generations.")}</span>
            </div>
            <div className="stat-item">
              <span className="stat-num">100+</span>
              <div className="stat-divider" />
              <span className="stat-title">{t("home.stat2Title", "Traditional dishes")}</span>
              <span className="stat-desc">{t("home.stat2Desc", "From Laksa to Umai, flavours unique to the Land of the Hornbills.")}</span>
            </div>
            <div className="stat-item">
              <span className="stat-num">400+</span>
              <div className="stat-divider" />
              <span className="stat-title">{t("home.stat3Title", "Years of heritage")}</span>
              <span className="stat-desc">{t("home.stat3Desc", "Centuries of trade, migration, and culture woven into every recipe.")}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 3: Dish Spotlight ── */}
      <section className="snap-section dish-snap-section">
        <DishSpotlight allFoods={allFoods} navigate={navigate} t={t} />
      </section>

      {/* ── SECTION 4: Rest of content ── */}
      <main className="features-layout-wrapper snap-section snap-main">
        <div style={{height: '1px'}} />

        <section className="showcase-section">
          <div className="section-header center-header">
            <h2>{t("home.showcaseTitle")}</h2>
            <p className="section-subtext">{t("home.showcaseSubtext")}</p>
          </div>

          <div className="cinema-grid-wrapper">
            <div className="cinema-grid">
              {signatureDishes.map((dish) => (
                <div key={dish.name} className="cinema-item" onClick={() => handleDishClick(dish)}>
                  <div className="plate-container">
                    <img src={dish.image} alt={dish.name} className="real-plate-img" />
                    <div className="plate-glare"></div>
                  </div>
                  <div className="floating-label">
                    <span className="dish-tag">
                      <FaStar className="star-icon" /> {t(dish.tagKey)}
                    </span>
                    <h3>{dish.name}</h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {recentFoods && recentFoods.length > 0 && (
          <section className="recent-section">
            <div className="section-header">
              <h2>{t("home.recentTitle")}</h2>
              <button className="view-all-link" onClick={() => navigate("/foods")}>
                {t("home.viewAll")} →
              </button>
            </div>
            <div className="food-carousel">
              {recentFoods.slice(0, 4).map((food) => (
                <div
                  key={food.id}
                  className="mini-food-card"
                  onClick={() => navigate(`/fooddetail/${food.id}`)}
                >
                  <div className="mini-card-image" style={{ backgroundImage: `url(${food.imageUrl})` }}></div>
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
          <div className="fact-decoration-circle circle-1"></div>
          <div className="fact-decoration-circle circle-2"></div>
          
          <div className="fact-content-wrapper">
            <div className="fact-icon-box">
              <FaLightbulb className="glowing-bulb" />
            </div>
            <div className={`fact-text-area ${isAnimating ? "fade-out" : "fade-in"}`}>
              <span className="fact-label">{t("home.didYouKnow")}</span>
              <h3 className="fact-title">{t(heritageFacts[currentFact].titleKey)}</h3>
              <p className="fact-body">{t(heritageFacts[currentFact].textKey)}</p>
            </div>
            <button className="fact-refresh-btn" onClick={handleNextFact} aria-label="Next Fact">
              <FaSyncAlt className={isAnimating ? "spin-icon" : ""} />
              <span>{t("home.nextFact")}</span>
            </button>
          </div>
        </section>
      </main>

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