// ✅ FULL RecipeDetailPage.jsx — Part 1/3
// ✅ All original code kept, only guest-save logic added

import React, { useMemo, useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../css/RecipeDetailPage.css";
import Modal from "../components/Modal";
import { Info, NotebookText, Share2, ShoppingBasket, CheckCircle2, AlertTriangle  } from "lucide-react";

// ✅ NEW — Import Auth & Login Modal
import { useAuth } from "../context/AuthContext";
import LoginPromptModal from "../components/LoginPromptModal";

// Format text function that handles section headers and numbered steps
const formatTextForDisplay = (text, type = 'instructions') => {
  if (!text) return '';
  
  // First clean the text
  let cleanedText = text
    .replace(/\\t/g, ' ')          // Replace literal \t with space
    .replace(/\t/g, ' ')           // Replace actual tabs with space
    .replace(/\\n/g, '\n')         // Replace literal \n with actual newline
    .replace(/\n\s*\n/g, '\n\n')   // Preserve paragraph breaks
    .trim();

  if (type === 'ingredients') {
    // For ingredients: convert to proper list with bullets
    const lines = cleanedText.split('\n').filter(line => line.trim());
    return lines.map(line => {
      const cleanedLine = line.trim();
      return `<div class="rdp-ingredient-item">${cleanedLine}</div>`;
    }).join('');
  } else {
    // For instructions: handle section headers and numbered steps
    const lines = cleanedText.split('\n').filter(line => line.trim());
    let html = '';
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      
      // Check for section headers (lines that are bolded or have ** **)
      const boldMatch = trimmedLine.match(/\*\*(.*?)\*\*/);
      if (boldMatch) {
        const headerText = boldMatch[1];
        html += `<div class="rdp-section-header">${headerText}</div>`;
        return;
      }
      
      // Check for numbered steps (like "1.", "2.", etc.)
      const numberedMatch = trimmedLine.match(/^(\d+)\.\s*(.*)/);
      if (numberedMatch) {
        const [, number, content] = numberedMatch;
        html += `<div class="rdp-step">
                  <span class="rdp-step-number">${number}.</span>
                  <span class="rdp-step-text">${content}</span>
                </div>`;
        return;
      }
      
      // Check for regular section headers (lines ending with colon)
      if (trimmedLine.endsWith(':') && !trimmedLine.match(/^\d/)) {
        html += `<div class="rdp-section-header">${trimmedLine}</div>`;
        return;
      }
      
      // Regular text line
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

// tiny inline icons so we don't import any libs
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

  // ✅ MOVED UP: checkSavedStatus function must be defined before useEffect
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

  // ✅ Now this useEffect can safely use checkSavedStatus
  useEffect(() => {
    if (id && isLoggedIn()) {
      checkSavedStatus();
    }
  }, [id, isLoggedIn()]);

  // Fetch recipe from backend (ORIGINAL CODE KEPT)
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

  // ✅ FIXED: Use correct endpoint and simplified logic
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
      
      // ✅ CORRECT ENDPOINT: Remove "/save" from the URL
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
            ← Back
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
            ← Back
          </button>
          <h2 style={{ marginTop: 12 }}>Recipe not found</h2>
          <p>{error || "The recipe you're looking for doesn't exist."}</p>
        </div>
        <Footer />
      </div>
    );
  }

  const hasSideNotes = Boolean(recipe.funFact || recipe.chefTips);

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
          title: "Link copied",
          message: "The link to this recipe has been copied to your clipboard.",
          icon: <CheckCircle2 />,
        });
        return;
      }

      openInfo({
        title: "Copy this link",
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
          ← Back
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
                      <h1 className="rdp-title">{recipe.name}</h1>
                    </div>
                  </>
                )}
              </div>

              <div className="rdp-card2 rdp-meta">
                <div className="rdp-meta-item">
                  <div className="rdp-meta-label">Prep Time</div>
                  <div className="rdp-meta-val">{fmtTime(recipe.prepTime, recipe.prepTimeLabel)}</div>
                </div>
                <div className="rdp-meta-item">
                  <div className="rdp-meta-label">Cook Time</div>
                  <div className="rdp-meta-val">{fmtTime(recipe.cookTime, recipe.cookTimeLabel)}</div>
                </div>
                <div className="rdp-meta-item">
                  <div className="rdp-meta-label">Servings</div>
                  <div className="rdp-meta-val">{recipe.servings || 1}</div>
                </div>
                <div className="rdp-meta-item">
                  <div className="rdp-meta-label">Difficulty</div>
                  <div className="rdp-meta-val">{recipe.difficulty || ""}</div>
                </div>
              </div>
            </div>

            {tags.length > 0 && (
              <div className="rdp-tags">
                {tags.map((t) => (
                  <span key={t} className="rdp-tag">
                    {t.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
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
                  {saved ? "✓ Saved" : "❤ Save Recipe"}
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
                <Info className="rdp-sec-icon" color="#6a4a2f" /> Description
              </h3>
              {recipe.description && <p className="rdp-sub">{recipe.description}</p>}
            </div>

            <div className="rdp-card3">
              <h3 className="rdp-sec-title">
                <ShoppingBasket className="rdp-sec-icon" color="#6a4a2f" /> Ingredients
              </h3>
              {/* ✅ UPDATED: Use formatTextForDisplay for ingredients */}
              <div 
                  className="rdp-ingredients-formatted"
                  dangerouslySetInnerHTML={{ 
                    __html: formatTextForDisplay(recipe.ingredients, 'ingredients')
                  }}
                />
              </div>

            <div className="rdp-card3">
              <h3 className="rdp-sec-title">
                <NotebookText className="rdp-sec-icon" color="#6a4a2f" /> Instructions
              </h3>
              {/* ✅ UPDATED: Use formatTextForDisplay for instructions */}
              <div 
                className="rdp-instructions-formatted"
                dangerouslySetInnerHTML={{ 
                  __html: formatTextForDisplay(recipe.instructions || recipe.steps, 'instructions')
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
                  className="lrp-btn lrp-btn-primary fdp-save"
                  onClick={handleSaveRecipe}
                >
                  {saved ? "✓ Saved" : "❤ Save Recipe"}
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
                    <Lightbulb className="rdp-sec-icon" color="#6a4a2f" /> <span>Did You Know?</span>
                  </div>
                  <p className="rdp-note-text">{recipe.funFact}</p>
                </div>
              )}

              {recipe.chefTips && (
                <div className="rdp-card3 rdp-note">
                  <div className="rdp-note-head">
                    <ChefHat className="rdp-sec-icon" color="#6a4a2f" /> <span>Chef's Tips</span>
                  </div>
                  <p className="rdp-note-text">{recipe.chefTips}</p>
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
          message="Please login or register to save this recipe."
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