import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../css/LoginRegisterPage.css";
import LoginFood from "../assets/LoginFood.png";
import Modal from "../components/Modal";
import { FaEnvelopeOpenText } from "react-icons/fa";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  onAuthStateChanged,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../config/firebase";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function LoginRegisterPage() {
  // ------------------------------
  // state (existing)
  // ------------------------------
  const [activeTab, setActiveTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberDevice, setRememberDevice] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Register fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [registerError, setRegisterError] = useState("");

  // resend verification
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [showResendButton, setShowResendButton] = useState(false);
  const [storedPassword, setStoredPassword] = useState("");

  // password visibility toggles
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);

  // OTP states
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [tempUserId, setTempUserId] = useState(null);
  const [otpCode, setOtpCode] = useState("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [tempRememberMe, setTempRememberMe] = useState(false);

  // lockout system
  const [lockouts, setLockouts] = useState(() => {
    const saved = localStorage.getItem("accountLockouts");
    return saved ? JSON.parse(saved) : {};
  });
  const [remainingTime, setRemainingTime] = useState(0);

  // password criteria
  const [regPasswordCriteria, setRegPasswordCriteria] = useState({
    length: false,
    upper: false,
    lower: false,
    number: false,
    special: false,
  });

  // registration modal
  const [showRegSuccess, setShowRegSuccess] = useState(false);

  // ── ADDED: show/hide hint + ref to detect outside clicks
  const [showPasswordHint, setShowPasswordHint] = useState(false);
  const passwordHintRef = useRef(null);

  const navigate = useNavigate();
  const { user, setUser, loginAsGuest } = useAuth();

  // ------------------------------
  // existing effects (unchanged logic)
  // ------------------------------
  useEffect(() => {
    if (user && user.role !== "guest") {
      navigate(user.role === "admin" ? "/admin" : "/home");
    }
  }, [user, navigate]);

  useEffect(() => {
    const sync = (e) => {
      if (e.key === "accountLockouts") {
        setLockouts(e.newValue ? JSON.parse(e.newValue) : {});
      }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  useEffect(() => {
    localStorage.setItem("accountLockouts", JSON.stringify(lockouts));
  }, [lockouts]);

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
          const newData = { ...prev };
          const entry = newData[email];
          if (entry) {
            if (entry.pendingPromotion) {
              entry.lockStage = Math.min((entry.lockStage || 0) + 1, 3);
            }
            entry.unlockAt = null;
            entry.attemptCount = 0;
            entry.pendingPromotion = false;
            entry.showReset = false;
          }
          return newData;
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [email, lockouts]);

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.emailVerified) {
        try {
          await fetch(`${API_URL}/api/syncEmailVerification`, {
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

  // ── ADDED: click outside to close password hint
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        passwordHintRef.current &&
        !passwordHintRef.current.contains(e.target)
      ) {
        setShowPasswordHint(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ------------------------------
  // helper functions (kept)
  // ------------------------------
  const formatTime = (sec) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const updatePasswordCriteria = (password) => {
    setRegPasswordCriteria({
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    });
  };

  const handleResendVerification = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    setLoginError("");
    if (!storedPassword) {
      setLoginError("Session expired. Please try logging in again.");
      setIsResending(false);
      setShowResendButton(false);
      return;
    }
    try {
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
          setLoginError(
            `Please wait ${checkData.remainingSeconds} seconds before requesting another email.`
          );
        } else {
          setLoginError(checkData.error || "Failed to resend verification email");
        }
        setIsResending(false);
        return;
      }
      setResendCooldown(120);
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        storedPassword
      );
      const user = userCredential.user;
      await sendEmailVerification(user, {
        url: window.location.origin + "/loginregister",
      });
      setLoginError(checkData.message);
      setShowResendButton(true);
      setStoredPassword("");
    } catch (err) {
      console.error("Resend verification error:", err);
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setLoginError("Session expired. Please try logging in again.");
        setShowResendButton(false);
        setStoredPassword("");
      } else {
        setLoginError("Failed to resend verification email. Please try again later.");
      }
    } finally {
      setIsResending(false);
    }
  };

  // Verify the OTP code
  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) {
      setLoginError("Please enter a valid 6-digit code.");
      return;
    }

    setIsVerifyingOtp(true);
    setLoginError("");

    try {
      const res = await fetch(`${API_URL}/api/otp/verifyLogin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId: tempUserId, code: otpCode, rememberDevice: tempRememberMe }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setUser(data.user);
        navigate(data.user.role === "admin" ? "/admin" : "/home");
      } else {
        setLoginError(data.message || "Invalid code. Please try again.");
      }
    } catch (err) {
      console.error("OTP Error:", err);
      setLoginError("Verification failed. Please try again.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Resend OTP Handler
  const handleResendOtp = async () => {
    if (isResending) return; // Prevent double clicks
    setIsResending(true);
    setLoginError("");

    try {
      const res = await fetch(`${API_URL}/api/otp/sendLogin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        // Send the tempUserId we saved from the login step
        body: JSON.stringify({ userId: tempUserId }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setLoginError("A new code has been sent to your email.");
        setResendCooldown(60); // Start 60s cooldown
      } else {
        setLoginError(data.message || "Failed to resend code.");
      }
    } catch (err) {
      setLoginError("Network error. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

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

      // Check for 2FA trigger
      if (data.requires2FA) {
          setTempUserId(data.tempUserId);
          setTempRememberMe(data.rememberDevice);
          setShowOtpInput(true); 
          setLoginError(""); 
          return; // Stop here. Don't log in yet.
      }

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
      if (data.notVerified) {
        setLoginError("Email is not verified. Please check your inbox or spam folder.");
        setShowResendButton(true);
        setStoredPassword(password);
        return;
      }
      handleFailedAttempt(email);
      setLoginError(data.message || "Invalid email or password.");
    } catch (err) {
      console.error("Login error:", err);
      setLoginError("Login failed. Please try again.");
    }
  };

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
      if (lockStage === 0 && attemptCount >= 30) {
        unlockAt = Date.now() + 2 * 60 * 1000;
        attemptCount = 0;
        pendingPromotion = true;
      } else if (lockStage === 1 && attemptCount >= 1) {
        unlockAt = Date.now() + 5 * 60 * 1000;
        attemptCount = 0;
        pendingPromotion = true;
      } else if (lockStage === 2 && attemptCount >= 1) {
        unlockAt = Date.now() + 10 * 60 * 1000;
        attemptCount = 0;
        pendingPromotion = true;
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
      const fb = await createUserWithEmailAndPassword(
        auth,
        regEmail,
        regPassword
      );
      const firebaseUID = fb.user.uid;
      await sendEmailVerification(fb.user, {
        url: window.location.origin + "/loginregister",
      });
      const res = await fetch(`${API_URL}/api/register`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstname: firstName,
          lastname: lastName,
          email: regEmail,
          password: regPassword,
          firebaseUID: firebaseUID,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRegisterError(data.message || "Registration failed");
        return;
      }
      setShowRegSuccess(true);
      setFirstName("");
      setLastName("");
      setRegEmail("");
      setRegPassword("");
      setActiveTab("login");
      setRegPasswordCriteria({
        length: false, upper: false, lower: false, number: false, special: false
      });
    } catch (err) {
      console.error("Register error:", err);
      if (err.code === 'auth/email-already-in-use') {
        setRegisterError("This email is already registered. Please use a different email or try logging in.");
      } else if (err.code === 'auth/invalid-email') {
        setRegisterError("Invalid email format. Please check your email address.");
      } else if (err.code === 'auth/network-request-failed') {
        setRegisterError("Network error. Please check your internet connection and try again.");
      } else {
        setRegisterError("Registration failed. Please try again or contact support.");
      }
    }
  };

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
  // ---------- End of existing functions ----------
  // ------------------------------

  // ------------------------------
  // JSX (modified markup for password wrappers)
  // ------------------------------
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
                  {lockouts[email]?.showReset && (
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

              {showOtpInput ? (
                <div className="otp-form-section">
                  <div className="otp-header-box">
                    <p className="otp-text">
                      We sent a 6-digit code to <strong>{email}</strong>.
                    </p>
                  </div>

                  <div className="password-input-wrap">
                    <label>Verification Code</label>
                    <input
                      type="text"
                      className="otp-input-field"
                      value={otpCode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                        setOtpCode(val);
                      }}
                      placeholder="123456"
                      maxLength={6}
                      autoFocus
                    />
                  </div>

                  <button 
                    onClick={handleVerifyOtp} 
                    className="lrp-btn lrp-btn-primary otp-verify-btn"
                    disabled={isVerifyingOtp}
                  >
                    {isVerifyingOtp ? "Verifying..." : "Verify Login"}
                  </button>

                  <button 
                    onClick={handleResendOtp}
                    className="lrp-btn lrp-btn-outline otp-resend-btn"
                    disabled={resendCooldown > 0 || isResending}
                  >
                    {resendCooldown > 0 
                      ? `Resend available in ${resendCooldown}s` 
                      : isResending ? "Sending..." : "Resend Code"}
                  </button>
                  
                  <button 
                    onClick={() => {
                      setShowOtpInput(false);
                      setOtpCode("");
                      setLoginError("");
                    }} 
                    className="lrp-btn lrp-btn-outline otp-back-btn"
                  >
                    Back to Password
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <label>Email</label>
                    <input
                      type="email"
                      value={email}
                      placeholder="e.g. johndoe@gmail.com"
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="password-input-wrap">
                    <label>Password</label>
                    <input
                      type={showLoginPassword ? "text" : "password"}
                      value={password}
                      placeholder="e.g. John123!"
                      onChange={(e) => setPassword(e.target.value)}
                      aria-label="Login password"
                    />
                    <span
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="password-eye-icon"
                      role="button"
                      aria-label={showLoginPassword ? "Hide password" : "Show password"}
                    >
                      {showLoginPassword ? <FaEyeSlash /> : <FaEye />}
                    </span>
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
                  <button onClick={() => navigate("/forgotpassword")} className="lrp-btn lrp-btn-primary">
                    Forgot Password
                  </button>
                  <div className="lrp-divider"><span>or</span></div>

                  <button onClick={handleGuest} className="lrp-btn lrp-btn-outline">
                    Continue as Guest
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="lrp-form-content">
              {registerError && <div className="lrp-error-box">{registerError}</div>}

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

              {/* -----------------------------------------------------------------------
                  REGISTER password input + floating hint
                  - wrapper (password-input-wrap) is the positioning context
                  - eye icon uses same class
                  - floating hint uses password-hint-box
                 ----------------------------------------------------------------------- */}
              <div ref={passwordHintRef} className="password-input-wrap">
                <label>Password</label>

                <input
                  type={showRegPassword ? "text" : "password"}
                  value={regPassword}
                  placeholder="e.g. John123!"
                  onFocus={() => setShowPasswordHint(true)}
                  onChange={(e) => {
                    setRegPassword(e.target.value);
                    updatePasswordCriteria(e.target.value);
                    setShowPasswordHint(true);
                  }}
                  aria-describedby="password-hint"
                  aria-label="Register password"
                />

                <span
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="password-eye-icon"
                  role="button"
                  aria-label={showRegPassword ? "Hide password" : "Show password"}
                >
                  {showRegPassword ? <FaEyeSlash /> : <FaEye />}
                </span>

                {showPasswordHint && (
                  <div id="password-hint" className="password-hint-box" role="status" aria-live="polite">
                    <div className="password-hints">
                      <div className="password-hint-row">
                        <div className={`password-hint-icon ${regPasswordCriteria.length ? "password-hint-valid" : "password-hint-invalid"}`}>
                          {regPasswordCriteria.length ? "✅" : "❌"}
                        </div>
                        <div className={regPasswordCriteria.length ? "password-hint-valid" : "password-hint-invalid"}>
                          Minimum 8 characters
                        </div>
                      </div>

                      <div className="password-hint-row">
                        <div className={`password-hint-icon ${regPasswordCriteria.upper ? "password-hint-valid" : "password-hint-invalid"}`}>
                          {regPasswordCriteria.upper ? "✅" : "❌"}
                        </div>
                        <div className={regPasswordCriteria.upper ? "password-hint-valid" : "password-hint-invalid"}>
                          Uppercase letter
                        </div>
                      </div>

                      <div className="password-hint-row">
                        <div className={`password-hint-icon ${regPasswordCriteria.lower ? "password-hint-valid" : "password-hint-invalid"}`}>
                          {regPasswordCriteria.lower ? "✅" : "❌"}
                        </div>
                        <div className={regPasswordCriteria.lower ? "password-hint-valid" : "password-hint-invalid"}>
                          Lowercase letter
                        </div>
                      </div>

                      <div className="password-hint-row">
                        <div className={`password-hint-icon ${regPasswordCriteria.number ? "password-hint-valid" : "password-hint-invalid"}`}>
                          {regPasswordCriteria.number ? "✅" : "❌"}
                        </div>
                        <div className={regPasswordCriteria.number ? "password-hint-valid" : "password-hint-invalid"}>
                          Number
                        </div>
                      </div>

                      <div className="password-hint-row">
                        <div className={`password-hint-icon ${regPasswordCriteria.special ? "password-hint-valid" : "password-hint-invalid"}`}>
                          {regPasswordCriteria.special ? "✅" : "❌"}
                        </div>
                        <div className={regPasswordCriteria.special ? "password-hint-valid" : "password-hint-invalid"}>
                          Special character
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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

      <Modal
        open={showRegSuccess}
        title="Registration Successful"
        titleId="reg-success-title"
        icon={<FaEnvelopeOpenText />}
        primaryText="Close"
        onClose={() => setShowRegSuccess(false)}
        onPrimary={() => setShowRegSuccess(false)}
        centerActions
      >
        Please verify your email to continue. We've sent a verification link to your inbox.

        <strong style={{ display: 'block', marginTop: '15px' }}>
          Using Outlook, Hotmail, or a work email?
        </strong>
        <p style={{ fontSize: '14px', lineHeight: '1.5', margin: '5px 0 0' }}>
          Your email service might scan the link for security purposes and verify it for you. 
          If you see a "link already used" error, don't worry! It means you're verified. Just try to log in.
        </p>
      </Modal>
    </div>
  );
}
