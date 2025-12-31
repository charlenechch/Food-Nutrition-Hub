/* src/pages/ForgotPasswordPage.jsx */
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import LoginFood from "../assets/LoginFood.png";
import "../css/ForgotPasswordPage.css";

// Icons
import { FaEnvelope, FaArrowLeft, FaCheckCircle } from "react-icons/fa";

// Firebase
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../config/firebase";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Please enter your email.");
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
      setError("Failed to send reset email. Please check the email provided.");
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
          <h1 className="mh-title">Recover<br/>Your Account</h1>
          <div className="mh-divider"></div>
          <p className="mh-subtitle">
            Don't worry, it happens. <br/>
            We'll help you get back to exploring Sarawak's finest flavors in no time.
          </p>
        </div>

        {/* Right Side: Glass Card */}
        <div className="mh-form-card mh-form-card--auto-height">
          
          {!submitted ? (
            <>
              <div className="mh-card-header">
                <h3>Forgot Password?</h3>
                <p>Enter your email to receive a reset link</p>
              </div>

              <form onSubmit={handleSubmit} className="mh-form-body">
                {error && <div className="mh-error-msg">{error}</div>}

                <div className="mh-input-group">
                  <FaEnvelope className="mh-icon" />
                  <input
                    type="email"
                    placeholder="Enter your email"
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
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>

                <div className="mh-separator"><span>or</span></div>

                <button
                  type="button"
                  className="mh-back-btn"
                  onClick={() => navigate("/loginregister")}
                >
                  <FaArrowLeft /> Back to Login
                </button>
              </form>
            </>
          ) : (
            /* Success State */
            <div className="mh-success-view">
              <div className="mh-success-icon">
                <FaCheckCircle />
              </div>
              <h3>Check your inbox</h3>
              <p>
                We've sent a secure reset link to <br/><strong>{email}</strong>
              </p>
              
              <div className="mh-tips-box">
                <p>• Check your spam folder if you don't see it.</p>
                <p>• The link expires in 1 hour.</p>
              </div>

              <button
                type="button"
                className="mh-btn-primary"
                onClick={() => navigate("/loginregister")}
              >
                Back to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}