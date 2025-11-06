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
  const [selectedFile, setSelectedFile] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [foodName, setFoodName] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [suggestions, setSuggestions] = useState(null);

  const isGuest = !user || user?.role === "guest";

  const AI_URL = import.meta.env.VITE_AI_API_URL;
  const API_URL = import.meta.env.VITE_API_URL;

  const requireLogin = () => setShowModal(true);

  const handleFileChange = (e) => {
    if (isGuest) {
      e.preventDefault();
      requireLogin();
      return;
    }
    const file = e.target.files[0];
    if (file) setSelectedFile(file);
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (isGuest) {
      requireLogin();
      return;
    }

    if (!selectedFile && !foodName.trim()) {
      alert("Enter food name or upload an image");
      return;
    }

    setLoading(true);
    setSuggestions(null);
    setAnalysisResult(null);

    try {
      if (selectedFile) {
        const formData = new FormData();
        formData.append("image", selectedFile);

        const res = await fetch(`${AI_URL}/analyze-image`, {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        setAnalysisResult(data);
      } else {
        const res = await fetch(
          `${API_URL}/api/food/search?name=${encodeURIComponent(foodName.trim())}`
        );
        const data = await res.json();

        if (!data.found && data.didYouMean) {
          setSuggestions(data.didYouMean);
        } else {
          setAnalysisResult(data);
        }
      }
    } catch {
      alert("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const chooseSuggestion = (item) => {
    setFoodName(item);
    setSuggestions(null);
  };

  return (
    <div className="nutrition-page">
      <Header />

      <h1 className="page-title">AI Nutrition Analyzer</h1>
      <p className="page-subtitle">Get instant nutrition analysis and healthier alternatives</p>

      <div className="analyzer-container">
        <div className="left-column">
          <form className="food-form" onSubmit={handleAnalyze}>
            <div className="food-input-card">
              <h3 className="section-title">
                <LuSparkles /> Enter Food Information
              </h3>

              <label>Food Name</label>
              <input
                type="text"
                placeholder="e.g., Laksa, Manok Pansoh, Umai..."
                value={foodName}
                onChange={(e) => !isGuest && setFoodName(e.target.value)}
                onClick={() => isGuest && requireLogin()}
              />

              <label>Ingredients</label>
              <textarea
                placeholder="List ingredients (optional)"
                value={ingredients}
                onChange={(e) => !isGuest && setIngredients(e.target.value)}
                onClick={() => isGuest && requireLogin()}
              ></textarea>
            </div>

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
                    requireLogin();
                    return;
                  }
                  document.getElementById("fileInput").click();
                }}
              >
                <FaCamera size={28} />
                <p>{selectedFile ? selectedFile.name : "Drag & drop or click to upload"}</p>
                <input
                  id="fileInput"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
              </div>
            </div>

            <button type="submit" className="analyze-btn">
              {loading ? "Analyzing..." : <><FaWandMagicSparkles /> Analyze Nutrition</>}
            </button>
          </form>
        </div>

        <div className="result-card">
          {!analysisResult && !suggestions && !loading && <p>Enter food or upload image to begin</p>}
          {loading && <p>⏳ Analyzing...</p>}

          {suggestions && (
            <div>
              <p>Did you mean:</p>
              {suggestions.map((s) => (
                <button key={s} onClick={() => chooseSuggestion(s)} className="suggestion-btn">
                  {s}
                </button>
              ))}
            </div>
          )}

          {analysisResult && (
            <div>
              <h2>{analysisResult.food_name}</h2>

              {analysisResult.nutrition && (
                <div className="nutrition-box">
                  <p><b>Calories:</b> {analysisResult.nutrition.calories} kcal</p>
                  <p><b>Protein:</b> {analysisResult.nutrition.protein_g} g</p>
                  <p><b>Fat:</b> {analysisResult.nutrition.fat_g} g</p>
                  <p><b>Carbs:</b> {analysisResult.nutrition.carbs_g} g</p>
                  <p><b>Fiber:</b> {analysisResult.nutrition.fiber_g} g</p>
                  <p><b>Vitamin C:</b> {analysisResult.nutrition.vitaminC_mg} mg</p>
                </div>
              )}

              {analysisResult.tips?.length > 0 && (
                <div className="tips-box">
                  <h3>Health Tips</h3>
                  {analysisResult.tips.map((t, idx) => (
                    <li key={idx}>{t}</li>
                  ))}
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
