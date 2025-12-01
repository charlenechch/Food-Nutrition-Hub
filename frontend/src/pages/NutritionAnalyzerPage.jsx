import React, { useEffect, useMemo, useState } from "react";
import "../css/NutritionAnalyzer.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { FaWandMagicSparkles, FaCamera } from "react-icons/fa6";
import { IoCameraOutline } from "react-icons/io5";
import { LuSparkles } from "react-icons/lu";
import { useAuth } from "../context/AuthContext";
import LoginPromptModal from "../components/LoginPromptModal";

const API_URL = import.meta.env.VITE_API_URL;

export default function NutritionAnalyzerPage() {
  const { user } = useAuth();
  const isGuest = !user || user?.role === "guest";

  const [foodName, setFoodName] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);

  // ---------- LOGIN BLOCK ---------
  const requireLogin = (msg) => {
    if (isGuest) {
      setShowModal(true);
      return true;
    }
    return false;
  };

  // CSRF
  const [csrfToken, setCsrfToken] = useState("");

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const res = await fetch(`${API_URL}/api/csrf-token`, {
          credentials: "include",
        });
        const data = await res.json();
        setCsrfToken(data.csrfToken);
      } catch (e) {
        console.error("CSRF fetch failed");
      }
    };
    fetchToken();
  }, []);

  // ---- Debounced food suggestions ----
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
          `${API_URL}/api/ai/lookup?name=${encodeURIComponent(
            debouncedName
          )}`,
          { credentials: "include" }
        );
        const data = await r.json();

        if (data.found && data.item) {
          setSuggestions([]);
        } else {
          setSuggestions(
            Array.isArray(data.suggestions) ? data.suggestions : []
          );
        }
      } catch (e) {
        console.error(e);
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(t);
  }, [debouncedName]);

  // ----------------- DB SHAPING -----------------
  function shapeResultFromDB(row) {
    const altDescription = row.altDescription || "";

    const alternatives = row.alternative
      ? row.alternative
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .map((name) => ({
            title: name,
            description: altDescription,
          }))
      : [];

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
      alternatives,
      meta: {
        origin: row.origin,
        category: row.category,
        foodType: row.foodType,
        difficulty: row.difficulty,
        image: row.image,
      },
    };
  }

  // ----------------- GPT ANALYSIS -----------------
  const analyzeWithGPT = async (file) => {
    const toBase64 = (file) =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

    const base64 = await toBase64(file);

    const r = await fetch(`${API_URL}/api/ai/gpt/nutrition`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ imageBase64: base64 }),
    });

    const data = await r.json();
    if (!data.ok) throw new Error("GPT failed");

    return data.data;
  };

  // ----------------- EVENTS -----------------
  const handleSuggestionClick = async (name) => {
    setFoodName(name);
    setSelectedFile(null);
    setLoading(true);
    setError("");

    try {
      const r = await fetch(
        `${API_URL}/api/ai/lookup?name=${encodeURIComponent(name)}`,
        { credentials: "include" }
      );
      const data = await r.json();

      if (data.found && data.item) {
        setResult(shapeResultFromDB(data.item));
        setSuggestions([]);
      }
    } catch {
      setError("Failed to fetch item.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (requireLogin("upload image")) return;
    const f = e.target.files?.[0];
    if (f) {
      setSelectedFile(f);
      setResult(null);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setResult(null);
  };

  // ----------------- ANALYZE -----------------
  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (requireLogin("analyze")) return;

    setError("");
    setResult(null);
    setLoading(true);

    try {
      // IMAGE → GPT
      if (selectedFile) {
        const gpt = await analyzeWithGPT(selectedFile);

        const normalisedAlts = (gpt.alternatives || []).map((alt) => ({
          title: alt.title || alt.name || "",
          description: alt.description || alt.details || alt.note || "",
        }));

        setResult({
          source: "gpt",
          food_name: gpt.food,
          confidence: gpt.confidence,
          nutrition: {
            Energy_kcal: gpt.calories_kcal,
            Protein_g: gpt.macros?.protein_g,
            Fat_g: gpt.macros?.fat_g,
            Carbohydrates_g: gpt.macros?.carbs_g,
            Fiber_g: gpt.fiber_g,
            VitaminC_mg: gpt.vitaminC_mg,
          },
          tips: gpt.health_notes ? [gpt.health_notes] : [],
          alternatives: normalisedAlts,
          meta: {
            category: gpt.category,
            commonIngredients: gpt.ingredients || [],
            portion: gpt.portion_size,
            imageUsed: true,
          },
        });

        return;
      }

      // TEXT MODE
      const r = await fetch(`${API_URL}/api/ai/analyze`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({
          food_name: foodName,
          ingredients,
        }),
      });

      const data = await r.json();

      if (data.found && data.item) {
        setResult(shapeResultFromDB(data.item));
      } else {
        setError(data.message || "No result.");
      }
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // ===========================================================
  // UI RENDER
  // ===========================================================
  return (
    <div className="nutrition-page">
      <Header />

      <h1 className="page-title">AI Nutrition Analyzer</h1>
      <p className="page-subtitle">
        Get instant nutrition analysis and healthier alternatives
      </p>

      <div className="analyzer-container">
        {/* LEFT PANEL */}
        <div className="left-column">
          <form className="food-form" onSubmit={handleAnalyze}>
            <div className="food-input-card">
              <h3 className="section-title">
                <LuSparkles /> Enter Food Information
              </h3>

              <label>Food Name</label>
              <input
                type="text"
                value={foodName}
                placeholder="e.g., Laksa, Manok Pansoh, Umai..."
                onChange={(e) => {
                  if (!requireLogin()) setFoodName(e.target.value);
                }}
              />

              <label>Ingredients</label>
              <textarea
                value={ingredients}
                placeholder="List ingredients (optional)…"
                onChange={(e) => {
                  if (!requireLogin()) setIngredients(e.target.value);
                }}
              />
            </div>

            {/* UPLOAD */}
            <div className="upload-card">
              <h3 className="section-title">
                <IoCameraOutline /> Or Upload Food Photo
              </h3>
              <p>Take a photo or upload an image for AI analysis</p>

              <div className="upload-box-wrapper">
                <div
                  className="upload-box"
                  onClick={() =>
                    !requireLogin() &&
                    document.getElementById("fileInput").click()
                  }
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

                {selectedFile && (
                  <button
                    type="button"
                    className="file-remove-btn"
                    onClick={handleRemoveFile}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="analyze-btn"
              disabled={loading}
            >
              <FaWandMagicSparkles size={18} />
              {loading ? " Analyzing…" : " Analyze Nutrition"}
            </button>
          </form>
        </div>

        {/* RIGHT PANEL */}
        <div className={`result-card ${result ? "has-result" : "empty"}`}>
          {/* Suggestions */}
          {suggestions.length > 0 && (
            <>
              <p style={{ marginBottom: 8 }}>Did you mean:</p>
              <div className="suggestion-chips">
                {suggestions.map((name) => (
                  <button key={name} onClick={() => handleSuggestionClick(name)}>
                    {name}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Errors */}
          {error && <div className="error-text">{error}</div>}

          {!result && !error && !loading && (
            <p>Enter a food name or upload an image to get started.</p>
          )}

          {/* RESULT */}
          {result && (
            <div className="nap-results">
              {/* Main analysis */}
              <div className="analysis-container">
                <h2 className="analysis-title">{result.food_name}</h2>

                {/* NUTRITION GRID */}
                {result.nutrition && (
                  <div className="nutrition-section">
                    <h3 className="section-header">Nutrition (per portion)</h3>

                    <div className="nutrition-grid">
                      {[
                        ["Calories", result.nutrition.Energy_kcal, "kcal"],
                        ["Protein", result.nutrition.Protein_g, "g"],
                        ["Fat", result.nutrition.Fat_g, "g"],
                        ["Carbs", result.nutrition.Carbohydrates_g, "g"],
                        ["Fiber", result.nutrition.Fiber_g, "g"],
                        ["Vitamin C", result.nutrition.VitaminC_mg, "mg"],
                      ].map(([label, val, unit], i) => (
                        <div className="nutri-card" key={i}>
                          <span className="nutri-value">
                            {val ?? "—"} {val != null ? unit : ""}
                          </span>
                          <span className="nutri-label">{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* HEALTHIER ALTERNATIVES */}
              {!!result.alternatives?.length && (
                <div className="analysis-container">
                  <div className="alternatives-section">
                    <h3 className="section-header">Healthier Alternatives</h3>

                    {result.alternatives.map((alt, i) => (
                      <div className="alternative-card" key={i}>
                        <div className="alt-main">{alt.title}</div>
                        {alt.description && (
                          <div className="alt-desc">{alt.description}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* HEALTH TIPS */}
              {!!result.tips?.length && (
                <div className="analysis-container">
                  <div className="tips-section">
                    <h3 className="section-header">Health Tips</h3>

                    {result.tips.map((tip, i) => (
                      <div className="tip-card tip-info" key={i}>
                        {tip}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Footer />
      <LoginPromptModal
        show={showModal}
        onClose={() => setShowModal(false)}
      />
    </div>
  );
}
