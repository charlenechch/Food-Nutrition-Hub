import React from "react";
import "./Footer.css";
import { FaEnvelope, FaPhone, FaMapMarkerAlt } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* About Section */}
        <div className="footer-about">
          <h3>
            <span className="logo-icon">S</span> SarawakEats
          </h3>
          {/* <h4>About SarawakEats</h4>
          <p>
            Preserving and celebrating the rich culinary heritage of Sarawak
            through traditional recipes, cultural stories, and community
            contributions.
          </p> */}
        </div>

        {/* Quick Links */}
        {/* <div className="footer-links">
          <h4>Quick Links</h4>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/explore">Explore Foods</a></li>
            <li><a href="/analyzer">Nutrition Analyzer</a></li>
            <li><a href="/recipes">Recipes</a></li>
            <li><a href="/community">Community</a></li>
          </ul>
        </div> */}

        {/* Contact */}
        {/* <div className="footer-contact">
          <h4>Contact</h4>
          <p><FaEnvelope /> info@sarawakeats.com</p>
          <p><FaPhone /> +60 82-123456</p>
          <p><FaMapMarkerAlt /> Kuching, Sarawak, Malaysia</p>
        </div> */}
      </div>

      {/* Footer Bottom */}
      {/* <div className="footer-bottom">
        <p>© 2024 SarawakEats. All rights reserved.</p>
        <div className="footer-bottom-links">
          <a href="/privacy">Privacy Policy</a>
          <a href="/terms">Terms of Service</a>
        </div>
      </div>

      <p className="made-with">
        Made with <span style={{ color: "red" }}>❤</span> for Sarawak
      </p> */}
    </footer>
  );
}


