import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import "../css/ResetPasswordPage.css";

// ✅ Firebase for password reset
import {
  confirmPasswordReset,
  verifyPasswordResetCode,
} from "firebase/auth";
import { auth } from "../config/firebase";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  // ✅ Firebase includes this in the email link: /resetpassword?oobCode=xxxx
  const oobCode = params.get("oobCode");

  // ✅ Email will be securely fetched using the oobCode (so we don't trust URL email)
  const [email, setEmail] = useState("");

  // ✅ New password fields
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");

  // ✅ UI states
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // ✅ Step 1: When page loads, verify the oobCode & fetch associated email
  useEffect(() => {
    if (oobCode) {
      verifyPasswordResetCode(auth, oobCode)
        .then((emailFromFirebase) => {
          // ✅ This is the real account email tied to the reset token
          setEmail(emailFromFirebase);
        })
        .catch(() => {
          // ❌ Invalid / expired / already used link
          setError("Invalid or expired reset link. Please request a new one.");
        });
    }
  }, [oobCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (pwd.length < 8) {
      return setError("Password must be at least 8 characters.");
    }
    if (pwd !== confirm) {
      return setError("Passwords do not match.");
    }

    try {
      // ✅ Step 2: Reset password in Firebase (using oobCode)
      await confirmPasswordReset(auth, oobCode, pwd);

      // ✅ Step 3: Sync password to MySQL (hashing done in backend)
      if (email) {
        await fetch(`${API_URL}/api/auth/updatePassword`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            email: email,
            newPassword: pwd,
          }),
        });
      }

      // ✅ Step 4: Show success, then redirect to login page
      setSuccess(true);
      setTimeout(() => navigate("/loginregister"), 2000);
    } catch (err) {
      console.error(err);
      setError(
        "Something went wrong. The reset link may be invalid or expired."
      );
    }
  };

  // ✅ If no oobCode is in the URL at all, show error immediately
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

  // ✅ Show success screen
  if (success) {
    return (
      <div className="rpp-container">
        <div className="rpp-card">
          <h2 className="rpp-head2">Password Updated Successfully!</h2>
          <p>You can now log in with your new password.</p>
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
          <input
            type="password"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
          />

          <label>Confirm Password</label>
          <input
            type="password"
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
