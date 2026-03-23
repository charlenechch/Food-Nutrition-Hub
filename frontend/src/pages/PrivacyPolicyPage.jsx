import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { FaArrowLeft } from "react-icons/fa";
import "../css/PrivacyPolicyPage.css";
import PrivacyPolicyContent from "../components/PrivacyPolicyContent";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [policyDate, setPolicyDate] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/api/auth/policyversion`)
      .then(res => res.json())
      .then(data => setPolicyDate(data.lastUpdated))
      .catch(() => setPolicyDate(""));
  }, []);

  return (
    <div className="privacy-policy-page">
      <Header />
      
      <div className="pp-content-wrapper">
        <button className="pp-back-btn" onClick={() => navigate(-1)}>
          <FaArrowLeft /> {t("privacyPolicy.back")}
        </button>

        <h1 className="pp-title">{t("privacyPolicy.title")}</h1>

        <p className="pp-updated-text">{t("privacyPolicy.lastUpdated", { date: policyDate })}</p>
        
        <div>
          <PrivacyPolicyContent />
        </div>

      </div>

      <Footer />
    </div>
  );
}
