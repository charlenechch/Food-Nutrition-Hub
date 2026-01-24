import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../css/FoodDetailPage.css";
import Modal from "../components/Modal"
import { 
  Share2, 
  Info, 
  TriangleAlert, 
  MessagesSquare, 
  ShoppingBasket, 
  Cross, 
  ScrollText,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import LoginPromptModal from "../components/LoginPromptModal";

const LS_RECIPES = 'savedRecipes';

export default function FoodDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { user } = useAuth();

  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const [food, setFood] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [foodComments, setFoodComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [savedLoading, setSavedLoading] = useState(false);
  const [healthAlerts, setHealthAlerts] = useState([]);
  const [jumping, setJumping] = useState(false);

  const [infoDlg, setInfoDlg] = useState({
    open: false,
    title: "",
    message: "",
    icon: null,
    primaryText: "OK",
  });

  //================
  //CSRF
  //=============
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

  const sharingRef = useRef(false);

  const openInfo = ({ title, message, icon, primaryText = "OK"}) =>
    setInfoDlg({open: true, title, message, icon, primaryText});

  const closeInfo = () => setInfoDlg((d) => ({ ...d, open: false}));

  const num = (v) => (v == null ? 0 : Number(v));

  const getPerServing = (food, keyPs, keyTotal) =>
    num(food?.[keyPs]) || num(food?.[keyTotal]);

  const buildHealthAlerts = (food) => {
    const alerts = [];

    const kcal = getPerServing(food, "Energy_kcal_ps", "Energy_kcal");
    const protein = getPerServing(food, "Protein_g_ps", "Protein_g");
    const fat = getPerServing(food, "Fat_g_ps", "Fat_g");
    const carbs = getPerServing(food, "Carbohydrates_g_ps", "Carbohydrates_g");
    const fiber = getPerServing(food, "Fiber_g_ps", "Fiber_g");
    const vitC = getPerServing(food, "VitaminC_mg_ps", "VitaminC_mg");

    if (kcal >= 600) {
      alerts.push({ type: "warning", message: "High-calorie dish — consume in moderation." });
    } else if (kcal > 0 && kcal <= 300) {
      alerts.push({ type: "info", message: "Low-calorie dish." });
    }

    if (protein >= 25) {
      alerts.push({ type: "info", message: "Excellent source of protein." });
    } else if (protein >= 12) {
      alerts.push({ type: "info", message: "Good protein content." });
    }

    if (fat >= 20) {
      alerts.push({ type: "warning", message: "High total fat per serving." });
    } else if (fat > 0 && fat <= 10) {
      alerts.push({ type: "info", message: "Low-fat dish." });
    }

    if (carbs >= 60) {
      alerts.push({ type: "warning", message: "High in carbohydrates." });
    }
    if (fiber >= 5) {
      alerts.push({ type: "info", message: "High in dietary fiber." });
    }

    if (vitC >= 30) {
      alerts.push({ type: "info", message: "Rich in Vitamin C." });
    }

    const tags = Array.isArray(food?.dietaryTags) ? food.dietaryTags : [];
    if (tags.includes("spicy")) alerts.push({ type: "info", message: "Spicy dish." });
    if (tags.includes("vegetarian")) alerts.push({ type: "info", message: "Vegetarian-friendly." });

    return alerts;
  };

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
          setHealthAlerts(buildHealthAlerts(result.data));
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

  useEffect(() => {
    if (food) setHealthAlerts(buildHealthAlerts(food));
  }, [food]);

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
  
  const getUserInitials = (comment) => {
  console.log('Available fields:', Object.keys(comment)); 
  const username = comment.username || comment.user || comment.author || 'User';
  console.log('Found username:', username); 
  return username.substring(0, 2).toUpperCase();
  };

  useEffect(() => {
    if (id && isLoggedIn()) {
      checkSavedStatus();
    }
  }, [id, isLoggedIn()]);

  const checkSavedStatus = async () => {
  try {
    const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
    console.log('🔍 Checking saved status for food:', id);
    console.log('👤 Current user ID:', user?.userID);

    const url = `${API_BASE_URL}/api/saveFood/check/${id}?userProfileID=${user?.userID}&type=food`;
    
    console.log('📤 Making request to:', url);

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
      }, 
    });

    console.log('📊 Save check response status:', response.status);
    
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
  
  const handleSaveFood = async () => {
  if (!isLoggedIn()) {
    setShowLoginPrompt(true);
    return;
  }

  const userProfileID = user?.userID;

  if (!userProfileID) {
    console.error("❌ User data incomplete - cannot save food");
    console.log("Current user object:", user);
    setShowLoginPrompt(true); 
    return;
  }

  setSavedLoading(true);
  try {
    const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
    
    const response = await fetch(
      `${API_BASE_URL}/api/saveFood/${id}`, 
      { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        credentials: 'include',
        body: JSON.stringify({
        userProfileID: userProfileID,
        type:  'food'
        })
      }
    );

    console.log('📊 Save response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      setSaved(data.saved);
      console.log(data.message);
    } else {
      const errorData = await response.json();
      console.error("Failed to save food:", errorData.error);
    }
  } catch (error) {
    console.error("Error saving food:", error);
  } finally {
    setSavedLoading(false);
  }
};

  const handleViewDiscussion = () => {
    navigate(`/fooddiscussion/${id}`, { state: { food } });
  };

  const goToRecipe = async () => {
    if (!food) return;
    setJumping(true);
    try {
      if (food.recipeId) {
        console.log("Using direct recipeId from food:", food.recipeId);
        navigate(`/recipes/${food.recipeId}`);
        return;
      }

      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

      try {
        const byFood = await fetch(`${API_BASE_URL}/api/recipe/byFood/${food.id}`, {
          credentials: "include",
        });
        if (byFood.ok) {
          const json = await byFood.json();
          const recipeId = json?.data?.id || json?.data?.recipeId || json?.data?.recipeID;
          if (recipeId) {
            navigate(`/recipes/${recipeId}`);
            return;
          }
        }
      } catch {}

      try {
        const byName = await fetch(
          `${API_BASE_URL}/api/recipe/find?name=${encodeURIComponent(food.name || "")}`,
          { credentials: "include" }
        );
        if (byName.ok) {
          const json = await byName.json();
          const hit = Array.isArray(json?.data) ? json.data[0] : json?.data;
          const recipeId = hit?.id || hit?.recipeId;
          if (recipeId) {
            navigate(`/recipes/${recipeId}`);
            return;
          }
        }
      } catch {}

      try {
        const res = await fetch(`${API_BASE_URL}/api/recipe/all/recipes`, { credentials: "include" });
        if (res.ok) {
          const all = await res.json();
          const norm = (s) => String(s ?? "").trim().toLowerCase();
          const byExact = all.find(r => norm(r.name) === norm(food.name));
          const byLoose = byExact || all.find(r => norm(r.name).includes(norm(food.name)));
          const recipeId = byLoose?.id || byLoose?.foodID;
          if (recipeId) {
            navigate(`/recipes/${recipeId}`);
            return;
          }
        }
      } catch {}

      navigate(`/recipes?q=${encodeURIComponent(food.name || "")}`);
    } finally {
      setJumping(false);
    }
  };

  const handleBack = () => navigate(-1);

  const handleShare = async () => {
    if (!food || sharingRef.current) return;
    sharingRef.current = true;
    const url = `${window.location.origin}/fooddetail/${food.id}`;
    const title = food.name || "Food";
    const text = food.description || "Check out this Sarawakian Food!";

    try{
      if (navigator.share) {
        try {
          await navigator.share({ title, text, url});
          return;
        } catch (err) {
          if (err?.name === "AbortError") {
            return;
          }
        }
      }
      if (window.isSecureContext && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        openInfo({
          title: "Link copied",
          message: "The link of the page has been copied to your clipboard.",
          icon: <CheckCircle2 />,
        });
        return;
      }
      openInfo({
        title: "Copy this link",
        message: url,
        icon: <AlertTriangle />,
      });
    } finally {
      sharingRef.current = false;
    }
  };

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

  if (error || !food) {
    return (
      <div className="food-detail-page">
        <Header />
        <div className="fdp-container">
          <div className="fdp-topbar">
            <button type="button" className="lrp-btn lrp-btn-outline fdp-back" onClick={handleBack}>
              ← Back
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
            ← Back
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
                <Info className="rdp-sec-icon" color={"#6a4a2f"}/> Cultural Heritage
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
                  <ShoppingBasket className="rdp-sec-icon"  color={"#6a4a2f"}/> Common Ingredients
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
              <button
                type = "button"
                className = "lrp-btn lrp-btn-outline fdp-share"
                onClick = {handleShare}
                aria-label = "Share this food"
                title = "Share"
              >
                <Share2 className = "rdp-sec-icon" />
              </button>
            </div>
            <div className="fdp-actions">
              <button type="button" className="lrp-btn lrp-btn-outline" onClick={goToRecipe} disabled={jumping}>
                <ScrollText className="rdp-sec-icon"  /> {jumping ? "Finding recipe..." : "Go to Recipe"}
              </button>
            </div>

            {/* Nutrition */}
            <div className="fdp-card">
              <h3 className="rdp-sec-title">
                <Cross className="rdp-sec-icon"  color={"#6a4a2f"}/> Nutritional Information
              </h3>
              <p className="fdp-muted">Per serving</p>
              <div className="fdp-nutri-grid">
                <div className="fdp-nutri">
                  <div className="fdp-nutri-value">{Math.round(getPerServing(food, "Energy_kcal_ps", "Energy_kcal")) || "-"}</div>
                  <div className="fdp-nutri-label">Calories</div>
                </div>
                <div className="fdp-nutri">
                  <div className="fdp-nutri-value">{getPerServing(food, "Protein_g_ps", "Protein_g")?.toFixed?.(1) ?? "-"}g</div>
                  <div className="fdp-nutri-label">Protein</div>
                </div>
                <div className="fdp-nutri">
                  <div className="fdp-nutri-value">{getPerServing(food, "Carbohydrates_g_ps", "Carbohydrates_g")?.toFixed?.(1) ?? "-"}g</div>
                  <div className="fdp-nutri-label">Carbohydrates</div>
                </div>
                <div className="fdp-nutri">
                  <div className="fdp-nutri-value">{getPerServing(food, "Fat_g_ps", "Fat_g")?.toFixed?.(1) ?? "-"}g</div>
                  <div className="fdp-nutri-label">Fat</div>
                </div>
              </div>
            </div>

            {/* Health alerts */}
            {healthAlerts.length > 0 && (
              <div className="fdp-card">
                <h3 className="rdp-sec-title">
                  <TriangleAlert size={18} color={"#6a4a2f"} /> Health Information
                </h3>
                <div className="fdp-alerts">
                  {healthAlerts.map((a, idx) => (
                    <div
                      key={idx}
                      className={`fdp-alert ${a.type === "warning" ? "fdp-alert-warn" : "fdp-alert-info"}`}
                    >
                      {a.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Discussion preview */}
            <div className="fdp-card">
              <div className="fdp-disc-header">
                <h3 className="rdp-sec-title">
                  <MessagesSquare className="rdp-sec-icon"  color={"#6a4a2f"}/> Community Discussion
                </h3>
              </div>
              
              <div className="fdp-comments">
                {commentsLoading ? (
                  <p className="fdp-muted fdp-center">Loading comments...</p>
                ) : foodComments.length > 0 ? (
                  <>
                    {foodComments.slice(0, 2).map((c) => (
                      <div key={c.id} className="fdp-comment">
                        {console.log('Individual Comment:', c)}
                        <div className="fdp-comment-head">
                          <span className="fdp-avatar">
                              {c.avatar ? (
                                <img src={c.avatar} alt="avatar" className="fdp-avatar-img" />
                              ) : (
                                <div className="fdp-avatar-initials">
                                  {getUserInitials(c)}
                                </div>
                              )}
                            </span>
                          <span className="fdp-user">{c.username || c.user}</span>
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

      {/* Login Prompt Modal – only shows if guest tries to save */}
      {showLoginPrompt && (
        <LoginPromptModal
          message="Please login or register to save this food."
          onClose={() => setShowLoginPrompt(false)}
          onLogin={() => navigate("/loginregister")}
        />
      )}
      <Modal
        open = {infoDlg.open}
        title = {infoDlg.title}
        icon = {infoDlg.icon}
        primaryText = {infoDlg.primaryText}
        onPrimary = {closeInfo}
        onClose = {closeInfo}
      >
        {infoDlg.message}
      </Modal>
    </div>
  );
}
