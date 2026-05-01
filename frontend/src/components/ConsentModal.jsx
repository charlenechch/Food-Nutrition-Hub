import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { FaGlobe } from "react-icons/fa";
import { createPortal } from "react-dom";
import axios from "axios";
import { FaShieldAlt, FaFileAlt, FaCheckCircle } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import PrivacyPolicyContent from "./PrivacyPolicyContent";
import TermsAndConditionsContent from "./TermsAndConditionsContent";
import "../css/PolicyContent.css";
import "../css/ConsentModal.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Scrollable document panel

function ScrollableDoc({ title, lastUpdated, icon: Icon, children, onScrolledToBottom, hasScrolled, scrollHint }) {
  const scrollRef = useRef(null);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 30) {
      onScrolledToBottom();
    }
  };

  return (
    <div className="tpm-doc-panel">
      <div className="tpm-doc-header">
        <Icon className="tpm-doc-icon" />
        <div className="tpm-doc-header-text">
          <span className="tpm-doc-title">{title}</span>
          {lastUpdated && <span className="tpm-doc-updated-inline">{lastUpdated}</span>}
        </div>
        {hasScrolled && <FaCheckCircle className="tpm-doc-read-badge" />}
      </div>
      <div className="tpm-doc-scroll" ref={scrollRef} onScroll={handleScroll}>
        {children}
      </div>
      {!hasScrolled && (
        <div className="tpm-doc-scroll-hint">{scrollHint}</div>
      )}
    </div>
  );
}

// Main Modal

export default function ConsentModal() {
  const { user, setUser } = useAuth();
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language === "en" ? "EN" : "BM";

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "ms" : "en";
    i18n.changeLanguage(newLang);
    localStorage.setItem("sarawakeats_lang", newLang);
  };

  const [isPdpaChecked, setIsPdpaChecked] = useState(false);
  const [isTncChecked, setIsTncChecked] = useState(false);
  const [pdpaScrolled, setPdpaScrolled] = useState(false);
  const [tncScrolled, setTncScrolled] = useState(false);
  const [policyLastUpdatedEN, setPolicyLastUpdatedEN] = useState(null);
  const [policyLastUpdatedMS, setPolicyLastUpdatedMS] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/api/auth/policyversion`)
      .then(res => res.json())
      .then(data => {
        setPolicyLastUpdatedEN(data.lastUpdatedEN);
        setPolicyLastUpdatedMS(data.lastUpdatedMS);
      })
      .catch(err => console.error("Failed to fetch policy version", err));
  }, []);
  

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [csrfToken, setCsrfToken] = useState("");

  useEffect(() => {
    if (!user || user.role === "guest" || user.agreed_version !== 0) return;

    const fetchCsrfToken = async () => {
      try {
        const res = await fetch(`${API_URL}/api/csrf-token`, { credentials: "include" });
        const data = await res.json();
        setCsrfToken(data.csrfToken);
      } catch (err) {
        console.error("Failed to fetch CSRF token", err);
      }
    };
    fetchCsrfToken();
  }, [user]);

  useEffect(() => {
    if (user && user.role !== "guest" && user.agreed_version === 0) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [user]);

  if (!user || user.role === "guest" || user.agreed_version !== 0) {
    return null;
  }

  const isNewUser = user.agreed_version === 0;

  const handleAgree = async () => {
    if (!isPdpaChecked || !isTncChecked) return;

    setIsSubmitting(true);
    setError("");

    try {
      await axios.put(`${API_URL}/api/userProfile/consent`, {
        pdpaConsent: isPdpaChecked,
        tncConsent: isTncChecked
      }, {
        withCredentials: true,
        headers: { "X-CSRF-Token": csrfToken }
      });

      setUser({ ...user, pdpa_consent: 1, tnc_consent: 1, agreed_version: 1 });

    } catch (err) {
      console.error("Consent Error:", err);
      const errorMessage = err.response?.data?.error || t("consent.error");
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <>
      <div className="tpm-overlay">
        <div className="tpm-card">

          {/* Header */}
          <div className="tpm-header">
            <button onClick={toggleLanguage} className="tpm-lang-btn">
              <FaGlobe /> {currentLang}
            </button>
            <FaShieldAlt className="tpm-header-icon" />
            <h2 className="tpm-title">{isNewUser ? t("consent.titleNew") : t("consent.titleUpdated")}</h2>
            <p className="tpm-subtitle">
              {isNewUser ? t("consent.subtitleNew") : t("consent.subtitleUpdated")}
            </p>
          </div>

          {/* Documents */}
          <div className="tpm-docs">
            <ScrollableDoc
              title={t("privacyPolicy.title")}
              lastUpdated={(policyLastUpdatedEN || policyLastUpdatedMS) ? t("consent.lastUpdated", { date: i18n.language === "ms" ? policyLastUpdatedMS : policyLastUpdatedEN }) : ""}
              icon={FaShieldAlt}
              onScrolledToBottom={() => setPdpaScrolled(true)}
              hasScrolled={pdpaScrolled}
              scrollHint={t("consent.scrollHint")}
            >
              <PrivacyPolicyContent />
            </ScrollableDoc>

            <ScrollableDoc
              title={t("termsAndConditions.title")}
              lastUpdated={(policyLastUpdatedEN || policyLastUpdatedMS) ? t("consent.lastUpdated", { date: i18n.language === "ms" ? policyLastUpdatedMS : policyLastUpdatedEN }) : ""}
              icon={FaFileAlt}
              onScrolledToBottom={() => setTncScrolled(true)}
              hasScrolled={tncScrolled}
              scrollHint={t("consent.scrollHint")}
            >
              <TermsAndConditionsContent />
            </ScrollableDoc>
          </div>

          {/* Checkboxes */}
          <div className="tpm-checkboxes">
            <div className={`tpm-checkbox-row ${!pdpaScrolled ? "tpm-checkbox-locked" : ""}`}>
              <input
                type="checkbox"
                id="pdpa-agree"
                checked={isPdpaChecked}
                disabled={!pdpaScrolled}
                onChange={(e) => setIsPdpaChecked(e.target.checked)}
              />
              <label htmlFor="pdpa-agree" className="tpm-checkbox-label">
                {t("consent.checkboxPdpa")} <strong>{t("privacyPolicy.title")}</strong>.
              </label>
            </div>

            <div className={`tpm-checkbox-row ${!tncScrolled ? "tpm-checkbox-locked" : ""}`}>
              <input
                type="checkbox"
                id="tnc-agree"
                checked={isTncChecked}
                disabled={!tncScrolled}
                onChange={(e) => setIsTncChecked(e.target.checked)}
              />
              <label htmlFor="tnc-agree" className="tpm-checkbox-label">
                {t("consent.checkboxTnc")} <strong>{t("termsAndConditions.title")}</strong>.
              </label>
            </div>
          </div>

          {error && (
            <div className="tpm-error">{error}</div>
          )}

          <button
            className="tpm-btn"
            onClick={handleAgree}
            disabled={!isPdpaChecked || !isTncChecked || isSubmitting}
          >
            {isSubmitting ? t("consent.saving") : t("consent.agreeBtn")}
          </button>

          <p className="tpm-disagree-note">{t("consent.disagreeNote")}</p>
        </div>
      </div>
    </>,
    document.body
  );
}