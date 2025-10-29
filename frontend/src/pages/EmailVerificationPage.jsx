import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { applyActionCode } from 'firebase/auth';
import { auth } from '../config/firebase';
import '../css/EmailVerificationPage.css';

export default function EmailVerificationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const oobCode = searchParams.get('oobCode');
  
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('Verifying your email...');
  
  useEffect(() => {
    if (!oobCode) {
      setStatus('error');
      setMessage('Invalid verification link. Please check your email and try again.');
      return;
    }
    
    // Verify email with Firebase
    applyActionCode(auth, oobCode)
      .then(() => {
        setStatus('success');
        setMessage('Email verified successfully!');
        setTimeout(() => navigate('/loginregister'), 3000);
      })
      .catch((error) => {
        setStatus('error');
        if (error.code === 'auth/invalid-action-code') {
          setMessage('This verification link is invalid or has already been used.');
        } else if (error.code === 'auth/expired-action-code') {
          setMessage('This verification link has expired. Please request a new one.');
        } else {
          setMessage('Verification failed. Please try again or contact support.');
        }
      });
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