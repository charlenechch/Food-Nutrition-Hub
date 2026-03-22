import React, { useMemo, useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useTranslation } from "react-i18next";
import { FaCamera, FaExclamationTriangle, FaInfoCircle } from "react-icons/fa";
import LS_KEY from "./UserProfilePage";
import "../css/ReviseRecipePage.css";
import Modal from "../components/Modal";
import { CheckCircle2, AlertTriangle } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function loadUsers() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}
function saveUsers(obj) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(obj)); } catch {}
}

const ORIGIN_OPTIONS = [
  "Malay", "Chinese", "Iban", "Melanau", 
  "Kadazan", "Bidayuh", "Dayak"
];

const DIET_OPTIONS = [
  "gluten-free", "dairy-free", "vegetarian", "vegan",
  "halal", "low-fat", "high-protein", "spicy",
];

export default function ReviseRecipePage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const { contribution, adminFeedback, fieldsWithIssues } = state || {};
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [item, setItem] = useState(contribution);
  const [form, setForm] = useState({
    name: "", origin: "", difficulty: "Easy",
    prepTime: "", cookTime: "", servings: "",
    imageData: "", description: "", ingredients: "",
    instructions: "", funFact: "", chefTips: "",
    dietaryTags: [], otherDietEnabled: false, otherDietText: "",
    foodType: "Poultry", otherFoodEnabled: false, otherFoodText: "",
  });

  const [infoDlg, setInfoDlg] = useState({
    open: false, title: "", message: "", icon: null, primaryText: "OK",
  });

  const openInfo = ({ title, message, icon, primaryText = "OK" }) =>
    setInfoDlg({ open: true, title, message, icon, primaryText });

  const closeInfo = () => setInfoDlg((d) => ({ ...d, open: false }));

  const needsFix = new Set(item?.fieldsWithIssues || []);

  //====================
  // CSRF
  //====================
  const [csrfToken, setCsrfToken] = useState("");

  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/csrf-token`, { credentials: "include" });
        const data = await res.json();
        setCsrfToken(data.csrfToken);
      } catch (err) {
        console.error("Failed to fetch CSRF token", err);
      }
    };
    fetchCsrfToken();
  }, []);

  useEffect(() => {
    const initializeForm = () => {
      if (contribution) {
        console.log("📝 Using state contribution:", contribution);

        setItem({
          ...contribution,
          feedback: contribution.adminFeedback || contribution.feedback || ""
        });

        const p = contribution.payload || contribution;
        const initialForm = {
          name: p.name || p.title || "",
          origin: p.origin || "",
          difficulty: p.difficulty || "Easy",
          prepTime: p.prepTime ?? "",
          cookTime: p.cookTime ?? "",
          servings: p.servings ?? "",
          imageData: p.imageData || p.image || "",
          description: p.description || "",
          ingredients: Array.isArray(p.ingredients) ? p.ingredients.join('\n') : (p.ingredients || ""),
          instructions: Array.isArray(p.instructions) ? p.instructions.join('\n') : (p.instructions || ""),
          funFact: p.funFact || p.DidYouKnow || "",
          chefTips: p.chefTips || "",
          dietaryTags: Array.isArray(p.dietaryTags) ? p.dietaryTags : [],
          otherDietEnabled: false, otherDietText: "",
          foodType: p.foodType || "Poultry",
          otherFoodEnabled: false, otherFoodText: "",
        };

        setForm(initialForm);
        setIsLoading(false);
      }
    };

    const fetchRecipeData = async () => {
      try {
        const recipeId = id;
        console.log("🎯 Using recipe ID from URL:", recipeId);

        if (!recipeId) throw new Error("No recipe ID provided in URL");

        const response = await fetch(`${API_BASE_URL}/api/recipe/recipes/${recipeId}`);

        if (!response.ok) throw new Error(`Failed to fetch recipe: ${response.status}`);

        const recipeData = await response.json();
        console.log("✅ Recipe data received:", recipeData);

        setItem(prev => ({
          ...prev, ...recipeData, id: recipeId,
          feedback: recipeData.adminFeedback || recipeData.feedback || prev?.feedback || "",
          fieldsWithIssues: recipeData.fieldsWithIssues || prev?.fieldsWithIssues || []
        }));

        setForm(prev => ({
          ...prev,
          name: recipeData.name || "",
          origin: recipeData.origin || "",
          difficulty: recipeData.difficulty || "Easy",
          prepTime: recipeData.prepTime ?? "",
          cookTime: recipeData.cookTime ?? "",
          servings: recipeData.servings ?? "",
          imageData: recipeData.image || "",
          description: recipeData.description || "",
          ingredients: recipeData.ingredients || "",
          instructions: recipeData.instructions || "",
          funFact: recipeData.funFact || recipeData.DidYouKnow || "",
          chefTips: recipeData.chefTips || "",
          dietaryTags: Array.isArray(recipeData.dietaryTags) ? recipeData.dietaryTags : [],
          foodType: recipeData.foodType || "",
          category: recipeData.category || "",
          status: recipeData.status || "Pending"
        }));

      } catch (error) {
        console.error("❌ Error fetching from API, using state data:", error);
        initializeForm();
      } finally {
        setIsLoading(false);
      }
    };

    if (contribution) {
      initializeForm();
    } else {
      fetchRecipeData();
    }
  }, [id, contribution]);

  const onChangeForm = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const toggleDiet = (tag) => {
    setForm(prev => {
      const exists = prev.dietaryTags.includes(tag);
      return {
        ...prev,
        dietaryTags: exists ? prev.dietaryTags.filter(t => t !== tag) : [...prev.dietaryTags, tag],
      };
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm(prev => ({ ...prev, imageData: reader.result }));
    reader.readAsDataURL(file);
  };

  const addRecipe = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      console.log('🚀 Starting recipe revision for ID:', id);

      const revisedData = {
        name: form.name, origin: form.origin, difficulty: form.difficulty,
        prepTime: parseInt(form.prepTime) || 0,
        cookTime: parseInt(form.cookTime) || 0,
        servings: parseInt(form.servings) || 1,
        image: form.imageData, description: form.description,
        foodType: form.foodType, dietaryTags: form.dietaryTags,
        ingredients: form.ingredients, instructions: form.instructions,
        funFact: form.funFact, chefTips: form.chefTips, status: "Pending"
      };

      console.log('📤 Sending update request with data:', revisedData);

      const response = await fetch(`${API_BASE_URL}/api/recipe/revise/recipes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
        credentials: "include",
        body: JSON.stringify(revisedData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update recipe: ${errorText}`);
      }

      await response.json();

      openInfo({
        title: t("reviseRecipe.revisedSuccessTitle"),
        message: t("reviseRecipe.revisedSuccessMsg"),
        icon: <CheckCircle2 />,
      });
      setTimeout(() => {
        navigate("/profile?tab=status");
      }, 2000);

    } catch (error) {
      console.error("❌ Update error:", error);
      openInfo({
        title: t("reviseRecipe.failedTitle"),
        message: error?.message || t("reviseRecipe.pleaseRetry"),
        icon: <AlertTriangle />,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldLabels = {
    name: t("reviseRecipe.nameLabel").replace(" *", ""),
    origin: t("reviseRecipe.originLabel").replace(" *", ""),
    description: t("reviseRecipe.descriptionLabel").replace(" *", ""),
    images: t("reviseRecipe.uploadPhotoLabel").replace(" *", ""),
    ingredients: t("reviseRecipe.ingredientsLabel").replace(" *", ""),
    instructions: t("reviseRecipe.instructionsLabel").replace(" *", ""),
    dietaryTags: t("reviseRecipe.dietaryPreferencesLabel"),
  };

  if (isLoading) {
    return (
      <div className="revise-recipe-page">
        <Header />
        <div className="upp-page">
          <div className="upp-wrap">
            <div className="loading-state">{t("reviseRecipe.loadingData")}</div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="upp-wrap">
        <button
          className="lrp-btn lrp-btn-outline lrp-back"
          onClick={() => navigate("/profile?tab=status")}
        >
          {t("reviseRecipe.back")}
        </button>
        <h2 className="upp-404-h2">{t("reviseRecipe.notAvailableTitle")}</h2>
        <p className="upp-muted">{t("reviseRecipe.notAvailableMsg")}</p>
      </div>
    );
  }

  return (
    <div className="revise-recipe-page">
      <Header />
      <div className="upp-page">
        <div className="upp-wrap">
          <button
            className="lrp-btn lrp-btn-outline lrp-back"
            onClick={() => navigate("/profile?tab=status")}
          >
            {t("reviseRecipe.backToContributions")}
          </button>

          <div className="rcp-wrap">
            <h2 className="rp-title">{t("reviseRecipe.pageTitle")}</h2>

            {/* Admin Alert Box */}
            <div className="rcp-admin-alert">
              <div className="rcp-alert-header">
                <FaExclamationTriangle className="rcp-alert-icon" size={24} />
                <h3>{t("reviseRecipe.adminFeedbackTitle")}</h3>
              </div>

              <div className="rcp-alert-content">
                {item.feedback ? (
                  <p
                    className="rcp-feedback-message"
                    style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", overflowWrap: "break-word" }}
                  >
                    {item.feedback}
                  </p>
                ) : (
                  <p className="rcp-feedback-message">{t("reviseRecipe.defaultFeedback")}</p>
                )}

                {needsFix.size > 0 && (
                  <div className="rcp-issues-list">
                    <p className="rcp-issues-title">
                      <FaInfoCircle size={14} /> {t("reviseRecipe.fieldsNeedAttention")}
                    </p>
                    <ul>
                      {Array.from(needsFix).map(field => (
                        <li key={field}>• {fieldLabels[field] || field}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <p className="upp-muted" style={{ marginBottom: 16 }}>
              {t("reviseRecipe.originalSubmissionDate", {
                date: item.submittedDate
                  ? new Date(item.submittedDate).toLocaleDateString()
                  : t("reviseRecipe.unknownDate")
              })}
            </p>

            <form className="rp-form" onSubmit={addRecipe}>
              <div className="rp-grid-2">
                <div className={`rp-field ${needsFix.has("name") ? "needs-fix" : ""}`}>
                  <label>{t("reviseRecipe.nameLabel")}</label>
                  <input name="name" value={form.name} onChange={onChangeForm} placeholder={t("reviseRecipe.namePlaceholder")} required />
                  {needsFix.has("name") && <div className="field-issue-hint">{t("reviseRecipe.reviewAndCorrect")}</div>}
                </div>
                <div className={`rp-field ${needsFix.has("origin") ? "needs-fix" : ""}`}>
                  <label>{t("reviseRecipe.originLabel")}</label>
                  <select 
                    name="origin" 
                    value={form.origin} 
                    onChange={onChangeForm} 
                    required
                  >
                    <option value="" disabled>
                      {t("reviseRecipe.originPlaceholder", "Select Origin")}
                    </option>
                    {ORIGIN_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  {needsFix.has("origin") && <div className="field-issue-hint">{t("reviseRecipe.reviewAndCorrect")}</div>}
                </div>
              </div>

              <div className="rp-grid-3">
                <div className="rp-field">
                  <label>{t("reviseRecipe.difficultyLabel")}</label>
                  <select name="difficulty" value={form.difficulty} onChange={onChangeForm} required>
                    <option value="Easy">{t("reviseRecipe.easy")}</option>
                    <option value="Medium">{t("reviseRecipe.medium")}</option>
                    <option value="Hard">{t("reviseRecipe.hard")}</option>
                  </select>
                </div>
                <div className="rp-field">
                  <label>{t("reviseRecipe.prepTimeLabel")}</label>
                  <input type="number" name="prepTime" value={form.prepTime} onChange={onChangeForm} required />
                </div>
                <div className="rp-field">
                  <label>{t("reviseRecipe.cookTimeLabel")}</label>
                  <input type="number" name="cookTime" value={form.cookTime} onChange={onChangeForm} required />
                </div>
              </div>

              <div className="rp-grid-2">
                <div className="rp-field">
                  <label>{t("reviseRecipe.foodTypeLabel")}</label>
                  <select
                    name="foodType"
                    value={form.foodType}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "__other__") {
                        setForm(prev => ({ ...prev, foodType: v, otherFoodEnabled: true }));
                      } else {
                        setForm(prev => ({ ...prev, foodType: v, otherFoodEnabled: false, otherFoodText: "" }));
                      }
                    }}
                  >
                    {["Poultry", "Seafood", "Vegetables", "Fermented", "Dessert", "Rice Dish", "Noodles", "Soup", "Meat"].map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                    <option value="__other__">{t("reviseRecipe.otherOption")}</option>
                  </select>
                </div>

                {form.otherFoodEnabled && (
                  <div className="rp-field">
                    <label>{t("reviseRecipe.specifyFoodTypeLabel")}</label>
                    <input
                      type="text"
                      placeholder={t("reviseRecipe.specifyFoodTypePlaceholder")}
                      value={form.otherFoodText}
                      onChange={(e) => setForm(prev => ({ ...prev, otherFoodText: e.target.value }))}
                    />
                  </div>
                )}
              </div>

              <div className="rp-grid-2">
                <div className={`rp-field ${needsFix.has("description") ? "needs-fix" : ""}`}>
                  <label>{t("reviseRecipe.descriptionLabel")}</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={onChangeForm}
                    placeholder={t("reviseRecipe.descriptionPlaceholder")}
                    required
                  />
                  {needsFix.has("description") && <div className="field-issue-hint">{t("reviseRecipe.reviewAndCorrect")}</div>}
                </div>

                <div className={`rp-field ${needsFix.has("images") ? "needs-fix" : ""}`}>
                  <label>{t("reviseRecipe.uploadPhotoLabel")}</label>
                  <div
                    className="upload-box"
                    onClick={() => document.getElementById("recipe-file-input").click()}
                    role="button"
                    tabIndex={0}
                  >
                    {form.imageData ? (
                      <img src={form.imageData} alt="Preview" className="preview-img" />
                    ) : (
                      <div className="upload-placeholder">
                        <FaCamera className="camera-icon" />
                        <p>{t("reviseRecipe.uploadPhotoBtn")}</p>
                      </div>
                    )}
                  </div>
                  <input
                    id="recipe-file-input"
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleImageUpload}
                    required={!form.imageData}
                  />
                  {needsFix.has("images") && <div className="field-issue-hint">{t("reviseRecipe.reviewImage")}</div>}
                </div>
              </div>

              <div className="rp-field">
                <label>{t("reviseRecipe.servingsLabel")}</label>
                <input type="number" name="servings" value={form.servings} onChange={onChangeForm} required />
              </div>

              <div className="rp-grid-2">
                <div className={`rp-field ${needsFix.has("ingredients") ? "needs-fix" : ""}`}>
                  <label>{t("reviseRecipe.ingredientsLabel")}</label>
                  <textarea
                    name="ingredients"
                    value={form.ingredients}
                    onChange={onChangeForm}
                    placeholder={t("reviseRecipe.ingredientsPlaceholder")}
                    required
                  />
                  {needsFix.has("ingredients") && <div className="field-issue-hint">{t("reviseRecipe.reviewIngredients")}</div>}
                </div>
                <div className={`rp-field ${needsFix.has("instructions") ? "needs-fix" : ""}`}>
                  <label>{t("reviseRecipe.instructionsLabel")}</label>
                  <textarea
                    name="instructions"
                    value={form.instructions}
                    onChange={onChangeForm}
                    placeholder={t("reviseRecipe.instructionsPlaceholder")}
                    required
                  />
                  {needsFix.has("instructions") && <div className="field-issue-hint">{t("reviseRecipe.reviewInstructions")}</div>}
                </div>
              </div>

              <div className="rp-field">
                <label>{t("reviseRecipe.dietaryPreferencesLabel")}</label>
                <div className="rp-diet-grid">
                  {DIET_OPTIONS.map(tag => (
                    <label key={tag} className="rp-diet-item">
                      <input
                        type="checkbox"
                        checked={form.dietaryTags.includes(tag)}
                        onChange={() => toggleDiet(tag)}
                      />
                      <span>{tag.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase())}</span>
                    </label>
                  ))}
                </div>

                <div className="rp-diet-other">
                  <label className="rp-diet-item">
                    <input
                      type="checkbox"
                      checked={form.otherDietEnabled}
                      onChange={(e) => setForm(prev => ({ ...prev, otherDietEnabled: e.target.checked }))}
                    />
                    <span>{t("reviseRecipe.otherDiet")}</span>
                  </label>

                  {form.otherDietEnabled && (
                    <input
                      className="rp-input rp-input--sm"
                      type="text"
                      placeholder={t("reviseRecipe.otherDietPlaceholder")}
                      value={form.otherDietText}
                      onChange={(e) => setForm(prev => ({ ...prev, otherDietText: e.target.value }))}
                    />
                  )}
                </div>
              </div>

              <div className="rp-grid-2">
                <div className="rp-field">
                  <label>{t("reviseRecipe.funFactLabel")}</label>
                  <textarea
                    name="funFact"
                    value={form.funFact}
                    onChange={onChangeForm}
                    placeholder={t("reviseRecipe.funFactPlaceholder")}
                  />
                </div>
                <div className="rp-field">
                  <label>{t("reviseRecipe.tipsLabel")}</label>
                  <textarea
                    name="chefTips"
                    value={form.chefTips}
                    onChange={onChangeForm}
                    placeholder={t("reviseRecipe.tipsPlaceholder")}
                  />
                </div>
              </div>

              <div className="rp-actions">
                <button className="rp-btn rp-submit" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? t("reviseRecipe.submitting") : t("reviseRecipe.submitRevision")}
                </button>
                <button
                  className="rp-btn rp-btn-muted"
                  type="button"
                  onClick={() => navigate("/profile?tab=status")}
                >
                  {t("reviseRecipe.cancelBtn")}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

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

      <Footer />
    </div>
  );
}