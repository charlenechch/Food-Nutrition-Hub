import React from "react";
import "../css/NutritionAnalyzer.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { FaWandMagicSparkles, FaCamera } from "react-icons/fa6";
import { LuSparkles } from "react-icons/lu";
import { IoCameraOutline } from "react-icons/io5";

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
        <div className="left-column">
          <form className="food-form">
            {/* Food Information */}
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

            {/* Upload Section */}
            <div className="upload-card">
              <h3 className="section-title">
                <IoCameraOutline /> Or Upload Food Photo
              </h3>
              <p>Take a photo or upload an image for AI analysis</p>

              <div className="upload-box">
                <FaCamera size={28} />
                <p>Drag and drop an image or click to upload</p>
                <input type="file" accept="image/*" />
              </div>
            </div>

            {/* Submit Button */}
            <button type="submit" className="analyze-btn">
              <FaWandMagicSparkles size={18} /> Analyze Nutrition
            </button>
          </form>
        </div>

        {/* Right Column */}
        <div className="result-card">
          <FaWandMagicSparkles size={40} className="result-icon" />
          <p>Enter food information or upload a photo to get started</p>
        </div>
      </div>

      <Footer/> 
    </div>
  );
}
