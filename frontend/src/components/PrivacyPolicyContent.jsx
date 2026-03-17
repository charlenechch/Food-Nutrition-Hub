import React from "react";
import "../css/PolicyContent.css";

export default function PrivacyPolicyContent() {
   return (
    <div className="tpm-doc-body">
      <p className="tpm-doc-text">Welcome to SarawakEats. Your privacy is important to us.</p>

      <h3 className="tpm-doc-section">1. Information We Collect</h3>
      <p className="tpm-doc-text">We collect your name, email address, and saved recipes to provide a personalized experience.</p>

      <h3 className="tpm-doc-section">2. How We Use Your Data</h3>
      <p className="tpm-doc-text">Your data is securely stored and used exclusively for authentication and app functionality. We do not sell your personal data to third parties.</p>

      <p className="tpm-doc-text">And more...</p>
    </div>
  );
}