import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import "../css/ResetPasswordPage.css";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token");

  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  // UI-only “verify token”
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setValid(Boolean(token)); // valid if there is a token
      setLoading(false);
    }, 400);
  }, [token]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (pwd.length < 8) return setError("At least 8 characters");
    if (!/[A-Z]/.test(pwd) || !/[a-z]/.test(pwd) || !/[0-9]/.test(pwd) || !/[!@#$%^&*(),.?\":{}|<>]/.test(pwd)) {
      return setError("Use upper, lower, number, and symbol");
    }
    if (pwd !== confirm) return setError("Passwords don't match");
    // UI-only success
    setDone(true);
  };

  if (loading) {
    return (
      <div className="rpp-container">
        <div className="rpp-card"><p>Verifying link…</p></div>
      </div>
    );
  }

  if (!valid) {
    return (
      <div className="rpp-container">
        <div className="rpp-card">
          <h2 className="rpp-head2">Link invalid or expired</h2>
          <p className="rpp-subtext">Please request a new reset link.</p>
            <button
                type="button"
                className="lrp-btn lrp-btn-primary"
                onClick={() => navigate("/forgotpassword")}
            >
                Back
            </button>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="rpp-container">
        <div className="rpp-card">
          <h2 className="rpp-head2">Password updated</h2>
          <button className="lrp-btn lrp-btn-primary" onClick={() => navigate("/loginregister")}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rpp-container">
      <div className="rpp-card">
        <h2 className="rpp-head2">Set a new password</h2>
        <form onSubmit={handleSubmit} className="rpp-form" noValidate>
          <label>New password</label>
          <input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} autoComplete="new-password" />
          <label>Confirm password</label>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
          {error && <div className="rpp-error" role="alert">{error}</div>}
          <button type="submit" className="lrp-btn lrp-btn-primary">Save new password</button>
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