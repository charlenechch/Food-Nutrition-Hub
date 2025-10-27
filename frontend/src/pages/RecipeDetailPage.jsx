// ✅ FULL RecipeDetailPage.jsx — Part 1/3
// ✅ All original code kept, only guest-save logic added

import React, { useMemo, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../css/RecipeDetailPage.css";
import { NotebookText, Share2, ShoppingBasket } from "lucide-react";

// ✅ NEW — Import Auth & Login Modal
import { useAuth } from "../context/AuthContext";
import LoginPromptModal from "../components/LoginPromptModal";

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

  // ✅ New — control show login popup for guests
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

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

  if (loading) {
    return (
      <div className="recipe-detail-page">
        <Header />
        <div className="rdp-wrap">
          <button className="lrp-btn lrp-btn-outline fdp-back rdp-back" onClick={() => navigate(-1)}>
            ← Back to Recipes
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
            ← Back to Recipes
          </button>
          <h2 style={{ marginTop: 12 }}>Recipe not found</h2>
          <p>{error || "The recipe you're looking for doesn't exist."}</p>
        </div>
        <Footer />
      </div>
    );
  }
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
    if (!recipe) return;

    const url = `${window.location.origin}/recipe/${recipe.id}`;
    const title = recipe.name || "Recipe";
    const text = recipe.description || "Check out this Sarawakian recipe!";

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (err) {
        if (err && err.name !== "AbortError") console.warn("Share failed:", err);
      }
    }

    try {
      await navigator.clipboard.writeText(`${title} — ${text}\n${url}`);
      alert("Link copied to clipboard!");
    } catch {
      window.prompt("Copy this link:", url);
    }
  }

  // ✅ NEW — Handle Save Recipe (Block guest with popup)
  const handleSaveRecipe = () => {
    if (!user || user.role === "guest") {
      setShowLoginPrompt(true); // ✅ Show login modal instead of saving
      return;
    }
    // ✅ If logged in → still toggle saved state (original behavior kept)
    setSaved((prev) => !prev);
  };

  return (
    <div className="recipe-detail-page">
      <Header />
      <div className="rdp-wrap">
        <button
          className="lrp-btn lrp-btn-outline fdp-back rdp-back"
          onClick={() => navigate(-1)}
        >
          ← Back to Recipes
        </button>

        <div className="rdp-grid">
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
                      {recipe.description && <p className="rdp-sub">{recipe.description}</p>}
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

            <div className="rdp-card3">
              <h3 className="rdp-sec-title">
                <ShoppingBasket className="rdp-sec-icon" size={18} color="#6a4a2f" /> Ingredients
              </h3>
              <ul className="rdp-list">
                {ingredients.map((it, i) => (
                  <li key={i}>{it}</li>
                ))}
              </ul>
            </div>

            <div className="rdp-card3">
              <h3 className="rdp-sec-title">
                <NotebookText className="rdp-sec-icon" size={18} color="#6a4a2f" /> Instructions
              </h3>
              <ol className="rdp-steps">
                {instructions.map((step, i) => (
                  <div className="rdp-step" key={i}>
                    <span className="rdp-step-text">{step}</span>
                  </div>
                ))}
              </ol>
            </div>
          </div>

          {/* RIGHT: sidebar */}
          <aside className="rdp-aside">
            <div className="fdp-actions">
              <button
                type="button"
                className="lrp-btn lrp-btn-primary fdp-save"
                onClick={handleSaveRecipe} // ✅ replaced toggle with guest-protected function
              >
                {saved ? "✓ Saved" : "❤ Save Recipe"}
              </button>
              <button
                type="button"
                className="lrp-btn lrp-btn-outline fdp-share"
                onClick={handleShare}
              >
                <Share2 className="rdp-sec-icon" size={18} />
              </button>
            </div>
            {recipe.funFact && (
              <div className="rdp-card3 rdp-note rdp-note-warm">
                <div className="rdp-note-head">
                  <Lightbulb className="rdp-sec-icon" size={18} color="#6a4a2f" /> <span>Did You Know?</span>
                </div>
                <p className="rdp-note-text">{recipe.funFact}</p>
              </div>
            )}

            {recipe.chefTips && (
              <div className="rdp-card3 rdp-note">
                <div className="rdp-note-head">
                  <ChefHat className="rdp-sec-icon" size={18} color="#6a4a2f" /> <span>Chef's Tips</span>
                </div>
                <p className="rdp-note-text">{recipe.chefTips}</p>
              </div>
            )}
          </aside>
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
    </div>
  );
}
