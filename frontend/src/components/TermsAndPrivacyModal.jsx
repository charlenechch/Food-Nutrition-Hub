import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { FaShieldAlt, FaFileAlt, FaCheckCircle } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { CURRENT_POLICY_VERSION } from "../config/policyVersion";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Inline content

function PrivacyPolicyContent() {
  return (
    <div className="tpm-doc-body">
      <p className="tpm-doc-text">Welcome to SarawakEats. Your privacy is important to us.</p>

      <h3 className="tpm-doc-section">1. Information We Collect</h3>
      <p className="tpm-doc-text">We collect your name, email address, and saved recipes to provide a personalized experience.</p>

      <h3 className="tpm-doc-section">2. How We Use Your Data</h3>
      <p className="tpm-doc-text">Your data is securely stored and used exclusively for authentication and app functionality. We do not sell your personal data to third parties.</p>

      <h3 className="tpm-doc-section">3. Data Retention</h3>
      <p className="tpm-doc-text">We retain your personal data for as long as your account is active. You may request deletion of your account and associated data at any time through your profile settings.</p>

      <h3 className="tpm-doc-section">4. Your Rights (PDPA)</h3>
      <p className="tpm-doc-text">Under the Personal Data Protection Act (PDPA), you have the right to access, correct, and withdraw consent for the processing of your personal data. To exercise these rights, please contact us directly.</p>

      <h3 className="tpm-doc-section">5. Security</h3>
      <p className="tpm-doc-text">We implement industry-standard security measures including encrypted sessions, hashed passwords, and CSRF protection to safeguard your information.</p>
    </div>
  );
}

function TermsAndConditionsContent() {
  return (
    <div className="tpm-doc-body">

      <h3 className="tpm-doc-section">1. Introduction</h3>
      <p className="tpm-doc-text">Welcome to SarawakEats. By accessing or using our website and services, you agree to be bound by these Terms & Conditions. If you do not agree with any part of these terms, please do not use our platform.</p>

      <h3 className="tpm-doc-section">2. User Accounts</h3>
      <p className="tpm-doc-text">To access certain features of SarawakEats, such as posting recipes or participating in discussions, you must register for an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>

      <h3 className="tpm-doc-section">3. Community Guidelines & Content</h3>
      <p className="tpm-doc-text">Our community thrives on respect and sharing. Users may submit recipes and posts, provided the content is not illegal, offensive, defamatory, or infringing on intellectual property rights. SarawakEats reserves the right to review, edit, or remove any user-submitted content at our discretion.</p>

      <h3 className="tpm-doc-section">4. Intellectual Property</h3>
      <p className="tpm-doc-text">The overarching content, design, and branding of SarawakEats are owned by us. User-submitted recipes remain the property of the creator; however, by submitting content to SarawakEats, you grant us a non-exclusive license to display, modify, and share it across our platform.</p>

      <h3 className="tpm-doc-section">5. Limitation of Liability</h3>
      <p className="tpm-doc-text">SarawakEats provides culinary information and tools for educational and inspirational purposes only. We do not guarantee the absolute accuracy of nutritional data and are not liable for any health issues, allergies, or damages arising from the use of our recipes or tools. Always consult a professional for strict dietary requirements.</p>

      <h3 className="tpm-doc-section">6. Changes to Terms</h3>
      <p className="tpm-doc-text">We reserve the right to modify these Terms & Conditions at any time. When significant changes occur, we will notify users by prompting them to review and accept the new terms upon logging in. Continued use of the platform constitutes acceptance of the updated terms.</p>
    </div>
  );
}

// Scrollable document panel

function ScrollableDoc({ title, lastUpdated, icon: Icon, children, onScrolledToBottom, hasScrolled }) {
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
        <div className="tpm-doc-scroll-hint">↓ Scroll to read</div>
      )}
    </div>
  );
}

// Main Modal

export default function TermsAndPrivacyModal() {
  const { user, setUser } = useAuth();

  const [isPdpaChecked, setIsPdpaChecked] = useState(false);
  const [isTncChecked, setIsTncChecked] = useState(false);
  const [pdpaScrolled, setPdpaScrolled] = useState(false);
  const [tncScrolled, setTncScrolled] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [csrfToken, setCsrfToken] = useState("");

  useEffect(() => {
    if (!user || user.role === "guest" || (user.agreed_version >= CURRENT_POLICY_VERSION)) return;

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
    if (user && user.role !== "guest" && (user.agreed_version < CURRENT_POLICY_VERSION)) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [user]);

  if (!user || user.role === "guest" || (user.agreed_version >= CURRENT_POLICY_VERSION)) {
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

      setUser({ ...user, pdpa_consent: 1, tnc_consent: 1, agreed_version: CURRENT_POLICY_VERSION });

    } catch (err) {
      console.error("Consent Error:", err);
      const errorMessage = err.response?.data?.error || "Failed to save consent. Please try again.";
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
            <FaShieldAlt className="tpm-header-icon" />
            <h2 className="tpm-title">{isNewUser ? "Welcome to SarawakEats" : "Updated Legal Policies"}</h2>
            <p className="tpm-subtitle">
              {isNewUser
                ? "Before you get started, please read and accept our Privacy Policy and Terms & Conditions."
                : "Our policies have been updated. Please read and accept both documents below to continue using SarawakEats."}
            </p>
          </div>

          {/* Documents */}
          <div className="tpm-docs">
            <ScrollableDoc
              title="Privacy Policy"
              lastUpdated="Last Updated: 9th March 2026"
              icon={FaShieldAlt}
              onScrolledToBottom={() => setPdpaScrolled(true)}
              hasScrolled={pdpaScrolled}
            >
              <PrivacyPolicyContent />
            </ScrollableDoc>

            <ScrollableDoc
              title="Terms & Conditions"
              lastUpdated="Last Updated: 9th March 2026"
              icon={FaFileAlt}
              onScrolledToBottom={() => setTncScrolled(true)}
              hasScrolled={tncScrolled}
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
                I have read and agree to the <strong>Privacy Policy</strong>.
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
                I have read and agree to the <strong>Terms & Conditions</strong>.
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
            {isSubmitting ? "Saving..." : "I Agree & Continue"}
          </button>

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
          max-height: 90vh; overflow-y: auto;
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
        .tpm-doc-body { font-size: 0.88rem; color: #444; }
        .tpm-doc-updated { font-size: 0.8rem; color: #999; font-style: italic; margin-bottom: 12px; }
        .tpm-doc-section { font-family: 'Playfair Display', serif; font-size: 1rem; color: #5c3a21; margin: 14px 0 6px; }
        .tpm-doc-text { line-height: 1.65; margin-bottom: 10px; font-weight: 300; }
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