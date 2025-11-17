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
          // auto-fill immediate preview on the right
          setResult(shapeResultFromDB(data.item));
          setSuggestions([]);
        } else {
          setResult(null);
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
        if (foodName) fd.append("food_name", foodName);
        if (ingredients) fd.append("ingredients", ingredients);

        const r = await fetch(`${AI_URL}/predict`, {
          method: "POST",
          body: fd,
        });

        const data = await r.json();

        if (!data.pred_class && !data.nutrition) {
          setError("The AI couldn’t confidently recognize this food. Try a clearer photo or another angle.");
          setResult(null);
          return;
          }

        // shape into UI model
        const shaped = {
          source: "ai",
          food_name: data.pred_class, 

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
            ? data.alternative.split(",").map((x) => x.trim())
            : [],

          altDescription: data.altDescription || "",

           meta: {
            origin: data.origin,
            category: data.category,
            foodType: data.foodType,
            difficulty: data.difficulty,
            image: data.image,                   
            commonIngredients: data.commonIngredients,
          }
        };

        setResult(shaped);
         return;
      }


      // 2) Else (no file) -> ask backend to return DB row or synthesize
      const r2 = await fetch(`${API_URL}/api/ai/analyze`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
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
              <h3 className="section-title"><IoCameraOutline/> Or Upload Food Photo</h3>
              <p>Take a photo or upload an image for AI analysis</p>

              <div
                className="upload-box"
                onClick={() => {
                  if (requireLogin("open file picker")) return;
                  document.getElementById("fileInput").click();
                }}
                style={{ cursor: "pointer" }}
              >
                <FaCamera size={28} />
                <p>
                  {selectedFile ? selectedFile.name : "Drag & drop an image or click to upload"}
                </p>
                <input
                  id="fileInput"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
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
        <div className="result-card">
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
            <div>
              <h3 style={{ marginTop: 0 }}>{result.food_name}</h3>
              {result.meta?.origin && (
                <p style={{ opacity: 0.8, marginTop: -6 }}>
                  {result.meta.origin} · {result.meta.foodType} · {result.meta.difficulty}
                </p>
              )}

              {result.nutrition && (
                <div style={{ marginTop: 10 }}>
                  <strong>Nutrition (per portion)</strong>
                  <ul style={{ margin: "6px 0 0 18px" }}>
                    <li>Energy: {result.nutrition.Energy_kcal ?? "—"} kcal</li>
                    <li>Protein: {result.nutrition.Protein_g ?? "—"} g</li>
                    <li>Fat: {result.nutrition.Fat_g ?? "—"} g</li>
                    <li>Carbs: {result.nutrition.Carbohydrates_g ?? "—"} g</li>
                    <li>Fiber: {result.nutrition.Fiber_g ?? "—"} g</li>
                    <li>Vitamin C: {result.nutrition.VitaminC_mg ?? "—"} mg</li>
                  </ul>
                </div>
              )}

              {!!(result.alternatives?.length) && (
                <div style={{ marginTop: 14 }}>
                  <strong>Healthier alternatives</strong>
                  <ul style={{ margin: "6px 0 0 18px" }}>
                    {result.alternatives.map((a, i) => <li key={i}>{a}</li>)}
                  </ul>
                  {result.altDescription && (
                    <p style={{ marginTop: 6, opacity: 0.9 }}>{result.altDescription}</p>
                  )}
                </div>
              )}

              {!!(result.tips?.length) && (
                <div style={{ marginTop: 14 }}>
                  <strong>Tips</strong>
                  <ul style={{ margin: "6px 0 0 18px" }}>
                    {result.tips.map((t, i) => <li key={i}>{t}</li>)}
                  </ul>
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
