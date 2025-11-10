import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { FaArrowLeft, FaUser, FaCalendarAlt, FaFileAlt, FaCheck, FaTimes } from "react-icons/fa";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const ReviewContentPage = () => {
  const { id, type } = useParams(); // ✅ type will be "community" or "recipe"
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");

  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ Fetch submission (dynamic: recipe or community post)
  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        setLoading(true);
        setError(null);

        // --- Check for community post URL ---
        const isCommunityPost = type === "communitypost" || type === "community";
        
        // ✅ Detect endpoint based on type
        const endpoint = isCommunityPost
          ? `${API_URL}/api/communitypost/admin/${id}` // Use correct community endpoint
          : `${API_URL}/api/recipe/recipes/${id}`; // Default to recipe endpoint

        console.log(`Fetching content type '${type}' from endpoint: ${endpoint}`);

        const res = await fetch(endpoint, {
          credentials: "include",
        });

        if (!res.ok) {
          const errData = await res.json();
          // Include the actual status code in the error message for better debugging
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

  // Handle Approve/Reject action
  const handleConfirmAction = async (newStatus) => {
    const feedback =
      document.querySelector(".admin-feedback-input")?.value.trim() ||
      "No feedback provided.";

    try {
      // 1. Determine if it's a community post
      const isCommunityPost = type === "communitypost" || type === "community";

      let updateUrl;

      if (isCommunityPost) {
        // Check the newStatus and build the URL the backend expects
        if (newStatus === "Approved") {
          updateUrl = `${API_URL}/api/communitypost/admin/approve/${id}`;
        } else {
          updateUrl = `${API_URL}/api/communitypost/admin/reject/${id}`;
        }
      } else {
        // This is for your recipes (it uses updateStatus)
        updateUrl = `${API_URL}/api/recipe/updateStatus/${id}`;
      }

      // 3. Set up the request options
      const fetchOptions = {
        method: "PUT", // <-- Use PUT (to match your backend)
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      };

      // 4. Only add a body if it's a recipe
      // (Your community post routes don't need a body, but the recipe one does)
      if (!isCommunityPost) {
        fetchOptions.body = JSON.stringify({ status: newStatus, feedback });
      }
      
      // 5. Make the request
      const res = await fetch(updateUrl, fetchOptions);

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to update status");
      }

      setShowModal(false);
      // NOTE: Using console.log instead of alert() as per environment instructions
      console.log(`${newStatus === "Approved" ? "✅ Approved" : "❌ Rejected"}\n\nAdmin Feedback:\n${feedback}`);
      navigate("/admin"); // Navigate back to AdminHomepage
    } catch (err) {
      console.error("Failed to update status:", err);
      // NOTE: Using console.error instead of alert()
      console.error(`Error: ${err.message}`);
    }
  };


  if (loading) return <p className="text-center mt-20">Loading content...</p>;
  if (error) return <p className="text-center mt-20">Error: {error}</p>;
  if (!submission) return <p className="text-center mt-20">Content not found.</p>;

  // Determine submission type for display purposes
  const submissionType = type === "community" ? "community post" : type || "submission";

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
          <button
            className="content-edit-approve-btn"
            onClick={() => {
              setModalType("approve");
              setShowModal(true);
            }}
          >
            <span className="content-edit-btn">
              <FaCheck />
            </span>{" "}
            Approve
          </button>

          <button
            className="content-edit-reject-btn"
            onClick={() => {
              setModalType("reject");
              setShowModal(true);
            }}
          >
            <span className="content-edit-btn">
              <FaTimes />
            </span>{" "}
            Reject
          </button>
        </div>
      </div>

      {/* --- Content Display (Simplified for brevity, assuming existing structure) --- */}
      <div className="review-container">
        <div className="review-layout">
          {/* ===== Left Sidebar ===== */}
          <div className="review-left-sidebar">
            <h3>
              <FaFileAlt /> Submission Details
            </h3>

            <div className="review-info">
              <div className="info-label">
                <FaUser className="left-sidebar-icon" />
                <span> Submitted by</span>
              </div>
              <strong>{submission.author || submission.username || "Unknown Author"}</strong>
              <p className="email">{submission.email || "N/A"}</p>
            </div>

            <div className="review-info">
              <p>
                <FaCalendarAlt /> Submission Date
              </p>
              <strong>
                {submission.date
                  ? new Date(submission.date).toLocaleDateString()
                  : "Unknown"}
              </strong>
            </div>

            <div className="review-info">
              <p>Status</p>
              <span className="status-tag">{submission.status}</span>
            </div>
          </div>

          {/* ===== Main Section ===== */}
          <div className="review-main">
            {/* ===== Uploaded Image Section ===== */}
            <div className="review-section uploaded-image-card">
              <h3>
                <FaFileAlt /> Uploaded Image
              </h3>
              <div className="uploaded-img-box">
                <img
                  src={
                    submission.image ||
                    submission.imageUrl ||
                    "https://via.placeholder.com/400x250?text=No+Image+Available"
                  }
                  alt={submission.name || submission.title}
                  className="uploaded-img"
                />
              </div>
            </div>

            {/* ===== Basic Information Section (Handles both Recipe and Post fields) ===== */}
            <div className="rcp-review-section rcp-info-grid">
              <h3>Basic Information</h3>
              <div className="rcp-info-grid">
                <div className="rcp-info-item">
                  <h4>Food Name / Title</h4>
                  <p>{submission.name || submission.foodName || submission.title}</p>
                </div>

                <div className="rcp-info-item full-width">
                  <h4>Origin / Cultural Story</h4>
                  <p style={{ whiteSpace: "pre-wrap" }}>
                    {submission.description ||
                      submission.culturalStory ||
                      submission.content ||
                      "No description provided."}
                  </p>
                </div>
                
                {/* Display instructions/recipe if available */}
                {(Array.isArray(submission.instructions) && submission.instructions.length > 0) || submission.recipe ? (
                  <div className="rcp-info-item full-width">
                    <h4>Recipe / Instructions</h4>
                    {Array.isArray(submission.instructions) && submission.instructions.length > 0 ? (
                      <ol className="list-decimal pl-5">
                        {submission.instructions.map((step, index) => (
                          <li key={index}>{step}</li>
                        ))}
                      </ol>
                    ) : (
                      <p style={{ whiteSpace: "pre-wrap" }}>{submission.recipe || "N/A"}</p>
                    )}
                  </div>
                ) : null}
              </div>
            </div>

            {/* ===== Admin Feedback Section ===== */}
            <div className="rcp-review-section rcp-basic-info-grid">
              <h3>Admin Feedback</h3>
              <div className="rcp-edit-info-grid">
                <div className="rcp-edit-info-item full-width">
                  <textarea
                    className="admin-feedback-input"
                    placeholder="Enter feedback for the submitter..."
                    rows="4"
                  ></textarea>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* ===== Modal Confirmation ===== */}
      {showModal && (
        <div className="confirm-overlay">
          <div className="confirm-modal">
            <h3>Warning</h3>
            <p>
              Are you sure you want to{" "}
              <strong>{modalType === "approve" ? "approve" : "reject"}</strong> this{" "}
              {submissionType} submission?
              <br />
              This action cannot be undone.
            </p>

            <div className="confirm-buttons">
              <button className="cancel-btn" onClick={() => setShowModal(false)}>
                Cancel
              </button>

              <button
                className={modalType === "approve" ? "approve-btn" : "delete-btn"}
                onClick={() => handleConfirmAction(modalType === "approve" ? "Approved" : "Rejected")}
              >
                {modalType === "approve" ? "Approve" : "Reject"}
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
