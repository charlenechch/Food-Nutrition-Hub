import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../css/LoginRegisterPage.css";
import LoginFood from "../assets/LoginFood.png";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Firebase imports
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  onAuthStateChanged,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../config/firebase";

// ✅ NEW: Eye icon imports (added only, no removal)
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function LoginRegisterPage() {
  const [activeTab, setActiveTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberDevice, setRememberDevice] = useState(false);
  const [loginError, setLoginError] = useState("");

  // ✅ Register fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [registerError, setRegisterError] = useState("");

  // ✅ Resend verification states
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [showResendButton, setShowResendButton] = useState(false);
  
  // ✅ NEW: Password visibility toggle states (added only, original untouched)
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);

  // ✅ Lockout system
  const [lockouts, setLockouts] = useState(() => {
    const saved = localStorage.getItem("accountLockouts");
    return saved ? JSON.parse(saved) : {};
  });
  const [remainingTime, setRemainingTime] = useState(0);

  const navigate = useNavigate();
  const { setUser, loginAsGuest } = useAuth(); // ✅ use setUser instead of login(email)
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

  // ✅ Save lockouts
  useEffect(() => {
    localStorage.setItem("accountLockouts", JSON.stringify(lockouts));
  }, [lockouts]);

  // ✅ Countdown & unlock system
  useEffect(() => {
    if (!email || !lockouts[email]?.unlockAt) return;
    const interval = setInterval(() => {
      const diff = Math.max(
        0,
        Math.ceil((lockouts[email].unlockAt - Date.now()) / 1000)
      );
      setRemainingTime(diff);

      if (diff <= 0) {
        // Auto-unlock & promote stage _after_ unlock
        setLockouts((prev) => {
          const newData = { ...prev };
          const entry = newData[email];
          if (entry) {
            // ⬇️ allow promotion up to stage 3 (so stage 2 → 3 after 10-min lock)
            if (entry.pendingPromotion) {
              entry.lockStage = Math.min((entry.lockStage || 0) + 1, 3);
            }
            entry.unlockAt = null;
            entry.attemptCount = 0;
            entry.pendingPromotion = false;
            // Clear the reset hint after unlock; it will be shown on next failure at stage 3+
            entry.showReset = false;
          }
          return newData;
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [email, lockouts]);

  // ✅ Resend verification cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // ✅ Listen for Firebase email verification (sync to MySQL)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.emailVerified) {
        try {
          await fetch(`${API_URL}/api/verifyEmail/sync`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: user.email }),
          });
          console.log("✅ Verification synced to Database");
        } catch (err) {
          console.error("❌ Sync error:", err);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // ✅ Handle resend verification email
  const handleResendVerification = async () => {
    if (resendCooldown > 0 || isResending) return;
    
    setIsResending(true);
    
    try {
      // Check backend rate limiting
      const checkRes = await fetch(`${API_URL}/api/resendVerification`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      const checkData = await checkRes.json();
      
      if (!checkRes.ok) {
        if (checkRes.status === 429 && checkData.remainingSeconds) {
          setResendCooldown(checkData.remainingSeconds);
          setLoginError(`Please wait ${checkData.remainingSeconds} seconds before requesting another email.`);
        } else {
          setLoginError(checkData.error || "Failed to resend verification email");
        }
        setIsResending(false);
        return;
      }
      
      // Sign in to Firebase and send verification email
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      if (!user.emailVerified) {
        await sendEmailVerification(user, {
          url: window.location.origin + "/loginregister",
        });
        
        setLoginError("Verification email sent! Please check your inbox or spam folder.");
        setResendCooldown(120);
        setShowResendButton(false);
        console.log("Verification email resent successfully");
      } else {
        setLoginError("Your email is already verified. Please try logging in.");
      }
      
    } catch (err) {
      console.error("Resend verification error:", err);
      setLoginError("Failed to resend verification email. Please try again later.");
    } finally {
      setIsResending(false);
    }
  };

  // ✅ Helper: should we show the reset suggestion (Stage 3+)? 
  const shouldSuggestReset = (email) => {
    const entry = lockouts[email];
    return !!(entry && entry.lockStage >= 3);
  };

  // ✅ LOGIN HANDLER
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

      // ✅ Success → set user into context properly
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

      // ✅ Not verified → show resend button
      if (data.notVerified) {
        setLoginError("Email is not verified. Please check your inbox or spam folder.");
        setShowResendButton(true);
        return;
      }

      // ❌ Wrong credentials → Lockout system
      handleFailedAttempt(email);
      setLoginError(data.message || "Invalid email or password.");
    } catch (err) {
      console.error("Login error:", err);
      setLoginError("Login failed. Please try again.");
    }
  };

  // ✅ Failed attempt logic (with Stage 3 suggestion)
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
        // Stage 0 → lock 2 min, then promote to stage 1 after unlock
        unlockAt = Date.now() + 2 * 60 * 1000;
        attemptCount = 0;
        pendingPromotion = true;
      } else if (lockStage === 1 && attemptCount >= 1) {
        // Stage 1 → lock 5 min, then promote to stage 2 after unlock
        unlockAt = Date.now() + 5 * 60 * 1000;
        attemptCount = 0;
        pendingPromotion = true;
      } else if (lockStage === 2 && attemptCount >= 1) {
        // Stage 2 → lock 10 min, then promote to stage 3 after unlock
        unlockAt = Date.now() + 10 * 60 * 1000;
        attemptCount = 0;
        pendingPromotion = true;
      } else if (lockStage >= 3) {
        // Stage 3+ → no more time locks; suggest password reset
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
  // ✅ Password Validation
  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNum = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength)
      return `Password must be at least ${minLength} characters long`;
    if (!hasUpper) return "Password must contain an uppercase letter";
    if (!hasLower) return "Password must contain a lowercase letter";
    if (!hasNum) return "Password must contain a number";
    if (!hasSpecial)
      return "Password must contain a special character (!@#$%^&*...)";
    return null;
  };

  // ✅ REGISTER Handler (MySQL + Firebase + Email Verification)
  const handleRegister = async () => {
    setRegisterError("");

    if (!firstName || !lastName || !regEmail || !regPassword) {
      setRegisterError("Please fill in all fields.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(regEmail)) {
      setRegisterError("Please enter a valid email address.");
      return;
    }

    const passwordError = validatePassword(regPassword);
    if (passwordError) {
      setRegisterError(passwordError);
      return;
    }

    try {
      // ✅ Step 1 — Register in MySQL database
      const res = await fetch(`${API_URL}/api/register`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstname: firstName,
          lastname: lastName,
          email: regEmail,
          password: regPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setRegisterError(data.message || "Registration failed");
        return;
      }

      // ✅ Step 2 — Create Firebase user
      const fb = await createUserWithEmailAndPassword(
        auth,
        regEmail,
        regPassword
      );

      // ✅ Step 3 — Send Firebase verification email
      await sendEmailVerification(fb.user, {
        url: window.location.origin + "/loginregister",
      });

      alert("Registration successful! Please verify your email to continue.");
      setFirstName("");
      setLastName("");
      setRegEmail("");
      setRegPassword("");
      setActiveTab("login");
    } catch (err) {
      console.error("Register error:", err);
      setRegisterError("Something went wrong. Try again.");
    }
  };

  // ✅ Guest login → does not affect member/admin sessions
  const handleGuest = () => {
    loginAsGuest();
    navigate("/home");
  };

  const getLockLabel = (stage) => {
    if (stage === 0) return "2 minutes lock";
    if (stage === 1) return "5 minutes lock";
    if (stage === 2) return "10 minutes lock";
    // Stage 3+ doesn't show timers anymore
    return "Account protection";
  };

  // ✅ RETURN – All code preserved, only placeholders + eye toggle added
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
                        Forgot your password? Reset it here.
                      </span>
                    </p>
                  )}

                  {showResendButton && (
                    <div style={{ marginTop: "12px", textAlign: "center" }}>
                      <button
                        onClick={handleResendVerification}
                        disabled={resendCooldown > 0 || isResending}
                        style={{
                          padding: "8px 16px",
                          backgroundColor: resendCooldown > 0 || isResending ? "#ccc" : "#8B4513",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          cursor: resendCooldown > 0 || isResending ? "not-allowed" : "pointer",
                          fontSize: "14px",
                          fontWeight: "500",
                        }}
                      >
                        {isResending 
                          ? "Sending..." 
                          : resendCooldown > 0 
                            ? `Resend in ${formatTime(resendCooldown)}`
                            : "Resend Verification Email"
                        }
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  placeholder="e.g. johndoe@gmail.com"
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label>Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    value={password}
                    placeholder="e.g. John123!"
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <span
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    style={{
                      position: "absolute",
                      right: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      cursor: "pointer",
                      color: "#555",
                    }}
                  >
                    {showLoginPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
              </div>

              {/* ✅ Same buttons unchanged */}
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
              <button onClick={() => navigate("/forgotpassword")} className="lrp-btn lrp-btn-primary">
                Forgot Password
              </button>
              <div className="lrp-divider"><span>or</span></div>

              <button onClick={handleGuest} className="lrp-btn lrp-btn-outline">
                Continue as Guest
              </button>
            </div>
          ) : (
            /* ✅ REGISTER FORM (PRESERVED + enhanced inputs) */
            <div className="lrp-form-content">
              {registerError && (
                <div className="lrp-error-box">{registerError}</div>
              )}

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

              <div>
                <label>Email</label>
                <input
                  type="email"
                  value={regEmail}
                  placeholder="e.g. johndoe@gmail.com"
                  onChange={(e) => setRegEmail(e.target.value)}
                />
              </div>

              <div>
                <label>Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showRegPassword ? "text" : "password"}
                    value={regPassword}
                    placeholder="e.g. John123!"
                    onChange={(e) => setRegPassword(e.target.value)}
                  />
                  <span
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    style={{
                      position: "absolute",
                      right: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      cursor: "pointer",
                      color: "#555",
                    }}
                  >
                    {showRegPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
              </div>

              <button onClick={handleRegister} className="lrp-btn lrp-btn-primary">
                Create Account
              </button>
              <div className="lrp-divider"><span>or</span></div>

              <button onClick={handleGuest} className="lrp-btn lrp-btn-outline">
                Continue as Guest
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
