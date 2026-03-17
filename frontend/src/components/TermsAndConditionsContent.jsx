import React from "react";
import "../css/PolicyContent.css";

export default function TermsAndConditionsContent() {
  return (
    <div className="tpm-doc-body">
      <h3 className="tpm-doc-section">1. Introduction</h3>
      <p className="tpm-doc-text">Welcome to SarawakEats. By accessing or using our website and services, you agree to be bound by these Terms & Conditions. If you do not agree with any part of these terms, please do not use our platform.</p>

      <h3 className="tpm-doc-section">2. User Accounts</h3>
      <p className="tpm-doc-text">To access certain features of SarawakEats, such as posting recipes or participating in discussions, you must register for an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>

      <h3 className="tpm-doc-section">3. Community Guidelines & Content</h3>
      <p className="tpm-doc-text">Our community thrives on respect and sharing. Users may submit recipes and posts, provided the content is not illegal, offensive, defamatory, or infringing on intellectual property rights. SarawakEats reserves the right to review, edit, or remove any user-submitted content at our discretion.</p>

      <h3 className="tpm-doc-section">4. Intellectual Property</h3>
      <p className="tpm-doc-text">The overarching content, design, and branding of SarawakEats are owned by us. User-submitted recipes remain the property of the creator; however, by submitting content to SarawakEats, you grant us a non-exclusive license to display, modify, and share it across our platform.</p>

      <h3 className="tpm-doc-section">5. Limitation of Liability</h3>
      <p className="tpm-doc-text">SarawakEats provides culinary information and tools for educational and inspirational purposes only. We do not guarantee the absolute accuracy of nutritional data and are not liable for any health issues, allergies, or damages arising from the use of our recipes or tools. Always consult a professional for strict dietary requirements.</p>

      <h3 className="tpm-doc-section">6. Changes to Terms</h3>
      <p className="tpm-doc-text">We reserve the right to modify these Terms & Conditions at any time. When significant changes occur, we will notify users by prompting them to review and accept the new terms upon logging in. Continued use of the platform constitutes acceptance of the updated terms.</p>
    </div>
  );
}