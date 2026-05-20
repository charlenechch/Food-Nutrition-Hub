import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useTranslation } from "react-i18next";

import "../css/Homepage.css";
import Header from "../components/Header";
import LoginPromptModal from "../components/LoginPromptModal";
import { useAuth } from "../context/AuthContext";
import { translateTexts } from "../hooks/useAITranslation";

import LoginFood from "../assets/LoginFood.png";
import KoloImg from "../assets/kolomee.jpg";

import { FaDice, FaArrowRight } from "react-icons/fa";

// ─── Ethnic groups for "27 peoples, one table" section ───
// Hardcoded English + i18n-ready (use t() with fallback)
const ETHNIC_GROUPS = [
  { key: "iban",     name: "Iban",     dishCount: 18, knownFor: ["Manok Pansoh", "Tuak"] },
  { key: "bidayuh",  name: "Bidayuh",  dishCount: 14, knownFor: ["Bubur Pedas", "Asam Pais"] },
  { key: "melanau",  name: "Melanau",  dishCount: 11, knownFor: ["Umai", "Linut"] },
  { key: "chinese",  name: "Chinese",  dishCount: 22, knownFor: ["Kolo Mee", "Kueh Chap"] },
  { key: "malay",    name: "Malay",    dishCount: 19, knownFor: ["Sarawak Laksa", "Mee Kolok"] },
  { key: "orangulu", name: "Orang Ulu", dishCount: 9,  knownFor: ["Sago Worm", "Daun Ubi"] },
];

// ─── Tonight's pick — reuses DishSpotlight logic from current homepage ───
// Picks a featured dish from DB; falls back to "Manok Pansoh" copy if none.
function TonightPick({ allFoods, navigate, t, translatedFoods = {} }) {
  // Same SPOTLIGHT_IDS pattern as DishSpotlight; pick the first available
  const SPOTLIGHT_IDS = [2, 10, 11];

  const dish = useMemo(() => {
    if (!allFoods || allFoods.length === 0) return null;
    for (const id of SPOTLIGHT_IDS) {
      const found = allFoods.find(f => (f.foodID || f.id) === id);
      if (found && (found.imageUrl || found.image)) return found;
    }
    return null;
  }, [allFoods]);

  if (!dish) {
    return (
      <section className="v6-tonight">
        <div className="v6-tonight-inner">
          <p className="v6-section-eyebrow v6-eyebrow-orange">
            <span className="v6-eyebrow-line" />
            {t("homeV6.section3Eyebrow", "Section Three · Today")}
          </p>
          <h2 className="v6-tonight-headline">
            {t("homeV6.tonightHeadline", "Tonight, eat like a Sarawakian.")}
          </h2>
          <p className="v6-tonight-empty">
            {t("homeV6.tonightLoading", "Loading today's pick…")}
          </p>
        </div>
      </section>
    );
  }

  const dishImg = dish.imageUrl || dish.image;
  const dishId = dish.foodID || dish.id;
  const dishName = translatedFoods[`name_${dish.foodID}`] || dish.name;
  const dishDesc = translatedFoods[`desc_${dish.foodID}`] || dish.description
    || t("homeV6.tonightDescFallback", "Centuries of longhouse cooking distilled into one fragrant pot.");

  return (
    <section className="v6-tonight">
      <div className="v6-tonight-inner">
        <p className="v6-section-eyebrow v6-eyebrow-orange">
          <span className="v6-eyebrow-line" />
          {t("homeV6.section3Eyebrow", "Section Three · Today")}
        </p>
        <h2 className="v6-tonight-headline">
          {t("homeV6.tonightHeadline", "Tonight, eat like a Sarawakian.")}
        </h2>

        <div className="v6-tonight-grid">
          <div
            className="v6-tonight-image"
            style={{ backgroundImage: `url(${dishImg})` }}
            aria-label={dishName}
          />
          <div className="v6-tonight-content">
            <span className="v6-pill-orange">
              {t("homeV6.tonightPickLabel", "Today's pick · auto-curated")}
            </span>
            <h3 className="v6-tonight-dish-name">{dishName}.</h3>
            <p className="v6-tonight-desc">{dishDesc}</p>
            <div className="v6-tonight-actions">
              <button
                className="v6-btn v6-btn-primary lrp-no-outline"
                onClick={() => navigate(`/fooddetail/${dishId}`)}
              >
                {t("homeV6.getRecipe", "Get the recipe")} <FaArrowRight />
              </button>
              <button
                className="v6-btn v6-btn-outline lrp-no-outline"
                onClick={() => navigate(`/map?q=${encodeURIComponent(dish.name)}`)}
              >
                {t("homeV6.findOnMap", "Find on map")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function HomePageV6() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const isGuest = !user || user?.role === "guest";

  const [allFoods, setAllFoods] = useState([]);
  const [translatedFoods, setTranslatedFoods] = useState({});
  const [modalMessage, setModalMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isRandomizing, setIsRandomizing] = useState(false);
  const [randomizerText, setRandomizerText] = useState("");
  const [randomizerResult, setRandomizerResult] = useState(null);

  // Parallax scroll offset
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Fetch foods (same pattern as UserHomepage)
  useEffect(() => {
    const fetchFoods = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const res = await axios.get(`${API_BASE_URL}/api/exploreFood`);
        if (Array.isArray(res.data)) setAllFoods(res.data);
        else if (res.data && res.data.success) setAllFoods(res.data.data);
      } catch (err) {
        console.error("Failed to load foods:", err);
      }
    };
    fetchFoods();
  }, []);

  // Translation cache (same pattern as UserHomepage — i18n-ready)
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
    const texts = {};
    allFoods.forEach(f => {
      texts[`name_${f.foodID}`] = f.name;
      texts[`desc_${f.foodID}`] = f.description;
    });
    translateTexts(texts, i18n.language).then(result => {
      setTranslatedFoods(result);
      localStorage.setItem(cacheKey, JSON.stringify(result));
    });
  }, [allFoods, i18n.language]);

  // Guard guest users from login-only features
  const requireLogin = (message = "") => {
    if (isGuest) {
      setModalMessage(message);
      setShowModal(true);
      return true;
    }
    return false;
  };

  // Randomizer — reused from UserHomepage
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

  const handleStartExploring = () => navigate("/foods");

  const handleContribute = () => {
    if (requireLogin(t("homeV6.loginContribute", "Please log in to contribute a dish."))) return;
    navigate("/community");
  };

  const handleBrowseCommunity = () => navigate("/community");

  const handleEthnicGroupClick = (group) => {
    navigate(`/foods?ethnicity=${encodeURIComponent(group.name)}`);
  };

  return (
    <div className="v6-page">
      <Header transparent={false} />

      {/* ── SECTION 1: Editorial Hero ── */}
      <section className="v6-hero">
        <div className="v6-hero-inner">
          <div className="v6-hero-text">
            {/* <p className="v6-hero-volume">
              {t("homeV6.heroVolume", "Vol. 12 · The Borneo Issue")}
            </p> */}
            <h1 className="v6-hero-headline">
              {t("homeV6.heroLine1", "Sarawak's")}<br />
              {t("homeV6.heroLine2", "edible")}<br />
              {t("homeV6.heroLine3", "heritage.")}
            </h1>
            <p className="v6-hero-subtitle">
              {t("homeV6.heroSubtitle", "A living archive of Borneo cuisine — recipes, stories, photos and voice notes from the 27 ethnics groups who built this kitchen.")}
            </p>
            <div className="v6-hero-actions">
              <button className="v6-btn v6-btn-dark lrp-no-outline" onClick={handleStartExploring}>
                {t("homeV6.startExploring", "Start exploring")} <FaArrowRight />
              </button>
              <button className="v6-btn v6-btn-outline lrp-no-outline" onClick={handleRandomize}>
                <FaDice /> {t("homeV6.imHungry", "I'm feeling hungry")}
              </button>
            </div>
            <div className="v6-hero-sdgs">
              <span className="v6-sdg-chip">🌿 {t("homeV6.sdg3", "SDG 3 · Good Health")}</span>
              <span className="v6-sdg-chip">🏙️ {t("homeV6.sdg11", "SDG 11 · Sustainable Cities")}</span>
            </div>
          </div>

          <div className="v6-hero-photo-wrap">
            <div
              className="v6-hero-photo"
              style={{
                backgroundImage: `url(${KoloImg})`,
                transform: `translateY(${scrollY * 0.15}px) scale(1.08)`,
              }}
            />
            <span className="v6-hero-stamp">
              {t("homeV6.heroStamp", "SARAWAK · EST. 2024")}
            </span>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: 27 peoples, one table ── */}
      <section className="v6-peoples">
        <div className="v6-peoples-inner">
          <div className="v6-peoples-header">
            <p className="v6-section-eyebrow v6-eyebrow-orange">
              <span className="v6-eyebrow-line" />
              {t("homeV6.section2Eyebrow", "Section Two · The peoples")}
            </p>
            <button
              className="v6-link-arrow lrp-no-outline"
              onClick={() => navigate("/foods")}
            >
              {t("homeV6.allEthnicGroups", "All ethnic groups")} →
            </button>
          </div>
          <h2 className="v6-peoples-headline">
            {t("homeV6.peoplesHeadline1", "27 peoples,")}<br />
            {t("homeV6.peoplesHeadline2", "one table.")}
          </h2>

          <div className="v6-peoples-grid">
            {ETHNIC_GROUPS.map(group => (
              <button
                key={group.key}
                className="v6-people-card lrp-no-outline"
                onClick={() => handleEthnicGroupClick(group)}
                type="button"
              >
                <div className="v6-people-thumb" />
                <div className="v6-people-content">
                  <div className="v6-people-row">
                    <span className="v6-people-name">
                      {t(`homeV6.ethnic.${group.key}`, group.name)}
                    </span>
                    <span className="v6-people-count">
                      {group.dishCount} {t("homeV6.dishes", "dishes")}
                    </span>
                  </div>
                  <p className="v6-people-known">
                    {t("homeV6.knownFor", "known for")} →
                  </p>
                  <div className="v6-people-chips">
                    {group.knownFor.map(dish => (
                      <span key={dish} className="v6-people-chip">{dish}</span>
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 3: Tonight's pick (reuses DishSpotlight pattern) ── */}
      <TonightPick
        allFoods={allFoods}
        navigate={navigate}
        t={t}
        translatedFoods={translatedFoods}
      />

      {/* ── SECTION 4: Family recipe CTA + community ── */}
      <section className="v6-family">
        <div className="v6-family-inner">
          <p className="v6-section-eyebrow v6-eyebrow-yellow">
            <span className="v6-eyebrow-line v6-eyebrow-line-yellow" />
            {t("homeV6.section4Eyebrow", "Section Four · Your turn")}
          </p>
          <div className="v6-family-grid">
            <div className="v6-family-left">
              <h2 className="v6-family-headline">
                {t("homeV6.familyHeadline1", "Has your family")}<br />
                {t("homeV6.familyHeadline2", "kept a recipe alive?")}
              </h2>
              <p className="v6-family-subtitle">
                {t("homeV6.familySubtitle", "Add it to the story. Every contribution becomes part of a living archive — recipes, photos, voice notes, all preserved for the next generation.")}
              </p>
              <div className="v6-family-actions">
                <button className="v6-btn v6-btn-primary lrp-no-outline" onClick={handleContribute}>
                  {t("homeV6.contributeDish", "Contribute a dish")} <FaArrowRight />
                </button>
                <button className="v6-btn v6-btn-ghost-light lrp-no-outline" onClick={handleBrowseCommunity}>
                  {t("homeV6.browseCommunity", "Browse community")}
                </button>
              </div>
            </div>

            <div className="v6-family-quote-card">
              <p className="v6-quote-eyebrow">
                {t("homeV6.fromCommunity", "From the community")}
              </p>
              <p className="v6-quote-text">
                "{t("homeV6.quoteText", "My grandmother's manok pansoh recipe is on here. Now my kids can learn it too.")}"
              </p>
              <div className="v6-quote-attrib">
                <span className="v6-quote-avatar" />
                <span className="v6-quote-name">
                  — {t("homeV6.quoteAuthor", "Anne K., contributor since 2024")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <footer className="v6-footer">
          <p className="v6-footer-left">
            {t("homeV6.footerLeft", "SarawakEats · a living archive of Borneo cuisine · est. 2024")}
          </p>
          <div className="v6-footer-right">
            <button onClick={() => navigate("/foods")} className="v6-footer-link lrp-no-outline">
              {t("homeV6.footerAbout", "About")}
            </button>
            <span className="v6-footer-sep">·</span>
            <button onClick={handleContribute} className="v6-footer-link lrp-no-outline">
              {t("homeV6.footerContribute", "Contribute")}
            </button>
            <span className="v6-footer-sep">·</span>
            <button onClick={() => navigate("/privacypolicy")} className="v6-footer-link lrp-no-outline">
              {t("homeV6.footerPrivacy", "Privacy")}
            </button>
            <span className="v6-footer-sep">·</span>
            <button onClick={() => navigate("/foods")} className="v6-footer-link lrp-no-outline">
              {t("homeV6.footerContact", "Contact")}
            </button>
          </div>
        </footer>
      </section>

      {/* Randomizer overlay — reused pattern from UserHomepage */}
      {isRandomizing && (
        <div className="v6-randomizer-overlay">
          <div className="v6-randomizer-content">
            {!randomizerResult ? (
              <>
                <FaDice className="v6-spinning-dice" />
                <h3>{t("homeV6.randomizerFinding", "Finding something delicious…")}</h3>
                <div className="v6-slot-text">{randomizerText}</div>
              </>
            ) : (
              <div className="v6-result-reveal">
                <h3>{t("homeV6.randomizerHowAbout", "How about…")}</h3>
                <div className="v6-slot-text v6-slot-winner">{randomizerResult.name}</div>
                <div className="v6-randomizer-actions">
                  <button
                    className="v6-btn v6-btn-primary"
                    onClick={() => {
                      setIsRandomizing(false);
                      navigate(`/fooddetail/${randomizerResult.foodID || randomizerResult.id}`);
                    }}
                  >
                    {t("homeV6.randomizerOpen", "Open dish")}
                  </button>
                  <button
                    className="v6-btn v6-btn-outline"
                    onClick={() => {
                      setIsRandomizing(false);
                      navigate(`/map?q=${encodeURIComponent(randomizerResult.name)}`);
                    }}
                  >
                    {t("homeV6.randomizerMap", "Find on map")}
                  </button>
                  <div className="v6-randomizer-secondary">
                    <button className="v6-text-btn" onClick={handleRandomize}>
                      {t("homeV6.randomizerSpinAgain", "Spin again")}
                    </button>
                    <button className="v6-text-btn" onClick={() => setIsRandomizing(false)}>
                      {t("homeV6.randomizerCancel", "Cancel")}
                    </button>
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