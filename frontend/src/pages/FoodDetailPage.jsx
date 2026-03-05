import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../css/FoodDetailPage.css";
import Modal from "../components/Modal";
import { Share2, Info, TriangleAlert, MessagesSquare, ShoppingBasket, Cross, ScrollText, CheckCircle2, AlertTriangle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import LoginPromptModal from "../components/LoginPromptModal";
import { useTranslation } from "react-i18next";
import { translateTexts } from "../hooks/useAITranslation";

export default function FoodDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();

  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [food, setFood] = useState(null);
  const [translatedFood, setTranslatedFood] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [foodComments, setFoodComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [savedLoading, setSavedLoading] = useState(false);
  const [healthAlerts, setHealthAlerts] = useState([]);
  const [jumping, setJumping] = useState(false);
  const [csrfToken, setCsrfToken] = useState("");
  const [infoDlg, setInfoDlg] = useState({ open: false, title: "", message: "", icon: null, primaryText: "OK" });
  const sharingRef = useRef(false);

  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const res = await fetch(`${API_BASE_URL}/api/csrf-token`, { credentials: "include" });
        const data = await res.json();
        setCsrfToken(data.csrfToken);
      } catch (err) { console.error("Failed to fetch CSRF token", err); }
    };
    fetchCsrfToken();
  }, []);

  useEffect(() => {
    if (!food || i18n.language === "en") {
      setTranslatedFood({});
      return;
    }
    const ingredients = food.commonIngredients || []; // ✅ define it here
    translateTexts({
      name: food.name,
      description: food.description,
      culturalSignificance: food.culturalSignificance,
      traditionalPreparation: food.traditionalPreparation,
      ingredients: ingredients.join("||"),
    }, i18n.language).then((result) => { // ✅ result not results
      if (result.ingredients) {
        result.ingredientsArray = result.ingredients.split("||").map(s => s.trim());
      }
      setTranslatedFood(result);
    });
  }, [food, i18n.language]);

  const openInfo = ({ title, message, icon, primaryText = "OK" }) =>
    setInfoDlg({ open: true, title, message, icon, primaryText });
  const closeInfo = () => setInfoDlg((d) => ({ ...d, open: false }));
  const num = (v) => (v == null ? 0 : Number(v));
  const getPerServing = (food, keyPs, keyTotal) => num(food?.[keyPs]) || num(food?.[keyTotal]);

  const buildHealthAlerts = (food) => {
    const alerts = [];
    const kcal = getPerServing(food, "Energy_kcal_ps", "Energy_kcal");
    const protein = getPerServing(food, "Protein_g_ps", "Protein_g");
    const fat = getPerServing(food, "Fat_g_ps", "Fat_g");
    const carbs = getPerServing(food, "Carbohydrates_g_ps", "Carbohydrates_g");
    const fiber = getPerServing(food, "Fiber_g_ps", "Fiber_g");
    const vitC = getPerServing(food, "VitaminC_mg_ps", "VitaminC_mg");

    if (kcal >= 600) alerts.push({ type: "warning", key: "foodDetail.alertHighCal" });
    else if (kcal > 0 && kcal <= 300) alerts.push({ type: "info", key: "foodDetail.alertLowCal" });
    if (protein >= 25) alerts.push({ type: "info", key: "foodDetail.alertExcellentProtein" });
    else if (protein >= 12) alerts.push({ type: "info", key: "foodDetail.alertGoodProtein" });
    if (fat >= 20) alerts.push({ type: "warning", key: "foodDetail.alertHighFat" });
    else if (fat > 0 && fat <= 10) alerts.push({ type: "info", key: "foodDetail.alertLowFat" });
    if (carbs >= 60) alerts.push({ type: "warning", key: "foodDetail.alertHighCarbs" });
    if (fiber >= 5) alerts.push({ type: "info", key: "foodDetail.alertHighFiber" });
    if (vitC >= 30) alerts.push({ type: "info", key: "foodDetail.alertVitC" });
    const tags = Array.isArray(food?.dietaryTags) ? food.dietaryTags : [];
    if (tags.includes("spicy")) alerts.push({ type: "info", key: "foodDetail.alertSpicy" });
    if (tags.includes("vegetarian")) alerts.push({ type: "info", key: "foodDetail.alertVegetarian" });
    return alerts;
  };

  useEffect(() => {
    const fetchFood = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const res = await fetch(`${API_BASE_URL}/api/foodDetail/${id}`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const result = await res.json();
        if (result.success) {
          setFood(result.data);
          setHealthAlerts(buildHealthAlerts(result.data));
          fetchFoodComments(result.data.id || id);
        } else { setError(result.message || "Food not found"); }
      } catch (err) { setError("Failed to fetch food details"); console.error("Error:", err); }
      finally { setLoading(false); }
    };
    if (id) fetchFood();
  }, [id]);

  useEffect(() => { if (food) setHealthAlerts(buildHealthAlerts(food)); }, [food]);

  const fetchFoodComments = async (foodId) => {
    try {
      setCommentsLoading(true);
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const res = await fetch(`${API_BASE_URL}/api/foodDiscussion/food/${foodId}`);
      if (res.ok) { const result = await res.json(); if (result.success) setFoodComments(result.data); }
    } catch (err) { console.error("Error fetching comments:", err); }
    finally { setCommentsLoading(false); }
  };

  const isLoggedIn = () => user && user.role !== "guest";
  const getUserInitials = (comment) => {
    const username = comment.username || comment.user || comment.author || "User";
    return username.substring(0, 2).toUpperCase();
  };

  useEffect(() => { if (id && isLoggedIn()) checkSavedStatus(); }, [id, isLoggedIn()]);

  const checkSavedStatus = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const url = `${API_BASE_URL}/api/saveFood/check/${id}?userProfileID=${user?.userID}&type=food`;
      const response = await fetch(url, { method: "GET", credentials: "include", headers: { Accept: "application/json" } });
      if (response.ok) { const data = await response.json(); setSaved(data.saved); }
      else setSaved(false);
    } catch (error) { setSaved(false); }
  };

  const handleSaveFood = async () => {
    if (!isLoggedIn()) { setShowLoginPrompt(true); return; }
    const userProfileID = user?.userID;
    if (!userProfileID) { setShowLoginPrompt(true); return; }
    setSavedLoading(true);
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const response = await fetch(`${API_BASE_URL}/api/saveFood/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
        credentials: "include",
        body: JSON.stringify({ userProfileID, type: "food" }),
      });
      if (response.ok) { const data = await response.json(); setSaved(data.saved); }
    } catch (error) { console.error("Error saving food:", error); }
    finally { setSavedLoading(false); }
  };

  const handleViewDiscussion = () => navigate(`/fooddiscussion/${id}`, { state: { food } });
  const handleBack = () => navigate(-1);

  const handleShare = async () => {
    if (!food || sharingRef.current) return;
    sharingRef.current = true;
    const url = `${window.location.origin}/fooddetail/${food.id}`;
    const title = food.name || "Food";
    const text = food.description || "Check out this Sarawakian Food!";
    try {
      if (navigator.share) {
        try { await navigator.share({ title, text, url }); return; }
        catch (err) { if (err?.name === "AbortError") return; }
      }
      if (window.isSecureContext && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        openInfo({ title: t("foodDetail.linkCopied"), message: t("foodDetail.linkCopiedMsg"), icon: <CheckCircle2 /> });
        return;
      }
      openInfo({ title: t("foodDetail.copyLink"), message: url, icon: <AlertTriangle /> });
    } finally { sharingRef.current = false; }
  };

  const goToRecipe = async () => {
    if (!food) return;
    setJumping(true);
    try { navigate(`/recipes?q=${encodeURIComponent(food.name || "")}`); }
    catch (error) { navigate(`/recipes?q=${encodeURIComponent(food.name || "")}`); }
    finally { setJumping(false); }
  };

  if (loading) return (
    <div className="food-detail-page"><Header />
      <div className="fdp-container"><div className="fdp-center">{t("foodDetail.loading")}</div></div>
      <Footer />
    </div>
  );

  if (error || !food) return (
    <div className="food-detail-page"><Header />
      <div className="fdp-container">
        <div className="fdp-topbar">
          <button type="button" className="lrp-btn lrp-btn-outline fdp-back" onClick={handleBack}>← {t("foodDetail.back")}</button>
        </div>
        <div className="fdp-center">
          <h2>{t("foodDetail.notFound")}</h2>
          <p>{error || t("foodDetail.notFoundMsg")}</p>
        </div>
      </div>
      <Footer />
    </div>
  );

  const ingredients = food.commonIngredients || [];

  return (
    <div className="food-detail-page">
      <Header />
      <div className="fdp-container">
        <div className="fdp-topbar">
          <button type="button" className="lrp-btn lrp-btn-outline fdp-back" onClick={handleBack}>
            ← {t("Back")}
          </button>
        </div>

        <div className="fdp-grid">
          {/* Left column */}
          <div className="fdp-left">
            <div className="fdp-card fdp-hero">
              <div className="fdp-hero-media">
                <img src={food.image} alt={food.name} />
                <div className="fdp-hero-overlay" />
                <div className="fdp-hero-text">
                  <div className="fdp-badges">
                    {food.origin && <span className="fdp-badge">{food.origin}</span>}
                    {food.category && <span className="fdp-badge">{food.category}</span>}
                  </div>
                  <h1 className="fdp-title">{translatedFood.name || food.name}</h1>
                </div>
              </div>
            </div>

            <div className="fdp-card">
              <h3 className="rdp-sec-title">
                <Info className="rdp-sec-icon" color="#6a4a2f" /> {t("foodDetail.culturalHeritage")}
              </h3>
              <div className="fdp-block">
                <p className="fdp-block-title">{t("foodDetail.description")}</p>
                {food.description && <p className="fdp-text">{translatedFood.description || food.description}</p>}
              </div>
              {food.culturalSignificance && (
                <div className="fdp-block">
                  <p className="fdp-block-title">{t("foodDetail.culturalSignificance")}</p>
                  <p className="fdp-text">{translatedFood.culturalSignificance || food.culturalSignificance}</p>
                </div>
              )}
              <div className="fdp-block">
                <p className="fdp-block-title">{t("foodDetail.traditionalPrep")}</p>
                <p className="fdp-text">{translatedFood.traditionalPreparation || food.traditionalPreparation}</p>
              </div>
            </div>

            {ingredients.length > 0 && (
              <div className="fdp-card">
                <h3 className="rdp-sec-title">
                  <ShoppingBasket className="rdp-sec-icon" color="#6a4a2f" /> {t("foodDetail.commonIngredients")}
                </h3>
                <div className="fdp-chip-grid">
                  {(translatedFood.ingredientsArray || ingredients).map((ing, i) => (
                    <span key={i} className="fdp-chip">{ing}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="fdp-right">
            <div className="fdp-actions">
              <button type="button" className={`lrp-btn lrp-btn-primary fdp-save ${saved ? "saved" : ""}`}
                onClick={handleSaveFood} disabled={savedLoading}>
                {savedLoading ? "..." : saved ? `✓ ${t("foodDetail.saved")}` : `❤ ${t("foodDetail.saveFood")}`}
              </button>
              <button type="button" className="lrp-btn lrp-btn-outline fdp-share"
                onClick={handleShare} aria-label="Share this food" title="Share">
                <Share2 className="rdp-sec-icon" />
              </button>
            </div>
            <div className="fdp-actions">
              <button type="button" className="lrp-btn lrp-btn-outline" onClick={goToRecipe} disabled={jumping}>
                <ScrollText className="rdp-sec-icon" /> {jumping ? t("foodDetail.findingRecipe") : t("foodDetail.goToRecipe")}
              </button>
            </div>

            <div className="fdp-card">
              <h3 className="rdp-sec-title">
                <Cross className="rdp-sec-icon" color="#6a4a2f" /> {t("foodDetail.nutritionalInfo")}
              </h3>
              <p className="fdp-muted">{t("foodDetail.perServing")}</p>
              <div className="fdp-nutri-grid">
                <div className="fdp-nutri">
                  <div className="fdp-nutri-value">{Math.round(getPerServing(food, "Energy_kcal_ps", "Energy_kcal")) || "-"}</div>
                  <div className="fdp-nutri-label">{t("explore.calories")}</div>
                </div>
                <div className="fdp-nutri">
                  <div className="fdp-nutri-value">{getPerServing(food, "Protein_g_ps", "Protein_g")?.toFixed?.(1) ?? "-"}g</div>
                  <div className="fdp-nutri-label">{t("explore.protein")}</div>
                </div>
                <div className="fdp-nutri">
                  <div className="fdp-nutri-value">{getPerServing(food, "Carbohydrates_g_ps", "Carbohydrates_g")?.toFixed?.(1) ?? "-"}g</div>
                  <div className="fdp-nutri-label">{t("explore.carbs")}</div>
                </div>
                <div className="fdp-nutri">
                  <div className="fdp-nutri-value">{getPerServing(food, "Fat_g_ps", "Fat_g")?.toFixed?.(1) ?? "-"}g</div>
                  <div className="fdp-nutri-label">{t("explore.fat")}</div>
                </div>
              </div>
            </div>

            {healthAlerts.length > 0 && (
              <div className="fdp-card">
                <h3 className="rdp-sec-title">
                  <TriangleAlert size={18} color="#6a4a2f" /> {t("foodDetail.healthInfo")}
                </h3>
                <div className="fdp-alerts">
                  {healthAlerts.map((a, idx) => (
                    <div key={idx} className={`fdp-alert ${a.type === "warning" ? "fdp-alert-warn" : "fdp-alert-info"}`}>
                      {t(a.key)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="fdp-card">
              <div className="fdp-disc-header">
                <h3 className="rdp-sec-title">
                  <MessagesSquare className="rdp-sec-icon" color="#6a4a2f" /> {t("foodDetail.communityDiscussion")}
                </h3>
              </div>
              <div className="fdp-comments">
                {commentsLoading ? (
                  <p className="fdp-muted fdp-center">{t("foodDetail.loadingComments")}</p>
                ) : foodComments.length > 0 ? (
                  <>
                    {foodComments.slice(0, 2).map((c) => (
                      <div key={c.id} className="fdp-comment">
                        <div className="fdp-comment-head">
                          <span className="fdp-avatar">
                            {c.avatar ? <img src={c.avatar} alt="avatar" className="fdp-avatar-img" />
                              : <div className="fdp-avatar-initials">{getUserInitials(c)}</div>}
                          </span>
                          <span className="fdp-user">{c.username || c.user}</span>
                          <span className="fdp-time">{c.timeAgo}</span>
                        </div>
                        <p className="fdp-comment-text">{c.content}</p>
                      </div>
                    ))}
                    <button type="button" className="lrp-btn lrp-btn-outline" onClick={handleViewDiscussion}>
                      {t("foodDetail.viewDiscussion", { count: foodComments.length })}
                    </button>
                  </>
                ) : (
                  <div className="fdp-no-comments">
                    <p className="fdp-muted fdp-center">{t("foodDetail.noComments")}</p>
                    <button type="button" className="lrp-btn lrp-btn-primary" onClick={handleViewDiscussion}>
                      {t("foodDetail.startDiscussion")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {showLoginPrompt && (
        <LoginPromptModal message={t("foodDetail.loginToSave")}
          onClose={() => setShowLoginPrompt(false)}
          onLogin={() => navigate("/loginregister")} />
      )}
      <Modal open={infoDlg.open} title={infoDlg.title} icon={infoDlg.icon}
        primaryText={infoDlg.primaryText} onPrimary={closeInfo} onClose={closeInfo}>
        {infoDlg.message}
      </Modal>
    </div>
  );
}