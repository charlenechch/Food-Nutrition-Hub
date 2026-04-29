/* src/pages/LoginRegisterPage.jsx */
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import "../css/LoginRegisterPage.css";
import LoginFood from "../assets/LoginFood.png";
import Modal from "../components/Modal";
/* Icons */
import { FaEnvelopeOpenText, FaInfoCircle, FaEye, FaEyeSlash, FaUser, FaLock, FaEnvelope, FaArrowRight } from "react-icons/fa";
/* Firebase */
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { auth } from "../config/firebase";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function LoginRegisterPage() {
  const { t } = useTranslation();

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
  const [pdpaConsent, setPdpaConsent] = useState(false);
  const [tncConsent, setTncConsent] = useState(false);

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

  const [showTooltip, setShowTooltip] = useState(false);

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
      setLoginError(t("auth.sessionExpired"));
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
          setLoginError(t("auth.waitSeconds", { seconds: checkData.remainingSeconds }));
        } else {
          setLoginError(checkData.error || t("auth.resendFailed"));
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
        setLoginError(t("auth.sessionExpired"));
        setShowResendButton(false);
        setStoredPassword("");
      } else {
        setLoginError(t("auth.resendFailed"));
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) {
      setLoginError(t("auth.invalidOtp"));
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
        setLoginError(data.message || t("auth.invalidCode"));
      }
    } catch (err) {
      setLoginError(t("auth.verificationFailed"));
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
        setLoginError(t("auth.newCodeSent"));
        setResendCooldown(60); 
      } else {
        setLoginError(data.message || t("auth.resendCodeFailed"));
      }
    } catch (err) {
      setLoginError(t("auth.networkError"));
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
       setLoginError(t("auth.accountLocked", { time: formatTime(serverLockoutTimer) }));
       return;
    }
    if (!email || !password) {
      setLoginError(t("auth.fillAllFields"));
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
          setLoginError(t("auth.tooManyAttempts", { time: formatTime(data.lockoutRemaining) }));
          return;
      }
      if (res.status === 403 && data.googleUserBlocked) {
          setLoginError(t("auth.googleUserBlocked"));
          return;
      }
      if (data.requires2FA) {
          setTempUserId(data.tempUserId);
          setTempRememberMe(data.rememberDevice);
          setShowOtpInput(true);
          setOtpCode("");
          setLoginError(""); 
          return; 
      }
      if (res.ok && data.success && data.user) {
        setUser(data.user);
        navigate(data.user.role === "admin" ? "/admin" : "/home");
        return;
      }
      if (data.notVerified) {
        setLoginError(t("auth.emailNotVerified"));
        setShowResendButton(true);
        setStoredPassword(password);
        return;
      }
      setLoginError(data.message || t("auth.invalidCredentials"));
    } catch (err) {
      console.error("Login error:", err);
      setLoginError(t("auth.loginFailed"));
    }
  };

  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNum = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    if (password.length < minLength) return t("auth.pwdMinLength", { n: minLength });
    if (!hasUpper) return t("auth.pwdNeedsUpper");
    if (!hasLower) return t("auth.pwdNeedsLower");
    if (!hasNum) return t("auth.pwdNeedsNumber");
    if (!hasSpecial) return t("auth.pwdNeedsSpecial");
    return null;
  };

  const handleRegister = async () => {
    setRegisterError("");
    if (!firstName || !lastName || !regEmail || !regPassword) {
      setRegisterError(t("auth.fillAllFields"));
      return;
    }
    if (!pdpaConsent) {
      setRegisterError(t("auth.pdpaConsentRequired"));
      return;
    }
    if (!tncConsent) {
      setRegisterError(t("auth.tncConsentRequired"));
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(regEmail)) {
      setRegisterError(t("auth.invalidEmail"));
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
          pdpaconsent: pdpaConsent,
          tncconsent: tncConsent,
        }),
      });
      const data = await res.json();
      await fb.user.delete();
      if (!res.ok) {
        setRegisterError(data.message || t("auth.registrationFailed"));
        return;
      }
      await sendEmailVerification(fb.user, {
        url: window.location.origin + "/loginregister",
      });
      setShowRegSuccess(true);
      setFirstName("");
      setLastName("");
      setRegEmail("");
      setRegPassword("");
      setActiveTab("login");
      setRegPasswordCriteria({ length: false, upper: false, lower: false, number: false, special: false });
    } catch (err) {
      console.error("Register error:", err);
      setRegisterError(t("auth.registrationFailed"));
    }
  };

  const handleGuest = () => {
    loginAsGuest();
    navigate("/"); 
  };

  // ------------------------------
  // Google Login Handler
  // ------------------------------
  const handleGoogleLogin = async () => {
    setLoginError("");
    
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const token = await user.getIdToken();

      const csrfRes = await fetch(`${API_URL}/api/csrf-token`, { credentials: "include" });
      const csrfData = await csrfRes.json();
      const freshCsrfToken = csrfData.csrfToken;

      const res = await fetch(`${API_URL}/api/auth/google-login`, {
        method: "POST",
        credentials: "include",
        headers: { 
            "Content-Type": "application/json", 
            "X-CSRF-Token": freshCsrfToken 
        },
        body: JSON.stringify({
          email: user.email,
          firstname: user.displayName ? user.displayName.split(" ")[0] : "User",
          lastname: user.displayName ? user.displayName.split(" ").slice(1).join(" ") : "",
          token: token,
          googlePhotoUrl: user.photoURL,
          firebaseUID: user.uid,
          rememberDevice: rememberDevice,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setUser(data.user);
        navigate(data.user.role === "admin" ? "/admin" : "/home");
      } else if (data.suspended) {
        setLoginError(data.message);
      } else {
        setLoginError(data.message || t("auth.googleLoginFailed"));
      }

    } catch (err) {
      if (err.code === "auth/popup-closed-by-user" || err.code === "auth/cancelled-popup-request") {
        return;
      }
      console.error("Google Login Error:", err);
      setLoginError(t("auth.googleLoginFailed"));
    }
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
          <h1 className="mh-title">{t("auth.brandTitle")}</h1>
          <div className="mh-divider"></div>
          <p className="mh-subtitle">{t("auth.brandSubtitle")}</p>
        </div>

        {/* Right Side: Card */}
        <div className={`mh-form-card ${activeTab === "register" ? "mh-form-card--register" : ""}`}>
          
          {/* Dynamic Header */}
          <div className="mh-card-header">
            <h3>
              {activeTab === "register" ? t("auth.createAccount") : 
               showOtpInput ? t("auth.verifyIdentity") : t("auth.welcomeBack")}
            </h3>
            <p>
              {activeTab === "register" ? t("auth.registerSubtitle") : 
               showOtpInput ? t("auth.otpSubtitle") : t("auth.loginSubtitle")}
            </p>
          </div>

          {/* Tabs (Hidden in OTP mode) */}
          {!showOtpInput && (
            <div className="mh-tabs">
              <div className="mh-tab-pill" style={{ transform: activeTab === "login" ? "translateX(0)" : "translateX(100%)" }} />
              <button className={`mh-tab-btn ${activeTab === "login" ? "active" : ""}`} onClick={() => setActiveTab("login")}>{t("auth.tabLogin")}</button>
              <button className={`mh-tab-btn ${activeTab === "register" ? "active" : ""}`} onClick={() => setActiveTab("register")}>{t("auth.tabRegister")}</button>
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
                      {t("auth.codeSentTo")} <strong>{email}</strong>
                    </p>

                    {loginError && <div className="mh-error-msg">{loginError}</div>}
                    
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
                      className="mh-btn-primary lrp-no-outline" 
                      disabled={isVerifyingOtp}
                    >
                      {isVerifyingOtp ? t("auth.verifying") : t("auth.verifyCode")}
                    </button>

                    <button 
                      onClick={handleResendOtp} 
                      className="mh-btn-text lrp-no-outline" 
                      disabled={resendCooldown > 0}
                    >
                      {resendCooldown > 0 ? t("auth.resendCodeIn", { seconds: resendCooldown }) : t("auth.resendCode")}
                    </button>
                    
                    <button onClick={() => setShowOtpInput(false)} className="mh-btn-text-small lrp-no-outline">
                      <FaArrowRight style={{ transform: "rotate(180deg)" }}/> {t("auth.backToLogin")}
                    </button>
                  </div>
               ) : (
                 /* LOGIN FORM */
                 <>
                  {loginError && <div className="mh-error-msg">{loginError}</div>}
                  
                  {showResendButton && (
                    <button
                      type="button"
                      className="mh-btn-text lrp-no-outline"
                      onClick={handleResendVerification}
                      disabled={resendCooldown > 0 || isResending}
                    >
                      {isResending
                        ? t("auth.resending")
                        : resendCooldown > 0
                        ? t("auth.resendIn", { seconds: resendCooldown })
                        : t("auth.resendVerification")}
                    </button>
                  )}

                  <div className="mh-input-group">
                    <FaUser className="mh-icon" />
                    <input type="email" placeholder={t("auth.emailPlaceholder")} value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  
                  <div className="mh-input-group">
                    <FaLock className="mh-icon" />
                    <input type={showLoginPassword ? "text" : "password"} placeholder={t("auth.passwordPlaceholder")} value={password} onChange={(e) => setPassword(e.target.value)} />
                    <div className="mh-eye" onClick={() => setShowLoginPassword(!showLoginPassword)}>{showLoginPassword ? <FaEyeSlash/> : <FaEye/>}</div>
                  </div>

                  <div className="mh-actions">
                    <div className="mh-checkbox-wrapper">
                      <label className="mh-checkbox">
                        <input 
                          type="checkbox" 
                          checked={rememberDevice} 
                          onChange={(e) => setRememberDevice(e.target.checked)} 
                        />
                        <span>{t("auth.rememberMe")}</span>
                      </label>
                      
                      <div 
                        className="mh-info-icon"
                        onMouseEnter={() => setShowTooltip(true)}
                        onMouseLeave={() => setShowTooltip(false)}
                        onClick={() => setShowTooltip(!showTooltip)} 
                      >
                        <FaInfoCircle />
                        
                        {showTooltip && (
                          <div className="mh-custom-tooltip">
                            {t("auth.rememberTooltip")}
                          </div>
                        )}
                      </div>
                    </div>
                    <span onClick={() => navigate("/forgotpassword")} className="mh-forgot">{t("auth.forgotPassword")}</span>
                  </div>

                  <button onClick={handleLogin} className="mh-btn-primary lrp-no-outline">
                    {t("auth.signIn")} <FaArrowRight className="btn-arrow"/>
                  </button>

                  <div className="mh-google-wrapper">
                    <button 
                      onClick={handleGoogleLogin} 
                      className="mh-btn-google lrp-no-outline"
                      type="button" 
                    >
                      <img 
                        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                        alt="G" 
                        className="mh-google-icon"
                      />
                      {t("auth.signInGoogle")}
                    </button>
                  </div>
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
                    <input type="text" placeholder={t("auth.firstNamePlaceholder")} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                  </div>
                  <div className="mh-input-group">
                     <input type="text" placeholder={t("auth.lastNamePlaceholder")} value={lastName} onChange={(e) => setLastName(e.target.value)} />
                  </div>
                </div>

                <div className="mh-input-group">
                  <FaEnvelope className="mh-icon" />
                  <input type="email" placeholder={t("auth.emailPlaceholder")} value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
                </div>

                <div ref={passwordHintRef} className="mh-password-wrapper">
                  <div className="mh-input-group">
                    <FaLock className="mh-icon" />
                    <input 
                      type={showRegPassword ? "text" : "password"} 
                      placeholder={t("auth.createPasswordPlaceholder")} 
                      value={regPassword} 
                      onFocus={() => setShowPasswordHint(true)}
                      onChange={(e) => { setRegPassword(e.target.value); updatePasswordCriteria(e.target.value); setShowPasswordHint(true); }}
                    />
                    <div className="mh-eye" onClick={() => setShowRegPassword(!showRegPassword)}>{showRegPassword ? <FaEyeSlash/> : <FaEye/>}</div>
                  </div>
                  
                  {showPasswordHint && (
                    <div className="mh-password-hints">
                       <div className={regPasswordCriteria.length ? "valid" : "invalid"}>• {t("auth.hint8Chars")}</div>
                       <div className={regPasswordCriteria.upper ? "valid" : "invalid"}>• {t("auth.hintUppercase")}</div>
                       <div className={regPasswordCriteria.lower ? "valid" : "invalid"}>• {t("auth.hintLowercase")}</div>
                       <div className={regPasswordCriteria.number ? "valid" : "invalid"}>• {t("auth.hintNumber")}</div>
                       <div className={regPasswordCriteria.special ? "valid" : "invalid"}>• {t("auth.hintSymbol")}</div>
                    </div>
                  )}
                </div>

                <div className="pdpa-checkbox-wrapper">
                  <label className="pdpa-checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={pdpaConsent} 
                      onChange={(e) => setPdpaConsent(e.target.checked)} 
                    />
                    <span className="pdpa-checkbox-text">
                      {t("auth.pdpaConsentText")} <a href="/privacypolicy" target="_blank" rel="noopener noreferrer" className="pdpa-link">{t("auth.pdpaConsentLink")}</a>.
                    </span>
                  </label>
                </div>

                <div className="pdpa-checkbox-wrapper">
                  <label className="pdpa-checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={tncConsent} 
                      onChange={(e) => setTncConsent(e.target.checked)} 
                    />
                    <span className="pdpa-checkbox-text">
                      {t("auth.tncConsentText")} <a href="/terms" target="_blank" rel="noopener noreferrer" className="pdpa-link">{t("auth.tncConsentLink")}</a>.
                    </span>
                  </label>
                </div>

                <button onClick={handleRegister} className="mh-btn-primary lrp-no-outline">{t("auth.createAccount")}</button>

                <div className="mh-google-wrapper">
                  <button
                    onClick={handleGoogleLogin}
                    className="mh-btn-google lrp-no-outline"
                    type="button"
                  >
                    <img
                      src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                      alt="G"
                      className="mh-google-icon "
                    />
                    {t("auth.continueWithGoogle")}
                  </button>
                  <p className="mh-google-note">
                    {t("auth.googleSignUpNote")}
                  </p>
                </div>
              </>
            )}

            {!showOtpInput && (
              <>
                <div className="mh-separator"><span>{t("auth.or")}</span></div>
                <button onClick={handleGuest} className="mh-btn-outline lrp-no-outline">{t("auth.continueAsGuest")}</button>
              </>
            )}
          </div>
        </div>
      </div>

      <Modal open={showRegSuccess} title={t("auth.regSuccessTitle")} icon={<FaEnvelopeOpenText />} primaryText={t("auth.close")} onClose={() => setShowRegSuccess(false)} onPrimary={() => setShowRegSuccess(false)}>
        {t("auth.regSuccessMsg")}
      </Modal>
    </div>
  );
}