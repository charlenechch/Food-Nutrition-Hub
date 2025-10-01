import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; 
import "../css/LoginRegisterPage.css";
import LoginFood from "../assets/LoginFood.png";

export default function LoginRegisterPage() {
  const [activeTab, setActiveTab] = useState("login");
  const navigate = useNavigate();

  
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
                  <input type="email" placeholder="Enter your email" />
                </div>
                <div>
                  <label>Password</label>
                  <input type="password" placeholder="Enter your password" />
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
                    <input type="text" placeholder="First name" />
                  </div>
                  <div>
                    <label>Last Name</label>
                    <input type="text" placeholder="Last name" />
                  </div>
                </div>
                <div>
                  <label>Email</label>
                  <input type="email" placeholder="Enter your email" />
                </div>
                <div>
                  <label>Password</label>
                  <input type="password" placeholder="Create a password" />
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
