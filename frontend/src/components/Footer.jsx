import React from "react";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-about">
        <h3>SarawakEats</h3>
        <p>
          Preserving and celebrating the rich culinary heritage of Sarawak 
          through traditional recipes, cultural stories, and community contributions.
        </p>
      </div>

      <div className="footer-links">
        <h4>Quick Links</h4>
        <ul>
          <li>Home</li>
          <li>Explore Foods</li>
          <li>Nutrition Analyzer</li>
          <li>Recipes</li>
          <li>Community</li>
        </ul>
      </div>

      <div className="footer-contact">
        <h4>Contact</h4>
        <p>📧 info@sarawakeats.com</p>
        <p>📞 +60 82-123456</p>
        <p>📍 Kuching, Sarawak, Malaysia</p>
      </div>
    </footer>
  );
}
