import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { FaArrowLeft } from "react-icons/fa";
import "../css/TermsAndConditionsPage.css";

export default function TermsAndConditionsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="terms-page">
      <Header />

      <div className="terms-content-wrapper">
        <button className="terms-back-btn" onClick={() => navigate(-1)}>
          <FaArrowLeft /> Back
        </button>

        <h1 className="terms-title">Terms & Conditions</h1>

        <p className="terms-updated-text">Last Updated: 9th March 2026</p>

        <section>
          <h2 className="terms-section-title">1. Introduction</h2>
          <p className="terms-text">
            Welcome to SarawakEats. By accessing or using our website and services, you agree to be bound by these Terms & Conditions. If you do not agree with any part of these terms, please do not use our platform.
          </p>
        </section>

        <section>
          <h2 className="terms-section-title">2. User Accounts</h2>
          <p className="terms-text">
            To access certain features of SarawakEats, such as posting recipes or participating in discussions, you must register for an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
          </p>
        </section>

        <section>
          <h2 className="terms-section-title">3. Community Guidelines & Content</h2>
          <p className="terms-text">
            Our community thrives on respect and sharing. Users may submit recipes and posts, provided the content is not illegal, offensive, defamatory, or infringing on intellectual property rights. SarawakEats reserves the right to review, edit, or remove any user-submitted content at our discretion.
          </p>
        </section>

        <section>
          <h2 className="terms-section-title">4. Intellectual Property</h2>
          <p className="terms-text">
            The overarching content, design, and branding of SarawakEats are owned by us. User-submitted recipes remain the property of the creator; however, by submitting content to SarawakEats, you grant us a non-exclusive license to display, modify, and share it across our platform.
          </p>
        </section>

        <section>
          <h2 className="terms-section-title">5. Limitation of Liability</h2>
          <p className="terms-text">
            SarawakEats provides culinary information and tools for educational and inspirational purposes only. We do not guarantee the absolute accuracy of nutritional data and are not liable for any health issues, allergies, or damages arising from the use of our recipes or tools. Always consult a professional for strict dietary requirements.
          </p>
        </section>

        <section>
          <h2 className="terms-section-title">6. Changes to Terms</h2>
          <p className="terms-text">
            We reserve the right to modify these Terms & Conditions at any time. When significant changes occur, we will notify users by prompting them to review and accept the new terms upon logging in. Continued use of the platform constitutes acceptance of the updated terms.
          </p>
        </section>
      </div>

      <Footer />
    </div>
  );
}
