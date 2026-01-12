/* src/pages/ResetPasswordPage.jsx */
import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import "../css/ResetPasswordPage.css";
import LoginFood from "../assets/LoginFood.png";

// Icons
import { FaEye, FaEyeSlash, FaLock, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";

// Firebase
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { auth } from "../config/firebase";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const oobCode = params.get("oobCode");

  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pwdStatus, setPwdStatus] = useState([]);

  // UI States
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // CSRF
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

  // Password Rules
  const passwordRules = [
    { regex: /.{8,}/, label: "At least 8 characters" },
    { regex: /[A-Z]/, label: "Uppercase letter" },
    { regex: /[a-z]/, label: "Lowercase letter" },
    { regex: /[0-9]/, label: "Number" },
    { regex: /[!@#$%^&*(),.?":{}|<>]/, label: "Special symbol (!@#$)" },
  ];

  const getPasswordStatus = (password) =>
    passwordRules.map((rule) => ({
      label: rule.label,
      passed: rule.regex.test(password),
    }));

  // Step 1: Verify Link
  useEffect(() => {
    if (oobCode) {
      verifyPasswordResetCode(auth, oobCode)
        .then((emailFromFirebase) => {
          setEmail(emailFromFirebase);
          setLoading(false);
        })
        .catch(() => {
          setError("Invalid or expired reset link. Please request a new one.");
          setLoading(false);
        });
    } else {
      setError("Invalid or missing reset link.");
      setLoading(false);
    }
  }, [oobCode]);

  // Update validation status live
  useEffect(() => {
    setPwdStatus(getPasswordStatus(pwd));
  }, [pwd]);

  // Step 2: Handle Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    for (let rule of passwordRules) {
      if (!rule.regex.test(pwd)) {
        setError(`Requirement missing: ${rule.label}`);
        return;
      }
    }

    if (pwd !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    try {
      await confirmPasswordReset(auth, oobCode, pwd);

      // Sync with backend if needed
      if (email && csrfToken) {
        await fetch(`${API_URL}/api/auth/updatePassword`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken
          },
          credentials: "include",
          body: JSON.stringify({ email, newPassword: pwd }),
        });
      }

      setSuccess(true);
      setTimeout(() => navigate("/loginregister"), 3000);
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong. Please try again.");
    }
  };

  // --- RENDER CONTENT BASED ON STATE ---
  let content;

  if (loading) {
    content = (
      <div className="mh-status-view">
        <div className="mh-spinner"></div>
        <h3>Verifying Link...</h3>
        <p>Please wait a moment.</p>
      </div>
    );
  } else if (success) {
    content = (
      <div className="mh-status-view">
        <div className="mh-success-icon"><FaCheckCircle /></div>
        <h3>Password Reset!</h3>
        <p>Your password has been updated successfully.</p>
        <p className="mh-redirect-text">Redirecting to login...</p>
        <button className="mh-btn-primary" onClick={() => navigate("/loginregister")}>
          Login Now
        </button>
      </div>
    );
  } else if (error && !email) {
    // Error loading the page (invalid link)
    content = (
      <div className="mh-status-view">
        <div className="mh-error-icon"><FaExclamationCircle /></div>
        <h3>Link Expired</h3>
        <p>{error}</p>
        <button className="mh-btn-primary" onClick={() => navigate("/forgotpassword")}>
          Request New Link
        </button>
      </div>
    );
  } else {
    // Main Form
    content = (
      <>
        <div className="mh-card-header">
          <h3>Set New Password</h3>
          <p>Resetting for <strong>{email}</strong></p>
        </div>

        <form onSubmit={handleSubmit} className="mh-form-body">
          {error && <div className="mh-error-msg">{error}</div>}

          {/* New Password */}
          <div className="mh-password-wrapper">
            <div className="mh-input-group">
              <FaLock className="mh-icon" />
              <input
                type={showPwd ? "text" : "password"}
                placeholder="New Password"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                onFocus={() => setShowHint(true)}
                // onBlur={() => setShowHint(false)} // Optional: keep open to see checks
              />
              <div className="mh-eye" onClick={() => setShowPwd(!showPwd)}>
                {showPwd ? <FaEyeSlash /> : <FaEye />}
              </div>
            </div>

            {/* Validation Hints */}
            {showHint && (
              <div className="mh-password-rules">
                {pwdStatus.map((rule, idx) => (
                  <div
                    key={idx}
                    className={`mh-rule-item ${rule.passed ? "passed" : "pending"}`}
                  >
                    {rule.passed ? "✓" : "○"} {rule.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="mh-input-group">
            <FaLock className="mh-icon" />
            <input
              type={showConfirm ? "text" : "password"}
              placeholder="Confirm Password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            <div className="mh-eye" onClick={() => setShowConfirm(!showConfirm)}>
              {showConfirm ? <FaEyeSlash /> : <FaEye />}
            </div>
          </div>

          <button type="submit" className="mh-btn-primary">
            Save New Password
          </button>
          
          <button 
            type="button" 
            className="mh-btn-text"
            onClick={() => navigate("/loginregister")}
          >
            Cancel
          </button>
        </form>
      </>
    );
  }

  return (
    <div className="modern-heritage-page">
      {/* Background */}
      <div className="mh-background">
        <img src={LoginFood} alt="Sarawak Cuisine" />
        <div className="mh-overlay"></div>
      </div>

      {/* Content */}
      <div className="mh-content-wrapper">
        {/* Brand Text */}
        <div className="mh-brand-section">
          <h1 className="mh-title">Secure<br/>Your Account</h1>
          <div className="mh-divider"></div>
          <p className="mh-subtitle">
            Create a strong password to protect your journey<br/>
            through Sarawak's culinary heritage.
          </p>
        </div>

        {/* Glass Card */}
        <div className="mh-form-card mh-form-card--auto">
          {content}
        </div>
      </div>
    </div>
  );
}