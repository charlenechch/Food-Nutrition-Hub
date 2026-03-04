// import React, { useEffect, useState } from "react";
// import { useSearchParams, useNavigate } from "react-router-dom";
// import { useTranslation } from "react-i18next";
// import { auth } from "../config/firebase";
// import "../css/EmailVerificationPage.css";
// import { applyActionCode, checkActionCode } from "firebase/auth";

// const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// export default function EmailVerificationPage() {
//   const [searchParams] = useSearchParams();
//   const navigate = useNavigate();
//   const { t } = useTranslation();
//   const oobCode = searchParams.get('oobCode');
  
//   const [status, setStatus] = useState('verifying'); // verifying, success, error
//   const [message, setMessage] = useState('');

//   // CSRF
//   const [csrfToken, setCsrfToken] = useState("");

//   useEffect(() => {
//     const fetchCsrfToken = async () => {
//       try {
//         const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
//         const res = await fetch(`${API_BASE_URL}/api/csrf-token`, { credentials: "include" });
//         const data = await res.json();
//         setCsrfToken(data.csrfToken);
//       } catch (err) {
//         console.error("Failed to fetch CSRF token", err);
//       }
//     };
//     fetchCsrfToken();
//   }, []);

//   useEffect(() => {
//     if (!oobCode) {
//         setStatus("error");
//         setMessage(t("emailVerification.invalidLink"));
//         return;
//     }
    
//     if (!csrfToken) return;

//     const verifyEmail = async () => {
//         try {
//         // Step 1: Get email from verification code
//         const info = await checkActionCode(auth, oobCode);
//         const email = info.data.email;
        
//         // Step 2: Apply the action code (verify in Firebase)
//         await applyActionCode(auth, oobCode);
        
//         // Step 3: Sync to MySQL database
//         try {
//             const response = await fetch(`${API_URL}/api/auth/syncEmailVerification`, {
//             method: "POST",
//             headers: { 
//                 "Content-Type": "application/json",
//                 "X-CSRF-Token": csrfToken
//              },
//             credentials: "include",
//             body: JSON.stringify({ email })
//             });
            
//             if (response.ok) {
//                 console.log("Verification synced to database");
//             } else {
//                 console.error("Failed to sync verification to database");
//             }
//         } catch (syncError) {
//             console.error("Database sync error:", syncError);
//         }
        
//         // Step 4: Show success
//         setStatus("success");
//         setMessage(t("emailVerification.successMsg"));
//         setTimeout(() => navigate("/loginregister"), 3000);
        
//         } catch (error) {
//             setStatus("error");
//             if (error.code === "auth/invalid-action-code") {
//                 setMessage(t("emailVerification.invalidActionCode"));
//             } else if (error.code === "auth/expired-action-code") {
//                 setMessage(t("emailVerification.expiredActionCode"));
//             } else {
//                 setMessage(t("emailVerification.unexpectedError"));
//             }
//         }
//     };
    
//     verifyEmail();
//     }, [oobCode, navigate, csrfToken, t]);
  
//   return (
//     <div className="ev-container">
//       <div className="ev-card">
//         {status === 'verifying' && (
//           <>
//             <div className="ev-header">
//               <div className="ev-logo">📧</div>
//               <h2 className="ev-title">{t("emailVerification.title")}</h2>
//               <p className="ev-subtitle">{t("emailVerification.pleaseWait")}</p>
//             </div>
            
//             <div className="ev-body">
//               <div className="ev-spinner-wrapper">
//                 <div className="ev-spinner"></div>
//                 <p className="ev-muted">{message || t("emailVerification.verifying")}</p>
//               </div>
//             </div>
//           </>
//         )}
        
//         {status === 'success' && (
//           <>
//             <div className="ev-header">
//               <div className="ev-success-icon">✓</div>
//               <h2 className="ev-title">{t("emailVerification.successTitle")}</h2>
//               <p className="ev-subtitle">{message}</p>
//             </div>
            
//             <div className="ev-body">
//               <p className="ev-muted">{t("emailVerification.canLogin")}</p>
//               <p className="ev-redirect-text">{t("emailVerification.redirecting")}</p>
//             </div>
//           </>
//         )}
        
//         {status === 'error' && (
//           <>
//             <div className="ev-header">
//               <div className="ev-error-icon">✗</div>
//               <h2 className="ev-title">{t("emailVerification.failedTitle")}</h2>
//               <p className="ev-subtitle">{message}</p>
//             </div>
            
//             <div className="ev-body">
//               <div className="ev-actions">
//                 <button
//                   className="lrp-btn lrp-btn-primary"
//                   onClick={() => navigate('/loginregister')}
//                 >
//                   {t("auth.backToLogin")}
//                 </button>
//                 <button
//                   className="lrp-btn lrp-btn-outline"
//                   onClick={() => window.location.reload()}
//                 >
//                   {t("emailVerification.tryAgain")}
//                 </button>
//               </div>
//             </div>
//           </>
//         )}
//       </div>
//     </div>
//   );
// }