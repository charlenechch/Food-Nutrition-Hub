// import React from "react";
// import "./Footer.css";
// import { FaEnvelope, FaPhone, FaMapMarkerAlt } from "react-icons/fa";
// import { useTranslation } from "react-i18next";

// export default function Footer() {
//   const { t } = useTranslation();

//   return (
//     <footer className="footer">
//       <div className="footer-container">
//         {/* About Section */}
//         <div className="footer-about">
//           <h3>
//             <span className="logo-icon">S</span> SarawakEats
//           </h3>
//           <h4>{t("footer.aboutTitle")}</h4>
//           <p>{t("footer.aboutDesc")}</p>
//         </div>

//         {/* Quick Links */}
//         <div className="footer-links">
//           <h4>{t("footer.quickLinks")}</h4>
//           <ul>
//             <li><a href="/home">{t("nav.home")}</a></li>
//             <li><a href="/foods">{t("nav.explore")}</a></li>
//             <li><a href="/analyzer">{t("nav.analyzer")}</a></li>
//             <li><a href="/recipes">{t("nav.recipes")}</a></li>
//             <li><a href="/community">{t("nav.community")}</a></li>
//           </ul>
//         </div>

//         {/* Contact Section */}
//         <div className="footer-contact">
//           <h4>{t("footer.contact")}</h4>
//           <p><FaEnvelope className="footer-icon" /> info@sarawakeats.com</p>
//           <p><FaPhone className="footer-icon" /> +60 82-123456</p>
//           <p><FaMapMarkerAlt className="footer-icon" /> Kuching, Sarawak, Malaysia</p>
//         </div>
//       </div>

//       {/* Footer Bottom */}
//       <div className="footer-bottom">
//         <p>{t("footer.rights")}</p>
//         <div className="footer-bottom-links">
//           <a href="/privacy">{t("footer.privacy")}</a>
//           <a href="/terms">{t("footer.terms")}</a>
//         </div>
//       </div>
//     </footer>
//   );
// }
