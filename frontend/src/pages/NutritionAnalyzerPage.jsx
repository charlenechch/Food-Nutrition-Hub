import React, { useEffect, useMemo, useState } from "react";
import "../css/NutritionAnalyzer.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { FaWandMagicSparkles, FaCamera } from "react-icons/fa6";
import { IoCameraOutline } from "react-icons/io5";
import { LuSparkles } from "react-icons/lu";
import { useAuth } from "../context/AuthContext";
import LoginPromptModal from "../components/LoginPromptModal";

const API_URL = import.meta.env.VITE_API_URL;        // Node backend (Railway)
const AI_URL  = import.meta.env.VITE_AI_API_URL;     // FastAPI (Railway: ai-...up.railway.app)

export default function NutritionAnalyzerPage() {
  const { user } = useAuth();
  const isGuest = !user || user?.role === "guest";

  const [foodName, setFoodName] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);     // ["Kolo Mee", ...]
  const [result, setResult] = useState(null);             // object with nutrition, tips, alternatives
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);

  const requireLogin = (msg) => {
    if (isGuest) {
      console.log("Blocked:", msg);
      setShowModal(true);
      return true;
    }
    return false;
  };
//====================
  //CSRF
  //======================
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

  // ---- Debounced lookup to backend (DB) when typing food name ----
  const debouncedName = useMemo(() => foodName.trim(), [foodName]);
      useEffect(() => {
    if (!debouncedName) {
      setSuggestions([]);
      return;
    }

    const t = setTimeout(async () => {
      try {
        setError("");

        const r = await fetch(
          `${API_URL}/api/ai/lookup?name=${encodeURIComponent(debouncedName)}`,
          { credentials: "include" }
        );
        const data = await r.json();

        if (data.found && data.item) {
          // Only clear suggestions so it doesn’t list similar names
          setSuggestions([]);
        } else {
          // ✔ Show suggestions if fuzzy match found
          setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
        }

      } catch (e) {
        console.error(e);
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(t);
  }, [debouncedName]);


  // ---- Helpers ----
  function shapeResultFromDB(row) {
    return {
      source: "db",
      food_name: row.name,
      nutrition: {
        Energy_kcal: row.Energy_kcal,
        Protein_g: row.Protein_g,
        Fat_g: row.Fat_g,
        Carbohydrates_g: row.Carbohydrates_g,
        Fiber_g: row.Fiber_g,
        VitaminC_mg: row.VitaminC_mg,
      },
      tips: row.healthTips ? [row.healthTips] : [],
      alternatives: row.alternative
        ? row.alternative.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
      altDescription: row.altDescription || "",
      meta: {
        origin: row.origin,
        category: row.category,
        foodType: row.foodType,
        difficulty: row.difficulty,
        image: row.image,
        commonIngredients: row.commonIngredients,
        culturalSignificance: row.culturalSignificance,
        traditionalPreparation: row.traditionalPreparation,
        description: row.description,
      },
    };
  }

  const handleSuggestionClick = async (name) => {
    setFoodName(name);
    setSelectedFile(null);
    setLoading(true);
    setError("");
    try {
      const r = await fetch(`${API_URL}/api/ai/lookup?name=${encodeURIComponent(name)}`, {
        credentials: "include",
      });
      const data = await r.json();
      if (data.found && data.item) {
        setResult(shapeResultFromDB(data.item));
        setSuggestions([]);
      }
    } catch (e) {
      setError("Failed to fetch item.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (requireLogin("upload image")) return;
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setResult(null); // clear any DB preview to avoid confusion
    }
  };
  
  const handleRemoveFile = () => {
    setSelectedFile(null);   // remove the file
    setResult(null);         // clear any preview
  };


  // ---- Analyze button ----
  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (requireLogin("analyze")) return;

    setError("");
    setResult(null);
    setLoading(true);

    try {
      // 1) If file provided -> call FastAPI /predict (image route)
      if (selectedFile) {
        const fd = new FormData();
        fd.append("file", selectedFile);
        // you *can* send food_name if you want, but it's optional now
        if (foodName) fd.append("food_name", foodName);
        if (ingredients) fd.append("ingredients", ingredients);

        const r = await fetch(`${AI_URL}/predict`, {
          method: "POST",
          body: fd,
        });

        const data = await r.json();

        const shaped = {
          source: "ai",
          food_name:
            data.pred_class ||
            data.food_name ||
            foodName ||
            "Detected Food",

          confidence: data.confidence,

          nutrition: data.nutrition
            ? {
                Energy_kcal: data.nutrition.calories,
                Protein_g: data.nutrition.protein_g,
                Fat_g: data.nutrition.fat_g,
                Carbohydrates_g: data.nutrition.carbs_g,
                Fiber_g: data.nutrition.fiber_g,
                VitaminC_mg: data.nutrition.vitaminC_mg,
              }
            : null,

          tips: data.tips ? [data.tips] : [],

          alternatives: data.alternative
            ? data.alternative.split(",").map((s) => s.trim()).filter(Boolean)
            : [],

          altDescription: data.altDescription || "",

          meta: {
            origin: data.origin,
            category: data.category,
            foodType: data.foodType,
            difficulty: data.difficulty,
            image: data.image,
            commonIngredients: data.commonIngredients,
            portion: "1 serving",
            imageUsed: true,
          },
        };

        setResult(shaped);
        return;
      }

      // 2) Else (no file) -> ask backend to return DB row or synthesize
      const r2 = await fetch(`${API_URL}/api/ai/analyze`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken
         },
        body: JSON.stringify({
          food_name: foodName || "",
          ingredients: ingredients || "",
        }),
      });
      const data2 = await r2.json();
      if (data2.found && data2.item) {
        setResult(shapeResultFromDB(data2.item));
      } else if (data2.message) {
        setError(data2.message);
      } else {
        setError("No result.");
      }
    } catch (e) {
      console.error(e);
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // ---- UI ----
  return (
    <div className="nutrition-page">
      <Header />

      <h1 className="page-title">AI Nutrition Analyzer</h1>
      <p className="page-subtitle">Get instant nutrition analysis and healthier alternatives</p>

      <div className="analyzer-container">
        {/* LEFT */}
        <div className="left-column">
          <form className="food-form" onSubmit={handleAnalyze}>
            {/* Food Info */}
            <div className="food-input-card">
              <h3 className="section-title"><LuSparkles/> Enter Food Information</h3>

              <label htmlFor="food-name">Food Name</label>
              <input
                id="food-name"
                type="text"
                placeholder="e.g., Laksa, Manok Pansoh, Umai..."
                value={foodName}
                onChange={(e) => {
                  if (requireLogin("typing in food name")) return;
                   setFoodName(e.target.value);
                }}
              />

              <label htmlFor="ingredients">Ingredients</label>
              <textarea
                id="ingredients"
                placeholder="List ingredients (optional)…"
                value={ingredients}
                onChange={(e) => {
                  if (requireLogin("typing in ingredients")) return;
                  setIngredients(e.target.value);
                }}
              />
            </div>

              {/* Upload */}
            <div className="upload-card">
              <h3 className="section-title">
                <IoCameraOutline /> Or Upload Food Photo
              </h3>
              <p>Take a photo or upload an image for AI analysis</p>

              {/* Wrapper allows button to attach to dashed box */}
              <div className="upload-box-wrapper">
                <div
                  className="upload-box"
                  onClick={() => {
                    if (requireLogin("open file picker")) return;
                    document.getElementById("fileInput").click();
                  }}
                >
                  <FaCamera size={28} />
                  <p>
                    {selectedFile
                      ? selectedFile.name
                      : "Drag & drop an image or click to upload"}
                  </p>

                  <input
                    id="fileInput"
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                  />
                </div>

                {/* Remove button ATTACHED TO BOX */}
                {selectedFile && (
                  <button type="button" className="file-remove-btn" onClick={handleRemoveFile}>
                    ✕
                  </button>
                )}
              </div>

            </div>

            {/* Analyze */}
            <button
              type="submit"
              className="analyze-btn"
              disabled={loading}
              style={{
                backgroundColor: "#b8926a",
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                padding: "10px 18px",
                fontWeight: "500",
                cursor: loading ? "not-allowed" : "pointer",
                marginTop: "10px",
              }}
            >
              <FaWandMagicSparkles size={18} />
              {loading ? " Analyzing…" : " Analyze Nutrition"}
            </button>
          </form>
        </div>

        {/* RIGHT: Suggestions + Results */}
        <div className={`result-card ${result ? "has-result" : "empty"}`}>
          {/* Suggestions (chips) */}
          {suggestions.length > 0 && (
            <>
              <p style={{ marginBottom: 8 }}>Did you mean:</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                {suggestions.map((name) => (
                  <button
                    type="button"
                    key={name}
                    onClick={() => handleSuggestionClick(name)}
                    style={{
                      border: "1px solid #d8c7b2",
                      background: "#f9f6f2",
                      padding: "6px 10px",
                      borderRadius: 12,
                      fontSize: 13,
                    }}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Errors */}
          {error && (
            <div style={{ color: "#b04d4d", marginBottom: 10 }}>
              {error}
            </div>
          )}

          {/* Result */}
          {!result && !error && !loading && (
            <p>Enter a food name or upload an image to get started.</p>
          )}

          {result && (
            <>
              {/* MAIN ANALYSIS CARD */}
              <div className="analysis-container">
                {/* Food Name */}
                <h2 className="analysis-title">{result.food_name}</h2>

                {/* Food Meta */}
                {(result.meta?.origin || result.meta?.foodType || result.meta?.difficulty) && (
                  <p className="analysis-meta">
                    {result.meta.origin && `${result.meta.origin} · `}
                    {result.meta.foodType && `${result.meta.foodType} · `}
                    {result.meta.difficulty && result.meta.difficulty}
                  </p>
                )}

                {/* IMAGE */}
                {result.meta?.image && (
                  <div className="analysis-image-wrapper">
                    <img
                      src={result.meta.image}
                      alt={result.food_name}
                      className="analysis-image"
                    />
                  </div>
                )}

                {/* Nutrition Section */}
                {result.nutrition && (
                  <div className="nutrition-section">
                    <h3 className="section-header">Nutrition (per portion)</h3>

                    <div className="nutrition-grid">
                      <div className="nutri-card">
                        <span className="nutri-value">
                          {result.nutrition.Energy_kcal ?? "—"} kcal
                        </span>
                        <span className="nutri-label">Calories</span>
                      </div>

                      <div className="nutri-card">
                        <span className="nutri-value">
                          {result.nutrition.Protein_g ?? "—"} g
                        </span>
                        <span className="nutri-label">Protein</span>
                      </div>

                      <div className="nutri-card">
                        <span className="nutri-value">
                          {result.nutrition.Fat_g ?? "—"} g
                        </span>
                        <span className="nutri-label">Fat</span>
                      </div>

                      <div className="nutri-card">
                        <span className="nutri-value">
                          {result.nutrition.Carbohydrates_g ?? "—"} g
                        </span>
                        <span className="nutri-label">Carbs</span>
                      </div>

                      <div className="nutri-card">
                        <span className="nutri-value">
                          {result.nutrition.Fiber_g ?? "—"} g
                        </span>
                        <span className="nutri-label">Fiber</span>
                      </div>

                      <div className="nutri-card">
                        <span className="nutri-value">
                          {result.nutrition.VitaminC_mg ?? "—"} mg
                        </span>
                        <span className="nutri-label">Vitamin C</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* HEALTHIER ALTERNATIVES CARD */}
              {!!result.alternatives?.length && (
                <div className="analysis-container">
                  <div className="alternatives-section">
                    <h3 className="section-header">Healthier Alternatives</h3>

                    {result.alternatives.map((alt, index) => (
                      <div className="alternative-card" key={index}>
                        <div className="alt-main">{alt}</div>
                        {result.altDescription && (
                          <div className="alt-desc">{result.altDescription}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* HEALTH TIPS CARD */}
              {!!result.tips?.length && (
                <div className="analysis-container">
                  <div className="tips-section">
                    <h3 className="section-header">Health Tips</h3>

                    {result.tips.map((tip, index) => (
                      <div
                        key={index}
                        className={`tip-card ${
                          tip.toLowerCase().includes("sodium") ? "tip-warning" : "tip-info"
                        }`}
                      >
                        {tip}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </div>

      <Footer />

      <LoginPromptModal show={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}
