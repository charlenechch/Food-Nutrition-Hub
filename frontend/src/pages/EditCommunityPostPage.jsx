import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { FaArrowLeft, FaUser, FaCalendarAlt, FaFileAlt, FaCheck, FaTimes } from "react-icons/fa";
// import "../css/EditRecipe.css"; // ✅ Optional: same styling as recipes

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const EditCommunityPostPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(""); // 'approve' or 'reject'

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ Fetch Community Post data
  useEffect(() => {
    const fetchPost = async () => {
      try {
        console.log(`Fetching community post ID ${id} from backend...`);
        const response = await fetch(`${API_URL}/api/communityPost/${id}`, {
          credentials: "include",
        });

        if (!response.ok) throw new Error("Failed to fetch community post");
        const data = await response.json();

        if (!data || !data.data) throw new Error("No post data returned");
        const postData = data.data;

        // 🧩 Normalize for consistent frontend display
        const normalized = {
          title: postData.foodName || "Untitled Post",
          author: postData.author || "Unknown Author",
          email: postData.authorEmail || "N/A",
          submissionDate: postData.createdAt
            ? new Date(postData.createdAt).toLocaleDateString()
            : new Date().toLocaleDateString(),
          status: postData.status || "Pending Review",
          culturalOrigin: postData.culturalOrigin || "-",
          culturalStory: postData.culturalStory || "No story provided.",
          recipe: postData.recipe || "N/A",
          image:
            postData.image ||
            "https://via.placeholder.com/400x250?text=No+Image+Uploaded",
        };

        setPost(normalized);
        setError(null);
      } catch (err) {
        console.error("❌ Error loading community post:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchPost();
  }, [id]);

  // ✅ Modal confirm handler
  const handleConfirmAction = async () => {
    const newStatus = modalType === "approve" ? "Approved" : "Rejected";
    const feedback =
      document.querySelector(".admin-feedback-input")?.value.trim() ||
      "No feedback provided.";

    try {
      const res = await fetch(`${API_URL}/api/communityPost/updateStatus/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus, adminFeedback: feedback }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to update status");

      alert(`✅ Post ${newStatus}\n\nFeedback: ${feedback}`);
      navigate("/admin");
    } catch (err) {
      console.error("❌ Failed to update status:", err);
      alert(`Error: ${err.message}`);
    }
  };

  // === Render States ===
  if (loading) return <p className="text-center mt-20">Loading post...</p>;
  if (error) return <p className="text-center mt-20">Error: {error}</p>;
  if (!post) return <p className="text-center mt-20">Post not found.</p>;

  return (
    <div className="admin-review-page">
      <Header />

      {/* === Header === */}
      <div className="admin-review-header">
        <button
          className="admin-recipe-edit-back-btn"
          onClick={() => navigate("/admin")}
        >
          <span className="recipe-edit-btn">
            <FaArrowLeft />
          </span>{" "}
          Back to Moderation
        </button>

        <div className="review-title">
          <h2>Review Community Post</h2>
          <p>{post.title}</p>
        </div>

        <div className="rcp-edit-review-actions">
          <button
            className="rcp-edit-approve-btn"
            onClick={() => {
              setModalType("approve");
              setShowModal(true);
            }}
          >
            <span className="recipe-edit-btn">
              <FaCheck />
            </span>{" "}
            Approve
          </button>

          <button
            className="rcp-edit-reject-btn"
            onClick={() => {
              setModalType("reject");
              setShowModal(true);
            }}
          >
            <span className="recipe-edit-btn">
              <FaTimes />
            </span>{" "}
            Reject
          </button>
        </div>
      </div>

      {/* === Content Layout === */}
      <div className="review-container">
        <div className="review-layout">
          {/* === Left Sidebar === */}
          <div className="review-left-sidebar">
            <h3>
              <FaFileAlt /> Submission Details
            </h3>

            <div className="review-info">
              <div className="info-label">
                <FaUser className="left-sidebar-icon" />
                <span> Submitted by</span>
              </div>
              <strong>{post.author}</strong>
              <p className="email">{post.email}</p>
            </div>

            <div className="review-info">
              <p>
                <FaCalendarAlt /> Submission Date
              </p>
              <strong>{post.submissionDate}</strong>
            </div>

            <div className="review-info">
              <p>Status</p>
              <span className="status-tag">{post.status}</span>
            </div>
          </div>

          {/* === Main Content === */}
          <div className="review-main">
            <div className="review-section uploaded-image-card">
              <h3>
                <FaFileAlt /> Uploaded Image
              </h3>
              <div className="uploaded-img-box">
                <img
                  src={post.image}
                  alt="Uploaded community post"
                  className="uploaded-img"
                />
              </div>
            </div>

            <div className="rcp-review-section rcp-basic-info-grid">
              <h3>Cultural Information</h3>
              <div className="rcp-edit-info-grid">
                <div className="rcp-edit-info-item">
                  <h4>Cultural Origin</h4>
                  <p>{post.culturalOrigin}</p>
                </div>
                <div className="rcp-edit-info-item full-width">
                  <h4>Cultural Story</h4>
                  <p style={{ whiteSpace: "pre-wrap" }}>{post.culturalStory}</p>
                </div>
              </div>
            </div>

            <div className="rcp-review-section rcp-basic-info-grid">
              <h3>Recipe (if provided)</h3>
              <div className="rcp-edit-info-grid">
                <div className="rcp-edit-info-item full-width">
                  <p style={{ whiteSpace: "pre-wrap" }}>{post.recipe}</p>
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
              <strong>
                {modalType === "approve" ? "approve" : "reject"}
              </strong>{" "}
              this community post? <br />
              This action cannot be undone.
            </p>
            <div className="confirm-buttons">
              <button className="cancel-btn" onClick={() => setShowModal(false)}>
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

export default EditCommunityPostPage;
