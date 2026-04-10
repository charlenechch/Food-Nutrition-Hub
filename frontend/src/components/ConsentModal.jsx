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

      <style>{`
        .tpm-overlay {
          position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
          background: rgba(0,0,0,0.65); backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px); z-index: 999999;
          display: flex; align-items: center; justify-content: center; padding: 20px;
        }
        .tpm-card {
          background: #ffffff; border-radius: 20px; width: 100%; max-width: 640px;
          max-height: 90vh; overflow-y: auto; position: relative;
          padding: 36px 36px 32px; box-shadow: 0 25px 60px rgba(0,0,0,0.35);
          font-family: 'Poppins', sans-serif;
          animation: tpmPopIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          -webkit-mask-image: -webkit-radial-gradient(white, black);
        }
        @keyframes tpmPopIn {
          0% { opacity: 0; transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
        .tpm-header { text-align: center; margin-bottom: 24px; }
        .tpm-header-icon { font-size: 2.5rem; color: #c6a87c; margin-bottom: 12px; display: block; }
        .tpm-title {
          font-family: 'Playfair Display', serif; font-size: 1.8rem;
          color: #5c3a21; margin: 0 0 10px; font-weight: 700;
        }
        .tpm-subtitle { font-size: 0.9rem; color: #777; line-height: 1.5; margin: 0; }
        .tpm-lang-btn {
          position: absolute; top: 16px; right: 16px;
          background: none; border: 1px solid #c6a87c;
          border-radius: 8px; padding: 6px 12px;
          cursor: pointer; display: flex; align-items: center;
          gap: 6px; font-size: 0.85rem; color: #5c3a21; font-weight: 600;
        }
        .tpm-lang-btn:hover { background: #f7f2ed; }
        .tpm-docs { display: flex; flex-direction: column; gap: 16px; margin-bottom: 20px; }
        .tpm-doc-panel {
          border: 1px solid rgba(92,58,33,0.15); border-radius: 12px; overflow: hidden;
        }
        .tpm-doc-header {
          display: flex; align-items: center; gap: 8px;
          background: #f7f2ed; padding: 10px 16px;
          border-bottom: 1px solid rgba(92,58,33,0.1);
        }
        .tpm-doc-icon { color: #5c3a21; font-size: 0.9rem; flex-shrink: 0; }
        .tpm-doc-header-text { display: flex; flex-direction: column; flex: 1; gap: 2px; }
        .tpm-doc-title { font-size: 0.9rem; font-weight: 600; color: #5c3a21; }
        .tpm-doc-updated-inline { font-size: 0.75rem; color: #999; font-style: italic; }
        .tpm-doc-read-badge { color: #4caf50; font-size: 1rem; flex-shrink: 0; }
        .tpm-doc-scroll {
          height: 180px; overflow-y: auto; padding: 16px 18px;
          scrollbar-width: thin; scrollbar-color: #c6a87c #f7f2ed;
        }
        .tpm-doc-scroll::-webkit-scrollbar { width: 6px; }
        .tpm-doc-scroll::-webkit-scrollbar-track { background: #f7f2ed; }
        .tpm-doc-scroll::-webkit-scrollbar-thumb { background: #c6a87c; border-radius: 3px; }
        .tpm-doc-scroll-hint {
          text-align: center; font-size: 0.78rem; color: #999;
          padding: 6px 0; background: #fdfaf7;
          border-top: 1px solid rgba(92,58,33,0.07);
        }
        .tpm-doc-updated { font-size: 0.8rem; color: #999; font-style: italic; margin-bottom: 12px; }
        .tpm-checkboxes { display: flex; flex-direction: column; gap: 10px; margin-bottom: 18px; }
        .tpm-checkbox-row {
          display: flex; align-items: flex-start; gap: 10px;
          background: #f7f2ed; padding: 12px 16px; border-radius: 10px;
          border: 1px solid rgba(92,58,33,0.1); transition: opacity 0.2s;
        }
        .tpm-checkbox-locked { opacity: 0.45; }
        .tpm-checkbox-row input[type="checkbox"] {
          margin-top: 3px; width: 16px; height: 16px;
          cursor: pointer; accent-color: #5c3a21; flex-shrink: 0;
        }
        .tpm-checkbox-row input[type="checkbox"]:disabled { cursor: not-allowed; }
        .tpm-checkbox-label { font-size: 0.88rem; color: #333; line-height: 1.4; cursor: pointer; }
        .tpm-error { color: #d32f2f; font-size: 0.88rem; font-weight: 500; margin-bottom: 14px; text-align: center; }
        .tpm-btn {
          width: 100%; background: #5c3a21; color: white; border: none;
          padding: 14px; border-radius: 12px; font-size: 1rem; font-weight: 600;
          font-family: 'Poppins', sans-serif; cursor: pointer; transition: all 0.3s ease;
        }
        .tpm-btn:disabled { background: #ccc; cursor: not-allowed; }
        .tpm-btn:not(:disabled):hover {
          background: #4a2e1a; transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(92,58,33,0.2);
        }
        .tpm-disagree-note {
          text-align: center; font-size: 0.78rem; color: #999;
          margin-top: 14px; line-height: 1.5;
        }
        @media (max-width: 600px) {
          .tpm-card { padding: 24px 18px; }
          .tpm-title { font-size: 1.4rem; }
          .tpm-doc-scroll { height: 150px; }
        }
      `}</style>
    </>,
    document.body
  );
}