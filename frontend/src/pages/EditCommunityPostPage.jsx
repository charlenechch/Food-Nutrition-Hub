import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Modal from "../components/Modal";
import {
  FaArrowLeft,
  FaUser,
  FaCalendarAlt,
  FaFileAlt,
  FaCheck,
  FaTimes,
  FaCheckCircle,
  FaExclamationTriangle,
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
  const [feedbackText, setFeedbackText] = useState("");
  const [infoDlg, setInfoDlg] = useState({
    open: false,
    title: "",
    message: "",
    icon: null,
    primaryText: "OK",
  });
  
  const openInfo = (opts) =>
    setInfoDlg({
      open: true,
      title: opts.title || "",
      message: opts.message || "",
      icon: opts.icon || null,
      primaryText: opts.primaryText || "OK",
    });
  const closeInfo = () => setInfoDlg((m) => ({ ...m, open: false }));

  // CSRF
  const [csrfToken, setCsrfToken] = useState("");
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const res = await fetch(`${API_URL}/api/csrf-token`, { credentials: "include" });
        const data = await res.json();
        setCsrfToken(data.csrfToken);
      } catch (err) {
        console.error("Failed to fetch CSRF token", err);
      }
    };
    fetchCsrfToken();
  }, []);
  
  // Fetch post
  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/api/communityPost/admin/${id}`, {
          credentials: "include",
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || "Failed to fetch post");
        }
        const data = await res.json();
        if (!data?.data) {
          setError("Post not found.");
          setPost(null);
          return;
        }
        const p = data.data;
        setPost({
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
          images: p.photos ? p.photos.split(",").map((url) => url.trim()) : [],
          adminFeedback: p.adminFeedback || "",
        });
        setFeedbackText(p.adminFeedback || "");
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchPost();
  }, [id]);

  // ✅ SMART NAVIGATION LOGIC
  const handleBack = () => {
    if (!post) {
      navigate("/admin");
      return;
    }
    const status = (post.status || "").toLowerCase();
    
    // Approved -> Database Tab (default /admin)
    // Pending/Rejected -> Moderation Tab (/admin?tab=moderation)
    if (status === "approved") {
      navigate("/admin"); 
    } else {
      navigate("/admin?tab=moderation");
    }
  };

  // Approve / Reject
  const handleConfirmAction = async () => {
    const endpoint =
      modalType === "approve"
        ? `${API_URL}/api/communityPost/admin/approve/${id}`
        : `${API_URL}/api/communityPost/admin/reject/${id}`;

    const requestOptions = {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
      body: JSON.stringify({ feedback: feedbackText }),
    };

    try {
      const res = await fetch(endpoint, requestOptions);
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || "Action failed");
      
      openInfo({
        title: "Success",
        message: `Post ${modalType === "approve" ? "approved" : "rejected"} successfully!`,
        icon: <FaCheckCircle />,
      });
      
      setShowModal(false);
      
      setPost((prev) => ({ 
        ...prev, 
        status: modalType === "approve" ? "Approved" : "Rejected",
        adminFeedback: modalType === "reject" ? feedbackText : prev.adminFeedback
      }));
      
    } catch (err) {
      openInfo({
        title: "Action Failed",
        message: err.message || "Something went wrong.",
        icon: <FaExclamationTriangle />,
      });
    }
  };

  // Send feedback
  const handleSendFeedback = async () => {
    if (!feedbackText.trim()) {
      openInfo({
        title: "Missing Feedback",
        message: "Please enter feedback before sending.",
        icon: <FaExclamationTriangle />,
      });
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/communityPost/admin/sendFeedback/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
        body: JSON.stringify({ feedback: feedbackText.trim() }),
      });
      if (!res.ok) {
        throw new Error("Failed to send feedback");
      }
      openInfo({
        title: "Feedback Sent",
        message: "Your feedback has been sent successfully.",
        icon: <FaCheckCircle />,
      });
      setPost((prev) => ({ ...prev, adminFeedback: feedbackText.trim() }));
    } catch (err) {
      openInfo({
        title: "Failed to Send Feedback",
        message: err.message || "Could not send feedback.",
        icon: <FaExclamationTriangle />,
      });
    }
  };

  if (loading) return <p className="text-center mt-20">Loading...</p>;
  if (error) return <p className="text-center mt-20">{error}</p>;
  if (!post) return <p className="text-center mt-20">Post not found</p>;

  // Button text logic
  const backButtonText = (post.status === "Approved") ? "Back to Dashboard" : "Back to Moderation";

  // === Action Buttons Helper ===
  const renderActionButtons = (isMobile = false) => {
    // Hide buttons entirely if it's already approved
    if (post.status === "Approved") return null;

    return (
      <div className={`moderation-actions ${isMobile ? "mobile-actions" : "desktop-actions"}`}>
        <button
          className="rcp-edit-approve-btn"
          onClick={() => { setModalType("approve"); setShowModal(true); }}
        >
          <FaCheck /> Approve
        </button>
        
        {post.status === "Pending" && (
          <button
            className="rcp-edit-reject-btn"
            onClick={() => { setModalType("reject"); setShowModal(true); }}
          >
            <FaTimes /> Reject
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="admin-review-page">
      <Header />

      <div className="admin-review-header">
        {/* ✅ UPDATED BACK BUTTON */}
        <button className="admin-recipe-edit-back-btn" onClick={handleBack}>
          <span className="recipe-edit-btn"><FaArrowLeft /></span> {backButtonText}
        </button>

        <div className="review-title">
          <h2>Review Community Post</h2>
          <p>{post.title}</p>
        </div>

        {renderActionButtons(false)}
      </div>

      <div className="review-container">
        <div className="review-layout">
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

          <div className="review-main">
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

            <div className="rcp-review-section rcp-basic-info-grid">
              <h3>Cultural Information</h3>
              <p><strong>Origin:</strong> {post.culturalOrigin}</p>
              <p style={{ whiteSpace: "pre-wrap" }}>{post.culturalStory}</p>
            </div>

            <div className="rcp-review-section">
              <h3>Recipe</h3>
              <p style={{ whiteSpace: "pre-wrap" }}>{post.recipe}</p>
            </div>

            <div className="rcp-review-section">
              <h3>Admin Feedback</h3>
              <textarea
                className="admin-feedback-input"
                placeholder="Enter feedback..."
                rows="4"
                style={{ width: "100%", padding: "10px" }}
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
              />
              {(post.status === "Approved" || post.status === "Rejected") && (
                  <button
                    className="approve-btn"
                    style={{ marginTop: "10px" }}
                    onClick={handleSendFeedback}
                  >
                    Send Feedback
                  </button>
                )}
            </div>
            <div className="rcp-review-section">
              <h3>Admin Feedback</h3>
              <textarea
                className="admin-feedback-input"
                placeholder="Enter feedback..."
                rows="4"
                style={{ width: "100%", padding: "10px" }}
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
              />
              {(post.status === "Approved" || post.status === "Rejected") && (
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

        {renderActionButtons(true)}
      </div>

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
      <Modal
        open={infoDlg.open}
        title={infoDlg.title}
        icon={infoDlg.icon}
        primaryText={infoDlg.primaryText}
        onPrimary={closeInfo}
        onClose={closeInfo}
      >
        {infoDlg.message}
      </Modal>

      <Footer />
    </div>
  );
};

export default EditCommunityPostPage;