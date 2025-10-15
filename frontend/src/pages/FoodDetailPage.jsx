import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../css/FoodDetailPage.css";
import { DEFAULT_COMMENTS_BY_FOOD } from "./FoodDiscussionPage";
import { Share2, Info, TriangleAlert, MessagesSquare, ShoppingBasket, Cross, ScrollText } from "lucide-react";

export default function FoodDetailPage({ food, onBack, onViewDiscussion }) {
  const foodComments = DEFAULT_COMMENTS_BY_FOOD[food.id]?? [];
  const navigate = useNavigate();
  const { state } = useLocation();

  const goToRecipe = () => {
    if (!food) return;

    // 1) If you already store a direct recipeId on the food, use it
    if (food.recipeId) {
      navigate(`/recipes/${food.recipeId}`);
      return;
    }

    // 2) Otherwise, try to find by name in your recipes list
    let recipes = [];
    try {
      const raw = localStorage.getItem(LS_RECIPES);
      recipes = raw ? JSON.parse(raw) : [];
    } catch {}

    const match = recipes.find(
      (r) => r.name?.trim().toLowerCase() === food.name?.trim().toLowerCase()
    );

    if (match?.id) {
      navigate(`/recipes/${match.id}`);
    } else {
      // 3) Fallback: send them to the Recipes page with a search query
      navigate(`/recipes?q=${encodeURIComponent(food.name || "")}`);
    }
  };

  if (!food) return null;

  const [saved, setSaved] = useState(false);

  const getHealthAlerts = (f) => {
    const alerts = [];
    if (Number(f.calories) > 250) alerts.push({ type: "warning", message: "High calorie dish - consume in moderation" });
    if (Number(f.protein) > 25) alerts.push({ type: "info", message: "Excellent source of protein" });
    if ((f.name || "").includes("Kasam") || (f.name || "").includes("Belacan")) alerts.push({ type: "warning", message: "High in sodium - limit if hypertensive" });
    if (f.category === "Vegetables") alerts.push({ type: "info", message: "Rich in dietary fiber" });
    return alerts;
  };

  const healthAlerts = getHealthAlerts(food);
  const ingredients = food.ingredients  || [];

  const handleShare = async () => {
    const url = `${window.location.origin}/fooddetail?id=${food.id}`;
    if (navigator.share) {
      try { await navigator.share({ title: food.name, text: food.description, url }); return; } catch {}
    }
    await navigator.clipboard.writeText(url);
    alert("Link copied to clipboard");
  };

  return (
    <div className="food-detail-page">
        <Header />
        <div className="fdp-container">
        {/* Top bar */}
        <div className="fdp-topbar">
            <button type="button" className="lrp-btn lrp-btn-outline fdp-back" onClick={onBack}>← Back to Foods</button>
        </div>

        <div className="fdp-grid">
            {/* Left column */}
            <div className="fdp-left">
            {/* Hero */}
            <div className="fdp-card fdp-hero">
                <div className="fdp-hero-media">
                <img src={food.image} alt={food.name} />
                <div className="fdp-hero-overlay" />
                <div className="fdp-hero-text">
                    <div className="fdp-badges">
                    {food.origin && <span className="fdp-badge">{food.origin}</span>}
                    {food.category && <span className="fdp-badge">{food.category}</span>}
                    </div>
                    <h1 className="fdp-title">{food.name}</h1>
                    {food.description && <p className="fdp-desc">{food.description}</p>}
                </div>
                </div>
            </div>

            {/* Cultural / Preparation */}
            <div className="fdp-card">
                <h3 className="fdp-section-title"><Info size={18} color={"#6a4a2f"}/> Cultural Heritage</h3>
                {food.culturalSignificance  && (
                <div className="fdp-block">
                    <p className="fdp-block-title">Cultural Significance</p>
                    <p className="fdp-text">{food.culturalSignificance}</p>
                </div>
                )}
                <div className="fdp-block">
                <p className="fdp-block-title">Traditional Preparation</p>
                <p className="fdp-text">{food.traditionalPreparation}</p>
                </div>
            </div>

            {/* Ingredients */}
            {ingredients.length > 0 && (
                <div className="fdp-card">
                <h3 className="fdp-section-title"><ShoppingBasket size={18} color={"#6a4a2f"}/> Common Ingredients</h3>
                <div className="fdp-chip-grid">
                    {ingredients.map((ing, i) => (
                    <span key={i} className="fdp-chip">{ing}</span>
                    ))}
                </div>
                </div>
            )}
            </div>

            {/* Right column */}
            <div className="fdp-right">
            {/* Actions */}
            <div className="fdp-actions">
                <button type="button" className="lrp-btn lrp-btn-primary fdp-save" onClick={() => setSaved((s) => !s)}>
                {saved ? "✓ Saved" : "❤ Save Food"}
                </button>
                <button type="button" className="lrp-btn lrp-btn-primary fdp-share" onClick={handleShare}><Share2 size={18} /></button>
            </div>
            <div className="fdp-actions">
                <button type="button" className="lrp-btn lrp-btn-outline" onClick={goToRecipe}><ScrollText size={18} /> Go to Recipe</button>
            </div>

            {/* Nutrition */}
            <div className="fdp-card">
                <h3 className="fdp-section-title"><Cross size={18} color={"#6a4a2f"}/> Nutritional Information</h3>
                <p className="fdp-muted">Per serving</p>
                <div className="fdp-nutri-grid">
                <div className="fdp-nutri">
                    <div className="fdp-nutri-value">{food.calories ?? "-"}</div>
                    <div className="fdp-nutri-label">Calories</div>
                </div>
                <div className="fdp-nutri">
                    <div className="fdp-nutri-value">{food.protein ?? "-"}g</div>
                    <div className="fdp-nutri-label">Protein</div>
                </div>
                <div className="fdp-nutri">
                    <div className="fdp-nutri-value">{food.carbs ?? "-"}g</div>
                    <div className="fdp-nutri-label">Carbohydrates</div>
                </div>
                <div className="fdp-nutri">
                    <div className="fdp-nutri-value">{food.fat ?? "-"}g</div>
                    <div className="fdp-nutri-label">Fat</div>
                </div>
                </div>
            </div>

            {/* Health alerts */}
            {healthAlerts.length > 0 && (
                <div className="fdp-card">
                <h3 className="fdp-section-title"><TriangleAlert size={18} color={"#6a4a2f"}/> Health Information</h3>
                <div className="fdp-alerts">
                    {healthAlerts.map((a, idx) => (
                    <div key={idx} className={`fdp-alert ${a.type === "warning" ? "fdp-alert-warn" : "fdp-alert-info"}`}>
                        {a.message}
                    </div>
                    ))}
                </div>
                </div>
            )}

            {/* Discussion preview */}
            <div className="fdp-card">
                <div className="fdp-disc-header">
                <h3 className="fdp-section-title"><MessagesSquare size={18} color={"#6a4a2f"}/> Community Discussion</h3>
                </div>
                {onViewDiscussion ? (
                <div className="fdp-comments">
                    {foodComments.slice(0, 2).map((c) => (
                    <div key={c.id} className="fdp-comment">
                        <div className="fdp-comment-head">
                        <span className="fdp-avatar">{c.avatar}</span>
                        <span className="fdp-user">{c.user}</span>
                        <span className="fdp-time">{c.timeAgo}</span>
                        </div>
                        <p className="fdp-comment-text">{c.content}</p>
                    </div>
                    ))}
                    <button type="button" className="lrp-btn lrp-btn-outline" onClick={onViewDiscussion}>
                    View More ({foodComments.length} comments)
                    </button>
                </div>
                ) : (
                <p className="fdp-muted fdp-center">Sign in to view and join community discussions.</p>
                )}
            </div>
            </div>
        </div>
        </div>
        <Footer />
    </div>
  );
}