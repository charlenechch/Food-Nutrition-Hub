import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import "../css/ResetPasswordPage.css";
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

  // 🔹 Password rules
  const passwordRules = [
    { regex: /.{8,}/, label: "At least 8 characters" },
    { regex: /[A-Z]/, label: "At least one uppercase letter" },
    { regex: /[a-z]/, label: "At least one lowercase letter" },
    { regex: /[0-9]/, label: "At least one number" },
    { regex: /[!@#$%^&*(),.?":{}|<>]/, label: "At least one special symbol (!@#$%)" },
  ];

  const getPasswordStatus = (password) =>
    passwordRules.map((rule) => ({ label: rule.label, passed: rule.regex.test(password) }));

  // ✅ Step 1: Verify Firebase reset link
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
      setError("Invalid or missing reset link. Please request a new one.");
      setLoading(false);
    }
  }, [oobCode]);

  // 🔹 Update live password status
  useEffect(() => {
    setPwdStatus(getPasswordStatus(pwd));
  }, [pwd]);

  // ✅ Step 2: Handle password reset submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // 🔹 Check password rules
    for (let rule of passwordRules) {
      if (!rule.regex.test(pwd)) {
        setError(`Password requirement not met: ${rule.label}`);
        return;
      }
    }

    if (pwd !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    try {
      // 🔹 Reset password in Firebase
      await confirmPasswordReset(auth, oobCode, pwd);

      // 🔹 Sync password with backend if email exists
      if (email) {
        const res = await fetch(`${API_URL}/api/auth/updatePassword`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, newPassword: pwd }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to update backend password");
      }

      // 🔹 Mark success and redirect
      setSuccess(true);
      setTimeout(() => navigate("/loginregister"), 2500);
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again or request a new link.");
    }
  };

  // ✅ Loading state
  if (loading) {
    return (
      <div className="rpp-container">
        <div className="rpp-card">
          <h2 className="rpp-head2">Verifying link...</h2>
        </div>
      </div>
    );
  }

  // ✅ Success state
  if (success) {
    return (
      <div className="rpp-container">
        <div className="rpp-card">
          <h2 className="rpp-head2">Password Updated Successfully!</h2>
          <p>Please wait while we navigate you to our Login page.</p>
        </div>
      </div>
    );
  }

  // ✅ Invalid link
  if (error && !email) {
    return (
      <div className="rpp-container">
        <div className="rpp-card">
          <h2 className="rpp-head2">Invalid or Missing Link</h2>
          <p>{error}</p>
          <button
            className="lrp-btn lrp-btn-primary"
            onClick={() => navigate("/forgotpassword")}
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  // ✅ Main Reset Form
  return (
    <div className="rpp-container">
      <div className="rpp-card">
        <h2 className="rpp-head2">Set a New Password</h2>
        <p className="rpp-subtext">
          Resetting password for <strong>{email}</strong>
        </p>

        <form onSubmit={handleSubmit} className="rpp-form" noValidate>
          <label>New Password</label>
          <input
            type="password"
            placeholder="Enter a new password"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
          />

          {/* 🔹 Live password strength feedback */}
          <div className="password-strength">
            <ul>
              {pwdStatus.map((rule, idx) => (
                <li
                  key={idx}
                  style={{ color: rule.passed ? "green" : "red" }}
                >
                  {rule.passed ? "✔" : "✖"} {rule.label}
                </li>
              ))}
            </ul>
          </div>

          <label>Confirm New Password</label>
          <input
            type="password"
            placeholder="Re-enter your new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />

          {error && <p className="rpp-error">{error}</p>}

          <button type="submit" className="lrp-btn lrp-btn-primary">
            Save New Password
          </button>
          <button
            type="button"
            className="lrp-btn lrp-btn-outline"
            onClick={() => navigate("/forgotpassword")}
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}
