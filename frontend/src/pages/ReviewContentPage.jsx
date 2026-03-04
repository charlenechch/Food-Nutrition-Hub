// import React, { useState, useEffect } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import Header from "../components/Header";
// import Footer from "../components/Footer";
// import { useTranslation } from "react-i18next";
// import { FaArrowLeft, FaUser, FaCalendarAlt, FaFileAlt, FaCheck, FaTimes } from "react-icons/fa";

// const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// const ReviewContentPage = () => {
//   const { t } = useTranslation();
//   const { id, type } = useParams();
//   const navigate = useNavigate();
//   const [showModal, setShowModal] = useState(false);
//   const [modalType, setModalType] = useState("");

//   const [submission, setSubmission] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   //====================
//   // CSRF
//   //====================
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

//   // Fetch submission (dynamic: recipe or community post)
//   useEffect(() => {
//     const fetchSubmission = async () => {
//       try {
//         setLoading(true);
//         setError(null);

//         const isCommunityPost = type === "communitypost" || type === "community";

//         const endpoint = isCommunityPost
//           ? `${API_URL}/api/communitypost/admin/${id}`
//           : `${API_URL}/api/recipe/recipes/${id}`;

//         console.log(`Fetching content type '${type}' from endpoint: ${endpoint}`);

//         const res = await fetch(endpoint, { credentials: "include" });

//         if (!res.ok) {
//           const errData = await res.json();
//           throw new Error(errData.error || `Failed to fetch content: ${res.status}`);
//         }

//         const data = await res.json();
//         setSubmission(data.data);
//       } catch (err) {
//         console.error("❌ Error fetching submission:", err);
//         setError(err.message);
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (id) fetchSubmission();
//   }, [id, type]);

//   // Handle Approve/Reject action
//   const handleConfirmAction = async (newStatus) => {
//     const feedback =
//       document.querySelector(".admin-feedback-input")?.value.trim() ||
//       "No feedback provided.";

//     try {
//       const isCommunityPost = type === "communitypost" || type === "community";

//       let updateUrl;

//       if (isCommunityPost) {
//         if (newStatus === "Approved") {
//           updateUrl = `${API_URL}/api/communitypost/admin/approve/${id}`;
//         } else {
//           updateUrl = `${API_URL}/api/communitypost/admin/reject/${id}`;
//         }
//       } else {
//         updateUrl = `${API_URL}/api/recipe/updateStatus/${id}`;
//       }

//       const fetchOptions = {
//         method: "PUT",
//         headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
//         credentials: "include",
//       };

//       if (!isCommunityPost) {
//         fetchOptions.body = JSON.stringify({ status: newStatus, feedback });
//       }

//       const res = await fetch(updateUrl, fetchOptions);

//       if (!res.ok) {
//         const errData = await res.json();
//         throw new Error(errData.message || "Failed to update status");
//       }

//       setShowModal(false);
//       console.log(`${newStatus === "Approved" ? "✅ Approved" : "❌ Rejected"}\n\nAdmin Feedback:\n${feedback}`);
//       navigate("/admin");
//     } catch (err) {
//       console.error("Failed to update status:", err);
//       console.error(`Error: ${err.message}`);
//     }
//   };

//   if (loading) return <p className="text-center mt-20">{t("reviseContent.loadingContent")}</p>;
//   if (error) return <p className="text-center mt-20">Error: {error}</p>;
//   if (!submission) return <p className="text-center mt-20">{t("reviseContent.contentNotFound")}</p>;

//   // Determine submission type for display purposes
//   const submissionType = type === "community"
//     ? t("reviseContent.communityPostType")
//     : t("reviseContent.submissionType");

//   return (
//     <div className="review-content-page">
//       <Header />

//       <div className="admin-review-content-header">
//         <button className="admin-content-edit-back-btn" onClick={() => navigate(-1)}>
//           <span className="content-edit-btn">
//             <FaArrowLeft />
//           </span>{" "}
//           {t("reviseContent.backToModeration")}
//         </button>

//         <div className="review-title">
//           <h2>{t("reviseContent.reviewTitle", { type: submissionType })}</h2>
//           <p>{submission.name || submission.foodName || submission.title}</p>
//         </div>

//         <div className="content-edit-review-actions">
//           <button
//             className="content-edit-approve-btn"
//             onClick={() => { setModalType("approve"); setShowModal(true); }}
//           >
//             <span className="content-edit-btn"><FaCheck /></span>{" "}
//             {t("reviseContent.approve")}
//           </button>

//           <button
//             className="content-edit-reject-btn"
//             onClick={() => { setModalType("reject"); setShowModal(true); }}
//           >
//             <span className="content-edit-btn"><FaTimes /></span>{" "}
//             {t("reviseContent.reject")}
//           </button>
//         </div>
//       </div>

//       <div className="review-container">
//         <div className="review-layout">
//           {/* Left Sidebar */}
//           <div className="review-left-sidebar">
//             <h3><FaFileAlt /> {t("reviseContent.submissionDetails")}</h3>

//             <div className="review-info">
//               <div className="info-label">
//                 <FaUser className="left-sidebar-icon" />
//                 <span> {t("reviseContent.submittedBy")}</span>
//               </div>
//               <strong>{submission.author || submission.username || "Unknown Author"}</strong>
//               <p className="email">{submission.email || "N/A"}</p>
//             </div>

//             <div className="review-info">
//               <p><FaCalendarAlt /> {t("reviseContent.submissionDate")}</p>
//               <strong>
//                 {submission.date
//                   ? new Date(submission.date).toLocaleDateString()
//                   : t("reviseContent.unknownDate")}
//               </strong>
//             </div>

//             <div className="review-info">
//               <p>{t("reviseContent.status")}</p>
//               <span className="status-tag">{submission.status}</span>
//             </div>
//           </div>

//           {/* Main Section */}
//           <div className="review-main">
//             {/* Uploaded Image Section */}
//             <div className="review-section uploaded-image-card">
//               <h3><FaFileAlt /> {t("reviseContent.uploadedImage")}</h3>
//               <div className="uploaded-img-box">
//                 <img
//                   src={
//                     submission.image ||
//                     submission.imageUrl ||
//                     "https://via.placeholder.com/400x250?text=No+Image+Available"
//                   }
//                   alt={submission.name || submission.title}
//                   className="uploaded-img"
//                 />
//               </div>
//             </div>

//             {/* Basic Information Section */}
//             <div className="rcp-review-section rcp-info-grid">
//               <h3>{t("reviseContent.basicInformation")}</h3>
//               <div className="rcp-info-grid">
//                 <div className="rcp-info-item">
//                   <h4>{t("reviseContent.foodNameTitle")}</h4>
//                   <p>{submission.name || submission.foodName || submission.title}</p>
//                 </div>

//                 <div className="rcp-info-item full-width">
//                   <h4>{t("reviseContent.originStory")}</h4>
//                   <p style={{ whiteSpace: "pre-wrap" }}>
//                     {submission.description ||
//                       submission.culturalStory ||
//                       submission.content ||
//                       t("reviseContent.noDescription")}
//                   </p>
//                 </div>

//                 {(Array.isArray(submission.instructions) && submission.instructions.length > 0) || submission.recipe ? (
//                   <div className="rcp-info-item full-width">
//                     <h4>{t("reviseContent.recipeInstructions")}</h4>
//                     {Array.isArray(submission.instructions) && submission.instructions.length > 0 ? (
//                       <ol className="list-decimal pl-5">
//                         {submission.instructions.map((step, index) => (
//                           <li key={index}>{step}</li>
//                         ))}
//                       </ol>
//                     ) : (
//                       <p style={{ whiteSpace: "pre-wrap" }}>{submission.recipe || "N/A"}</p>
//                     )}
//                   </div>
//                 ) : null}
//               </div>
//             </div>

//             {/* Admin Feedback Section */}
//             <div className="rcp-review-section rcp-basic-info-grid">
//               <h3>{t("reviseContent.adminFeedback")}</h3>
//               <div className="rcp-edit-info-grid">
//                 <div className="rcp-edit-info-item full-width">
//                   <textarea
//                     className="admin-feedback-input"
//                     placeholder={t("reviseContent.feedbackPlaceholder")}
//                     rows="4"
//                   ></textarea>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Modal Confirmation */}
//       {showModal && (
//         <div className="confirm-overlay">
//           <div className="confirm-modal">
//             <h3>{t("reviseContent.warningTitle")}</h3>
//             <p>
//               {t("reviseContent.warningConfirm", {
//                 action: modalType === "approve" ? t("reviseContent.approve").toLowerCase() : t("reviseContent.reject").toLowerCase(),
//                 type: submissionType,
//               })}
//             </p>

//             <div className="confirm-buttons">
//               <button className="cancel-btn" onClick={() => setShowModal(false)}>
//                 {t("reviseContent.cancelBtn")}
//               </button>

//               <button
//                 className={modalType === "approve" ? "approve-btn" : "delete-btn"}
//                 onClick={() => handleConfirmAction(modalType === "approve" ? "Approved" : "Rejected")}
//               >
//                 {modalType === "approve" ? t("reviseContent.approve") : t("reviseContent.reject")}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       <Footer />
//     </div>
//   );
// };

// export default ReviewContentPage;