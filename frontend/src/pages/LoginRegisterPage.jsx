import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../css/LoginRegisterPage.css";
import LoginFood from "../assets/LoginFood.png";
import { API_URL } from "../config/api";

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

  // Lockout state
  const [lockouts, setLockouts] = useState(() => {
    const saved = localStorage.getItem("accountLockouts");
    return saved ? JSON.parse(saved) : {};
  });
  const [remainingTime, setRemainingTime] = useState(0);

  const navigate = useNavigate();
  const { login, checkSession } = useAuth(); // ✅ IMPORTANT

  // Sync lockouts across tabs
  useEffect(() => {
    const sync = (e) => {
      if (e.key === "accountLockouts")
        setLockouts(e.newValue ? JSON.parse(e.newValue) : {});
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  // Persist lockouts
  useEffect(() => {
    localStorage.setItem("accountLockouts", JSON.stringify(lockouts));
  }, [lockouts]);

  // Countdown + auto unlock
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
          if (updated[email]) {
            updated[email].attemptCount = 0;
            if (updated[email].pendingPromotion && updated[email].lockStage < 2) {
              updated[email].lockStage += 1;
            }
            updated[email].unlockAt = null;
            updated[email].pendingPromotion = false;
          }
          return updated;
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [email, lockouts]);

  // ✅ Listen to email verification & sync with database
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.emailVerified) {
        try {
          await fetch(`${API_URL}/verify-email/sync`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: user.email }),
          });
        } catch (err) {
          console.error("Sync error:", err);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // ✅ FIXED LOGIN — No more manual refresh needed!
  const handleLogin = async () => {
    setLoginError("");

    // 1. Check lockout
    if (lockouts[email]?.unlockAt > Date.now()) {
      setLoginError(`Account locked. Try again in ${formatTime(remainingTime)}`);
      return;
    }

    // 2. Validate empty fields
    if (!email || !password) {
      setLoginError("Please fill in all fields.");
      return;
    }

    try {
      // ✅ 3. Backend login (creates session)
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, rememberDevice }),
      });

      const data = await res.json();

      // ✅ 4. If login is successful
      if (res.ok && data.success) {
        // Clear lockout
        setLockouts((prev) => {
          const updated = { ...prev };
          delete updated[email];
          return updated;
        });

        // ✅ 5. Force AuthContext to reload /auth/session
        await checkSession();

        // ✅ 6. Redirect based on role
        const role = data?.user?.role;
        navigate(role === "admin" ? "/admin" : "/home");
        return;
      }

      // 7. Handle unverified email (auto-verify Firebase)
      if (data.notVerified) {
        try {
          const fb = await signInWithEmailAndPassword(auth, email, password);
          if (!fb.user.emailVerified) {
            await sendEmailVerification(fb.user, {
              url: window.location.origin + "/loginregister",
            });
            setLoginError("Email not verified. New verification sent.");
            return;
          }
        } catch (error) {
          console.error("Auto-verify error:", error);
        }
      }

      // 8. Wrong password → apply lock system
      handleFailedAttempt(email);
      setLoginError(data.message || "Invalid email or password.");
    } catch (err) {
      console.error("Login error:", err);
      setLoginError("Server error. Please try again.");
    }
  };
  // ✅ Lockout failed attempt logic
  const handleFailedAttempt = (email) => {
    setLockouts((prev) => {
      const entry = prev[email] || {
        attemptCount: 0,
        lockStage: 0,
        unlockAt: null,
        pendingPromotion: false,
      };

      entry.attemptCount += 1;

      // Stage 0 → 5 tries → lock 2 mins
      if (entry.lockStage === 0 && entry.attemptCount >= 5) {
        entry.unlockAt = Date.now() + 2 * 60 * 1000;
        entry.pendingPromotion = true;
        entry.attemptCount = 0;
      }
      // Stage 1 → 1 try → lock 5 mins
      else if (entry.lockStage === 1 && entry.attemptCount >= 1) {
        entry.unlockAt = Date.now() + 5 * 60 * 1000;
        entry.pendingPromotion = true;
        entry.attemptCount = 0;
      }
      // Stage 2 → 1 try → lock 10 mins (final)
      else if (entry.lockStage === 2 && entry.attemptCount >= 1) {
        entry.unlockAt = Date.now() + 10 * 60 * 1000;
        entry.pendingPromotion = false;
        entry.attemptCount = 0;
      }

      return {
        ...prev,
        [email]: entry,
      };
    });
  };

  // ✅ Password strength validation
  const validatePassword = (password) => {
    const minLength = 8;
    if (password.length < minLength)
      return `Password must be at least ${minLength} characters long`;
    if (!/[A-Z]/.test(password))
      return "Password must contain an uppercase letter";
    if (!/[a-z]/.test(password))
      return "Password must contain a lowercase letter";
    if (!/[0-9]/.test(password))
      return "Password must contain a number";
    if (!/[!@#$%^&*(),.?\":{}|<>]/.test(password))
      return "Password must contain a special character (!@#$...)";
    return null;
  };

  // ✅ Fully working Register Function (Firebase + MySQL)
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
      // ✅ Step 1: Register in your backend MySQL
      const res = await fetch(`${API_URL}/register`, {
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
        setRegisterError(data.message || "Registration failed!");
        return;
      }

      // ✅ Step 2: Register in Firebase (for email verification)
      const fbUser = await createUserWithEmailAndPassword(
        auth,
        regEmail,
        regPassword
      );

      // ✅ Step 3: Send verification email
      await sendEmailVerification(fbUser.user, {
        url: window.location.origin + "/loginregister",
        handleCodeInApp: false,
      });

      alert("Registered! Please verify your email before logging in.");
      setFirstName("");
      setLastName("");
      setRegEmail("");
      setRegPassword("");
      setActiveTab("login");
    } catch (err) {
      console.error("Register error:", err);
      setRegisterError("Failed to register. Please try again.");
    }
  };

  // ✅ Guest login (no authentication, just local role)
  const handleGuest = () => {
    navigate("/home"); // handled as guest elsewhere
  };

  // ✅ Return UI (unchanged structure — fully intact)
  return (
    <div className="login-register-page">
      {/* Left image section */}
      <div className="lrp-image-section">
        <img src={LoginFood} alt="Login Food" />
        <div className="lrp-image-overlay"></div>
        <div className="lrp-image-text">
          <h1>Sarawak Food Heritage</h1>
          <p>Discover, preserve, and celebrate Sarawak culinary traditions</p>
        </div>
      </div>

      {/* Right form section */}
      <div className="lrp-form-section">
        <div className="lrp-card">
          <div className="lrp-card-header">
            <h3>Welcome to SarawakEats</h3>
            <p>Preserving and celebrating Sarawak's food culture</p>
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
          {activeTab === "login" ? (
            <div className="lrp-form-content">
              {/* ✅ Error message */}
              {loginError && (
                <div className="lrp-error-box">
                  {loginError}
                  {lockouts[email]?.unlockAt > Date.now() && (
                    <p className="lrp-timer">
                      Try again in {formatTime(remainingTime)}
                    </p>
                  )}
                </div>
              )}

              {/* ✅ Email Input */}
              <div>
                <label>Email</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* ✅ Password Input */}
              <div>
                <label>Password</label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {/* ✅ Remember Me */}
              <div className="otp-remember">
                <input
                  id="remember-device"
                  type="checkbox"
                  checked={rememberDevice}
                  onChange={(e) => setRememberDevice(e.target.checked)}
                />
                <label htmlFor="remember-device">Remember me for 7 days</label>
              </div>

              {/* ✅ Login Button */}
              <button
                onClick={handleLogin}
                className="lrp-btn lrp-btn-primary"
                disabled={
                  lockouts[email]?.unlockAt &&
                  lockouts[email].unlockAt > Date.now()
                }
              >
                {lockouts[email]?.unlockAt > Date.now() ? "Locked" : "Sign In"}
              </button>

              {/* ✅ Forgot Password */}
              <button
                onClick={() => navigate("/forgotpassword")}
                className="lrp-btn lrp-btn-primary"
              >
                Forgot Password
              </button>

              {/* ✅ Divider */}
              <div className="lrp-divider"><span>or</span></div>

              {/* ✅ Guest login */}
              <button
                onClick={handleGuest}
                className="lrp-btn lrp-btn-outline"
              >
                Continue as Guest
              </button>
            </div>
          ) : (
            // ✅ Register Form
            <div className="lrp-form-content">
              {registerError && (
                <div className="lrp-error-box">{registerError}</div>
              )}

              {/* ✅ First + Last Name */}
              <div className="lrp-grid">
                <div>
                  <label>First Name</label>
                  <input
                    type="text"
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div>
                  <label>Last Name</label>
                  <input
                    type="text"
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>

              {/* ✅ Email */}
              <div>
                <label>Email</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                />
              </div>

              {/* ✅ Password */}
              <div>
                <label>Password</label>
                <input
                  type="password"
                  placeholder="Create a password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                />
                <p className="password-hint">
                  Password must include uppercase, lowercase, number, and symbol.
                </p>
              </div>

              {/* ✅ Register Button */}
              <button
                onClick={handleRegister}
                className="lrp-btn lrp-btn-primary"
              >
                Create Account
              </button>

              {/* ✅ Divider */}
              <div className="lrp-divider"><span>or</span></div>

              {/* ✅ Guest */}
              <button
                onClick={handleGuest}
                className="lrp-btn lrp-btn-outline"
              >
                Continue as Guest
              </button>
            </div>
          )}

          {/* Footer Text */}
          <p className="lrp-footer-text">
            Join our community to contribute recipes & preserve Sarawak’s heritage.
          </p>
        </div>
      </div>
    </div>
  );
}
