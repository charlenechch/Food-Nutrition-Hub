import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import {
  FaArrowLeft,
  FaUser,
  FaCalendarAlt,
  FaFileAlt,
  FaCheck,
  FaTimes,
} from "react-icons/fa";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const EditCommunityPostPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(""); // approve / reject
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch post
  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_URL}/api/communityPost/admin/${id}`, {
          credentials: "include",
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.message || "Failed to fetch post");
        }

        const data = await response.json();

        if (!data || !data.data) {
          setError("Post not found.");
          setPost(null);
          return;
        }

        const p = data.data;

        const normalized = {
          title: p.foodName || "Untitled Post",
          author: p.author || "Unknown",
          email: p.authorEmail || "N/A",
          submissionDate: p.created_at
            ? new Date(p.created_at).toLocaleDateString()
            : new Date().toLocaleDateString(),
          status: p.status || "Pending Review",
          culturalOrigin: p.culturalOrigin || "-",
          culturalStory: p.culturalStory || "No story provided.",
          recipe: p.recipe || "No recipe provided.",
          image: p.image || null,
          images: Array.isArray(p.images) ? p.images : [],
        };

        setPost(normalized);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchPost();
  }, [id]);

  // Approve / Reject
  const handleConfirmAction = async () => {
    const status = modalType === "approve" ? "Approved" : "Rejected";

    const feedback =
      document.querySelector(".admin-feedback-input")?.value.trim() ||
      "No feedback provided.";

    try {
      const res = await fetch(
        `${API_URL}/api/communityPost/updateStatus/${id}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status,
            adminFeedback: feedback,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      alert(`Post ${status} successfully!`);
      navigate("/admin");
    } catch (err) {
      alert(err.message);
    }
  };

  // Send feedback only (for approved posts)
  const handleSendFeedback = async () => {
    const feedback =
      document.querySelector(".admin-feedback-input")?.value.trim();
    if (!feedback) return alert("Please enter feedback before sending.");

    try {
      const res = await fetch(
        `${API_URL}/api/communityPost/sendFeedback/${id}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ feedback }),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to send feedback");
      }

      alert("✅ Feedback sent successfully!");
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <p className="text-center mt-20">Loading...</p>;
  if (error) return <p className="text-center mt-20">{error}</p>;
  if (!post) return <p className="text-center mt-20">Post not found</p>;

  return (
    <div className="admin-review-page">
      <Header />

      {/* Header */}
      <div className="admin-review-header">
        <button
          className="admin-recipe-edit-back-btn"
          onClick={() => navigate("/admin")}
        >
          <span className="recipe-edit-btn"><FaArrowLeft /></span> Back to Moderation
        </button>

        <div className="review-title">
          <h2>Review Community Post</h2>
          <p>{post.title}</p>
        </div>

        {/* Only show approve/reject if NOT approved */}
        {post.status !== "Approved" && (
          <div className="rcp-edit-review-actions">
            <button
              className="rcp-edit-approve-btn"
              onClick={() => {
                setModalType("approve");
                setShowModal(true);
              }}
            >
              <FaCheck /> Approve
            </button>
            <button
              className="rcp-edit-reject-btn"
              onClick={() => {
                setModalType("reject");
                setShowModal(true);
              }}
            >
              <FaTimes /> Reject
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="review-container">
        <div className="review-layout">
          {/* Left Sidebar */}
          <div className="review-left-sidebar">
            <h3><FaFileAlt /> Submission Details</h3>
            <div className="review-info">
              <FaUser />
              <strong>{post.author}</strong>
              <p className="email">{post.email}</p>
            </div>
            <div className="review-info">
              <FaCalendarAlt />
              <strong>{post.submissionDate}</strong>
            </div>
            <div className="review-info">
              <p>Status</p>
              <span className="status-tag">{post.status}</span>
            </div>
          </div>

          {/* Main Content */}
          <div className="review-main">
            {/* Image */}
            <div className="review-section uploaded-image-card">
              <h3><FaFileAlt /> Uploaded Image</h3>
              <div className="uploaded-img-box">
                <img
                  src={post.image || "/no-image.png"}
                  alt={post.title}
                  className="uploaded-img"
                  style={{ width: "100%", maxHeight: "420px", objectFit: "contain", borderRadius: "10px" }}
                  onError={(e) => { e.target.src = "/no-image.png"; }}
                />
              </div>
            </div>

            {/* Cultural info */}
            <div className="rcp-review-section rcp-basic-info-grid">
              <h3>Cultural Information</h3>
              <p><strong>Origin:</strong> {post.culturalOrigin}</p>
              <p style={{ whiteSpace: "pre-wrap" }}>{post.culturalStory}</p>
            </div>

            {/* Recipe */}
            <div className="rcp-review-section">
              <h3>Recipe</h3>
              <p style={{ whiteSpace: "pre-wrap" }}>{post.recipe}</p>
            </div>

            {/* Admin Feedback */}
            <div className="rcp-review-section">
              <h3>Admin Feedback</h3>
              <textarea
                className="admin-feedback-input"
                placeholder="Enter feedback..."
                rows="4"
                style={{ width: "100%", padding: "10px" }}
              />

              {/* Send Feedback only if approved */}
              {post.status === "Approved" && (
                <button
                  className="approve-btn"
                  style={{ marginTop: "10px" }}
                  onClick={handleSendFeedback}
                >
                  Send Feedback
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="confirm-overlay">
          <div className="confirm-modal">
            <h3>Warning</h3>
            <p>Are you sure you want to <strong>{modalType}</strong> this post?</p>
            <div className="confirm-buttons">
              <button className="cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
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
