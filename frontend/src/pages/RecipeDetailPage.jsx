import React, { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../css/RecipeDetailPage.css";
import { NotebookText, Share2, ShoppingBasket } from "lucide-react";

const LS_KEY = "recipes_data_v2";

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

// tiny inline icons so we don’t import any libs
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
  const [saved, setSaved] = useState(false);

  const recipes = useMemo(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }, []);

  const recipe = recipes.find(r => String(r.id) === String(id));

  if (!recipe) {
    return (
      <div className="rdp-wrap">
        <button className="lrp-btn lrp-btn-outline fdp-back" onClick={() => navigate("/recipes")}>← Back to Recipes</button>
        <h2 style={{ marginTop: 12 }}>Recipe not found</h2>
        <p>It may have been removed or your data was cleared.</p>
      </div>
    );
  }

  // normalize lists (accept array or newline string)
  const toList = (v) =>
    Array.isArray(v)
      ? v
      : String(v || "")
          .split(/\r?\n/)
          .map(s => s.trim())
          .filter(Boolean);

  const ingredients  = toList(recipe.ingredients);
  const instructions = toList(recipe.instructions);
  const tags = Array.isArray(recipe.dietaryTags) ? recipe.dietaryTags : [];

  async function handleShare() {
    if (!recipe) return;

    const url   = `${window.location.origin}/recipes/${recipe.id}`;
    const title = recipe.name || "Recipe";
    const text  = recipe.description || "Check out this Sarawakian recipe!";

    // 1) Native share (mobile & some desktop)
    if (navigator.share) {
        try {
        await navigator.share({ title, text, url });
        return;
        } catch (err) {
        // User canceled or share not allowed—fall through to clipboard
        if (err && err.name !== "AbortError") console.warn("Share failed:", err);
        }
    }

    // 2) Clipboard fallback
    try {
        await navigator.clipboard.writeText(`${title} — ${text}\n${url}`);
        alert("Link copied to clipboard!");
    } catch {
        // 3) Last-resort prompt (older browsers / permissions blocked)
        window.prompt("Copy this link:", url);
    }
    }


  return (
    <div className="recipe-detail-page">
        <Header />
        <div className="rdp-wrap">
        <button className="lrp-btn lrp-btn-outline fdp-back rdp-back" onClick={() => navigate(-1)}>← Back to Recipes</button>

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
                    {tags.map(t => (
                        <span key={t} className="rdp-tag">
                        {t.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase())}
                        </span>
                    ))}
                    </div>
                )}

                <div className="rdp-card3">
                    <h3 className="rdp-sec-title"><ShoppingBasket size={18} color="#6a4a2f"/> Ingredients</h3>
                    <ul className="rdp-list">
                    {ingredients.map((it, i) => (
                        <li key={i}>{it}</li>
                    ))}
                    </ul>
                </div>

                <div className="rdp-card3">
                    <h3 className="rdp-sec-title"><NotebookText size={18} color="#6a4a2f"/> Instructions</h3>
                    <ol className="rdp-steps">
                    {instructions.map((step, i) => (
                        <li key={i}>
                        <span className="rdp-step-index">{i + 1}</span>
                        <span>{step}</span>
                        </li>
                    ))}
                    </ol>
                </div>
            </div>

            {/* RIGHT: sidebar */}
            <aside className="rdp-aside">
            <div className="fdp-actions">
                <button type="button" className="lrp-btn lrp-btn-primary fdp-save" onClick={() => setSaved((s) => !s)}>
                {saved ? "✓ Saved" : "❤ Save Food"}
                </button>
                <button type="button" className="lrp-btn lrp-btn-outline fdp-share" onClick={handleShare}><Share2 size={18} /></button>
            </div>

            {recipe.funFact && (
                <div className="rdp-card3 rdp-note rdp-note-warm">
                <div className="rdp-note-head">
                    <Lightbulb size={18} color="#6a4a2f"/> <span>Did You Know?</span>
                </div>
                <p className="rdp-note-text">{recipe.funFact}</p>
                </div>
            )}

            {recipe.chefTips && (
                <div className="rdp-card3 rdp-note">
                <div className="rdp-note-head">
                    <ChefHat size={18} color="#6a4a2f"/> <span>Chef’s Tips</span>
                </div>
                <p className="rdp-note-text">{recipe.chefTips}</p>
                </div>
            )}
            </aside>
        </div>
      </div>
      <Footer />
    </div>
  );
}
