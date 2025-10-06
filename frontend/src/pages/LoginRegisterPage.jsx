import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../css/LoginRegisterPage.css";
import LoginFood from "../assets/LoginFood.png";

export default function LoginRegisterPage() {
  const [activeTab, setActiveTab] = useState("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  const navigate = useNavigate();
  const { login } = useAuth();

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
    if (!hasSpecialChar) return "Password must contain at least one special character";

    return null;
  };

  // Login
  const handleLogin = async () => {
    if (!email || !password) {
      toast.error("⚠️ Please fill in all fields");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      if (res.status === 429) {
        const data = await res.json();
        toast.error(data.error || "Login unavailable, try again later.");
        return;
      }

      const data = await res.json();
      if (res.ok) {
        login(data.user);
        toast.success("✅ Login successful!");

        if (data.user.role === "admin") navigate("/admin");
        else navigate("/home");
      } else {
        toast.error(data.error || data.message || "Login failed!");
      }
    } catch (err) {
      console.error("Login error:", err);
      toast.error("❌ Something went wrong!");
    }
  };

  // Register
  const handleRegister = async () => {
    if (!firstName || !lastName || !regEmail || !regPassword) {
      toast.error("⚠️ Please fill in all fields");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(regEmail)) {
      toast.error("⚠️ Invalid email address");
      return;
    }

    const passwordError = validatePassword(regPassword);
    if (passwordError) {
      toast.error(passwordError);
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstname: firstName, lastname: lastName, email: regEmail, password: regPassword })
      });

      if (res.status === 429) {
        const data = await res.json();
        toast.error(data.error || "Registration temporarily unavailable. Try again later.");
        return;
      }

      const data = await res.json();
      if (res.ok) {
        toast.success("✅ Account created!");
        setFirstName(""); setLastName(""); setRegEmail(""); setRegPassword("");
        setActiveTab("login");
      } else {
        toast.error(data.error || data.message || "Registration failed!");
      }
    } catch (err) {
      console.error("Register error:", err);
      toast.error("❌ Something went wrong during registration.");
    }
  };

  const handleGuest = () => {
    login({ role: "guest" });
    toast.info("👤 Logged in as guest");
    navigate("/home");
  };

  return (
    <div className="login-register-page">
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Left Section */}
      <div className="lrp-image-section">
        <img src={LoginFood} alt="Login Food" />
        <div className="lrp-image-overlay"></div>
        <div className="lrp-image-text">
          <h1>Sarawak Food Heritage</h1>
          <p>Discover, preserve, and celebrate Sarawak's culinary traditions</p>
        </div>
      </div>

      {/* Right Section */}
      <div className="lrp-form-section">
        <div className="lrp-card">
          <div className="lrp-card-header">
            <div className="lrp-logo">🍽️</div>
            <h3>Welcome to SarawakEats</h3>
          </div>

          {/* Tabs */}
          <div className="lrp-tabs">
            <button className={`lrp-tab ${activeTab === "login" ? "active" : ""}`} onClick={() => setActiveTab("login")}>Login</button>
            <button className={`lrp-tab ${activeTab === "register" ? "active" : ""}`} onClick={() => setActiveTab("register")}>Register</button>
          </div>

          {/* Form */}
          <div className="lrp-form-content">
            {activeTab === "login" ? (
              <>
                <label>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <label>Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button onClick={handleLogin} className="lrp-btn lrp-btn-primary">Sign In</button>
                <div className="lrp-divider"><span>or</span></div>
                <button onClick={handleGuest} className="lrp-btn lrp-btn-outline">Continue as Guest</button>
              </>
            ) : (
              <>
                <label>First Name</label>
                <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                <label>Last Name</label>
                <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                <label>Email</label>
                <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
                <label>Password</label>
                <input type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} />
                <p className="password-hint">Password must be strong (uppercase, lowercase, number, symbol)</p>
                <button onClick={handleRegister} className="lrp-btn lrp-btn-primary">Create Account</button>
                <div className="lrp-divider"><span>or</span></div>
                <button onClick={handleGuest} className="lrp-btn lrp-btn-outline">Continue as Guest</button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
