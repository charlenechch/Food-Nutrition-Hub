import React, { useEffect, useState, useRef } from "react";
import "../css/NutritionAnalyzer.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { FaWandMagicSparkles, FaCamera } from "react-icons/fa6";
import { IoCameraOutline } from "react-icons/io5";
import { LuSparkles } from "react-icons/lu";
import { useAuth } from "../context/AuthContext";
import LoginPromptModal from "../components/LoginPromptModal";
import { useTranslation } from "react-i18next";
import { translateTexts } from "../hooks/useAITranslation";

const API_URL = import.meta.env.VITE_API_URL;
export default function NutritionAnalyzerPage() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
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
  const [warning, setWarning] = useState("");
  const [activeTab, setActiveTab] = useState("input");

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

  const handleSuggestionClick = async (name) => {
    setFoodName(name);
    setSuggestions([]);
    setError("");
    setWarning("");
    setLoading(true);

    try {
      const lookupRes = await fetch(
        `${API_URL}/api/ai/lookup?name=${encodeURIComponent(name)}`,
        { credentials: "include" }
      );
      const lookupData = await lookupRes.json();

      if (lookupData.found && lookupData.item) {
        const item = lookupData.item;
        const tips = item.healthTips ? [item.healthTips] : [];
        const translatedTips = await translateTips(tips);
        setResult({
          food_name: item.name,
          nutrition: item,
          alternatives: item.alternative
            ? [{ title: item.alternative, description: item.altDescription }]
            : [],
          tips: translatedTips,
        });
        setActiveTab("result");
      } else {
        setError("Could not load nutrition for this food.");
        setActiveTab("result");
      }
    } catch {
      setError(t("analyzer.errorGeneral"));
    } finally {
      setLoading(false);
    }
  };

  const translateTips = async (tips) => {
    if (i18n.language === "en" || !tips?.length) return tips;
    const texts = {};
    tips.forEach((tip, i) => { texts[`tip_${i}`] = tip; });
    const translated = await translateTexts(texts, i18n.language);
    return tips.map((_, i) => translated[`tip_${i}`] || tips[i]);
  };

  // ─────────────────────────────────────────────────────────────
  // CNN-primary image detection with GPT fallback
  // 1. Try CNN /predict (fast, local model, 7 Sarawakian classes)
  // 2. If CNN returns no confident prediction → fall back to GPT
  // 3. Either way, nutrition always comes from DB — never AI
  // ─────────────────────────────────────────────────────────────
  const tryCNN = async (file, base64, csrfToken) => {
    try {
      // Proxy through backend to avoid CSP — reuses base64 already computed
      const res = await fetch(`${API_URL}/api/ai/cnn-predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
        credentials: "include",
        body: JSON.stringify({ imageBase64: base64 }),
      });

      if (!res.ok) return null;
      const data = await res.json();

      // pred_class is null when confidence < 0.60 (unsupported dish)
      if (!data.pred_class) return null;

      return data.pred_class;
    } catch (err) {
      // CNN proxy unreachable — silently fall through to GPT
      console.warn("CNN unavailable, falling back to GPT:", err.message);
      return null;
    }
  };

  const tryGPT = async (base64, ingredients, csrfToken) => {
    const res = await fetch(`${API_URL}/api/ai/gpt/nutrition`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
      credentials: "include",
      body: JSON.stringify({ imageBase64: base64, ingredients }),
    });
    return res.json();
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (requireLogin()) return;
    setLoading(true);
    setError("");
    setResult(null);
    setSuggestions([]);
    setWarning("");

    try {
      // ── IMAGE PATH ──────────────────────────────────────────
      if (selectedFile) {

        // Step 1: try CNN first
        const cnnName = await tryCNN(selectedFile, base64, csrfToken);

        if (cnnName) {
          // CNN confident — look up nutrition from DB
          const lookupRes = await fetch(
            `${API_URL}/api/ai/lookup?name=${encodeURIComponent(cnnName)}`,
            { credentials: "include" }
          );
          const lookupData = await lookupRes.json();

          if (lookupData.found && lookupData.item) {
            const item = lookupData.item;
            const tips = item.healthTips ? [item.healthTips] : [];
            const translatedTips = await translateTips(tips);
            setResult({
              food_name: item.name,
              nutrition: item,
              alternatives: item.alternative
                ? [{ title: item.alternative, description: item.altDescription }]
                : [],
              tips: translatedTips,
              detectedBy: "cnn",
            });
            return;
          }
          // CNN named it but DB has no record — fall through to GPT
        }

        // Step 2: GPT fallback (open-set, handles dishes outside 7 CNN classes)
        const data = await tryGPT(base64, ingredients, csrfToken);

        if (data.ok && data.data) {
          if (data.data.confidence_level === "low") {
            setWarning(data.warning ? t("analyzer.confidenceWarning") : "");
          } else {
            setWarning("");
          }

          const lookupRes = await fetch(
            `${API_URL}/api/ai/lookup?name=${encodeURIComponent(data.data.food_name)}`,
            { credentials: "include" }
          );
          const lookupData = await lookupRes.json();

          if (lookupData.found && lookupData.item) {
            const item = lookupData.item;
            const tips = item.healthTips ? [item.healthTips] : [];
            const translatedTips = await translateTips(tips);
            setResult({
              food_name: item.name,
              nutrition: item,
              tips: translatedTips,
              detectedBy: "gpt",
            });
            return;
          }

          setResult({ food_name: data.data.food_name, nutrition: null, alternatives: [], tips: [] });
          return;
        }

        if (data.suggest) { setSuggestions([data.suggested_name]); return; }
        setError(data.error || t("analyzer.errorFetch"));
        return;
      }

      // ── TEXT PATH (unchanged) ───────────────────────────────
      const dbRes = await fetch(`${API_URL}/api/ai/lookup?name=${encodeURIComponent(foodName)}`, {
        credentials: "include",
      });
      const dbData = await dbRes.json();

      if (dbData.found && dbData.item) {
        const tips = dbData.item.healthTips ? [dbData.item.healthTips] : [];
        const translatedTips = await translateTips(tips);
        setResult({
          food_name: dbData.item.name,
          nutrition: dbData.item,
          alternatives: dbData.item.alternative ? [{ title: dbData.item.alternative, description: dbData.item.altDescription }] : [],
          tips: translatedTips,
        });
        return;
      }
      if (dbData.suggestions?.length) { setSuggestions(dbData.suggestions); return; }

      const aiRes = await fetch(`${API_URL}/api/ai/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
        credentials: "include",
        body: JSON.stringify({ food_name: foodName, ingredients }),
      });
      const aiData = await aiRes.json();
      if (aiData.found && aiData.item) {
        const tips = aiData.item.healthTips ? [aiData.item.healthTips] : [];
        const translatedTips = await translateTips(tips);
        setResult({
          food_name: aiData.item.name,
          nutrition: aiData.item,
          alternatives: aiData.item.alternative ? [{ title: aiData.item.alternative, description: aiData.item.altDescription }] : [],
          tips: translatedTips,
        });
        return;
      }
      if (aiData.suggestions?.length) { setSuggestions(aiData.suggestions); return; }
      setResult({ food_name: null, nutrition: null, alternatives: [], tips: [], notFound: true, searchedName: foodName });

    } catch {
      setError(t("analyzer.errorGeneral"));
    } finally {
      setLoading(false);
      setActiveTab("result");
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
        <div className="analyzer-tabs">
          <button
            className={`analyzer-tab ${activeTab === "input" ? "active" : ""}`}
            onClick={() => setActiveTab("input")}
          >
            {t("analyzer.tabInput") || "Input"}
          </button>
          <button
            className={`analyzer-tab ${activeTab === "result" ? "active" : ""}`}
            onClick={() => setActiveTab("result")}
          >
            {t("analyzer.tabResults") || "Results"}
            {(result || error || suggestions.length > 0) && <span className="tab-dot" />}
          </button>
        </div>

        <div className="left-column" data-tab={activeTab === "input" ? "active" : "inactive"}>
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
              <p className="input-helper-text">{t("analyzer.dbScopeHint")}</p>
            </div>

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

        <div
          className={`result-card ${result ? "has-result" : "empty"}`}
          data-tab={activeTab === "result" ? "active" : "inactive"}
        >
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

          {result?.notFound && (
            <div className="no-match-card">
              <p className="no-match-title">⚠ {t("analyzer.noMatchTitle")}</p>
              <p className="no-match-body">{t("analyzer.noMatchBody")}</p>
            </div>
          )}

          {result && !result.notFound && (
            <>
              {warning && (
                <div className="confidence-warning">⚠️ {warning}</div>
              )}
              <div className="nap-results">
                <div className="analysis-container">
                  <h2 className="analysis-title">{result.food_name}</h2>

                  {result.nutrition && (
                    <div className="nutrition-section">
                      <h3 className="section-header">{t("analyzer.nutritionPerPortion")}</h3>
                      <div className="nutrition-content">
                        <div className="nutrition-grid">
                          {nutritionRows.map(([label, val, unit], i) => (
                            <div className="nutri-card" key={i}>
                              <span className="nutri-value">{val ?? "—"} {val != null ? unit : ""}</span>
                              <span className="nutri-label">{label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

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
            </>
          )}
        </div>
      </div>

      <Footer />
      <LoginPromptModal show={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}