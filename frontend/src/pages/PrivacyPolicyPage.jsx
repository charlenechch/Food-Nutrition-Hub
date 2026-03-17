import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { FaArrowLeft } from "react-icons/fa";
import "../css/PrivacyPolicyPage.css";
import PrivacyPolicyContent from "../components/PrivacyPolicyContent";

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="privacy-policy-page">
      <Header />
      
      <div className="pp-content-wrapper">
        <button className="pp-back-btn" onClick={() => navigate(-1)}>
          <FaArrowLeft /> Back
        </button>

        <h1 className="pp-title">Privacy Policy</h1>

        <p className="pp-updated-text">Last Updated: 9th March 2026</p>
        
        <div>
          <PrivacyPolicyContent />
        </div>

      </div>

      <Footer />
    </div>
  );
}
