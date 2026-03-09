import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { FaArrowLeft } from "react-icons/fa";
import "../css/PrivacyPolicyPage.css";

export default function TermsAndConditionsPage() {
  const { t } = useTranslation();

  return (
    <div className="page-container" style={{ backgroundColor: "#faf8f5", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      
      <main style={{ flex: 1, maxWidth: "800px", margin: "40px auto", padding: "40px", backgroundColor: "#fff", borderRadius: "16px", boxShadow: "0 10px 30px rgba(0,0,0,0.05)", fontFamily: '"Poppins", sans-serif', color: "#333" }}>
        <h1 style={{ fontFamily: '"Playfair Display", serif', color: "#5c3a21", fontSize: "2.5rem", marginBottom: "10px" }}>
          Terms & Conditions
        </h1>
        <p style={{ color: "#888", marginBottom: "40px", fontSize: "0.95rem" }}>
          Last Updated: March 2026
        </p>

        <section style={{ marginBottom: "30px" }}>
          <h2 style={{ color: "#916848", fontSize: "1.3rem", marginBottom: "12px", fontWeight: "600" }}>1. Introduction</h2>
          <p style={{ lineHeight: "1.7", fontSize: "0.95rem", color: "#555" }}>
            Welcome to SarawakEats. By accessing or using our website and services, you agree to be bound by these Terms & Conditions. If you do not agree with any part of these terms, please do not use our platform.
          </p>
        </section>

        <section style={{ marginBottom: "30px" }}>
          <h2 style={{ color: "#916848", fontSize: "1.3rem", marginBottom: "12px", fontWeight: "600" }}>2. User Accounts</h2>
          <p style={{ lineHeight: "1.7", fontSize: "0.95rem", color: "#555" }}>
            To access certain features of SarawakEats, such as posting recipes or participating in discussions, you must register for an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
          </p>
        </section>

        <section style={{ marginBottom: "30px" }}>
          <h2 style={{ color: "#916848", fontSize: "1.3rem", marginBottom: "12px", fontWeight: "600" }}>3. Community Guidelines & Content</h2>
          <p style={{ lineHeight: "1.7", fontSize: "0.95rem", color: "#555" }}>
            Our community thrives on respect and sharing. Users may submit recipes and posts, provided the content is not illegal, offensive, defamatory, or infringing on intellectual property rights. SarawakEats reserves the right to review, edit, or remove any user-submitted content at our discretion.
          </p>
        </section>

        <section style={{ marginBottom: "30px" }}>
          <h2 style={{ color: "#916848", fontSize: "1.3rem", marginBottom: "12px", fontWeight: "600" }}>4. Intellectual Property</h2>
          <p style={{ lineHeight: "1.7", fontSize: "0.95rem", color: "#555" }}>
            The overarching content, design, and branding of SarawakEats are owned by us. User-submitted recipes remain the property of the creator; however, by submitting content to SarawakEats, you grant us a non-exclusive license to display, modify, and share it across our platform.
          </p>
        </section>

        <section style={{ marginBottom: "30px" }}>
          <h2 style={{ color: "#916848", fontSize: "1.3rem", marginBottom: "12px", fontWeight: "600" }}>5. Limitation of Liability</h2>
          <p style={{ lineHeight: "1.7", fontSize: "0.95rem", color: "#555" }}>
            SarawakEats provides culinary information and tools for educational and inspirational purposes only. We do not guarantee the absolute accuracy of nutritional data and are not liable for any health issues, allergies, or damages arising from the use of our recipes or tools. Always consult a professional for strict dietary requirements.
          </p>
        </section>

        <section style={{ marginBottom: "30px" }}>
          <h2 style={{ color: "#916848", fontSize: "1.3rem", marginBottom: "12px", fontWeight: "600" }}>6. Changes to Terms</h2>
          <p style={{ lineHeight: "1.7", fontSize: "0.95rem", color: "#555" }}>
            We reserve the right to modify these Terms & Conditions at any time. When significant changes occur, we will notify users by prompting them to review and accept the new terms upon logging in. Continued use of the platform constitutes acceptance of the updated terms.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}