import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../css/EditRecipe.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Modal from "../components/Modal";
import { useTranslation } from "react-i18next";
import { FaArrowLeft, FaUser, FaCalendarAlt, FaFileAlt, FaCheck, FaTimes, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const EditRecipePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(""); 
  const [recipe, setRecipe] = useState(null);
  const [adminFeedback, setAdminFeedback] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  
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

  // Fetch recipe data
  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const response = await fetch(`${API_URL}/api/recipe/recipes/${id}`);
        if (!response.ok) throw new Error("Failed to fetch recipe");
        const data = await response.json();

        const normalized = {
          name: data.name || "Untitled Recipe",
          author: data.authorName || "Unknown Author",
          email: data.authorEmail || "N/A",
          submissionDate: new Date().toISOString().split("T")[0],
          type: "Recipe",
          status: data.status || "Pending Review",
          origin: data.origin || "-",
          difficulty: data.difficulty || "-",
          preptime: data.prepTime || 0,
          cooktime: data.cookTime || 0,
          category: data.category || "-",
          englishDesc: data.description || "-",
          serving: data.servings || 0,
          ingredientsEN:
            Array.isArray(data.ingredients)
              ? data.ingredients.join(", ")
              : data.ingredients || "-",
          steps: Array.isArray(data.instructions)
            ? data.instructions
            : data.instructions
            ? data.instructions.split("\n")
            : [],
          fact: data.funFact || "-",
          tips: data.chefTips || "-",
          dietary:
            Array.isArray(data.dietaryTags)
              ? data.dietaryTags.join(", ")
              : data.dietaryTags || "-",
          image: data.image || "https://res.cloudinary.com/demo/image/upload/v1638752412/placeholder_food.jpg",
          approvedBy: data.approvedBy || null,
        };

        setRecipe(normalized);
      } catch (err) {
        console.error("❌ Error loading recipe:", err);
      }
    };

    fetchRecipe();
  }, [id]);

  const handleBack = () => {
    if (!recipe) {
      navigate("/admin");
      return;
    }
    const status = (recipe.status || "").toLowerCase();
    if (status === "approved") {
      navigate("/admin"); 
    } else {
      navigate("/admin?tab=moderation");
    }
  };

  if (!recipe) return <p className="text-center mt-20">{t("editRecipe.loading", "Loading...")}</p>;

  const backButtonText = recipe.status === "Approved"
    ? t("editRecipe.backToDashboard", "Back to Dashboard")
    : t("editRecipe.backToModeration", "Back to Moderation");

  // === CLEANED UP API FUNCTION ===
  const handleConfirmAction = async (feedbackToSend = "") => {
    const newStatus = modalType === "approve" ? "Approved" : "Rejected";

    try {
      const updateUrl = `${API_URL}/api/recipe/updateStatus/${id}`;
      const payload = { 
        status: newStatus,
        feedback: feedbackToSend
      };

      const res = await fetch(updateUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to update status");
      }

      setShowModal(false);
      openInfo({
        title: newStatus === "Approved" ? t("editRecipe.approvedTitle", "Approved") : t("editRecipe.rejectedTitle", "Rejected"),
        message: `${t("editRecipe.adminFeedbackLabel", "Feedback Attached:")}\n${feedbackToSend}`,
        icon: newStatus === "Approved" ? <FaCheckCircle /> : <FaExclamationTriangle />,
        primaryText: "OK",
      });
      
      if (newStatus === "Approved") {
        navigate("/admin");
      } else {
        navigate("/admin?tab=moderation");
      }
      
    } catch (err) {
      console.error("Failed to update status:", err);
      openInfo({
        title: t("editRecipe.failedToUpdateStatus", "Failed to Update"),
        message: err.message || t("editRecipe.couldNotUpdateStatus", "Could not update status."),
        icon: <FaExclamationTriangle />,
      });
    }
  };

  // Send feedback manually
  const handleSendFeedback = async () => {
    const feedback = adminFeedback.trim();

    if (!feedback) {
      openInfo({
        title: t("editRecipe.missingFeedback", "Missing Feedback"),
        message: t("editRecipe.enterFeedbackFirst", "Please enter feedback first."),
        icon: <FaExclamationTriangle />,
      });
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/recipe/sendFeedback/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
        credentials: "include",
        body: JSON.stringify({ feedback }), 
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to send feedback");
      }

      openInfo({
        title: t("editRecipe.feedbackSent", "Feedback Sent"),
        message: t("editRecipe.feedbackSentSuccess", "Feedback was sent successfully."),
        icon: <FaCheckCircle />,
      });
      
      setAdminFeedback(""); 
    } catch (err) {
      openInfo({
        title: t("editRecipe.failedToSend", "Failed to Send"),
        message: err.message || t("editRecipe.couldNotSendFeedback", "Could not send feedback."),
        icon: <FaExclamationTriangle />,
      });
    }
  };

  return (
    <div className="admin-review-page">
      <Header />

      <div className="admin-review-header">
        <button className="admin-recipe-edit-back-btn" onClick={handleBack}>
          <span className="recipe-edit-btn"><FaArrowLeft /></span> {backButtonText}
        </button>
        <div className="review-title">
          <h2>{t("editRecipe.reviewSubmission", "Review Submission")}</h2>
          <p>{recipe.name}</p>
        </div>

        <div className="rcp-edit-review-actions">
          {recipe.status !== "Approved" && (
            <button
              className="rcp-edit-approve-btn"
              onClick={() => { setModalType("approve"); setShowModal(true); }}
            >
              <span className="recipe-edit-btn"><FaCheck /></span> {t("editRecipe.approve", "Approve")}
            </button>
          )}
          {recipe.status === "Pending" && (
            <button
              className="rcp-edit-reject-btn"
              onClick={() => { 
                setModalType("reject"); 
                setRejectReason(""); 
                setShowModal(true); 
              }}
            >
              <span className="recipe-edit-btn"><FaTimes /></span> {t("editRecipe.reject", "Reject")}
            </button>
          )}
        </div>
      </div>

      <div className="review-container">
        <div className="review-layout">
          <div className="review-left-sidebar">
            <h3><FaFileAlt /> {t("editRecipe.submissionDetails", "Submission Details")}</h3>
            <div className="review-info">
              <div className="info-label"><FaUser className="left-sidebar-icon" /> <span> {t("editRecipe.submittedBy", "Submitted By")}</span></div>
              <strong>{recipe.author}</strong>
              <p className="email">{recipe.email}</p>
            </div>
            <div className="review-info">
              <p><FaCalendarAlt /> {t("editRecipe.submissionDate", "Submission Date")}</p>
              <strong>{recipe.submissionDate}</strong>
            </div>
            <div className="review-info">
              <p>{t("editRecipe.status", "Status")}</p>
              <span className="status-tag">{recipe.status}</span>
            </div>
            {recipe.approvedBy && (
              <div className="review-info">
                <p>Approved By</p>
                <strong>{recipe.approvedBy}</strong>
              </div>
            )}
          </div>

          <div className="review-main">
            <div className="review-section uploaded-image-card">
              <h3><FaFileAlt /> {t("editRecipe.uploadedImage", "Uploaded Image")}</h3>
              <div className="uploaded-img-box">
                <img src={recipe.image} alt="Uploaded recipe" className="uploaded-img" />
              </div>
            </div>

            <div className="rcp-review-section rcp-basic-info-grid">
              <h3>{t("editRecipe.basicInformation", "Basic Information")}</h3>
              <div className="rcp-edit-info-grid">
                <div className="rcp-edit-info-item"><h4>{t("editRecipe.origin", "Origin")}</h4><p>{recipe.origin}</p></div>
                <div className="rcp-edit-info-item"><h4>{t("editRecipe.difficulty", "Difficulty")}</h4><p>{recipe.difficulty}</p></div>
                <div className="rcp-edit-info-item"><h4>{t("editRecipe.prepTime", "Prep Time")}</h4><p>{recipe.preptime}</p></div>
                <div className="rcp-edit-info-item"><h4>{t("editRecipe.cookTime", "Cook Time")}</h4><p>{recipe.cooktime}</p></div>
                <div className="rcp-edit-info-item"><h4>{t("editRecipe.category", "Category")}</h4><p>{recipe.category}</p></div>
              </div>
            </div>

            <div className="rcp-review-section rcp-basic-info-grid">
              <h3>{t("editRecipe.culturalContext", "Cultural Context")}</h3>
              <div className="rcp-edit-info-grid">
                <div className="rcp-edit-info-item"><h4>{t("editRecipe.description", "Description")}</h4><p>{recipe.englishDesc}</p></div>
              </div>
            </div>

            <div className="rcp-review-section rcp-info-grid">
              <h3>{t("editRecipe.ingredients", "Ingredients")}</h3>
              <div className="rcp-info-grid">
                <div className="rcp-info-item"><h4>{t("editRecipe.serving", "Serving")}</h4><p>{recipe.serving}</p></div>
                <div className="rcp-info-item"><h4>{t("editRecipe.ingredients", "Ingredients")}</h4><p>{recipe.ingredientsEN}</p></div>
              </div>
            </div>

            <div className="rcp-review-section rcp-info-grid">
              <h3>{t("editRecipe.preparationSteps", "Preparation Steps")}</h3>
              <div className="rcp-info-grid">
                <div className="rcp-info-item">
                  <ol>
                    {recipe.steps.map((s, i) => <li key={i}>{s}</li>)}
                  </ol>
                </div>
              </div>
            </div>

            <div className="rcp-review-section rcp-info-grid">
              <h3>{t("editRecipe.additionalNotes", "Additional Notes")}</h3>
              <div className="rcp-info-grid">
                <div className="rcp-info-item"><h4>{t("editRecipe.funFact", "Fun Fact")}</h4><p>{recipe.fact}</p></div>
                <div className="rcp-info-item"><h4>{t("editRecipe.tips", "Tips")}</h4><p>{recipe.tips}</p></div>
                <div className="rcp-info-item"><h4>{t("editRecipe.dietaryPreference", "Dietary Preference")}</h4><p>{recipe.dietary}</p></div>
              </div>
            </div>

            <div className="rcp-review-section rcp-basic-info-grid">
              <h3>{t("editRecipe.adminFeedback", "Admin Feedback")}</h3>
              <div className="rcp-edit-info-grid">
                <div className="rcp-edit-info-item full-width">
                  <textarea
                    className="admin-feedback-input"
                    placeholder={t("editRecipe.feedbackPlaceholder", "Write your feedback or reason for rejection here...")}
                    rows="4"
                    value={adminFeedback}
                    onChange={(e) => setAdminFeedback(e.target.value)}
                  ></textarea>
                  {(recipe.status === "Approved" || recipe.status === "Rejected") && (
                    <button
                      className="approve-btn"
                      style={{ marginTop: "10px" }}
                      onClick={handleSendFeedback}
                    >
                      {t("editRecipe.sendFeedback", "Send Feedback")}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="confirm-overlay">
          <div className="confirm-modal">
            <h3>{t("editRecipe.warningTitle", "Warning")}</h3>
            
            {modalType === "approve" ? (
              <p>{t("editRecipe.warningApprove", "Are you sure you want to approve this recipe?")}</p>
            ) : adminFeedback.trim().length > 0 ? (
              // SMART UX: Admin already provided feedback
              <>
                <p>{t("editRecipe.warningRejectConfirm", "Are you sure you want to reject this recipe?")}</p>
                <div style={{ marginTop: "15px", padding: "12px", backgroundColor: "#ffebe9", color: "#d73a49", borderRadius: "6px", border: "1px solid #ffc1c0", fontSize: "14px" }}>
                  <strong style={{ display: "block", marginBottom: "5px" }}>{t("editRecipe.feedbackToSend", "Feedback to be sent:")}</strong>
                  <span style={{ whiteSpace: "pre-wrap" }}>{adminFeedback}</span>
                </div>
              </>
            ) : (
              // SMART UX: Admin forgot feedback
              <>
                <p style={{ color: "#d73a49", fontWeight: "bold", display: "flex", alignItems: "center", gap: "8px" }}>
                   <FaExclamationTriangle /> 
                   {t("editRecipe.forgotFeedback", "Reminder: Feedback is required!")}
                </p>
                <p>{t("editRecipe.warningReject", "Please provide a reason for rejecting this recipe.")}</p>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder={t("editRecipe.feedbackPlaceholder", "e.g., Recipe is missing steps, unclear measurements...")}
                  rows="4"
                  style={{ width: "100%", padding: "10px", marginTop: "10px", marginBottom: "10px", borderRadius: "5px", border: "1px solid #ccc", fontFamily: "inherit", resize: "vertical" }}
                />
              </>
            )}

            <div className="confirm-buttons">
              <button className="cancel-btn" onClick={() => setShowModal(false)}>
                {t("editRecipe.cancel", "Cancel")}
              </button>
              
              <button
                className={modalType === "approve" ? "approve-btn" : "delete-btn"}
                disabled={modalType === "reject" && adminFeedback.trim().length === 0 && rejectReason.trim().length === 0}
                style={{ 
                  opacity: (modalType === "reject" && adminFeedback.trim().length === 0 && rejectReason.trim().length === 0) ? 0.5 : 1, 
                  cursor: (modalType === "reject" && adminFeedback.trim().length === 0 && rejectReason.trim().length === 0) ? "not-allowed" : "pointer" 
                }}
                onClick={() => {
                  const finalFeedback = modalType === "reject" ? (adminFeedback.trim() || rejectReason.trim()) : "";
                  handleConfirmAction(finalFeedback);
                }}
              >
                {modalType === "approve" ? t("editRecipe.approve", "Approve") : t("editRecipe.reject", "Reject")}
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

export default EditRecipePage;