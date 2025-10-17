import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../css/LoginRegisterPage.css";
import LoginFood from "../assets/LoginFood.png";
import { API_URL } from "../config/api";

export default function LoginRegisterPage() {
  const [activeTab, setActiveTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Register fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [registerError, setRegisterError] = useState("");

  // 🔐 Per-account lockout
  const [lockouts, setLockouts] = useState(() => {
    const saved = localStorage.getItem("accountLockouts");
    return saved ? JSON.parse(saved) : {};
  });
  const [remainingTime, setRemainingTime] = useState(0);

  const navigate = useNavigate();
  const { login } = useAuth();

  // 🔄 Sync lockouts across tabs
  useEffect(() => {
    const syncLockouts = (e) => {
      if (e.key === "accountLockouts") {
        setLockouts(e.newValue ? JSON.parse(e.newValue) : {});
      }
    };
    window.addEventListener("storage", syncLockouts);
    return () => window.removeEventListener("storage", syncLockouts);
  }, []);

  // 💾 Persist lockouts
  useEffect(() => {
    localStorage.setItem("accountLockouts", JSON.stringify(lockouts));
  }, [lockouts]);

  // ⏳ Countdown + auto-unlock (promote after unlock)
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
          const copy = { ...prev };
          const entry = copy[email];
          if (entry) {
            const { pendingPromotion = false, lockStage = 0 } = entry;
            entry.unlockAt = null;
            entry.attemptCount = 0;

            // ✅ Promote only after unlock
            if (pendingPromotion && lockStage < 2) {
              entry.lockStage = lockStage + 1;
            }
            entry.pendingPromotion = false;
          }
          return copy;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [email, lockouts]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // 🔑 Login handler
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
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // ✅ Success → clear lockout
        setLockouts((prev) => {
          const updated = { ...prev };
          delete updated[email];
          return updated;
        });

        if (data.skipOTP) {
          login(data.user);
          navigate(data.user.role === "admin" ? "/admin" : "/home");
        } else {
          navigate(`/otpverification?email=${encodeURIComponent(email)}`);
        }
        return;
      }

      // ❌ Wrong credentials
      handleFailedAttempt(email);
      setLoginError("Invalid email or password.");
    } catch (err) {
      console.error("Login error:", err);
      setLoginError("Login failed. Please try again later.");
    }
  };

  // ⚙️ Failed attempt + progressive lock (fixed with promotion delay)
  const handleFailedAttempt = (email) => {
    setLockouts((prev) => {
      const entry =
        prev[email] || {
          attemptCount: 0,
          lockStage: 0,
          unlockAt: null,
          pendingPromotion: false,
        };
      let { attemptCount, lockStage, unlockAt, pendingPromotion } = entry;

      attemptCount += 1;

      // Stage 1: 5 attempts → 2 min lock
      if (lockStage === 0 && attemptCount >= 5) {
        unlockAt = Date.now() + 2 * 60 * 1000;
        attemptCount = 0;
        pendingPromotion = true;
      }
      // Stage 2: 1 attempt → 5 min lock
      else if (lockStage === 1 && attemptCount >= 1) {
        unlockAt = Date.now() + 5 * 60 * 1000;
        attemptCount = 0;
        pendingPromotion = true;
      }
      // Stage 3: 1 attempt → 10 min lock (final)
      else if (lockStage === 2 && attemptCount >= 1) {
        unlockAt = Date.now() + 10 * 60 * 1000;
        attemptCount = 0;
        pendingPromotion = false;
      }

      console.log(
        `Failed login for ${email} → Stage ${lockStage}, pendingPromotion=${pendingPromotion}, unlocks at ${
          unlockAt ? new Date(unlockAt).toLocaleTimeString() : "none"
        }`
      );

      return {
        ...prev,
        [email]: { attemptCount, lockStage, unlockAt, pendingPromotion },
      };
    });
  };

  // 🧾 Password validation
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

  // 🧾 Register
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
      if (res.ok) {
        setFirstName("");
        setLastName("");
        setRegEmail("");
        setRegPassword("");
        setActiveTab("login");
      } else {
        setRegisterError(data.error || data.message || "Registration failed!");
      }
    } catch (err) {
      console.error("Registration error:", err);
      setRegisterError("Something went wrong during registration.");
    }
  };

  // 👤 Guest login
  const handleGuest = () => {
    login({ role: "guest" });
    navigate("/home");
  };

  // 🏷️ Lock label
  const getLockLabel = (stage) => {
    if (stage === 0) return "2 minutes lock";
    if (stage === 1) return "5 minutes lock";
    return "10 minutes lock";
  };

  return (
    <div className="login-register-page">
      <div className="lrp-image-section">
        <img src={LoginFood} alt="Login Food" />
        <div className="lrp-image-overlay"></div>
        <div className="lrp-image-text">
          <h1>Sarawak Food Heritage</h1>
          <p>
            Discover, preserve, and celebrate the rich culinary traditions of
            Sarawak
          </p>
          <p>
            From manok pansoh to umai – explore authentic recipes and their
            cultural stories
          </p>
        </div>
      </div>

      <div className="lrp-form-section">
        <div className="lrp-card">
          <div className="lrp-card-header">
            <div className="lrp-logo">🍽️</div>
            <h3>Welcome to SarawakEats</h3>
            <p className="lrp-description">
              Preserving and celebrating Sarawak's culinary heritage
            </p>
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
                  {lockouts[email]?.unlockAt &&
                    lockouts[email].unlockAt > Date.now() && (
                      <p className="lrp-timer">
                        Try again in {formatTime(remainingTime)} (
                        {getLockLabel(lockouts[email].lockStage)})
                      </p>
                    )}
                </div>
              )}

              <div>
                <label>Email</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label>Password</label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button
                onClick={handleLogin}
                className="lrp-btn lrp-btn-primary"
                disabled={
                  lockouts[email]?.unlockAt &&
                  lockouts[email].unlockAt > Date.now()
                }
              >
                {lockouts[email]?.unlockAt &&
                lockouts[email].unlockAt > Date.now()
                  ? "Locked"
                  : "Sign In"}
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
              <button onClick={handleGuest} className="lrp-btn lrp-btn-outline">
                Continue as Guest
              </button>
            </div>
          ) : (
            <div className="lrp-form-content">
              {registerError && (
                <div className="lrp-error-box">{registerError}</div>
              )}

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

              <div>
                <label>Email</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                />
              </div>
              <div>
                <label>Password</label>
                <input
                  type="password"
                  placeholder="Create a password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                />
                <p className="password-hint">
                  Password must be at least 8 characters with uppercase,
                  lowercase, number, and symbol
                </p>
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
              <button onClick={handleGuest} className="lrp-btn lrp-btn-outline">
                Continue as Guest
              </button>
            </div>
          )}

          <p className="lrp-footer-text">
            Join our community to contribute recipes and preserve Sarawak's food
            culture
          </p>
        </div>
      </div>
    </div>
  );
}
