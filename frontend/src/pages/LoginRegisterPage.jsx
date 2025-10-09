import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // make sure this hook is exported
import "../css/LoginRegisterPage.css";
import LoginFood from "../assets/LoginFood.png";

export default function LoginRegisterPage() {
  const [activeTab, setActiveTab] = useState("login");
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // Login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Register state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  const navigate = useNavigate();
  const { login } = useAuth(); // from AuthContext

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

  // Handle login
  const handleLogin = async () => {
    if (!email || !password) {
      alert("Please fill in all fields");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/login`, {
        method: "POST",
        credentials: "include", // include cookies for session
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      // Handle rate limiting
      if (res.status === 429) {
        const data = await res.json();
        alert(data.error || "Login unavailable, please try again later.");
        return;
      }

      const data = await res.json();

      if (res.ok) {
        console.log("Login successful:", data);

        login(data.user); // Store in context and localStorage

        // Navigate based on role
        if (data.user.role === "admin") {
          navigate("/admin");
        } else {
          navigate("/home");
        }
      } else {
        alert(data.error || data.message || "Login failed!");
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("Something went wrong!");
    }
  };

  // Handle registration
  const handleRegister = async () => {
    if (!firstName || !lastName || !regEmail || !regPassword) {
      alert("Please fill in all fields");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(regEmail)) {
      alert("Please enter a valid email address");
      return;
    }

    const passwordError = validatePassword(regPassword);
    if (passwordError) {
      alert(passwordError);
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstname: firstName,
          lastname: lastName,
          email: regEmail,
          password: regPassword
        })
      });

      // Handle rate limiting
      if (res.status === 429) {
        const data = await res.json();
        alert(data.error || "Registration temporarily unavailable. Please try again later.");
        return;
      }

      const data = await res.json();

      if (res.ok) {
        console.log("Registration successful:", data);
        alert("Account created! Welcome to SarawakEats.");

        // Clear form fields
        setFirstName("");
        setLastName("");
        setRegEmail("");
        setRegPassword("");

        // Switch back to login tab
        setActiveTab("login");
      } else {
        alert(data.error || data.message || "Registration failed!");
      }
    } catch (err) {
      console.error("Registration error:", err);
      alert("Something went wrong during registration.");
    }
  };

  // Handle Guest Login (tracks guest with role)
  const handleGuest = () => {
    login({ role: "guest" }); // Track guest
    console.log("Logged in as guest");
    navigate("/home");
  };

  return (
    <div className="login-register-page">
      {/* Left Section with Image */}
      <div className="lrp-image-section">
        <img src={LoginFood} alt="Login Food" />
        <div className="lrp-image-overlay"></div>
        <div className="lrp-image-text">
          <h1>Sarawak Food Heritage</h1>
          <p>Discover, preserve, and celebrate the rich culinary traditions of Sarawak</p>
          <p>From manok pansoh to umai - explore authentic recipes and their cultural stories</p>
        </div>
      </div>

      {/* Right Section with Form */}
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

          {/* Form Content */}
          <div className="lrp-form-content">
            {activeTab === "login" ? (
              <>
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
                <button onClick={handleLogin} className="lrp-btn lrp-btn-primary">
                  Sign In
                </button>
                <button onClick={handleLogin} className="lrp-btn lrp-btn-primary">
                  Forget Password
                </button>
                <div className="lrp-divider"><span>or</span></div>
                <button onClick={handleGuest} className="lrp-btn lrp-btn-outline">
                  Continue as Guest
                </button>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>

          {/* Footer Text */}
          <p className="lrp-footer-text">
            Join our community to contribute recipes and preserve Sarawak's food culture
          </p>
        </div>
      </div>
    </div>
  );
}
