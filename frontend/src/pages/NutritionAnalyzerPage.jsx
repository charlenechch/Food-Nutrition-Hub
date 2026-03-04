import React, { useEffect, useState } from "react";
import "../css/NutritionAnalyzer.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { FaWandMagicSparkles, FaCamera } from "react-icons/fa6";
import { IoCameraOutline } from "react-icons/io5";
import { LuSparkles } from "react-icons/lu";
import { useAuth } from "../context/AuthContext";
import LoginPromptModal from "../components/LoginPromptModal";
import { useTranslation } from "react-i18next";

const API_URL = import.meta.env.VITE_API_URL;

export default function NutritionAnalyzerPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const isGuest = !user || user?.role === "guest";

  const [foodName, setFoodName] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [csrfToken, setCsrfToken] = useState("");

  const requireLogin = () => {
    if (isGuest) { setShowModal(true); return true; }
    return false;
  };

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const res = await fetch(`${API_URL}/api/csrf-token`, { credentials: "include" });
        const data = await res.json();
        setCsrfToken(data.csrfToken);
      } catch (e) { console.error("CSRF fetch failed"); }
    };
    fetchToken();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setSelectedFile(file);
  };

  const handleRemoveFile = () => setSelectedFile(null);

  const handleSuggestionClick = (name) => {
    setFoodName(name);
    setSuggestions([]);
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (requireLogin()) return;
    setLoading(true);
    setError("");
    setResult(null);
    setSuggestions([]);

    try {
      // Image path
      if (selectedFile) {
        const formData = new FormData();
        formData.append("image", selectedFile);
        if (ingredients) formData.append("ingredients", ingredients);

        const res = await fetch(`${API_URL}/api/nutrition/analyze-image`, {
          method: "POST",
          headers: { "X-CSRF-Token": csrfToken },
          credentials: "include",
          body: formData,
        });
        const data = await res.json();
        if (data.success) { setResult(data.result); return; }
        setError(data.error || t("analyzer.errorFetch"));
        return;
      }

      // Text path — try DB first
      const dbRes = await fetch(`${API_URL}/api/nutrition/lookup`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
        credentials: "include",
        body: JSON.stringify({ foodName, ingredients }),
      });
      const dbData = await dbRes.json();

      if (dbData.success) { setResult(dbData.result); return; }
      if (dbData.suggestions?.length) { setSuggestions(dbData.suggestions); return; }

      // Fallback to AI
      const aiRes = await fetch(`${API_URL}/api/nutrition/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
        credentials: "include",
        body: JSON.stringify({ foodName, ingredients }),
      });
      const aiData = await aiRes.json();
      if (aiData.success) { setResult(aiData.result); return; }
      setError(aiData.error || t("analyzer.errorAI"));
    } catch {
      setError(t("analyzer.errorGeneral"));
    } finally {
      setLoading(false);
    }
  };

  const nutritionRows = result?.nutrition ? [
    [t("analyzer.calories"),  result.nutrition.Energy_kcal,       "kcal"],
    [t("explore.protein"),    result.nutrition.Protein_g,         "g"],
    [t("explore.fat"),        result.nutrition.Fat_g,             "g"],
    [t("explore.carbs"),      result.nutrition.Carbohydrates_g,   "g"],
    [t("analyzer.fiber"),     result.nutrition.Fiber_g,           "g"],
    [t("analyzer.vitaminC"),  result.nutrition.VitaminC_mg,       "mg"],
  ] : [];

  return (
    <div className="nutrition-page">
      <Header />

      <h1 className="page-title">{t("analyzer.title")}</h1>
      <p className="page-subtitle">{t("analyzer.subtitle")}</p>

      <div className="analyzer-container">
        {/* LEFT PANEL */}
        <div className="left-column">
          <form className="food-form" onSubmit={handleAnalyze}>
            <div className="food-input-card">
              <h3 className="section-title">
                <LuSparkles /> {t("analyzer.enterInfo")}
              </h3>

              <label>{t("analyzer.foodName")}</label>
              <input
                type="text"
                value={foodName}
                placeholder={t("analyzer.foodNamePlaceholder")}
                onChange={(e) => { if (!requireLogin()) setFoodName(e.target.value); }}
              />

              <label>{t("analyzer.ingredients")}</label>
              <textarea
                value={ingredients}
                placeholder={t("analyzer.ingredientsPlaceholder")}
                onChange={(e) => { if (!requireLogin()) setIngredients(e.target.value); }}
              />
            </div>

            {/* UPLOAD */}
            <div className="upload-card">
              <h3 className="section-title">
                <IoCameraOutline /> {t("analyzer.uploadTitle")}
              </h3>
              <p>{t("analyzer.uploadDesc")}</p>

              <div className="upload-box-wrapper">
                <div className="upload-box"
                  onClick={() => !requireLogin() && document.getElementById("fileInput").click()}>
                  <FaCamera size={28} />
                  <p>{selectedFile ? selectedFile.name : t("analyzer.dragDrop")}</p>
                  <input id="fileInput" type="file" accept="image/*"
                    style={{ display: "none" }} onChange={handleFileChange} />
                </div>
                {selectedFile && (
                  <button type="button" className="file-remove-btn" onClick={handleRemoveFile}>✕</button>
                )}
              </div>
            </div>

            <button type="submit" className="analyze-btn" disabled={loading}>
              <FaWandMagicSparkles size={18} />
              {loading ? ` ${t("analyzer.analyzing")}` : ` ${t("analyzer.analyzeBtn")}`}
            </button>
          </form>
        </div>

        {/* RIGHT PANEL */}
        <div className={`result-card ${result ? "has-result" : "empty"}`}>
          {suggestions.length > 0 && (
            <>
              <p style={{ marginBottom: 8 }}>{t("analyzer.didYouMean")}</p>
              <div className="suggestion-chips">
                {suggestions.map((name) => (
                  <button key={name} onClick={() => handleSuggestionClick(name)}>{name}</button>
                ))}
              </div>
            </>
          )}

          {error && <div className="error-text">{error}</div>}

          {!result && !error && !loading && (
            <p>{t("analyzer.getStarted")}</p>
          )}

          {result && (
            <div className="nap-results">
              <div className="analysis-container">
                <h2 className="analysis-title">{result.food_name}</h2>

                {result.nutrition && (
                  <div className="nutrition-section">
                    <h3 className="section-header">{t("analyzer.nutritionPerPortion")}</h3>
                    <div className="nutrition-grid">
                      {nutritionRows.map(([label, val, unit], i) => (
                        <div className="nutri-card" key={i}>
                          <span className="nutri-value">{val ?? "—"} {val != null ? unit : ""}</span>
                          <span className="nutri-label">{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {!!result.alternatives?.length && (
                <div className="analysis-container">
                  <div className="alternatives-section">
                    <h3 className="section-header">{t("analyzer.healthierAlts")}</h3>
                    {result.alternatives.map((alt, i) => (
                      <div className="alternative-card" key={i}>
                        <div className="alt-main">{alt.title}</div>
                        {alt.description && <div className="alt-desc">{alt.description}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!!result.tips?.length && (
                <div className="analysis-container">
                  <div className="tips-section">
                    <h3 className="section-header">{t("analyzer.healthTips")}</h3>
                    {result.tips.map((tip, i) => (
                      <div className="tip-card tip-info" key={i}>{tip}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Footer />
      <LoginPromptModal show={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}