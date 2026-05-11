import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { FaArrowLeft } from "react-icons/fa";
import "../css/TermsAndConditionsPage.css";
import TermsAndConditionsContent from "../components/TermsAndConditionsContent";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function TermsAndConditionsPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [policyDate, setPolicyDate] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/api/auth/policyversion`)
      .then(res => res.json())
      .then(data => setPolicyDate(i18n.language === "ms" ? data.lastUpdatedMS : data.lastUpdatedEN))
      .catch(() => setPolicyDate(""));
  }, []);

  return (
    <div className="terms-page">
      <Header />

      <div className="terms-content-wrapper">
        <button className="lrp-no-outline terms-back-btn" onClick={() => window.history.length > 1 ? navigate(-1) : window.close()}>
          <FaArrowLeft /> {t("termsAndConditions.back")}
        </button>

        <h1 className="terms-title">{t("termsAndConditions.title")}</h1>

        <p className="terms-updated-text">{t("termsAndConditions.lastUpdated", { date: policyDate })}</p>

        <TermsAndConditionsContent />
        
      </div>

      <Footer />
    </div>
  );
}
