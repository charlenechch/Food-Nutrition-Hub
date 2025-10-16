import React, { useState } from "react";
import "../css/NutritionAnalyzer.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { FaWandMagicSparkles, FaCamera } from "react-icons/fa6";
import { LuSparkles } from "react-icons/lu";
import { IoCameraOutline } from "react-icons/io5";
import { useAuth } from "../context/AuthContext";
import LoginPromptModal from "../components/LoginPromptModal"; // ✅ modal component

export default function NutritionAnalyzerPage() {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState(null);
  const [analysisResult, setAnalysisResult] = useState("");
  const [showModal, setShowModal] = useState(false);

  // ✅ Food input states
  const [foodName, setFoodName] = useState("");
  const [ingredients, setIngredients] = useState("");

  // ✅ Detect guest
  const isGuest = !user || user?.role === "guest";

  // ✅ Popup helper
  const requireLogin = (message = "Please log in or register to continue") => {
    console.log("🚫 Guest action blocked:", message);
    setShowModal(true);
  };

  // ✅ Handle file upload
  const handleFileChange = (e) => {
    if (isGuest) {
      e.preventDefault();
      requireLogin("Guest tried to upload image");
      return;
    }

    const file = e.target.files[0];
    if (file) setSelectedFile(file);
  };

  // ✅ Handle Analyze Button
  const handleAnalyze = (e) => {
    e.preventDefault();

    if (isGuest) {
      requireLogin("Guest pressed Analyze Nutrition");
      return;
    }

    if (!selectedFile && !foodName.trim() && !ingredients.trim()) {
      alert("Please enter food info or upload an image first!");
      return;
    }

    setAnalysisResult(
      `✅ Analysis Complete!\nCalories: 300 kcal\nProtein: 20g\nFat: 10g\nCarbs: 40g`
    );
  };

  // ✅ Handle typing (if guest, block and show modal)
  const handleGuestTyping = (e, field) => {
    if (isGuest) {
      e.preventDefault();
      requireLogin(`Guest tried typing in ${field}`);
      e.target.blur(); // remove focus so they can’t keep typing
      return;
    }
  };

  return (
    <div className="nutrition-page">
      <Header />

      <h1 className="page-title">AI Nutrition Analyzer</h1>
      <p className="page-subtitle">
        Get instant nutrition analysis and healthier alternatives
      </p>

      {/* ============================== MAIN SECTION ============================== */}
      <div className="analyzer-container">
        {/* LEFT COLUMN */}
        <div className="left-column">
          <form className="food-form" onSubmit={handleAnalyze}>
            {/* === Food Info Card === */}
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
                onChange={(e) => {
                  if (!isGuest) setFoodName(e.target.value);
                }}
                onFocus={(e) => handleGuestTyping(e, "food name input")}
              />

              <label htmlFor="ingredients">Ingredients</label>
              <textarea
                id="ingredients"
                placeholder="List ingredients (optional)..."
                value={ingredients}
                onChange={(e) => {
                  if (!isGuest) setIngredients(e.target.value);
                }}
                onFocus={(e) => handleGuestTyping(e, "ingredients input")}
              ></textarea>
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
                style={{
                  cursor: "pointer",
                }}
              >
                <FaCamera size={28} />
                <p>Drag and drop an image or click to upload</p>

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
              style={{
                backgroundColor: "#b8926a",
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                padding: "10px 18px",
                fontWeight: "500",
                cursor: "pointer",
                marginTop: "10px",
              }}
            >
              <FaWandMagicSparkles size={18} /> Analyze Nutrition
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN */}
        <div className="result-card">
          <FaWandMagicSparkles size={40} className="result-icon" />
          <p>
            {analysisResult
              ? analysisResult
              : selectedFile
              ? `Uploaded: ${selectedFile.name}`
              : "Enter food information or upload a photo to get started"}
          </p>
        </div>
      </div>

      <Footer />

      {/* === Login Modal === */}
      <LoginPromptModal
        show={showModal}
        onClose={() => {
          console.log("❌ Closing modal...");
          setShowModal(false);
        }}
      />
    </div>
  );
}
