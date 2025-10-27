import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import "../css/ResetPasswordPage.css";

// ✅ Firebase for password reset
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { auth } from "../config/firebase";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  // ✅ Firebase provides this after clicking email
  const oobCode = params.get("oobCode");
  const [email, setEmail] = useState(""); // ✅ email retrieved securely
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // ✅ Get email associated with the reset token (secure)
  useEffect(() => {
    if (oobCode) {
      verifyPasswordResetCode(auth, oobCode)
        .then((retrievedEmail) => setEmail(retrievedEmail))
        .catch(() => setError("Invalid or expired reset link."));
    }
  }, [oobCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (pwd.length < 8) return setError("Password must be at least 8 characters.");
    if (pwd !== confirm) return setError("Passwords do not match.");

    try {
      // ✅ 1. Update password in Firebase
      await confirmPasswordReset(auth, oobCode, pwd);

      // ✅ 2. Also sync to MySQL backend
      if (email) {
        await fetch(`${API_URL}/api/auth/updatePassword`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email: email, newPassword: pwd }),
        });
      }

      setSuccess(true);
      setTimeout(() => navigate("/loginregister"), 2000);
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please request a new reset link.");
    }
  };

  // ✅ If link is missing or invalid
  if (!oobCode) {
    return (
      <div className="rpp-container">
        <div className="rpp-card">
          <h2 className="rpp-head2">Invalid or Missing Link</h2>
          <p>Please request a new password reset email.</p>
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

  // ✅ Show success message after update
  if (success) {
    return (
      <div className="rpp-container">
        <div className="rpp-card">
          <h2 className="rpp-head2">Password Updated Successfully!</h2>
          <p>You can now login with your new password.</p>
          <button
            className="lrp-btn lrp-btn-primary"
            onClick={() => navigate("/loginregister")}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rpp-container">
      <div className="rpp-card">
        <h2 className="rpp-head2">Set a New Password</h2>
        <form onSubmit={handleSubmit} className="rpp-form" noValidate>
          <label>New Password</label>
          <input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} />

          <label>Confirm Password</label>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />

          {error && <p className="rpp-error">{error}</p>}

          <button type="submit" className="lrp-btn lrp-btn-primary">Save New Password</button>
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
