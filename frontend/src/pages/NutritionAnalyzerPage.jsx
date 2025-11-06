import React, { useState } from "react";
import "../css/NutritionAnalyzer.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { FaWandMagicSparkles, FaCamera } from "react-icons/fa6";
import { LuSparkles } from "react-icons/lu";
import { IoCameraOutline } from "react-icons/io5";
import { useAuth } from "../context/AuthContext";
import LoginPromptModal from "../components/LoginPromptModal";

export default function NutritionAnalyzerPage() {
  const { user } = useAuth();
  const AI_URL = import.meta.env.VITE_AI_API_URL;

  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Food input states (kept, but not used for API yet)
  const [foodName, setFoodName] = useState("");
  const [ingredients, setIngredients] = useState("");

  const isGuest = !user || user?.role === "guest";
  const requireLogin = (m = "Please log in or register to continue") => {
    console.log("🚫 Guest action blocked:", m);
    setShowModal(true);
  };

  const handleFileChange = (e) => {
    if (isGuest) {
      e.preventDefault();
      requireLogin("Guest tried to upload image");
      return;
    }
    const file = e.target.files?.[0];
    setSelectedFile(file || null);
    setResult(null);
    setErrorMsg("");
  };

  const handleGuestTyping = (e, field) => {
    if (isGuest) {
      e.preventDefault();
      requireLogin(`Guest tried typing in ${field}`);
      e.target.blur();
    }
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();

    if (isGuest) {
      requireLogin("Guest pressed Analyze Nutrition");
      return;
    }
    if (!selectedFile) {
      alert("Please upload an image first.");
      return;
    }
    if (!AI_URL) {
      alert("AI API URL is missing. Set VITE_AI_API_URL in your frontend .env");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");
      setResult(null);

      const form = new FormData();
      form.append("file", selectedFile);

      const res = await fetch(`${AI_URL}/predict`, {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `AI responded ${res.status}`);
      }

      const data = await res.json();
      // expected:
      // {
      //   food_name, confidence,
      //   nutrition: { calories, protein_g, fat_g, carbs_g, fiber_g, vitaminC_mg, portion_note },
      //   alternatives: [{ name, calories, note }],
      //   tips: ["..."],
      //   extra: {...}
      // }
      setResult(data);
    } catch (err) {
      console.error(err);
      setErrorMsg(String(err.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="nutrition-page">
      <Header />

      <h1 className="page-title">AI Nutrition Analyzer</h1>
      <p className="page-subtitle">Get instant nutrition analysis and healthier alternatives</p>

      {/* ============================== MAIN SECTION ============================== */}
      <div className="analyzer-container">
        {/* LEFT COLUMN */}
        <div className="left-column">
          <form className="food-form" onSubmit={handleAnalyze}>
            {/* === Food Info Card (kept for future) === */}
            <div className="food-input-card">
              <h3 className="section-title">
                <LuSparkles /> Enter Food Information
              </h3>

              <label htmlFor="food-name">Food Name</label>
              <input
                id="food-name"
                type="text"
                placeholder="e.g., Manok Pansoh, Umai, Sarawak Laksa..."
                value={foodName}
                onChange={(e) => !isGuest && setFoodName(e.target.value)}
                onFocus={(e) => handleGuestTyping(e, "food name input")}
              />

              <label htmlFor="ingredients">Ingredients</label>
              <textarea
                id="ingredients"
                placeholder="List ingredients (optional)..."
                value={ingredients}
                onChange={(e) => !isGuest && setIngredients(e.target.value)}
                onFocus={(e) => handleGuestTyping(e, "ingredients input")}
              />
            </div>

            {/* === Upload Card === */}
            <div className="upload-card">
              <h3 className="section-title">
                <IoCameraOutline /> Or Upload Food Photo
              </h3>
              <p>Take a photo or upload an image for AI analysis</p>

              <div
                className="upload-box"
                onClick={(e) => {
                  if (isGuest) {
                    e.preventDefault();
                    requireLogin("Guest clicked upload box");
                    return;
                  }
                  document.getElementById("fileInput").click();
                }}
                style={{ cursor: "pointer" }}
              >
                <FaCamera size={28} />
                <p>{selectedFile ? `Selected: ${selectedFile.name}` : "Drag and drop an image or click to upload"}</p>

                <input
                  id="fileInput"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
              </div>
            </div>

            {/* === Analyze Button === */}
            <button
              type="submit"
              className="analyze-btn"
              disabled={!selectedFile || loading}
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
              {loading ? "Analyzing..." : (<><FaWandMagicSparkles size={18} /> Analyze Nutrition</>)}
            </button>

            {errorMsg && <div className="notice error" style={{ marginTop: 10 }}>{errorMsg}</div>}
          </form>
        </div>

        {/* RIGHT COLUMN */}
        <div className="result-card">
          {!result && !selectedFile && (
            <>
              <FaWandMagicSparkles size={40} className="result-icon" />
              <p>Enter food information or upload a photo to get started</p>
            </>
          )}

          {!result && selectedFile && (
            <>
              <FaWandMagicSparkles size={40} className="result-icon" />
              <p>Uploaded: {selectedFile.name}</p>
            </>
          )}

          {result && (
            <div className="result-section">
              {/* Title + Accuracy */}
              <div className="result-header">
                <h3 className="result-title">{result.food_name}</h3>
                <div className="accuracy-text">
                  Accuracy: {Math.round((result.confidence ?? 0) * 100)}%
                </div>
                {result.nutrition?.portion_note && (
                  <div className="portion-note">{result.nutrition.portion_note}</div>
                )}
              </div>

              {/* Nutrition table (full labels) */}
              <div className="result-block">
                <h4 className="block-title">Nutrition</h4>
                {result.nutrition ? (
                  <table className="nutrition-table">
                    <tbody>
                      <tr><td>Calories</td><td>{safeVal(result.nutrition.calories, "kcal")}</td></tr>
                      <tr><td>Protein</td><td>{safeVal(result.nutrition.protein_g, "g")}</td></tr>
                      <tr><td>Fat</td><td>{safeVal(result.nutrition.fat_g, "g")}</td></tr>
                      <tr><td>Carbohydrates</td><td>{safeVal(result.nutrition.carbs_g, "g")}</td></tr>
                      <tr><td>Fiber</td><td>{safeVal(result.nutrition.fiber_g, "g")}</td></tr>
                      <tr><td>Vitamin C</td><td>{safeVal(result.nutrition.vitaminC_mg, "mg")}</td></tr>
                    </tbody>
                  </table>
                ) : (
                  <div className="muted">No nutrition data found for this dish.</div>
                )}
              </div>

              {/* Alternatives */}
              <div className="result-block">
                <h4 className="block-title">Healthier Alternatives</h4>
                {(result.alternatives?.length ? result.alternatives : []).map((a, i) => (
                  <div key={i} className="alt-row">
                    <div>
                      <div className="alt-name">{a?.name || "Alternative"}</div>
                      {a?.note && <div className="alt-note">{a.note}</div>}
                    </div>
                    {a?.calories != null && <span className="pill">{a.calories} calories</span>}
                  </div>
                ))}
                {!result.alternatives?.length && <div className="muted">No alternatives available.</div>}
              </div>

              {/* Tips */}
              <div className="result-block">
                <h4 className="block-title">Health Tips</h4>
                {(result.tips?.length ? result.tips : []).map((t, i) => (
                  <div key={i} className={`tip ${i === 0 ? "tip-warn" : ""}`}>{t}</div>
                ))}
                {!result.tips?.length && <div className="muted">No tips available.</div>}
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />

      {/* Login Modal */}
      <LoginPromptModal
        show={showModal}
        onClose={() => setShowModal(false)}
      />
    </div>
  );
}

/* helpers */
function safeVal(v, unit = "") {
  if (v == null || v === "") return "-";
  const num = Number(v);
  if (Number.isNaN(num)) return String(v);
  const r = Math.round(num * 100) / 100;
  return unit ? `${r} ${unit}` : `${r}`;
}
