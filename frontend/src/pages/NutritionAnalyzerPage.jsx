import React from "react";
import "../css/NutritionAnalyzer.css";
import Header from "../components/Header";
import { FaWandMagicSparkles, FaCamera } from "react-icons/fa6";

export default function NutritionAnalyzer() {
  return (
    <div className="nutrition-page">
      <Header />
      {/* Title */}
      <h1 className="page-title">AI Nutrition Analyzer</h1>
      <p className="page-subtitle">
        Get instant nutrition analysis and healthier alternatives
      </p>

      <div className="analyzer-container">
        {/* Left Column */}
        <div className="food-input-card">
          <h3 className="section-title">Enter Food Information</h3>

          <label>Food Name</label>
          <input
            type="text"
            placeholder="e.g., Manok Pansoh, Umai, fried rice..."
          />

          <label>Ingredients</label>
          <textarea placeholder="List ingredients (optional)..."></textarea>

          <div className="upload-section">
            <h3 className="section-title">Or Upload Food Photo</h3>
            <p>Take a photo or upload an image for AI analysis</p>

            <div className="upload-box">
              <FaCamera size={28} />
              <p>Drag and drop an image or click to upload</p>
              <input type="file" accept="image/*" />
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="result-card">
          <FaWandMagicSparkles size={40} className="result-icon" />
          <p>Enter food information or upload a photo to get started</p>
        </div>
      </div>
    </div>
  );
}
