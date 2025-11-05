import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { FaArrowLeft, FaUser, FaCalendarAlt, FaFileAlt, FaCheck, FaTimes } from "react-icons/fa";

// ✅ Use your existing review CSS
import "../css/EditRecipe.css"; 

// ✅ Use your API_URL constant
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const AdminCommunityReviewDetail = () => {
  const { reviewId: id } = useParams(); // Renaming reviewId to id
  const navigate = useNavigate();
  
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(""); 

  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ 1. Fetch community post
  useEffect(() => {
    const fetchCommunityPost = async () => {
      try {
        setLoading(true);
        
        // ✅ CORRECTED URL from your file:
        const res = await fetch(`${API_URL}/api/communityPost/${id}`); // <-- 'credentials' line removed

        const data = await res.json();
        
        if (data.success) {
          const postData = data.data;
          const normalized = {
            id: postData._id,
            title: postData.foodName || "Untitled Post", 
            content: postData.culturalStory || "No content provided.", 
            author: postData.author || "Unknown Author",
            email: postData.authorEmail || "N/A", 
            submissionDate: postData.createdAt ? new Date(postData.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
            status: postData.status || "Pending",
            image: postData.image || null, 
          };
          setSubmission(normalized);
          setError(null);
        } else {
          throw new Error(data.message || "Failed to load post");
        }
        
      } catch (err) {
        console.error("Error fetching community post:", err);
        setError(err.message);
      } finally {
        setLoading(false); // This will now run
      }
    };

    if (id) fetchCommunityPost();
  }, [id]);

  // ✅ 2. Handle the modal confirmation
  const handleConfirmAction = async () => {
    const newStatus = modalType === "approve" ? "Approved" : "Rejected";
    const feedback =
      document.querySelector(".admin-feedback-input")?.value.trim() ||
      "No feedback provided.";

    try {
      // ✅ CORRECTED URL from your file:
      const res = await fetch(`${API_URL}/api/communityPost/updateStatus/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        // <-- 'credentials' line removed
        body: JSON.stringify({ status: newStatus, adminFeedback: feedback }),
      });

      const data = await res.json();

      if (data.success) {
        setShowModal(false);
        alert(data.message || `Post ${newStatus}`);
        navigate("/admin");
      } else {
        throw new Error(data.message || "Failed to update status");
      }

    } catch (err) {
      console.error("Failed to update status:", err);
      alert(`Error: ${err.message}`);
    }
  };

  // --- Render logic ---

  if (loading) return <p className="text-center mt-20">Loading content...</p>;
  if (error) return <p className="text-center mt-20">Error: {error}</p>;
  if (!submission) return <p className="text-center mt-20">Content not found.</p>;

  return (
    <div className="admin-review-page">
      <Header />

      <div className="admin-review-header">
        <button className="admin-recipe-edit-back-btn" onClick={() => navigate("/admin")}>
          <span className="recipe-edit-btn"><FaArrowLeft /></span> Back to Moderation
        </button>
        <div className="review-title">
          <h2>Review Submission</h2>
          <p>{submission.title}</p>
        </div>
        <div className="rcp-edit-review-actions">
          <button
            className="rcp-edit-approve-btn"
            onClick={() => {
              setModalType("approve");
              setShowModal(true);
            }}
          >
            <span className="recipe-edit-btn"><FaCheck /></span> Approve
          </button>
          <button
            className="rcp-edit-reject-btn"
            onClick={() => {
              setModalType("reject");
              setShowModal(true);
            }}
          >
            <span className="recipe-edit-btn"><FaTimes /></span> Reject
          </button>
        </div>
      </div>

      <div className="review-container">
        <div className="review-layout">
          {/* Left Panel */}
          <div className="review-left-sidebar">
            <h3><FaFileAlt /> Submission Details</h3>
            <div className="review-info">
              <div className="info-label">
                <FaUser className="left-sidebar-icon" />
                <span> Submitted by</span>
              </div>
              <strong>{submission.author}</strong>
              <p className="email">{submission.email}</p>
            </div>
            <div className="review-info">
              <p><FaCalendarAlt /> Submission Date</p>
              <strong>{submission.submissionDate}</strong>
            </div>
            <div className="review-info">
              <p>Status</p>
              <span className="status-tag">{submission.status}</span>
            </div>
          </div>

          {/* Right Content */}
          <div className="review-main">
            
            {submission.image && (
              <div className="review-section uploaded-image-card">
                <h3><FaFileAlt /> Uploaded Image</h3>
                <div className="uploaded-img-box">
                  <img
                    src={submission.image}
                    alt="Uploaded community post"
                    className="uploaded-img"
                  />
                </div>
              </div>
            )}

            <div className="rcp-review-section rcp-basic-info-grid">
              <h3>Post Content</h3>
              <div className="rcp-edit-info-grid">
                <div className="rcp-edit-info-item full-width">
                  <p style={{ whiteSpace: "pre-wrap" }}>{submission.content}</p>
                </div>
              </div>
            </div>

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

      {/* === Confirmation Modal === */}
      {showModal && (
        <div className="confirm-overlay">
          <div className="confirm-modal">
            <h3>Warning</h3>
            <p>
              Are you sure you want to{" "}
              <strong>{modalType === "approve" ? "approve" : "reject"}</strong> this community post?
              <br />This action cannot be undone.
            </p>
            <div className="confirm-buttons">
              <button
                className="cancel-btn"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                className={modalType === "approve" ? "approve-btn" : "delete-btn"}
                onClick={handleConfirmAction}
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

export default AdminCommunityReviewDetail;