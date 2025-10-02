import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; 
import "../css/LoginRegisterPage.css";
import LoginFood from "../assets/LoginFood.png";

export default function LoginRegisterPage() {
  const [activeTab, setActiveTab] = useState("login");
  //login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Register state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const navigate = useNavigate();

  // Handle login
  const handleLogin = async () => {
    try {
      const res = await fetch("https://food-nutrition-aajtkoqej-fyp-group10-fnh.vercel.app/api/routes/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (res.ok) {
        console.log("Login successful:", data);
        navigate("/home");  // redirect to UserHomepage
      } else {
        alert(data.message || "Login failed!");
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Something went wrong!");
    }
  };

  // Handle register
  const handleRegister = async () => {
    try {
      const res = await fetch("https://food-nutrition-aajtkoqej-fyp-group10-fnh.vercel.app/api/routes/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email: regEmail,
          password: regPassword
        })
      });
      const data = await res.json();

      if (res.ok) {
        console.log("Registration successful:", data);
        alert("Account created! Welcome to SarawakEats!.");
        setActiveTab("login"); // switch back to login tab
      } else {
        alert(data.message || "Registration failed!");
      }
    } catch (err) {
      console.error("Register error:", err);
      alert("Something went wrong during registration.");
    }
  };

  // Function to handle guest navigation
  const handleGuest = () => {
    navigate("/home");  // goes to UserHomepage
  };

  return (
    <div className="login-register-page">
      {/* Left Section with Image */}
      <div className="lrp-image-section">
        <img src={LoginFood} alt="Login Food" />
        <div className="lrp-image-overlay"></div>
        <div className="lrp-image-text">
          <h1>Sarawak Food Heritage</h1>
          <p>
            Discover, preserve, and celebrate the rich culinary traditions of Sarawak
          </p>
          <p>  
            From manok pansoh to umai - explore authentic recipes and their cultural stories
          </p>
        </div>
      </div>

      {/* Right Section with Form */}
      <div className="lrp-form-section">
        <div className="lrp-card">
          <div className="lrp-card-header">
            <div className="lrp-logo">🍽️</div>
            <h3>
              Welcome to SarawakEats
            </h3>
            <p className="lrp-description">
              Preserving and celebrating Sarawak's culinary heritage
            </p>
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
                  <input type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)}  />
                </div>
                <div>
                  <label>Password</label>
                  <input type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <button className="lrp-btn lrp-btn-primary">Sign In</button>
                <div className="lrp-divider">
                  <span>or</span>
                </div>
                <button onClick={handleGuest} className="lrp-btn lrp-btn-outline">
                  Continue as Guest
                </button>
              </>
            ) : (
              <>
                <div className="lrp-grid">
                  <div>
                    <label>First Name</label>
                    <input type="text" placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                  </div>
                  <div>
                    <label>Last Name</label>
                    <input type="text" placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)}/>
                  </div>
                </div>
                <div>
                  <label>Email</label>
                  <input type="email" placeholder="Enter your email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)}  />
                </div>
                <div>
                  <label>Password</label>
                  <input type="password" placeholder="Create a password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)}/>
                </div>
                <button className="lrp-btn lrp-btn-primary">Create Account</button>
                <div className="lrp-divider">
                  <span>or</span>
                </div>
                <button className="lrp-btn lrp-btn-outline">
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
