import React, { useState } from "react";
import "../css/NutritionAnalyzer.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { FaWandMagicSparkles, FaCamera } from "react-icons/fa6";
import { LuSparkles } from "react-icons/lu";
import { IoCameraOutline } from "react-icons/io5";
import { useAuth } from "../context/AuthContext"; // ✅ use role from context

export default function NutritionAnalyzerPage() {
  const { user } = useAuth(); // role check
  const [selectedFile, setSelectedFile] = useState(null);
  const [analysisResult, setAnalysisResult] = useState("");

  const isGuest = user?.role === "guest"; // ✅ check guest status

  const handleFileChange = (e) => {
    if (isGuest) {
      alert("🚫 Guests cannot upload images. Please login or register.");
      return;
    }

    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleAnalyze = (e) => {
    e.preventDefault();

    if (isGuest) {
      alert("🚫 Guests cannot analyze food. Please login or register.");
      return;
    }

    if (!selectedFile) {
      alert("Please upload an image first.");
      return;
    }

    // Fake analysis result (replace this with actual API logic)
    setAnalysisResult(
      `✅ Analysis Complete!\nCalories: 300 kcal\nProtein: 20g\nFat: 10g\nCarbs: 40g`
    );
  };

  return (
    <div className="nutrition-page">
      <Header />

      <h1 className="page-title">AI Nutrition Analyzer</h1>
      <p className="page-subtitle">
        Get instant nutrition analysis and healthier alternatives
      </p>

      <div className="analyzer-container">
        {/* Left Column */}
        <div className="left-column">
          <form className="food-form" onSubmit={handleAnalyze}>
            {/* Food Info Card */}
            <div className="food-input-card">
              <h3 className="section-title">
                <LuSparkles /> Enter Food Information
              </h3>

              <label htmlFor="food-name">Food Name</label>
              <input
                id="food-name"
                type="text"
                placeholder="e.g., Manok Pansoh, Umai, Sarawak Laksa..."
              />

              <label htmlFor="ingredients">Ingredients</label>
              <textarea
                id="ingredients"
                placeholder="List ingredients (optional)..."
              ></textarea>
            </div>

            {/* Upload Card */}
            <div className="upload-card">
              <h3 className="section-title">
                <IoCameraOutline /> Or Upload Food Photo
              </h3>
              <p>Take a photo or upload an image for AI analysis</p>

              <div className="upload-box">
                <FaCamera size={28} />
                <p>Drag and drop an image or click to upload</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={isGuest}
                />
              </div>

              {isGuest && (
                <p className="guest-warning" style={{ color: "red", fontSize: "14px", marginTop: "10px" }}>
                  🚫 Guest users cannot upload images.
                </p>
              )}
            </div>

            {/* Analyze Button */}
            <button
              type="submit"
              className="analyze-btn"
              disabled={isGuest}
              style={isGuest ? { backgroundColor: "#ccc", cursor: "not-allowed" } : {}}
            >
              <FaWandMagicSparkles size={18} /> Analyze Nutrition
            </button>

            {isGuest && (
              <p className="guest-warning" style={{ color: "red", fontSize: "14px", marginTop: "8px" }}>
                🚫 Guest users cannot analyze food. Please login or register.
              </p>
            )}
          </form>
        </div>

        {/* Right Column */}
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
    </div>
  );
}
