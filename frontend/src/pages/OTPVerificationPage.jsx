import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "../css/OTPVerificationPage.css";

export default function OTPVerificationPage({ email: emailProp }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const email = emailProp || params.get("email") || "";

  const [otp, setOtp] = useState("");
  const [rememberDevice, setRememberDevice] = useState(false);
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

  // auto-verify when 6 digits filled
  useEffect(() => {
    if (otp.length === 6) handleVerify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  const handleOtpChange = (value) => {
    const clean = value.replace(/\D/g, "").slice(0, 6);
    setOtp(clean);
    setError("");
  };

  const handleVerify = async (e) => {
    e?.preventDefault();
    if (otp.length !== 6) { setError("Please enter the 6-digit code."); return; }
    setIsLoading(true);
    setError("");
    try {
      await new Promise((r) => setTimeout(r, 900));

      // Demo outcomes (Change it when applying backend !!!!!!!!!!)
      if (otp === "123456") {
        setSuccess(true);
        if (rememberDevice && email) {
          localStorage.setItem("sarawakeats_remember_device", JSON.stringify({ email, ts: Date.now(), ttl: 7 * 24 * 60 * 60 * 1000 }));
        }
        setTimeout(() => navigate("/home"), 1500); // change to whatever route after verified
      } else if (otp === "000000") {
        setError("Code expired. Please request a new one.");
      } else if (otp === "999999") {
        setError("Too many attempts. Try again later.");
      } else {
        setError("Invalid verification code. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setResendCooldown(60);
    setError("");
    setOtp("");
    await new Promise((r) => setTimeout(r, 600));
    console.log("OTP resent to:", email || "(demo)");
  };

  if (success) {
    return (
      <div className="otp-container">
        <div className="otp-card otp-center">
          <div className="otp-success-icon" aria-hidden>✓</div>
          <h2 className="otp-title">Email verified</h2>
          <p className="otp-muted">Redirecting…</p>
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
            <span className="otp-badge">your email</span>
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

            <div className="otp-remember">
              <input
                id="remember-device"
                type="checkbox"
                className="efp-checkbox"
                checked={rememberDevice}
                onChange={(e) => setRememberDevice(e.target.checked)}
                disabled={isLoading}
              />
              <label htmlFor="remember-device">Remember this device for 7 days</label>
            </div>

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
