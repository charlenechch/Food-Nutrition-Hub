import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { auth } from "../config/firebase";
import "../css/EmailVerificationPage.css";
import { applyActionCode, checkActionCode } from "firebase/auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function EmailVerificationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const oobCode = searchParams.get('oobCode');
  
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('Verifying your email...');
  
  useEffect(() => {
    if (!oobCode) {
        setStatus("error");
        setMessage("Invalid verification link. Please check your email and try again.");
        return;
    }
    
    const verifyEmail = async () => {
        try {
        // Step 1: Get email from verification code
        const info = await checkActionCode(auth, oobCode);
        const email = info.data.email;
        
        // Step 2: Apply the action code (verify in Firebase)
        await applyActionCode(auth, oobCode);
        
        // Step 3: Sync to MySQL database
        try {
            const response = await fetch(`${API_URL}/api/auth/syncEmailVerification`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ email })
            });
            
            if (response.ok) {
            console.log("Verification synced to database");
            } else {
            console.error("Failed to sync verification to database");
            }
        } catch (syncError) {
            console.error("Database sync error:", syncError);
        }
        
        // Step 4: Show success
        setStatus("success");
        setMessage("Email verified successfully!");
        setTimeout(() => navigate("/loginregister"), 3000);
        
        } catch (error) {
        setStatus("error");
        
        // This is the most common error, caused by Outlook or the link being used once.
        if (error.code === "auth/invalid-action-code") {
            setMessage("This link is invalid or has already been used. This could be caused by email security (like Outlook) scanning the link. Your account is likely already verified. Please try to log in.");
        
        // This is a separate error for time-based expiration.
        } else if (error.code === "auth/expired-action-code") {
            setMessage("This verification link has expired. Please go back to the login page, try to login and request a new link.");
        
        // This is a catch-all for any other errors (e.g., network issues).
        } else {
            setMessage("An unexpected error occurred. Please try again or contact support.");
        }
        }
    };
    
    verifyEmail();
    }, [oobCode, navigate]);
  
  return (
    <div className="ev-container">
      <div className="ev-card">
        {status === 'verifying' && (
          <>
            <div className="ev-header">
              <div className="ev-logo">📧</div>
              <h2 className="ev-title">Email Verification</h2>
              <p className="ev-subtitle">Please wait while we verify your email address.</p>
            </div>
            
            <div className="ev-body">
              <div className="ev-spinner-wrapper">
                <div className="ev-spinner"></div>
                <p className="ev-muted">{message}</p>
              </div>
            </div>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="ev-header">
              <div className="ev-success-icon">✓</div>
              <h2 className="ev-title">Verification Successful!</h2>
              <p className="ev-subtitle">{message}</p>
            </div>
            
            <div className="ev-body">
              <p className="ev-muted">You can now log in with your account.</p>
              <p className="ev-redirect-text">Redirecting to login page...</p>
            </div>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="ev-header">
              <div className="ev-error-icon">✗</div>
              <h2 className="ev-title">Verification Failed</h2>
              <p className="ev-subtitle">{message}</p>
            </div>
            
            <div className="ev-body">
              <div className="ev-actions">
                <button
                  className="lrp-btn lrp-btn-primary"
                  onClick={() => navigate('/loginregister')}
                >
                  Back to Login
                </button>
                <button
                  className="lrp-btn lrp-btn-outline"
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}