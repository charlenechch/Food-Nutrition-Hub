import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { FaArrowLeft } from "react-icons/fa";
import "../css/TermsAndConditionsPage.css";
import TermsAndConditionsContent from "../components/TermsAndConditionsContent";

export default function TermsAndConditionsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="terms-page">
      <Header />

      <div className="terms-content-wrapper">
        <button className="terms-back-btn" onClick={() => navigate(-1)}>
          <FaArrowLeft /> Back
        </button>

        <h1 className="terms-title">Terms & Conditions</h1>

        <p className="terms-updated-text">Last Updated: 9th March 2026</p>

        <TermsAndConditionsContent />
        
      </div>

      <Footer />
    </div>
  );
}
