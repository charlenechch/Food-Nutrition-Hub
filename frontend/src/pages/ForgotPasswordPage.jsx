import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import LoginFood from "../assets/LoginFood.png";
import "../css/ForgotPasswordPage.css";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // pretend success for UI preview
    setSubmitted(true);
  };

  return (
    <div className="fpp-page">
      {/* Left image panel (hidden on small screens) */}
      <div className="fpp-image-panel">
        <img src={LoginFood} alt="Sarawak cuisine collage" />
        <div className="fpp-overlay" />
        <div className="fpp-caption">
          <h1>Recover your account</h1>
          <p>We'll send a reset link to your email so you can create a new password.</p>
        </div>
      </div>

      {/* Right form card */}
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
              <div>
                <label htmlFor="fpp-email">Email</label>
                <input
                  id="fpp-email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <button type="submit" className="lrp-btn lrp-btn-primary">Send reset link</button>

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
              <div className="fpp-success-icon" aria-hidden>✓</div>
              <h3>Check your inbox</h3>
              {/* Change "your email" to user's actual email address when implementing backend ya !!!!!! */}
              <p>
                If an account exists for <strong>{email || "your email"}</strong>, you'll receive a message with a
                password reset link. The link will expire after a short time.
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
              <button
                type="button"
                className="lrp-btn lrp-btn-primary"
                onClick={() => navigate("/resetpassword?token=demo")}
              >
                Open reset page (demo) (Remember to delete this button when applying backend, only accessible with reset password link sent to their email)
              </button>
            </div>
          )}

          <p className="fpp-footer">Preserving and celebrating Sarawak's culinary heritage</p>
        </div>
      </div> 
    </div>
  );
}