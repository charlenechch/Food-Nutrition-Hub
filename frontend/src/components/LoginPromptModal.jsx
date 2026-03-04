// import React from "react";
// import { createPortal } from "react-dom";
// import { useNavigate } from "react-router-dom";
// import { FaLock } from "react-icons/fa";
// import { useTranslation } from "react-i18next";

// export default function LoginPromptModal({
//   show = true,
//   message,
//   onClose,
//   onLogin,
// }) {
//   const navigate = useNavigate();
//   const { t } = useTranslation();

//   if (!show) return null;

//   const handleLoginRedirect = () => {
//     if (onLogin) onLogin();
//     else navigate("/loginregister");
//     if (onClose) onClose();
//   };

//   return createPortal(
//     <>
//       <div
//         className="modal-overlay"
//         style={{
//           position: "fixed", top: 0, left: 0,
//           width: "100vw", height: "100vh",
//           backgroundColor: "rgba(0,0,0,0.45)",
//           backdropFilter: "blur(6px)", zIndex: 999999,
//         }}
//         onClick={onClose}
//       />
//       <div
//         className="modal-card"
//         style={{
//           position: "fixed", top: "50%", left: "50%",
//           transform: "translate(-50%, -50%)",
//           background: "rgba(255,255,255,0.95)",
//           border: "1px solid rgba(185,146,106,0.4)",
//           borderRadius: "16px", padding: "32px",
//           textAlign: "center", width: "380px",
//           zIndex: 1000000, boxShadow: "0 10px 40px rgba(0,0,0,0.25)",
//           animation: "fadeInUp 0.35s ease",
//         }}
//       >
//         <h2 style={{
//           display: "flex", alignItems: "center", justifyContent: "center",
//           gap: "8px", fontSize: "1.25rem", fontWeight: "600",
//           color: "#916848", marginBottom: "12px",
//         }}>
//           <FaLock style={{ fontSize: "1.5rem" }} />
//           {t("modal.loginRequired")}
//         </h2>

//         <p style={{ color: "#444", marginBottom: "24px", fontSize: "0.95rem" }}>
//           {message || t("modal.loginMessage")}
//         </p>

//         <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
//           <button onClick={handleLoginRedirect} className="login-prompt-btn login-prompt-login">
//             {t("modal.logIn")}
//           </button>
//           <button onClick={handleLoginRedirect} className="login-prompt-btn login-prompt-register">
//             {t("modal.register")}
//           </button>
//         </div>

//         <button
//           onClick={onClose}
//           style={{
//             position: "absolute", top: "10px", right: "14px",
//             border: "none", background: "transparent",
//             fontSize: "1.25rem", color: "#888", cursor: "pointer",
//           }}
//           className="login-prompt-btn"
//         >
//           ✕
//         </button>

//         <style>{`
//           @keyframes fadeInUp {
//             from { opacity: 0; transform: translate(-50%, -40%); }
//             to   { opacity: 1; transform: translate(-50%, -50%); }
//           }
//         `}</style>
//       </div>
//     </>,
//     document.body
//   );
// }