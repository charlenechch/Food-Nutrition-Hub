import React from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { FaArrowLeft } from "react-icons/fa";
import "../css/PrivacyPolicyPage.css";

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();

  return (
    <div className="privacy-policy-page">
      <Header />
      
      <div className="pp-content-wrapper">
        
        <button className="pp-back-btn" onClick={() => navigate(-1)}>
          <FaArrowLeft /> Back
        </button>

        <h1 className="pp-title">Personal Data Protection Act (PDPA) Policy</h1>
        
        <div>
          <p className="pp-text">Welcome to SarawakEats. Your privacy is important to us...</p>
          
          <h3 className="pp-section-title">1. Information We Collect</h3>
          <p className="pp-text">We collect your name, email address, and saved recipes to provide a personalized experience.</p>
          
          <h3 className="pp-section-title">2. How We Use Your Data</h3>
          <p className="pp-text">Your data is securely stored and used exclusively for authentication and app functionality. We do not sell your personal data to third parties.</p>

          <p className="pp-muted-text">
            *Please update this page with your official legal terms.*
          </p>
        </div>

      </div>

      <Footer />
    </div>
  );
}