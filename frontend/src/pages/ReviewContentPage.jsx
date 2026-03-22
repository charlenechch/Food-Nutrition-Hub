import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useTranslation } from "react-i18next";
import { FaArrowLeft, FaUser, FaCalendarAlt, FaFileAlt, FaCheck, FaTimes, FaPencilAlt } from "react-icons/fa";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const ReviewContentPage = () => {
  const { t } = useTranslation();
  const { id, type } = useParams();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");

  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  //====================
  // CSRF
  //====================
  const [csrfToken, setCsrfToken] = useState("");

  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const res = await fetch(`${API_BASE_URL}/api/csrf-token`, { credentials: "include" });
        const data = await res.json();
        setCsrfToken(data.csrfToken);
      } catch (err) {
        console.error("Failed to fetch CSRF token", err);
      }
    };
    fetchCsrfToken();
  }, []);

  // Fetch submission (dynamic: recipe or community post)
  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        setLoading(true);
        setError(null);

        const isCommunityPost = type === "communitypost" || type === "community";

        const endpoint = isCommunityPost
          ? `${API_URL}/api/communitypost/admin/${id}`
          : `${API_URL}/api/recipe/recipes/${id}`;

        console.log(`Fetching content type '${type}' from endpoint: ${endpoint}`);

        const res = await fetch(endpoint, { credentials: "include" });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || `Failed to fetch content: ${res.status}`);
        }

        const data = await res.json();
        setSubmission(data.data);
      } catch (err) {
        console.error("❌ Error fetching submission:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchSubmission();
  }, [id, type]);

  // Handle Approve/Draft/Reject action
  const handleConfirmAction = async (actionType) => {
    const feedback =
      document.querySelector(".admin-feedback-input")?.value.trim() ||
      "No feedback provided.";

    try {
      const isCommunityPost = type === "communitypost" || type === "community";

      let updateUrl;
      let statusToSend;

      // Determine the status based on action and content type
      if (actionType === "draft") {
        // For recipes only - set to Draft
        statusToSend = "Draft";
        updateUrl = `${API_URL}/api/recipe/updateStatus/${id}`;
      } else if (actionType === "approve") {
        // For community posts only
        statusToSend = "Approved";
        updateUrl = `${API_URL}/api/communitypost/admin/approve/${id}`;
      } else if (actionType === "reject") {
        // For both recipes and community posts
        statusToSend = "Rejected";
        updateUrl = isCommunityPost 
          ? `${API_URL}/api/communitypost/admin/reject/${id}`
          : `${API_URL}/api/recipe/updateStatus/${id}`;
      }

      const fetchOptions = {
        method: "PUT",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
        credentials: "include",
      };

      // Add body for recipe updates (not community posts)
      if (!isCommunityPost || actionType === "reject") {
        fetchOptions.body = JSON.stringify({ status: statusToSend, feedback });
      }

      const res = await fetch(updateUrl, fetchOptions);

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to update status");
      }

      setShowModal(false);
      
      // Log the action
      if (actionType === "draft") {
        console.log(`📝 Recipe marked as Draft for final admin editing\n\nAdmin Feedback:\n${feedback}`);
      } else {
        console.log(`${actionType === "approve" ? "✅ Approved" : "❌ Rejected"}\n\nAdmin Feedback:\n${feedback}`);
      }
      
      navigate("/admin");
    } catch (err) {
      console.error("Failed to update status:", err);
      console.error(`Error: ${err.message}`);
      alert(err.message);
    }
  };

  if (loading) return <p className="text-center mt-20">{t("reviseContent.loadingContent")}</p>;
  if (error) return <p className="text-center mt-20">Error: {error}</p>;
  if (!submission) return <p className="text-center mt-20">{t("reviseContent.contentNotFound")}</p>;

  // Determine submission type for display purposes
  const submissionType = type === "community" || type === "communitypost"
    ? "Community Post"
    : "Recipe";
  
  // Check if this is a recipe (not community post)
  const isRecipe = type !== "community" && type !== "communitypost";

  return (
    <div className="review-content-page">
      <Header />

      <div className="admin-review-content-header">
        <button className="admin-content-edit-back-btn" onClick={() => navigate(-1)}>
          <span className="content-edit-btn">
            <FaArrowLeft />
          </span>{" "}
          Back to Moderation
        </button>

        <div className="review-title">
          <h2>Review {submissionType}</h2>
          <p>{submission.name || submission.foodName || submission.title}</p>
        </div>

        <div className="content-edit-review-actions">
          {isRecipe ? (
            // For Recipes: Show DRAFT button instead of APPROVE
            <button
              className="content-edit-draft-btn"
              onClick={() => { setModalType("draft"); setShowModal(true); }}
              style={{
                backgroundColor: "#F59E0B",
                color: "#fff",
                padding: "10px 20px",
                borderRadius: "4px",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <span className="content-edit-btn"><FaPencilAlt /></span>
              Draft
            </button>
          ) : (
            // For Community Posts: Show APPROVE button
            <button
              className="content-edit-approve-btn"
              onClick={() => { setModalType("approve"); setShowModal(true); }}
              style={{
                backgroundColor: "#28a745",
                color: "#fff",
                padding: "10px 20px",
                borderRadius: "4px",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <span className="content-edit-btn"><FaCheck /></span>
              Approve
            </button>
          )}

          {/* Reject button for both */}
          <button
            className="content-edit-reject-btn"
            onClick={() => { setModalType("reject"); setShowModal(true); }}
            style={{
              backgroundColor: "#dc3545",
              color: "#fff",
              padding: "10px 20px",
              borderRadius: "4px",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <span className="content-edit-btn"><FaTimes /></span>
            Reject
          </button>
        </div>
      </div>

      {/* Info banner for recipe draft workflow */}
      {isRecipe && (
        <div className="admin-info-banner" style={{
          backgroundColor: "#FFF8E7",
          borderLeft: "4px solid #F59E0B",
          padding: "12px 20px",
          margin: "20px auto",
          maxWidth: "1200px",
          borderRadius: "8px"
        }}>
          <p style={{ margin: 0, color: "#92400E" }}>
            <strong>ℹ️ Note:</strong> Clicking "Draft" will mark this recipe for final editing. You'll need to edit the food details and publish it before it becomes visible to users.
          </p>
        </div>
      )}

      <div className="review-container">
        <div className="review-layout">
          {/* Left Sidebar */}
          <div className="review-left-sidebar">
            <h3><FaFileAlt /> Submission Details</h3>

            <div className="review-info">
              <div className="info-label">
                <FaUser className="left-sidebar-icon" />
                <span> Submitted By</span>
              </div>
              <strong>{submission.author || submission.username || "Unknown Author"}</strong>
              <p className="email">{submission.email || "N/A"}</p>
            </div>

            <div className="review-info">
              <p><FaCalendarAlt /> Submission Date</p>
              <strong>
                {submission.date
                  ? new Date(submission.date).toLocaleDateString()
                  : "Unknown Date"}
              </strong>
            </div>

            <div className="review-info">
              <p>Current Status</p>
              <span className="status-tag" style={{
                backgroundColor: submission.status === "Draft" ? "#FEF3C7" : 
                                 submission.status === "Approved" ? "#D1FAE5" :
                                 submission.status === "Rejected" ? "#FEE2E2" : "#E0E7FF",
                color: submission.status === "Draft" ? "#92400E" :
                       submission.status === "Approved" ? "#065F46" :
                       submission.status === "Rejected" ? "#991B1B" : "#1E40AF",
                padding: "4px 12px",
                borderRadius: "20px",
                fontSize: "0.875rem",
                fontWeight: "500"
              }}>
                {submission.status || "Pending"}
              </span>
            </div>
          </div>

          {/* Main Section */}
          <div className="review-main">
            {/* Uploaded Image Section */}
            <div className="review-section uploaded-image-card">
              <h3><FaFileAlt /> Uploaded Image</h3>
              <div className="uploaded-img-box">
                <img
                  src={
                    submission.image ||
                    submission.imageUrl ||
                    "https://via.placeholder.com/400x250?text=No+Image+Available"
                  }
                  alt={submission.name || submission.title}
                  className="uploaded-img"
                  style={{ maxWidth: "100%", height: "auto" }}
                />
              </div>
            </div>

            {/* Basic Information Section */}
            <div className="rcp-review-section rcp-info-grid">
              <h3>Basic Information</h3>
              <div className="rcp-info-grid">
                <div className="rcp-info-item">
                  <h4>{isRecipe ? "Food Name" : "Title"}</h4>
                  <p>{submission.name || submission.foodName || submission.title}</p>
                </div>

                <div className="rcp-info-item full-width">
                  <h4>{isRecipe ? "Origin Story" : "Description"}</h4>
                  <p style={{ whiteSpace: "pre-wrap" }}>
                    {submission.description ||
                      submission.culturalStory ||
                      submission.content ||
                      "No description provided"}
                  </p>
                </div>

                {isRecipe && ((Array.isArray(submission.instructions) && submission.instructions.length > 0) || submission.recipe) && (
                  <div className="rcp-info-item full-width">
                    <h4>Recipe Instructions</h4>
                    {Array.isArray(submission.instructions) && submission.instructions.length > 0 ? (
                      <ol style={{ paddingLeft: "20px" }}>
                        {submission.instructions.map((step, index) => (
                          <li key={index}>{step}</li>
                        ))}
                      </ol>
                    ) : (
                      <p style={{ whiteSpace: "pre-wrap" }}>{submission.recipe || "N/A"}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Admin Feedback Section */}
            <div className="rcp-review-section rcp-basic-info-grid">
              <h3>Admin Feedback</h3>
              <div className="rcp-edit-info-grid">
                <div className="rcp-edit-info-item full-width">
                  <textarea
                    className="admin-feedback-input"
                    placeholder="Provide feedback for the user here..."
                    rows="4"
                    style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
                  ></textarea>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Confirmation */}
      {showModal && (
        <div className="confirm-overlay" style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000
        }}>
          <div className="confirm-modal" style={{
            backgroundColor: "#fff",
            padding: "24px",
            borderRadius: "8px",
            maxWidth: "500px",
            width: "90%"
          }}>
            <h3>Confirm Action</h3>
            <p>
              {modalType === "draft" 
                ? `Are you sure you want to mark this ${submissionType} as DRAFT? It will require final admin editing before publication.`
                : modalType === "approve"
                ? `Are you sure you want to APPROVE this ${submissionType}?`
                : `Are you sure you want to REJECT this ${submissionType}?`
              }
            </p>

            <div className="confirm-buttons" style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
              <button 
                className="cancel-btn" 
                onClick={() => setShowModal(false)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#6c757d",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>

              <button
                className={modalType === "draft" ? "draft-btn" : modalType === "approve" ? "approve-btn" : "delete-btn"}
                onClick={() => handleConfirmAction(modalType)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: modalType === "draft" ? "#F59E0B" : 
                                   modalType === "approve" ? "#28a745" : "#dc3545",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                {modalType === "draft" ? "Draft" : modalType === "approve" ? "Approve" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default ReviewContentPage;