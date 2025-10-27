import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../css/LoginRegisterPage.css";
import LoginFood from "../assets/LoginFood.png";
import { FaEye, FaEyeSlash } from "react-icons/fa"; // 👁️ Password toggle icons

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Firebase imports
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  onAuthStateChanged,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../config/firebase";

export default function LoginRegisterPage() {
  const [activeTab, setActiveTab] = useState("login");

  // ✅ Login states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false); // 👁️

  // ✅ Register states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false); // 👁️

  const [rememberDevice, setRememberDevice] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [registerError, setRegisterError] = useState("");

  // ✅ Lockout system
  const [lockouts, setLockouts] = useState(() => {
    const saved = localStorage.getItem("accountLockouts");
    return saved ? JSON.parse(saved) : {};
  });
  const [remainingTime, setRemainingTime] = useState(0);

  const navigate = useNavigate();
  const { setUser, loginAsGuest } = useAuth();
  // ✅ Sync lockouts across tabs
  useEffect(() => {
    const sync = (e) => {
      if (e.key === "accountLockouts") {
        setLockouts(e.newValue ? JSON.parse(e.newValue) : {});
      }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  // ✅ Save lockouts in localStorage
  useEffect(() => {
    localStorage.setItem("accountLockouts", JSON.stringify(lockouts));
  }, [lockouts]);

  // ✅ Countdown for unlock timer
  useEffect(() => {
    if (!email || !lockouts[email]?.unlockAt) return;
    const interval = setInterval(() => {
      const diff = Math.max(
        0,
        Math.ceil((lockouts[email].unlockAt - Date.now()) / 1000)
      );
      setRemainingTime(diff);

      if (diff <= 0) {
        setLockouts((prev) => {
          const updated = { ...prev };
          const entry = updated[email];
          if (entry) {
            if (entry.pendingPromotion) {
              entry.lockStage = Math.min((entry.lockStage || 0) + 1, 3);
            }
            entry.unlockAt = null;
            entry.attemptCount = 0;
            entry.pendingPromotion = false;
            entry.showReset = false;
          }
          return updated;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [email, lockouts]);

  // ✅ Listen for Firebase email verification → sync to MySQL
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.emailVerified) {
        try {
          await fetch(`${API_URL}/api/verify-email/sync`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: user.email }),
          });
          console.log("✅ Email verification synced to database");
        } catch (err) {
          console.error("❌ Sync error:", err);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // ✅ Format seconds to mm:ss
  const formatTime = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // ✅ Show reset password suggestion (Stage 3+)
  const shouldSuggestReset = (email) => {
    const entry = lockouts[email];
    return !!(entry && entry.lockStage >= 3);
  };
  // ✅ HANDLE LOGIN
  const handleLogin = async () => {
    setLoginError("");

    const locked = lockouts[email];
    if (locked?.unlockAt && locked.unlockAt > Date.now()) {
      setLoginError(
        `Account locked. Try again in ${formatTime(
          Math.ceil((locked.unlockAt - Date.now()) / 1000)
        )}.`
      );
      return;
    }

    if (!email || !password) {
      setLoginError("Please fill in all fields.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, rememberDevice }),
      });

      const data = await res.json();

      // ✅ Success → set user & redirect
      if (res.ok && data.success && data.user) {
        setUser(data.user);
        setLockouts((prev) => {
          const updated = { ...prev };
          delete updated[email];
          return updated;
        });
        navigate(data.user.role === "admin" ? "/admin" : "/home");
        return;
      }

      // ✅ Not Verified → auto resend Firebase email
      if (data.notVerified) {
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;
          if (!user.emailVerified) {
            await sendEmailVerification(user, {
              url: window.location.origin + "/loginregister",
            });
          }
          setLoginError("Email not verified. A new verification email has been sent.");
        } catch (err) {
          setLoginError("Email not verified. Please check your inbox.");
        }
        return;
      }

      // ❌ Wrong credentials → Lockout
      handleFailedAttempt(email);
      setLoginError(data.message || "Invalid email or password.");
    } catch (err) {
      setLoginError("Login failed. Please try again.");
    }
  };

  // ✅ Failed attempt logic
  const handleFailedAttempt = (email) => {
    setLockouts((prev) => {
      const entry =
        prev[email] || {
          attemptCount: 0,
          lockStage: 0,
          unlockAt: null,
          pendingPromotion: false,
          showReset: false,
        };

      let { attemptCount, lockStage, unlockAt, pendingPromotion } = entry;
      attemptCount++;

      if (lockStage === 0 && attemptCount >= 5) {
        unlockAt = Date.now() + 2 * 60 * 1000;
        pendingPromotion = true;
        attemptCount = 0;
      } else if (lockStage === 1 && attemptCount >= 1) {
        unlockAt = Date.now() + 5 * 60 * 1000;
        pendingPromotion = true;
        attemptCount = 0;
      } else if (lockStage === 2 && attemptCount >= 1) {
        unlockAt = Date.now() + 10 * 60 * 1000;
        pendingPromotion = true;
        attemptCount = 0;
      } else if (lockStage >= 3) {
        unlockAt = null;
        pendingPromotion = false;
      }

      return {
        ...prev,
        [email]: {
          attemptCount,
          lockStage,
          unlockAt,
          pendingPromotion,
          showReset: lockStage >= 3,
        },
      };
    });
  };

  // ✅ Guest Login
  const handleGuest = () => {
    loginAsGuest();
    navigate("/home");
  };

  const getLockLabel = (stage) => {
    if (stage === 0) return "2 minutes lock";
    if (stage === 1) return "5 minutes lock";
    if (stage === 2) return "10 minutes lock";
    return "Account protection";
  };

  // ✅ LOGIN UI
  return (
    <div className="login-register-page">
      <div className="lrp-image-section">
        <img src={LoginFood} alt="Login Visual" />
        <div className="lrp-image-overlay"></div>
        <div className="lrp-image-text">
          <h1>Sarawak Food Heritage</h1>
          <p>Discover, preserve, and celebrate the rich culinary traditions of Sarawak</p>
        </div>
      </div>

      <div className="lrp-form-section">
        <div className="lrp-card">
          <div className="lrp-card-header">
            <div className="lrp-logo">🍽️</div>
            <h3>Welcome to SarawakEats</h3>
          </div>

          {/* Tabs */}
          <div className="lrp-tabs">
            <button
              className={`lrp-tab ${activeTab === "login" ? "active" : ""}`}
              onClick={() => setActiveTab("login")}
            >
              Login
            </button>
            <button
              className={`lrp-tab ${activeTab === "register" ? "active" : ""}`}
              onClick={() => setActiveTab("register")}
            >
              Register
            </button>
          </div>

          {/* ✅ LOGIN FORM */}
          {activeTab === "login" ? (
            <div className="lrp-form-content">
              {loginError && (
                <div className="lrp-error-box">
                  {loginError}
                  {lockouts[email]?.unlockAt > Date.now() && (
                    <p className="lrp-timer">
                      Try again in {formatTime(remainingTime)} ({getLockLabel(lockouts[email].lockStage)})
                    </p>
                  )}
                  {shouldSuggestReset(email) && (
                    <p className="lrp-reset-hint">
                      Too many attempts.{" "}
                      <span
                        onClick={() => navigate("/forgotpassword")}
                        style={{ color: "blue", cursor: "pointer", textDecoration: "underline" }}
                      >
                        Reset your password here.
                      </span>
                    </p>
                  )}
                </div>
              )}

              {/* Email */}
              <div>
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  placeholder="e.g. johntan@gmail.com"
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* Password with eye icon */}
              <div>
                <label>Password</label>
                <div className="password-wrapper">
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    value={password}
                    placeholder="e.g. John123!"
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <span
                    className="toggle-password"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                  >
                    {showLoginPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
              </div>

              <div className="otp-remember">
                <input
                  id="remember-device"
                  type="checkbox"
                  checked={rememberDevice}
                  onChange={(e) => setRememberDevice(e.target.checked)}
                />
                <label htmlFor="remember-device">Remember me for 7 days</label>
              </div>

              <button onClick={handleLogin} className="lrp-btn lrp-btn-primary">
                Sign In
              </button>

              <button
                onClick={() => navigate("/forgotpassword")}
                className="lrp-btn lrp-btn-primary"
              >
                Forgot Password
              </button>

              <div className="lrp-divider">
                <span>or</span>
              </div>
              <button
                onClick={handleGuest}
                className="lrp-btn lrp-btn-outline"
              >
                Continue as Guest
              </button>
            </div>
          ) : null}
          {/* ✅ REGISTER FORM */}
          {activeTab === "register" && (
            <div className="lrp-form-content">
              {registerError && (
                <div className="lrp-error-box">{registerError}</div>
              )}

              {/* First & Last Name */}
              <div className="lrp-grid">
                <div>
                  <label>First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    placeholder="e.g. John"
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div>
                  <label>Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    placeholder="e.g. Tan"
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label>Email</label>
                <input
                  type="email"
                  value={regEmail}
                  placeholder="e.g. johntan@gmail.com"
                  onChange={(e) => setRegEmail(e.target.value)}
                />
              </div>

              {/* Password with eye icon toggle */}
              <div>
                <label>Password</label>
                <div className="password-wrapper">
                  <input
                    type={showRegPassword ? "text" : "password"}
                    value={regPassword}
                    placeholder="e.g. John123!"
                    onChange={(e) => setRegPassword(e.target.value)}
                  />
                  <span
                    className="toggle-password"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                  >
                    {showRegPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
              </div>

              <button
                onClick={handleRegister}
                className="lrp-btn lrp-btn-primary"
              >
                Create Account
              </button>

              <div className="lrp-divider">
                <span>or</span>
              </div>

              <button
                onClick={handleGuest}
                className="lrp-btn lrp-btn-outline"
              >
                Continue as Guest
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
