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

  // ✅ Step 1: Verify Firebase reset link and get the associated email
  useEffect(() => {
    if (oobCode) {
      verifyPasswordResetCode(auth, oobCode)
        .then((emailFromFirebase) => {
          console.log("✅ Firebase verified email:", emailFromFirebase);
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

  // ✅ Step 2: Handle password reset submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (pwd.length < 8)
      return setError("Password must be at least 8 characters long.");
    if (pwd !== confirm)
      return setError("Passwords do not match.");

    try {
      // ✅ Reset password in Firebase first
      await confirmPasswordReset(auth, oobCode, pwd);
      console.log("✅ Firebase password updated successfully.");

      // ✅ Ensure email is available before backend sync
      if (email && email.trim() !== "") {
        console.log("🔍 Syncing password to backend:", { email, newPassword: pwd });

        const res = await fetch(`${API_URL}/api/auth/updatePassword`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, newPassword: pwd }),
        });

        const data = await res.json();
        console.log("🔧 Backend updatePassword response:", data);

        if (!res.ok) {
          throw new Error(data.message || "Failed to update password in backend.");
        }

        console.log("✅ Password synced successfully to MySQL backend.");
      } else {
        console.warn("⚠️ Skipped backend password sync — missing email from Firebase.");
      }

      // ✅ Mark success and redirect
      setSuccess(true);
      setTimeout(() => navigate("/loginregister"), 2500);

    } catch (err) {
      console.error("❌ Password reset error:", err);
      setError("Something went wrong. Please try again or request a new link.");
    }
  };

  // ✅ Loading UI
  if (loading) {
    return (
      <div className="rpp-container">
        <div className="rpp-card">
          <h2 className="rpp-head2">Verifying link...</h2>
        </div>
      </div>
    );
  }

  // ✅ Success message
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

  // ✅ Error message
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
            placeholder="Enter a new password (min 8 characters)"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
          />

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
