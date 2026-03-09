import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FaShieldAlt } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function TermsAndPrivacyModal() {
  const { user, setUser } = useAuth();
  
  // Two separate states for our two legal documents
  const [isPdpaChecked, setIsPdpaChecked] = useState(false);
  const [isTncChecked, setIsTncChecked] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [csrfToken, setCsrfToken] = useState("");

  useEffect(() => {
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
  }, []);

  // Lock the background scrolling if the modal is active
  useEffect(() => {
    // We now check if EITHER consent is missing
    if (user && user.role !== "guest" && (user.pdpa_consent !== 1 || user.tnc_consent !== 1)) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [user]);

  // Hide the modal if there is no user, they are a guest, or they've already agreed to both
  if (!user || user.role === "guest" || (user.pdpa_consent === 1 && user.tnc_consent === 1)) {
    return null; 
  }

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

    setUser({ ...user, pdpa_consent: 1, tnc_consent: 1 });
    
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
      <div className="terms-modal-overlay">
        <div className="terms-modal-card">
          <FaShieldAlt className="terms-modal-icon" />
          <h2 className="terms-modal-title">Updated Legal Policies</h2>
          
          <p className="terms-modal-text">
            To continue using SarawakEats, please review and accept our updated policies. This ensures your data is handled securely and establishes the rules of our community.
          </p>

          {error && <div style={{ color: "#d32f2f", marginBottom: "15px", fontSize: "0.9rem", fontWeight: "500" }}>{error}</div>}

          {/* Checkbox 1: Privacy Policy */}
          <div className="terms-modal-checkbox-wrapper">
            <input 
              type="checkbox" 
              id="pdpa-agree" 
              checked={isPdpaChecked} 
              onChange={(e) => setIsPdpaChecked(e.target.checked)} 
            />
            <label htmlFor="pdpa-agree" className="terms-modal-checkbox-label">
              I have read and agree to the <a href="/privacypolicy" target="_blank" rel="noopener noreferrer" className="terms-modal-link">PDPA Privacy Policy</a>.
            </label>
          </div>

          {/* Checkbox 2: Terms & Conditions */}
          <div className="terms-modal-checkbox-wrapper" style={{ marginTop: "-15px" }}>
            <input 
              type="checkbox" 
              id="tnc-agree" 
              checked={isTncChecked} 
              onChange={(e) => setIsTncChecked(e.target.checked)} 
            />
            <label htmlFor="tnc-agree" className="terms-modal-checkbox-label">
              I have read and agree to the <a href="/terms" target="_blank" rel="noopener noreferrer" className="terms-modal-link">Terms & Conditions</a>.
            </label>
          </div>

          <button 
            className="terms-modal-btn" 
            onClick={handleAgree} 
            disabled={!isPdpaChecked || !isTncChecked || isSubmitting}
          >
            {isSubmitting ? "Saving..." : "I Agree & Continue"}
          </button>
        </div>
      </div>

      <style>{`
        .terms-modal-overlay {
          position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
          background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px); z-index: 999999; 
          display: flex; align-items: center; justify-content: center; padding: 20px;
        }
        .terms-modal-card {
          background: #ffffff; border-radius: 20px; max-width: 550px; width: 100%;
          padding: 40px; box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3); text-align: left;
          font-family: 'Poppins', sans-serif; animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .terms-modal-icon { font-size: 3rem; color: #c6a87c; margin-bottom: 20px; display: block; text-align: center; }
        .terms-modal-title {
          font-family: 'Playfair Display', serif; font-size: 2rem; color: #5c3a21; 
          margin: 0 0 15px 0; font-weight: 700; text-align: center;
        }
        .terms-modal-text { font-size: 0.95rem; color: #555; line-height: 1.6; margin-bottom: 25px; text-align: center; }
        .terms-modal-checkbox-wrapper {
          background: #f7f2ed; padding: 15px 20px; border-radius: 12px; margin-bottom: 30px;
          display: flex; align-items: flex-start; gap: 12px;
          border: 1px solid rgba(92, 58, 33, 0.1);
        }
        .terms-modal-checkbox-wrapper input[type="checkbox"] {
          margin-top: 4px; width: 18px; height: 18px; cursor: pointer; accent-color: #5c3a21; flex-shrink: 0;
        }
        .terms-modal-checkbox-label {
          font-size: 0.9rem; color: #333; cursor: pointer; line-height: 1.4;
        }
        .terms-modal-link { color: #5c3a21; text-decoration: underline; font-weight: 600; }
        .terms-modal-btn {
          width: 100%; background: #5c3a21; color: white; border: none; padding: 15px;
          border-radius: 12px; font-size: 1rem; font-weight: 600; font-family: 'Poppins', sans-serif;
          cursor: pointer; transition: all 0.3s ease;
        }
        .terms-modal-btn:disabled { background: #ccc; cursor: not-allowed; transform: none; box-shadow: none; }
        .terms-modal-btn:not(:disabled):hover {
          background: #4a2e1a; transform: translateY(-2px); box-shadow: 0 10px 20px rgba(92, 58, 33, 0.2);
        }
        @keyframes popIn {
          0% { opacity: 0; transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
        @media (max-width: 600px) {
          .terms-modal-card { padding: 30px 20px; }
          .terms-modal-title { font-size: 1.5rem; }
        }
      `}</style>
    </>,
    document.body
  );
}