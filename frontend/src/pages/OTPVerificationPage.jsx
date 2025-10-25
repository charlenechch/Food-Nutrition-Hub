import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
import "../css/OTPVerificationPage.css";

export default function OTPVerificationPage({ email: emailProp }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const email = emailProp || params.get("email") || "";
  const { login } = useAuth();

  const [otp, setOtp] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // countdown for resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const id = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
      return () => clearTimeout(id);
    }
  }, [resendCooldown]);

  const handleOtpChange = (value) => {
    const clean = value.replace(/\D/g, "").slice(0, 6);
    setOtp(clean);
    setError("");
  };

  // Handle verify
  const handleVerify = async (e) => {
    e?.preventDefault();
    if (otp.length !== 6) { 
      setError("Please enter the 6-digit code."); 
      return; 
    }
    
    setIsLoading(true);
    setError("");
    
    try {
      // Call backend to verify OTP
      const res = await fetch(`${API_URL}/api/otp/verify`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
      setSuccess(true);
      
      // Redirect to login page after verification
      setTimeout(() => {
        navigate("/loginregister");
      }, 2000);
    } else {
        setError(data.error || "Invalid verification code");
      }
    } catch (err) {
      setError("Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  //Handle resend OTP
  const handleResend = async () => {
    setResendCooldown(60);
    setError("");
    setOtp("");
    
    try {
      const res = await fetch(`${API_URL}/api/otp/send`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      const data = await res.json();
      console.log("OTP resent:", data.message);
      
      if (data.devOTP) {
        console.log("Dev OTP:", data.devOTP);
      }
    } catch (err) {
      console.error("Failed to resend OTP:", err);
      setError("Failed to resend code. Please try again.");
    }
  };

  if (success) {
    return (
      <div className="otp-container">
        <div className="otp-card otp-center">
          <div className="otp-success-icon" aria-hidden>✓</div>
          <h2 className="otp-title">Email verified!</h2>
          <p className="otp-muted">Redirecting to login page…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="otp-container">
      <div className="otp-card">
        <div className="otp-header">
          <div className="otp-logo">✉️</div>
          <h2 className="otp-title">Email Verification</h2>
          <p className="otp-subtitle">We've sent a 6-digit verification code to your email address.</p>
          <p className="otp-subtitle">Please enter it below to verify your account.</p>
        </div>

        <div className="otp-body">
          <div className="otp-email-block">
            <p className="otp-muted">Code sent to:</p>
            {/* remember to change your email to a variable that shows what their email is !!! */}
            <span className="otp-badge">{email || "your email"}</span>
          </div>

          <form onSubmit={handleVerify} className="otp-form" noValidate>
            <label htmlFor="otp-input" className="otp-label">Enter 6-digit code</label>
            <input
              id="otp-input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              className="otp-input"
              placeholder="000000"
              value={otp}
              onChange={(e) => handleOtpChange(e.target.value)}
              maxLength={6}
              autoFocus
              disabled={isLoading}
            />

            {error && <div className="otp-error" role="alert">{error}</div>}

            <button type="submit" className="lrp-btn lrp-btn-primary" disabled={otp.length !== 6 || isLoading}>
              {isLoading ? "Verifying…" : "Verify"}
            </button>

            <div className="otp-actions">
              <button
                type="button"
                className="lrp-btn lrp-btn-primary"
                onClick={handleResend}
                disabled={resendCooldown > 0 || isLoading}
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
              </button>
              <button
                type="button"
                className="lrp-btn lrp-btn-outline"
                onClick={() => navigate("/loginregister")}
              >
                Back to Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
