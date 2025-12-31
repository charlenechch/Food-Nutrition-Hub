/* src/pages/LoginRegisterPage.jsx */
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../css/LoginRegisterPage.css";
import LoginFood from "../assets/LoginFood.png";
import Modal from "../components/Modal";
/* Icons */
import { FaEnvelopeOpenText, FaEye, FaEyeSlash, FaUser, FaLock, FaEnvelope, FaArrowRight } from "react-icons/fa";
/* Firebase */
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
  // State
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

  // Resend verification
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [showResendButton, setShowResendButton] = useState(false);
  const [storedPassword, setStoredPassword] = useState("");

  // Password visibility
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);

  // OTP states
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [tempUserId, setTempUserId] = useState(null);
  const [otpCode, setOtpCode] = useState("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [tempRememberMe, setTempRememberMe] = useState(false);

  // 🔒 Server-Side Lockout Timer
  const [serverLockoutTimer, setServerLockoutTimer] = useState(0);

  // Password criteria
  const [regPasswordCriteria, setRegPasswordCriteria] = useState({
    length: false,
    upper: false,
    lower: false,
    number: false,
    special: false,
  });

  // CSRF
  const [csrfToken, setCsrfToken] = useState("");
  
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const res = await fetch(`${API_BASE_URL}/api/csrf-token`, { credentials: "include" });
        const data = await res.json();
        setCsrfToken(data.csrfToken);
      } catch (err) {
        console.error("Failed to fetch CSRF token", err);
      }
    };
    fetchCsrfToken();
  }, []);

  // Registration modal
  const [showRegSuccess, setShowRegSuccess] = useState(false);

  // Hint logic
  const [showPasswordHint, setShowPasswordHint] = useState(false);
  const passwordHintRef = useRef(null);

  const navigate = useNavigate();
  const { user, setUser, loginAsGuest } = useAuth();

  // ------------------------------
  // Effects
  // ------------------------------
  useEffect(() => {
    const currentPath = window.location.pathname;
    if (user && user.role !== "guest" && currentPath === "/loginregister") {
      navigate(user.role === "admin" ? "/admin" : "/home");
    }
  }, [user, navigate]);

  useEffect(() => {
    if (serverLockoutTimer <= 0) return;
    const interval = setInterval(() => {
      setServerLockoutTimer((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [serverLockoutTimer]);

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
        if (!csrfToken) return;
        try {
          await fetch(`${API_URL}/api/auth/syncEmailVerification`, {
            method: "POST",
            credentials: "include",
            headers: { 
                "Content-Type": "application/json",
                "X-CSRF-Token": csrfToken 
            },
            body: JSON.stringify({ email: user.email }),
          });
        } catch (err) {
          console.error("❌ Sync error:", err);
        }
      }
    });
    return () => unsubscribe();
  }, [csrfToken]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (passwordHintRef.current && !passwordHintRef.current.contains(e.target)) {
        setShowPasswordHint(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ------------------------------
  // Helper Functions
  // ------------------------------
  const formatTime = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
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
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
        body: JSON.stringify({ email }),
      });
      const checkData = await checkRes.json();
      if (!checkRes.ok) {
        if (checkRes.status === 429 && checkData.remainingSeconds) {
          setResendCooldown(checkData.remainingSeconds);
          setLoginError(`Please wait ${checkData.remainingSeconds} seconds.`);
        } else {
          setLoginError(checkData.error || "Failed to resend verification email");
        }
        setIsResending(false);
        return;
      }
      setResendCooldown(60);
      const userCredential = await signInWithEmailAndPassword(auth, email, storedPassword);
      await sendEmailVerification(userCredential.user, {
        url: window.location.origin + "/loginregister",
      });
      setLoginError(checkData.message);
      setShowResendButton(true);
      setStoredPassword("");
    } catch (err) {
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setLoginError("Session expired. Please try logging in again.");
        setShowResendButton(false);
        setStoredPassword("");
      } else {
        setLoginError("Failed to resend verification email.");
      }
    } finally {
      setIsResending(false);
    }
  };

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
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
        credentials: "include",
        body: JSON.stringify({ userID: tempUserId, code: otpCode, rememberDevice: tempRememberMe }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setUser(data.user);
        navigate(data.user.role === "admin" ? "/admin" : "/home");
      } else {
        setLoginError(data.message || "Invalid code. Please try again.");
      }
    } catch (err) {
      setLoginError("Verification failed. Please try again.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (isResending) return; 
    setIsResending(true);
    setLoginError("");

    try {
      const res = await fetch(`${API_URL}/api/otp/sendLogin`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
        credentials: "include",
        body: JSON.stringify({ userID: tempUserId }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setLoginError("A new code has been sent to your email.");
        setResendCooldown(60); 
      } else {
        setLoginError(data.message || "Failed to resend code.");
      }
    } catch (err) {
      setLoginError("Network error. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  // ------------------------------
  // Login Handler
  // ------------------------------
  const handleLogin = async () => {
    setLoginError("");
    if (serverLockoutTimer > 0) {
       setLoginError(`Account locked. Try again in ${formatTime(serverLockoutTimer)}.`);
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
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
        body: JSON.stringify({ email, password, rememberDevice }),
      });
      const data = await res.json();

      if (res.status === 429 && data.lockoutRemaining) {
          setServerLockoutTimer(data.lockoutRemaining);
          setLoginError(`Too many attempts. Account locked for ${formatTime(data.lockoutRemaining)}.`);
          return;
      }
      if (data.requires2FA) {
          setTempUserId(data.tempUserId);
          setTempRememberMe(data.rememberDevice);
          setShowOtpInput(true); 
          setLoginError(""); 
          return; 
      }
      if (res.ok && data.success && data.user) {
        setUser(data.user);
        navigate(data.user.role === "admin" ? "/admin" : "/home");
        return;
      }
      if (data.notVerified) {
        setLoginError("Email is not verified. Please check your inbox.");
        setShowResendButton(true);
        setStoredPassword(password);
        return;
      }
      setLoginError(data.message || "Invalid email or password.");
    } catch (err) {
      console.error("Login error:", err);
      setLoginError("Login failed. Please try again.");
    }
  };

  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNum = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    if (password.length < minLength) return `Password must be at least ${minLength} characters long`;
    if (!hasUpper) return "Password must contain an uppercase letter";
    if (!hasLower) return "Password must contain a lowercase letter";
    if (!hasNum) return "Password must contain a number";
    if (!hasSpecial) return "Password must contain a special character";
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
      const fb = await createUserWithEmailAndPassword(auth, regEmail, regPassword);
      const firebaseUID = fb.user.uid;
      await sendEmailVerification(fb.user, {
        url: window.location.origin + "/loginregister",
      });
      const res = await fetch(`${API_URL}/api/register`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
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
      setRegPasswordCriteria({ length: false, upper: false, lower: false, number: false, special: false });
    } catch (err) {
      console.error("Register error:", err);
      setRegisterError("Registration failed. Please try again.");
    }
  };

  const handleGuest = () => {
    loginAsGuest();
    navigate("/"); 
  };

  // ------------------------------
  // JSX (Modern Heritage Design)
  // ------------------------------
  return (
    <div className="modern-heritage-page">
      {/* Background */}
      <div className="mh-background">
        <img src={LoginFood} alt="Sarawak Cuisine" />
        <div className="mh-overlay"></div>
      </div>

      <div className="mh-content-wrapper">
        {/* Left Side: Brand */}
        <div className="mh-brand-section">
          <h1 className="mh-title">Sarawak<br/>Food Heritage</h1>
          <div className="mh-divider"></div>
          <p className="mh-subtitle">
            Preserving the legacy of culinary traditions.<br/>
            Taste the history, share the culture.
          </p>
        </div>

        {/* Right Side: Card */}
        <div className="mh-form-card">
          
          {/* Dynamic Header */}
          <div className="mh-card-header">
            <h3>
              {activeTab === "register" ? "Create Account" : 
               showOtpInput ? "Verify It's You" : "Welcome Back"}
            </h3>
            <p>
              {activeTab === "register" ? "Join us to explore Sarawak's cuisine" : 
               showOtpInput ? "Enter the code sent to your email" : "Enter your details to explore"}
            </p>
          </div>

          {/* Tabs (Hidden in OTP mode) */}
          {!showOtpInput && (
            <div className="mh-tabs">
              <div className="mh-tab-pill" style={{ transform: activeTab === "login" ? "translateX(0)" : "translateX(100%)" }} />
              <button className={`mh-tab-btn ${activeTab === "login" ? "active" : ""}`} onClick={() => setActiveTab("login")}>Login</button>
              <button className={`mh-tab-btn ${activeTab === "register" ? "active" : ""}`} onClick={() => setActiveTab("register")}>Register</button>
            </div>
          )}

          <div className="mh-form-body">
            {/* LOGIN TAB */}
            {activeTab === "login" && (
               <>
               {showOtpInput ? (
                  /* OTP SECTION */
                  <div className="mh-otp-section">
                    <p className="mh-otp-label">
                      Code sent to <strong>{email}</strong>
                    </p>
                    
                    <div className="mh-otp-input-wrapper">
                      <input 
                        type="text" 
                        className="mh-otp-input" 
                        value={otpCode} 
                        maxLength={6} 
                        placeholder="0 0 0 0 0 0" 
                        onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                        autoFocus
                      />
                    </div>

                    <button 
                      onClick={handleVerifyOtp} 
                      className="mh-btn-primary" 
                      disabled={isVerifyingOtp}
                    >
                      {isVerifyingOtp ? "Verifying..." : "Verify Code"}
                    </button>

                    <button 
                      onClick={handleResendOtp} 
                      className="mh-btn-text" 
                      disabled={resendCooldown > 0}
                    >
                      {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend Code"}
                    </button>
                    
                    <button onClick={() => setShowOtpInput(false)} className="mh-btn-text-small">
                      <FaArrowRight style={{ transform: "rotate(180deg)" }}/> Back to Login
                    </button>
                  </div>
               ) : (
                 /* LOGIN FORM */
                 <>
                  {loginError && <div className="mh-error-msg">{loginError}</div>}
                  
                  <div className="mh-input-group">
                    <FaUser className="mh-icon" />
                    <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  
                  <div className="mh-input-group">
                    <FaLock className="mh-icon" />
                    <input type={showLoginPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    <div className="mh-eye" onClick={() => setShowLoginPassword(!showLoginPassword)}>{showLoginPassword ? <FaEyeSlash/> : <FaEye/>}</div>
                  </div>

                  <div className="mh-actions">
                    <label className="mh-checkbox">
                      <input type="checkbox" checked={rememberDevice} onChange={(e) => setRememberDevice(e.target.checked)} />
                      <span>Remember me</span>
                    </label>
                    <span onClick={() => navigate("/forgotpassword")} className="mh-forgot">Forgot Password?</span>
                  </div>

                  <button onClick={handleLogin} className="mh-btn-primary">
                    Sign In <FaArrowRight className="btn-arrow"/>
                  </button>
                 </>
               )}
               </>
            )}

            {/* REGISTER TAB */}
            {activeTab === "register" && (
              <>
                {registerError && <div className="mh-error-msg">{registerError}</div>}
                
                <div className="mh-grid-inputs">
                  <div className="mh-input-group">
                    <input type="text" placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                  </div>
                  <div className="mh-input-group">
                     <input type="text" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                  </div>
                </div>

                <div className="mh-input-group">
                  <FaEnvelope className="mh-icon" />
                  <input type="email" placeholder="Email Address" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
                </div>

                <div ref={passwordHintRef} className="mh-input-group">
                  <FaLock className="mh-icon" />
                  <input 
                    type={showRegPassword ? "text" : "password"} 
                    placeholder="Create Password" 
                    value={regPassword} 
                    onFocus={() => setShowPasswordHint(true)}
                    onChange={(e) => { setRegPassword(e.target.value); updatePasswordCriteria(e.target.value); setShowPasswordHint(true); }}
                  />
                  <div className="mh-eye" onClick={() => setShowRegPassword(!showRegPassword)}>{showRegPassword ? <FaEyeSlash/> : <FaEye/>}</div>
                  
                  {showPasswordHint && (
                    <div className="mh-password-hints">
                       <div className={regPasswordCriteria.length ? "valid" : "invalid"}>• 8+ Chars</div>
                       <div className={regPasswordCriteria.upper ? "valid" : "invalid"}>• Uppercase</div>
                       <div className={regPasswordCriteria.number ? "valid" : "invalid"}>• Number</div>
                       <div className={regPasswordCriteria.special ? "valid" : "invalid"}>• Symbol</div>
                    </div>
                  )}
                </div>

                <button onClick={handleRegister} className="mh-btn-primary">Create Account</button>
              </>
            )}

            {!showOtpInput && (
              <>
                <div className="mh-separator"><span>or</span></div>
                <button onClick={handleGuest} className="mh-btn-outline">Continue as Guest</button>
              </>
            )}
          </div>
        </div>
      </div>

      <Modal open={showRegSuccess} title="Registration Successful" icon={<FaEnvelopeOpenText />} primaryText="Close" onClose={() => setShowRegSuccess(false)} onPrimary={() => setShowRegSuccess(false)}>
        Please verify your email to continue.
      </Modal>
    </div>
  );
}