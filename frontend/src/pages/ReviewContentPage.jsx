import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { FaArrowLeft, FaUser, FaCalendarAlt, FaFileAlt, FaCheck, FaTimes } from "react-icons/fa";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const ReviewContentPage = () => {
  const { id, type } = useParams(); // ✅ Now supports dynamic "type" param (recipe / communityPost)
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

        // ✅ Detect endpoint based on type
        const endpoint =
          type === "communityPost"
            ? `${API_URL}/api/communityPost/admin/${id}`
            : `${API_URL}/api/recipe/recipes/${id}`;

        const res = await fetch(endpoint, {
          credentials: "include",
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || `Failed to fetch content: ${res.status}`);
        }

        const data = await res.json();
        setSubmission(data);
        setError(null);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchSubmission();
  }, [id, type]);

  if (loading) return <p className="text-center mt-20">Loading content...</p>;
  if (error) return <p className="text-center mt-20">Error: {error}</p>;
  if (!submission) return <p className="text-center mt-20">Content not found.</p>;

  return (
    <div className="review-content-page">
      <Header />

      <h2>Review Submission</h2>

      <div className="admin-review-content-header">
        <button className="admin-content-edit-back-btn" onClick={() => navigate(-1)}>
          <span className="content-edit-btn">
            <FaArrowLeft />
          </span>{" "}
          Back to Moderation
        </button>

        <div className="review-title">
          <h2>Review Submission</h2>
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

            {/* ===== Basic Information Section ===== */}
            <div className="rcp-review-section rcp-info-grid">
              <h3>Basic Information</h3>
              <div className="rcp-info-grid">
                <div className="rcp-info-item">
                  <h4>Food Name / Title</h4>
                  <p>{submission.name || submission.foodName || submission.title}</p>
                </div>

                <div className="rcp-info-item">
                  <h4>Origin / Cultural Background</h4>
                  <p>{submission.origin || submission.culturalOrigin || "N/A"}</p>
                </div>

                <div className="rcp-info-item">
                  <h4>Cultural Story / Description</h4>
                  <p>
                    {submission.description ||
                      submission.culturalStory ||
                      submission.content ||
                      "No description provided."}
                  </p>
                </div>

                <div className="rcp-info-item">
                  <h4>Recipe / Story Details</h4>
                  {Array.isArray(submission.instructions) &&
                  submission.instructions.length > 0 ? (
                    <ol>
                      {submission.instructions.map((step, index) => (
                        <li key={index}>{step}</li>
                      ))}
                    </ol>
                  ) : (
                    <p>{submission.recipe || "N/A"}</p>
                  )}
                </div>
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
              {type === "communityPost" ? "community post" : "recipe"} submission?
              <br />
              This action cannot be undone.
            </p>

            <div className="confirm-buttons">
              <button className="cancel-btn" onClick={() => setShowModal(false)}>
                Cancel
              </button>

              <button
                className={modalType === "approve" ? "approve-btn" : "delete-btn"}
                onClick={async () => {
                  const newStatus = modalType === "approve" ? "Approved" : "Rejected";
                  const feedback =
                    document.querySelector(".admin-feedback-input")?.value.trim() ||
                    "No feedback provided.";

                  try {
                    // ✅ Dynamic update endpoint
                    const updateUrl =
                      type === "communityPost"
                        ? `${API_URL}/api/communityPost/updateStatus/${id}`
                        : `${API_URL}/api/recipe/updateStatus/${id}`;

                    const res = await fetch(updateUrl, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      credentials: "include",
                      body: JSON.stringify({ status: newStatus, feedback }),
                    });

                    if (!res.ok) {
                      const errData = await res.json();
                      throw new Error(errData.message || "Failed to update status");
                    }

                    setShowModal(false);
                    alert(
                      `${
                        newStatus === "Approved" ? "✅ Approved" : "❌ Rejected"
                      }\n\nAdmin Feedback:\n${feedback}`
                    );
                    navigate(-1);
                  } catch (err) {
                    console.error("Failed to update status:", err);
                    alert(`Error: ${err.message}`);
                  }
                }}
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
