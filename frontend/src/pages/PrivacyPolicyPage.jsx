import React from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { FaArrowLeft } from "react-icons/fa";
import "../css/LoginRegisterPage.css"; // Reusing your existing styles for consistency

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="modern-heritage-page">
      <Header />
      
      <div className="mh-content-wrapper" style={{ padding: "40px 20px", maxWidth: "800px", margin: "0 auto", backgroundColor: "rgba(255,255,255,0.9)", borderRadius: "10px", marginTop: "120px", marginBottom: "40px" }}>
        
        <button className="mh-btn-text-small" onClick={() => navigate(-1)} style={{ marginBottom: "20px" }}>
          <FaArrowLeft /> Back
        </button>

        <h1 style={{ color: "#2c3e50", marginBottom: "20px" }}>Personal Data Protection Act (PDPA) Policy</h1>
        
        <div style={{ lineHeight: "1.6", color: "#333" }}>
          <p>Welcome to SarawakEats. Your privacy is important to us...</p>
          
          <h3 style={{ marginTop: "20px", color: "#c7a489" }}>1. Information We Collect</h3>
          <p>We collect your name, email address, and saved recipes to provide a personalized experience.</p>
          
          <h3 style={{ marginTop: "20px", color: "#c7a489" }}>2. How We Use Your Data</h3>
          <p>Your data is securely stored and used exclusively for authentication and app functionality. We do not sell your personal data to third parties.</p>

          <p style={{ marginTop: "30px", fontSize: "0.9rem", color: "#666" }}>
            *Please update this page with your official legal terms.*
          </p>
        </div>

      </div>

      <Footer />
    </div>
  );
}