/* src/pages/ForgotPasswordPage.jsx */
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LoginFood from "../assets/LoginFood.png";
import "../css/ForgotPasswordPage.css";

// Icons
import { FaEnvelope, FaArrowLeft, FaCheckCircle } from "react-icons/fa";

// Firebase
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../config/firebase";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError(t("forgotPassword.enterEmail"));
      return;
    }

    setLoading(true);

    try {
      const actionCodeSettings = {
        url:
          import.meta.env.MODE === "development"
            ? "http://localhost:5173/resetpassword"
            : "https://food-nutrition-hub.vercel.app/resetpassword",
        handleCodeInApp: true,
      };

      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setError(t("forgotPassword.sendFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modern-heritage-page">
      {/* 1. Full Screen Background */}
      <div className="mh-background">
        <img src={LoginFood} alt="Sarawak Cuisine" />
        <div className="mh-overlay"></div>
      </div>

      {/* 2. Content Container */}
      <div className="mh-content-wrapper">
        
        {/* Left Side: Brand Text */}
        <div className="mh-brand-section">
          <h1 className="mh-title">{t("forgotPassword.brandTitle")}</h1>
          <div className="mh-divider"></div>
          <p className="mh-subtitle">{t("forgotPassword.brandSubtitle")}</p>
        </div>

        {/* Right Side: Glass Card */}
        <div className="mh-form-card mh-form-card--auto-height">
          
          {!submitted ? (
            <>
              <div className="mh-card-header">
                <h3>{t("forgotPassword.cardTitle")}</h3>
                <p>{t("forgotPassword.cardSubtitle")}</p>
              </div>

              <form onSubmit={handleSubmit} className="mh-form-body">
                {error && <div className="mh-error-msg">{error}</div>}

                <div className="mh-input-group">
                  <FaEnvelope className="mh-icon" />
                  <input
                    type="email"
                    placeholder={t("auth.emailPlaceholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>

                <button 
                  type="submit" 
                  className="mh-btn-primary" 
                  disabled={loading}
                >
                  {loading ? t("forgotPassword.sending") : t("forgotPassword.sendResetLink")}
                </button>

                <div className="mh-separator"><span>{t("auth.or")}</span></div>

                <button
                  type="button"
                  className="mh-back-btn"
                  onClick={() => navigate("/loginregister")}
                >
                  <FaArrowLeft /> {t("auth.backToLogin")}
                </button>
              </form>
            </>
          ) : (
            /* Success State */
            <div className="mh-success-view">
              <div className="mh-success-icon">
                <FaCheckCircle />
              </div>
              <h3>{t("forgotPassword.checkInbox")}</h3>
              <p>
                {t("forgotPassword.sentTo")} <br/><strong>{email}</strong>
              </p>
              
              <div className="mh-tips-box">
                <p>{t("forgotPassword.tipSpam")}</p>
                <p>{t("forgotPassword.tipExpiry")}</p>
              </div>

              <button
                type="button"
                className="mh-btn-primary"
                onClick={() => navigate("/loginregister")}
              >
                {t("auth.backToLogin")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}