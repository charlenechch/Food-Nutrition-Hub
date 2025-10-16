import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../css/LoginRegisterPage.css";
import LoginFood from "../assets/LoginFood.png";
import { API_URL } from "../config/api";

export default function LoginRegisterPage() {
  const [activeTab, setActiveTab] = useState("login");

  // Login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Register state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [registerError, setRegisterError] = useState("");

  // Lockout state (rate limiter)
  const [lockoutUntil, setLockoutUntil] = useState(null);
  const [remainingTime, setRemainingTime] = useState(0);

  const navigate = useNavigate();
  const { login } = useAuth();

  // Countdown timer for lockout
  useEffect(() => {
    if (!lockoutUntil) return;

    const timer = setInterval(() => {
      const diff = Math.max(0, Math.ceil((lockoutUntil - Date.now()) / 1000));
      setRemainingTime(diff);
      if (diff <= 0) {
        setLockoutUntil(null);
        setLoginError("");
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [lockoutUntil]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) return `Password must be at least ${minLength} characters long`;
    if (!hasUpperCase) return "Password must contain at least one uppercase letter";
    if (!hasLowerCase) return "Password must contain at least one lowercase letter";
    if (!hasNumber) return "Password must contain at least one number";
    if (!hasSpecialChar) return "Password must contain at least one special character (!@#$%^&*...)";
    return null;
  };

  // Handle Login
  const handleLogin = async () => {
    setLoginError("");

    if (lockoutUntil) return; // prevent login if locked out
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

      // Handle Rate Limiter
      if (res.status === 429) {
        const data = await res.json();
        setLoginError(data.error || "Too many attempts. Please wait before retrying.");

        const unlockTime = Date.now() + 10 * 60 * 1000; // 10 minutes
        setLockoutUntil(unlockTime);
        setRemainingTime(600);
        return;
      }

      const data = await res.json();

      if (res.ok && data.success) {
        if (data.skipOTP) {
          login(data.user);
          navigate(data.user.role === "admin" ? "/admin" : "/home");
        } else {
          navigate(`/otpverification?email=${encodeURIComponent(email)}`);
        }
      } else {
        setLoginError(data.message || "Invalid email or password.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setLoginError("Login failed. Please try again later.");
    }
  };

  // Handle Registration
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

      if (res.status === 429) {
        const data = await res.json();
        setRegisterError(data.error || "Too many registration attempts. Try again later.");
        return;
      }

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

  // Handle Guest Login
  const handleGuest = () => {
    login({ role: "guest" });
    navigate("/home");
  };

  return (
    <div className="login-register-page">
      {/* Left Section */}
      <div className="lrp-image-section">
        <img src={LoginFood} alt="Login Food" />
        <div className="lrp-image-overlay"></div>
        <div className="lrp-image-text">
          <h1>Sarawak Food Heritage</h1>
          <p>Discover, preserve, and celebrate the rich culinary traditions of Sarawak</p>
          <p>From manok pansoh to umai - explore authentic recipes and their cultural stories</p>
        </div>
      </div>

      {/* Right Section */}
      <div className="lrp-form-section">
        <div className="lrp-card">
          <div className="lrp-card-header">
            <div className="lrp-logo">🍽️</div>
            <h3>Welcome to SarawakEats</h3>
            <p className="lrp-description">Preserving and celebrating Sarawak's culinary heritage</p>
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

          {/* Login Form */}
          {activeTab === "login" ? (
            <div className="lrp-form-content">
              {loginError && (
                <div className="lrp-error-box">
                  {loginError}
                  {lockoutUntil && remainingTime > 0 && (
                    <p className="lrp-timer">Try again in {formatTime(remainingTime)}</p>
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
                  disabled={!!lockoutUntil}
                />
              </div>
              <div>
                <label>Password</label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={!!lockoutUntil}
                />
              </div>

              <button
                onClick={handleLogin}
                className="lrp-btn lrp-btn-primary"
                disabled={!!lockoutUntil}
              >
                {lockoutUntil ? "Locked" : "Sign In"}
              </button>

              <button
                onClick={() => navigate("/forgotpassword")}
                className="lrp-btn lrp-btn-primary"
                disabled={!!lockoutUntil}
              >
                Forgot Password
              </button>

              <div className="lrp-divider"><span>or</span></div>
              <button onClick={handleGuest} className="lrp-btn lrp-btn-outline">
                Continue as Guest
              </button>
            </div>
          ) : (
            // Register Form
            <div className="lrp-form-content">
              {registerError && <div className="lrp-error-box">{registerError}</div>}

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
                  Password must be at least 8 characters with uppercase, lowercase, number, and symbol
                </p>
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

          <p className="lrp-footer-text">
            Join our community to contribute recipes and preserve Sarawak's food culture
          </p>
        </div>
      </div>
    </div>
  );
}
