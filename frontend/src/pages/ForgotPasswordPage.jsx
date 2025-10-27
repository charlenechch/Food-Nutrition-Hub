import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import LoginFood from "../assets/LoginFood.png";
import "../css/ForgotPasswordPage.css";

// ✅ Import Firebase
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../config/firebase";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Please enter your email.");
      return;
    }

    try {
      // ✅ MUST include reset URL to your ResetPasswordPage + email
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/resetpassword?email=${encodeURIComponent(email)}`,
        handleCodeInApp: true,
      });

      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setError("Failed to send reset email. Check if the email is registered.");
    }
  };

  return (
    <div className="fpp-page">
      {/* ✅ Left image panel */}
      <div className="fpp-image-panel">
        <img src={LoginFood} alt="Sarawak cuisine collage" />
        <div className="fpp-overlay" />
        <div className="fpp-caption">
          <h1>Recover your account</h1>
          <p>We'll send a reset link to your email so you can create a new password.</p>
        </div>
      </div>

      {/* ✅ Right form */}
      <div className="fpp-form-panel">
        <div className="fpp-card">
          <div className="fpp-card-header">
            <div className="fpp-logo">🍽️</div>
            <h3>Forgot Password</h3>
            <p className="fpp-subtext">Enter the email you used for SarawakEats.</p>
            <p className="fpp-subtext">We'll send a secure link to reset your password.</p>
          </div>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="fpp-form" noValidate>
              <label htmlFor="fpp-email">Email</label>
              <input
                id="fpp-email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />

              {error && <p className="fpp-error">{error}</p>}

              <button type="submit" className="lrp-btn lrp-btn-primary">
                Send reset link
              </button>

              <div className="fpp-links">
                <button
                  type="button"
                  className="lrp-btn lrp-btn-outline"
                  onClick={() => navigate("/loginregister")}
                >
                  Back to Login
                </button>
              </div>
            </form>
          ) : (
            <div className="fpp-success">
              <div className="fpp-success-icon">✓</div>
              <h3>Check your inbox</h3>
              <p>
                If an account exists for <strong>{email}</strong>, a password reset link has been sent.
              </p>
              <div className="fpp-success-actions">
                <button
                  type="button"
                  className="lrp-btn lrp-btn-primary"
                  onClick={() => navigate("/loginregister")}
                >
                  Back to Login
                </button>
              </div>
              <ul className="fpp-tips">
                <li>Didn't get it? Check your spam folder.</li>
                <li>Still no email? Try again or contact support.</li>
              </ul>
            </div>
          )}

          <p className="fpp-footer">Preserving and celebrating Sarawak's culinary heritage</p>
        </div>
      </div>
    </div>
  );
}
