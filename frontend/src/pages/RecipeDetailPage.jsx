import React, { useMemo, useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../css/RecipeDetailPage.css";
import Modal from "../components/Modal";
import { Info, NotebookText, Share2, ShoppingBasket, CheckCircle2, AlertTriangle  } from "lucide-react";
import { translateTexts } from "../hooks/useAITranslation";
import RecipeStarRating from "../components/RecipeStarRating";
import { getTierById } from "../utils/gamificationTiers";

// ✅ Import Auth & Login Modal
import { useAuth } from "../context/AuthContext";
import LoginPromptModal from "../components/LoginPromptModal";

// Format text function that handles section headers and numbered steps
const formatTextForDisplay = (text, type = 'instructions') => {
  if (!text) return '';
  
  let cleanedText = text
    .replace(/\\t/g, ' ')
    .replace(/\t/g, ' ')
    .replace(/\\n/g, '\n')
    .replace(/\n\s*\n/g, '\n\n')
    .trim();

  if (type === 'ingredients') {
    const lines = cleanedText.split('\n').filter(line => line.trim());
    return lines.map(line => {
      const cleanedLine = line.trim();
      return `<div class="rdp-ingredient-item">${cleanedLine}</div>`;
    }).join('');
  } else {
    const lines = cleanedText.split('\n').filter(line => line.trim());
    let html = '';
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      
      const boldMatch = trimmedLine.match(/\*\*(.*?)\*\*/);
      if (boldMatch) {
        const headerText = boldMatch[1];
        html += `<div class="rdp-section-header">${headerText}</div>`;
        return;
      }
      
      const numberedMatch = trimmedLine.match(/^(\d+)\.\s*(.*)/);
      if (numberedMatch) {
        const [, number, content] = numberedMatch;
        html += `<div class="rdp-step">
                  <span class="rdp-step-number">${number}.</span>
                  <span class="rdp-step-text">${content}</span>
                </div>`;
        return;
      }
      
      if (trimmedLine.endsWith(':') && !trimmedLine.match(/^\d/)) {
        html += `<div class="rdp-section-header">${trimmedLine}</div>`;
        return;
      }
      
      if (trimmedLine) {
        html += `<div class="rdp-step">
                  <span class="rdp-step-number"></span>
                  <span class="rdp-step-text">${trimmedLine}</span>
                </div>`;
      }
    });
    
    return html;
  }
};

// prefer label fields if present, else pretty-print minutes
const fmtTime = (n, label) => {
  if (label) return label;
  const m = Number(n || 0);
  if (m >= 60) {
    const h = (m / 60).toFixed(1).replace(/\.0$/, "");
    return `${h} hour${h === "1" ? "" : "s"}`;
  }
  return `${m} min`;
};

// tiny inline icons
const Lightbulb = (props) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
    <path d="M9 21h6v-1H9v1Zm3-20a7 7 0 0 0-4 12.9V16a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.1A7 7 0 0 0 12 1Zm3 11.2V15h-6v-2.8a1 1 0 0 0-.4-.8A5 5 0 1 1 15.4 11a1 1 0 0 0-.4 1.2Z"/>
  </svg>
);

const ChefHat = (props) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
    <path d="M12 2a5 5 0 0 0-4.7 3.2A4 4 0 1 0 4 12v2h16v-2a4 4 0 1 0-3.3-6.8A5 5 0 0 0 12 2Zm-7 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4H5Zm3 2h2v3H8v-3Zm6 0h2v3h-2v-3Z"/>
  </svg>
);

export default function RecipeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  // ✅ Access logged in user or guest
  const { user } = useAuth();

  const [saved, setSaved] = useState(false);
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [csrfToken, setCsrfToken] = useState("");

  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const res = await fetch(`${API_BASE_URL}/api/csrf-token`, { credentials: "include" });
        const data = await res.json();
        setCsrfToken(data.csrfToken);
      } catch (err) {
        console.error("Failed to fetch CSRF token", err);
      }
    };
    fetchCsrfToken();
  }, []);

  const [translatedRecipe, setTranslatedRecipe] = useState({});

  useEffect(() => {
    if (!recipe || i18n.language === "en") {
      setTranslatedRecipe({});
      return;
    }
    translateTexts({
      name: recipe.name,
      description: recipe.description,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions || recipe.steps,
      funFact: recipe.funFact,
      chefTips: recipe.chefTips,
    }, i18n.language).then(setTranslatedRecipe);
  }, [recipe, i18n.language]);

  // control show login popup for guests
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const [infoDlg, setInfoDlg] = useState({
    open: false,
    title: "",
    message: "",
    icon: null,
    primaryText: "OK",
  });

  const sharingRef = useRef(false);
  
  const openInfo = ({ title, message, icon, primaryText = "OK" }) =>
    setInfoDlg({ open: true, title, message, icon, primaryText });

  const closeInfo = () => setInfoDlg((d) => ({ ...d, open: false }));

  const handleProfileClick = (e, targetProfileID) => {
    if (e) e.stopPropagation();
    if (!targetProfileID) return;
    
    const currentUID = user?.userProfileID || user?.userID || user?.id;
    
    if (currentUID && String(currentUID) === String(targetProfileID)) {
      navigate("/profile"); 
    } else {
      navigate(`/profile/${targetProfileID}`); 
    }
  };

  const isLoggedIn = () => {
    const loggedIn = user && user.role !== "guest";
    console.log('🔐 isLoggedIn check:', {
      loggedIn,
      user: user,
      hasUserProfileID: user?.userProfileID,
      role: user?.role
    });
    return loggedIn;
  };

  // ✅ checkSavedStatus defined before useEffect
  const checkSavedStatus = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const url = `${API_BASE_URL}/api/saveFood/check/${id}?userProfileID=${user?.userID}&type=recipe`;
      
      console.log('📤 Checking saved status:', url);

      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        }, 
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Server response - saved:', data.saved);
        setSaved(data.saved);
      } else if (response.status === 401) {
        console.log("User not logged in - can't check saved status");
        setSaved(false);
      } else {
        console.error("Failed to check saved status");
        setSaved(false);
      }
    } catch (error) {
      console.error("Error checking saved status:", error);
      setSaved(false);
    }
  };

  useEffect(() => {
    if (id && isLoggedIn()) {
      checkSavedStatus();
    }
  }, [id, isLoggedIn()]);

  // Fetch recipe from backend
  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const res = await fetch(`${API_BASE_URL}/api/recipe/recipes/${id}`);
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Failed to fetch recipe: ${res.status} ${errorText}`);
        }
        const data = await res.json();
        setRecipe(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    if (id) {
      fetchRecipe();
    }
  }, [id]);

  // ✅ Save recipe handler
  const handleSaveRecipe = async () => {
    if (!isLoggedIn()) {
      setShowLoginPrompt(true);
      return;
    }

    const userProfileID = user?.userID;

    if (!userProfileID) {
      console.error("❌ User data incomplete - cannot save recipe");
      setShowLoginPrompt(true); 
      return;
    }

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const url = `${API_BASE_URL}/api/saveFood/${id}`;
      
      console.log('📤 Making request to:', url);

      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({
          userProfileID: userProfileID,
          type: 'recipe'
        })
      });

      console.log('📊 Save response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        setSaved(data.saved);
        console.log(data.message);
      } else {
        const errorData = await response.json();
        console.error("Failed to save recipe:", errorData.error);
      }
    } catch (error) {
      console.error("Error saving recipe:", error);
    }
  };

  if (loading) {
    return (
      <div className="recipe-detail-page">
        <Header />
        <div className="rdp-wrap">
          <button className="lrp-btn lrp-btn-outline fdp-back rdp-back" onClick={() => navigate(-1)}>
            {t("recipeDetail.back")}
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="recipe-detail-page">
        <Header />
        <div className="rdp-wrap">
          <button className="lrp-btn lrp-btn-outline fdp-back rdp-back" onClick={() => navigate(-1)}>
            {t("recipeDetail.back")}
          </button>
          <h2 className = "rdp-not-found">{t("recipeDetail.notFound")}</h2>
          <p>{error || t("recipeDetail.notFoundMsg")}</p>
        </div>
        <Footer />
      </div>
    );
  }

  const normalizeNote = (v) => {
    if (v == null) return "";
    const s = String(v).trim().toLowerCase();
    if (s === "null" || s === "undefined") return "";
    return s;
  };

  const hasSideNotes = Boolean(
    normalizeNote(recipe.funFact) || normalizeNote(recipe.chefTips)
  );

  // normalize lists (accept array or newline string)
  const toList = (v) =>
    Array.isArray(v)
      ? v
      : String(v || "")
          .split(/\r?\n/)
          .map((s) => s.trim())
          .filter(Boolean);

  const ingredients = toList(recipe.ingredients);
  const instructions = toList(recipe.instructions);
  const tags = Array.isArray(recipe.dietaryTags) ? recipe.dietaryTags : [];

  async function handleShare() {
    if (!recipe || sharingRef.current) return;
    sharingRef.current = true;

    const url = `${window.location.origin}/recipe/${recipe.id}`;
    const title = recipe.name || "Recipe";
    const text = recipe.description || "Check out this Sarawakian recipe!";

    try {
      if (navigator.share) {
        try {
          await navigator.share({ title, text, url });
          return;
        } catch (err) {
          if (err?.name === "AbortError") return; 
        }
      }

      if (window.isSecureContext && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(`${title} — ${text}\n${url}`);
        openInfo({
          title: t("recipeDetail.linkCopied"),
          message: t("recipeDetail.linkCopiedMsg"),
          icon: <CheckCircle2 />,
        });
        return;
      }

      openInfo({
        title: t("recipeDetail.copyLink"),
        message: `${title} — ${text}\n${url}`,
        icon: <AlertTriangle />,
      });
    } finally {
      sharingRef.current = false;
    }
  }

  return (
    <div className="recipe-detail-page">
      <Header />
      <div className="rdp-wrap">
        <button
          className="lrp-btn lrp-btn-outline fdp-back rdp-back"
          onClick={() => navigate(-1)}
        >
          {t("recipeDetail.back")}
        </button>

        <div className={`rdp-grid ${!hasSideNotes ? "rdp-grid--single" : ""}`}>
          {/* LEFT: main column */}
          <div className="rdp-main">
            <div className="rdp-card">
              <div className="rdp-hero">
                {recipe.image && (
                  <>
                    <img className="rdp-hero-img" src={recipe.image} alt={recipe.name} />
                    <div className="rdp-hero-overlay" />
                    <div className="rdp-hero-text">
                      <div className="rdp-badges">
                        {recipe.origin && (
                          <span className="rdp-badge rdp-badge-origin">
                            {recipe.origin}
                          </span>
                        )}
                      </div>

                      <h1 className="rdp-title">{recipe.name}</h1>
                    
                      <div className="rdp-badges" style={{ marginTop: '8px', marginBottom: '0' }}>
                        {recipe.category && (
                          (Array.isArray(recipe.category) ? recipe.category : recipe.category.split(','))
                            .map((cat, index) => (
                              <span key={`cat-${index}`} className="rdp-badge">
                                {cat.trim()}
                              </span>
                            ))
                        )}
                      </div>
                    </div>
                                      </>
                )}
              </div>

              {/* ✅ NEW: AUTHOR & RATING SUMMARY BAR */}
              <div 
                className="rdp-summary-bar"
                style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center", 
                  flexWrap: "wrap",
                  gap: "16px",
                  padding: "24px 20px 16px 20px", 
                  borderBottom: "1px solid #f0f0f0", 
                  backgroundColor: "#fff"
                }}
              >
                {/* Left Side: Clickable Author */}
                <div 
                  className="rdp-author-section"
                  onClick={(e) => handleProfileClick(e, recipe.authorProfileID)}
                  style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "12px", 
                    cursor: "pointer",
                    transition: "opacity 0.2s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = "0.7"}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                  title={`View ${recipe.authorName}'s profile`}
                >
                  <img 
                    src={recipe.authorAvatar || `https://ui-avatars.com/api/?name=${recipe.authorName}&background=8b5e3c&color=fff&rounded=true`} 
                    alt={recipe.authorName}
                    style={{ 
                      width: "48px", 
                      height: "48px", 
                      borderRadius: "50%", 
                      objectFit: "cover",
                      border: "1px solid #eaeaea",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
                    }}
                  />
                  <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <span style={{ fontSize: "0.85rem", color: "#888", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "2px" }}>
                      Recipe By
                    </span>
                    <span style={{ fontWeight: "700", color: "#2c2c2c", fontSize: "1.1rem" }}>
                      {recipe.authorName}
                      <span className="user-badge-inline">
                        {getTierById(recipe.equippedBadge || "novice").icon}
                        <span className="badge-tooltip-mini" style={{ color: getTierById(recipe.equippedBadge || "novice").color }}>
                          {getTierById(recipe.equippedBadge || "novice").title}
                        </span>
                      </span>
                    </span>
                  </div>
                </div>

                {/* Right Side: Recipe Rating */}
                <div 
                  className="rdp-rating-section"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    justifyContent: "center",
                    gap: "6px" // Keeps the stars and text perfectly spaced
                  }}
                >
                  <RecipeStarRating 
                    recipeId={id} 
                    initialAvg={recipe.avgRating || 0} 
                    initialCount={recipe.totalRatings || 0} 
                    csrfToken={csrfToken}
                    initialUserRating={recipe.userRating || 0}
                  />
                  
                  {/* Clean, pill-shaped badge that only shows when there are actual reviews */}
                  {recipe.totalRatings > 0 && (
                    <div style={{ 
                      display: "inline-flex", 
                      alignItems: "center",
                      backgroundColor: "#fcf8f5", // Very soft, warm background matching your theme
                      border: "1px solid #efe5dc",
                      color: "#6a4a2f", // Your theme's dark brown
                      padding: "4px 12px", 
                      borderRadius: "20px", // Makes it a sleek pill shape
                      fontSize: "0.85rem", 
                      fontWeight: "700",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.02)"
                    }}>
                      <span style={{ color: "#e6b800", marginRight: "6px", fontSize: "1rem" }}>★</span>
                      {recipe.avgRating} <span style={{ color: "#a88d75", margin: "0 4px", fontWeight: "400" }}>/</span> 5
                      <span style={{ color: "#a88d75", marginLeft: "6px", fontWeight: "500", fontSize: "0.8rem" }}>
                        ({recipe.totalRatings} {recipe.totalRatings === 1 ? 'Review' : 'Reviews'})
                      </span>
                    </div>
                  )}
                </div>
              </div>
              {/* ✅ END SUMMARY BAR */}

              <div className="rdp-card2 rdp-meta" style={{ borderTop: "none", paddingTop: "16px" }}>
                <div className="rdp-meta-item">
                  <div className="rdp-meta-label">{t("recipeDetail.prepTime")}</div>
                  <div className="rdp-meta-val">{fmtTime(recipe.prepTime, recipe.prepTimeLabel)}</div>
                </div>
                <div className="rdp-meta-item">
                  <div className="rdp-meta-label">{t("recipeDetail.cookTime")}</div>
                  <div className="rdp-meta-val">{fmtTime(recipe.cookTime, recipe.cookTimeLabel)}</div>
                </div>
                <div className="rdp-meta-item">
                  <div className="rdp-meta-label">{t("recipeDetail.servings")}</div>
                  <div className="rdp-meta-val">{recipe.servings || 1}</div>
                </div>
                <div className="rdp-meta-item">
                  <div className="rdp-meta-label">{t("recipeDetail.difficulty")}</div>
                  <div className="rdp-meta-val">{recipe.difficulty || ""}</div>
                </div>
              </div>
            </div>

            {tags.length > 0 && (
              <div className="rdp-tags">
                {tags.map((tag) => (
                  <span key={tag} className="rdp-tag">
                    {tag.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </span>
                ))}
              </div>
            )}

            {!hasSideNotes && (
              <div className="rdp-card3 rdp-main-actions">
                <button
                  type="button"
                  className="lrp-btn lrp-btn-primary fdp-save"
                  onClick={handleSaveRecipe}
                >
                  {saved ? t("recipeDetail.saved") : t("recipeDetail.saveRecipe")}
                </button>
                <button
                  type="button"
                  className="lrp-btn lrp-btn-outline fdp-share"
                  onClick={handleShare}
                >
                  <Share2 className="rdp-sec-icon" />
                </button>
              </div>
            )}

            <div className="rdp-card3">
              <h3 className="rdp-sec-title">
                <Info className="rdp-sec-icon" color="#6a4a2f" /> {t("recipeDetail.description")}
              </h3>
              {recipe.description && <p className="rdp-sub">{translatedRecipe.description || recipe.description}</p>}
            </div>

            <div className="rdp-card3">
              <h3 className="rdp-sec-title">
                <ShoppingBasket className="rdp-sec-icon" color="#6a4a2f" /> {t("recipeDetail.ingredients")}
              </h3>
              <div 
                  className="rdp-ingredients-formatted"
                  dangerouslySetInnerHTML={{ 
                    __html: formatTextForDisplay(translatedRecipe.ingredients || recipe.ingredients, 'ingredients')
                  }}
                />
              </div>

            <div className="rdp-card3">
              <h3 className="rdp-sec-title">
                <NotebookText className="rdp-sec-icon" color="#6a4a2f" /> {t("recipeDetail.instructions")}
              </h3>
              <div 
                className="rdp-instructions-formatted"
                dangerouslySetInnerHTML={{ 
                  __html: formatTextForDisplay(translatedRecipe.instructions || recipe.instructions || recipe.steps, 'instructions')
                }}
              />
            </div>
          </div>

          {/* RIGHT: sidebar */}
          {hasSideNotes && (
            <aside className="rdp-aside">
              <div className="fdp-actions">
                <button
                  type="button"
                  className={`lrp-btn lrp-btn-primary fdp-save ${saved ? "saved" : ""}`}
                  onClick={handleSaveRecipe}
                >
                  {saved ? t("recipeDetail.saved") : t("recipeDetail.saveRecipe")}
                </button>
                <button
                  type="button"
                  className="lrp-btn lrp-btn-outline fdp-share"
                  onClick={handleShare}
                >
                  <Share2 className="rdp-sec-icon" />
                </button>
              </div>
              {recipe.funFact && (
                <div className="rdp-card3 rdp-note rdp-note-warm">
                  <div className="rdp-note-head">
                    <Lightbulb className="rdp-sec-icon" color="#6a4a2f" /> <span>{t("recipeDetail.didYouKnow")}</span>
                  </div>
                  <p className="rdp-note-text">{translatedRecipe.funFact || recipe.funFact}</p>
                </div>
              )}

              {recipe.chefTips && (
                <div className="rdp-card3 rdp-note">
                  <div className="rdp-note-head">
                    <ChefHat className="rdp-sec-icon" color="#6a4a2f" /> <span>{t("recipeDetail.chefTips")}</span>
                  </div>
                  <p className="rdp-note-text">{translatedRecipe.chefTips || recipe.chefTips}</p>
                </div>
              )}
            </aside>
          )}
        </div>
      </div>
      <Footer />

      {/* ✅ Show LoginPromptModal if guest tries to save */}
      {showLoginPrompt && (
        <LoginPromptModal
          message={t("recipeDetail.loginToSave")}
          onClose={() => setShowLoginPrompt(false)}
          onLogin={() => navigate("/loginregister")}
        />
      )}
      <Modal
        open={infoDlg.open}
        title={infoDlg.title}
        icon={infoDlg.icon}
        primaryText={infoDlg.primaryText}
        onPrimary={closeInfo}
        onClose={closeInfo}
      >
        {infoDlg.message}
      </Modal>
    </div>
  );
}