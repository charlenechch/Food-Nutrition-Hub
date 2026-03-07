import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
import "../css/OTPVerificationPage.css";
import "../css/lrp.css";

export default function OTPVerificationPage({ email: emailProp }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { login } = useAuth();
  const { t } = useTranslation();
  const initialEmail = emailProp || params.get("email") || "";
  const [email, setEmail] = useState(initialEmail);

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

  // CSRF
  const [csrfToken, setCsrfToken] = useState("");

  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const res = await fetch(`${API_BASE_URL}/api/csrf-token`, { credentials: "include" });
        const data = await res.json();
        setCsrfToken(data.csrfToken);
      } catch (err) {
        console.error("Failed to fetch CSRF token", err);
      }
    };
    fetchCsrfToken();
  }, []);

  // Handle verify
  const handleVerify = async (e) => {
    e?.preventDefault();
    if (otp.length !== 6) { 
      setError(t("otp.enter6Digits")); 
      return; 
    }
    
    setIsLoading(true);
    setError("");
    
    try {
      const res = await fetch(`${API_URL}/api/otp/verifyLogin`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken
         },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(true);
        setTimeout(() => {
          login(data.user);
          navigate("/dashboard");
        }, 2000);
      } else {
        setError(data.error || t("otp.invalidCode"));
      }
    } catch (err) {
      setError(t("otp.verificationFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle resend OTP
  const handleResend = async () => {
    setResendCooldown(60);
    setError("");
    setOtp("");
    
    try {
      const res = await fetch(`${API_URL}/api/otp/sendLogin`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", 
        "X-CSRF-Token": csrfToken  
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await res.json();
      console.log("OTP resent:", data.message);
      
      if (data.devOTP) {
        console.log("Dev OTP:", data.devOTP);
      }
    } catch (err) {
      console.error("Failed to resend OTP:", err);
      setError(t("otp.resendFailed"));
    }
  };

  if (success) {
    return (
      <div className="otp-container">
        <div className="otp-card otp-center">
          <div className="otp-success-icon" aria-hidden>✓</div>
          <h2 className="otp-title">{t("otp.loginSuccess")}</h2>
          <p className="otp-muted">{t("otp.redirecting")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="otp-container">
      <div className="otp-card">
        <div className="otp-header">
          <div className="otp-logo">✉️</div>
          <h2 className="otp-title">{t("otp.title")}</h2>
          <p className="otp-subtitle">{t("otp.subtitle1")}</p>
          <p className="otp-subtitle">{t("otp.subtitle2")}</p>
        </div>

        <div className="otp-body">
          <div className="otp-email-block">
            <p className="otp-muted">{t("otp.codeSentTo")}</p>
            <span className="otp-badge">{email || t("otp.yourEmail")}</span>
          </div>

          <form onSubmit={handleVerify} className="otp-form" noValidate>
            <label htmlFor="otp-input" className="otp-label">{t("otp.enterCode")}</label>
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
              {isLoading ? t("otp.verifying") : t("otp.verify")}
            </button>

            <div className="otp-actions">
              <button
                type="button"
                className="lrp-btn lrp-btn-primary"
                onClick={handleResend}
                disabled={resendCooldown > 0 || isLoading}
              >
                {resendCooldown > 0 ? t("otp.resendIn", { seconds: resendCooldown }) : t("otp.resendCode")}
              </button>
              <button
                type="button"
                className="lrp-btn lrp-btn-outline"
                onClick={() => navigate("/loginregister")}
              >
                {t("auth.backToLogin")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}