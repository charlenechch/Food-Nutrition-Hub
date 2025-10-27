// ✅ FULL FoodDetailPage.jsx — Part 1/3
// 🚀 Everything preserved, only guest save logic + modal added

import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../css/FoodDetailPage.css";
import { 
  Share2, 
  Info, 
  TriangleAlert, 
  MessagesSquare, 
  ShoppingBasket, 
  Cross, 
  ScrollText 
} from "lucide-react";

// ✅ Added for guest login popup
import { useAuth } from "../context/AuthContext";
import LoginPromptModal from "../components/LoginPromptModal";

const LS_RECIPES = 'savedRecipes';

export default function FoodDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // ✅ Access auth state (user, guest, etc.)
  const { user } = useAuth();

  // ✅ Modal visibility for guest save
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const [food, setFood] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [foodComments, setFoodComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [savedLoading, setSavedLoading] = useState(false);

  // ✅ Fetch food details
  useEffect(() => {
    const fetchFood = async () => {
      try { 
        const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000"; 
        const res = await fetch(`${API_BASE_URL}/api/foodDetail/${id}`); 
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const result = await res.json();
        
        if (result.success) {
          setFood(result.data);
          // Fetch comments after food data is loaded
          fetchFoodComments(result.data.id || id);
        } else {
          setError(result.message || 'Food not found');
        }
      } catch (err) {
        setError('Failed to fetch food details');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchFood();
    }
  }, [id]);

  // ✅ Fetch comments
  const fetchFoodComments = async (foodId) => {
    try {
      setCommentsLoading(true);
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const res = await fetch(`${API_BASE_URL}/api/foodDiscussion/food/${foodId}`);
      
      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          setFoodComments(result.data);
        }
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setCommentsLoading(false);
    }
  };
  // ✅ Check if user is logged in (using AuthContext, NOT localStorage)
  const isLoggedIn = () => {
    return user && user.role !== "guest";
  };

  // ✅ Check if food is already saved on mount (kept exactly same)
  useEffect(() => {
    if (id) {
      checkSavedStatus();
    }
  }, [id]);

  const checkSavedStatus = async () => {
    try {
      if (!isLoggedIn()) {
        console.log("Guest mode – skip checking saved status");
        setSaved(false);
        return;
      }

      const userProfileID = user?.userID || null;
      if (!userProfileID) {
        console.log("No userID found – skip checking saved status");
        setSaved(false);
        return;
      }

      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const url = `${API_BASE_URL}/api/saveFood/check/${id}?userProfileID=${userProfileID}`;
      
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        setSaved(data.saved);
      } else {
        console.error("Failed to check saved status");
        setSaved(false);
      }
    } catch (error) {
      console.error("Error checking saved status:", error);
      setSaved(false);
    }
  };

  // ✅ SAVE FOOD — now shows modal for guests (instead of redirect)
  const handleSaveFood = async () => {
    if (!isLoggedIn()) {
      setShowLoginPrompt(true); // ✅ SHOW POPUP MODAL
      return;
    }

    setSavedLoading(true);
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const response = await fetch(`${API_BASE_URL}/api/saveFood/${id}`, { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setSaved(data.saved);
        if (data.saved) {
          console.log("Food saved successfully!");
        } else {
          console.log("Food unsaved successfully!");
        }
      } else {
        console.error("Failed to save food");
      }
    } catch (error) {
      console.error("Error saving food:", error);
    } finally {
      setSavedLoading(false);
    }
  };

  // ✅ Existing function (unchanged)
  const handleViewDiscussion = () => {
    navigate(`/fooddiscussion/${id}`, { state: { food } });
  };

  // ✅ Go to recipe logic stays unchanged
  const goToRecipe = () => {
    if (!food) return;

    if (food.recipeId) {
      navigate(`/recipes/${food.recipeId}`);
      return;
    }

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
      navigate(`/recipes?q=${encodeURIComponent(food.name || "")}`);
    }
  };

  const handleBack = () => navigate(-1);

  const handleShare = async () => {
    const url = `${window.location.origin}/fooddetail/${food.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: food.name,
          text: food.description,
          url
        });
        return;
      } catch {}
    }
    await navigator.clipboard.writeText(url);
    alert("Link copied to clipboard");
  };

  // ✅ LOADING UI (as original)
  if (loading) {
    return (
      <div className="food-detail-page">
        <Header />
        <div className="fdp-container">
          <div className="fdp-center">Loading food details...</div>
        </div>
        <Footer />
      </div>
    );
  }

  // ✅ ERROR UI (as original)
  if (error || !food) {
    return (
      <div className="food-detail-page">
        <Header />
        <div className="fdp-container">
          <div className="fdp-topbar">
            <button type="button" className="lrp-btn lrp-btn-outline fdp-back" onClick={handleBack}>
              ← Back to Foods
            </button>
          </div>
          <div className="fdp-center">
            <h2>Food not found</h2>
            <p>{error || 'The requested food item could not be found.'}</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const ingredients = food.commonIngredients || [];
  return (
    <div className="food-detail-page">
      <Header />
      <div className="fdp-container">
        {/* Top bar */}
        <div className="fdp-topbar">
          <button type="button" className="lrp-btn lrp-btn-outline fdp-back" onClick={handleBack}>
            ← Back to Foods
          </button>
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
                </div>
              </div>
            </div>

            {/* Cultural / Preparation */}
            <div className="fdp-card">
              <h3 className="rdp-sec-title">
                <Info className="rdp-sec-icon" size={5} color={"#6a4a2f"}/> Cultural Heritage
              </h3>
              <div className="fdp-block">
                <p className="fdp-block-title">Description</p>
                {food.description && <p className="fdp-text">{food.description}</p>}
              </div>
              {food.culturalSignificance && (
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
                <h3 className="rdp-sec-title">
                  <ShoppingBasket className="rdp-sec-icon" size={5}  color={"#6a4a2f"}/> Common Ingredients
                </h3>
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
              <button 
                type="button" 
                className={`lrp-btn lrp-btn-primary fdp-save ${saved ? 'saved' : ''}`}
                onClick={handleSaveFood}
                disabled={savedLoading}
              >
                {savedLoading ? "..." : saved ? "✓ Saved" : "❤ Save Food"}
              </button>
            </div>
            <div className="fdp-actions">
              <button type="button" className="lrp-btn lrp-btn-outline" onClick={goToRecipe}>
                <ScrollText className="rdp-sec-icon" size={5}  /> Go to Recipe
              </button>
            </div>

            {/* Nutrition */}
            <div className="fdp-card">
              <h3 className="rdp-sec-title">
                <Cross className="rdp-sec-icon" size={5}  color={"#6a4a2f"}/> Nutritional Information
              </h3>
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

            {/* Discussion preview */}
            <div className="fdp-card">
              <div className="fdp-disc-header">
                <h3 className="rdp-sec-title">
                  <MessagesSquare className="rdp-sec-icon" size={5}  color={"#6a4a2f"}/> Community Discussion
                </h3>
              </div>
              
              <div className="fdp-comments">
                {commentsLoading ? (
                  <p className="fdp-muted fdp-center">Loading comments...</p>
                ) : foodComments.length > 0 ? (
                  <>
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
                    <button 
                      type="button" 
                      className="lrp-btn lrp-btn-outline" 
                      onClick={handleViewDiscussion}
                    >
                      View Full Discussion ({foodComments.length} comments)
                    </button>
                  </>
                ) : (
                  <div className="fdp-no-comments">
                    <p className="fdp-muted fdp-center">No comments yet</p>
                    <button 
                      type="button" 
                      className="lrp-btn lrp-btn-primary" 
                      onClick={handleViewDiscussion}
                    >
                      Start Discussion
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {/* ✅ Login Prompt Modal – only shows if guest tries to save */}
      {showLoginPrompt && (
        <LoginPromptModal
          message="Please login or register to save this food."
          onClose={() => setShowLoginPrompt(false)}
          onLogin={() => navigate("/loginregister")}
        />
      )}
    </div>
  );
}
