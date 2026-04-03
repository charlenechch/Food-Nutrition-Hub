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
        console.log(`Fetching recipe ID ${id} from backend...`);
        const response = await fetch(`${API_URL}/api/recipe/recipes/${id}`);
        if (!response.ok) throw new Error("Failed to fetch recipe");
        const data = await response.json();

        console.log("✅ Loaded recipe:", data);

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

  // ✅ SMART NAVIGATION LOGIC
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

  if (!recipe) return <p>{t("editRecipe.loading")}</p>;

  // Button text logic
  const backButtonText = recipe.status === "Approved"
    ? t("editRecipe.backToDashboard")
    : t("editRecipe.backToModeration");

  // Send feedback function
  const handleSendFeedback = async () => {
    const feedback = adminFeedback.trim();

    if (!feedback) {
      openInfo({
        title: t("editRecipe.missingFeedback"),
        message: t("editRecipe.enterFeedbackFirst"),
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
        title: t("editRecipe.feedbackSent"),
        message: t("editRecipe.feedbackSentSuccess"),
        icon: <FaCheckCircle />,
      });
      
      setAdminFeedback(""); 
    } catch (err) {
      openInfo({
        title: t("editRecipe.failedToSend"),
        message: err.message || t("editRecipe.couldNotSendFeedback"),
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
          <h2>{t("editRecipe.reviewSubmission")}</h2>
          <p>{recipe.name}</p>
        </div>

        <div className="rcp-edit-review-actions">
          {recipe.status !== "Approved" && (
            <button
              className="rcp-edit-approve-btn"
              onClick={() => { setModalType("approve"); setShowModal(true); }}
            >
              <span className="recipe-edit-btn"><FaCheck /></span> {t("editRecipe.approve")}
            </button>
          )}
          {recipe.status === "Pending" && (
            <button
              className="rcp-edit-reject-btn"
              onClick={() => { 
                setModalType("reject"); 
                setRejectReason(""); // <-- NEW: Clear old text when opening the modal
                setShowModal(true); 
              }}
            >
              <span className="recipe-edit-btn"><FaTimes /></span> {t("editRecipe.reject")}
            </button>
          )}
        </div>
      </div>

      <div className="review-container">
        <div className="review-layout">
          <div className="review-left-sidebar">
            <h3><FaFileAlt /> {t("editRecipe.submissionDetails")}</h3>
            <div className="review-info">
              <div className="info-label"><FaUser className="left-sidebar-icon" /> <span> {t("editRecipe.submittedBy")}</span></div>
              <strong>{recipe.author}</strong>
              <p className="email">{recipe.email}</p>
            </div>
            <div className="review-info">
              <p><FaCalendarAlt /> {t("editRecipe.submissionDate")}</p>
              <strong>{recipe.submissionDate}</strong>
            </div>
            <div className="review-info">
              <p>{t("editRecipe.status")}</p>
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
              <h3><FaFileAlt /> {t("editRecipe.uploadedImage")}</h3>
              <div className="uploaded-img-box">
                <img src={recipe.image} alt="Uploaded recipe" className="uploaded-img" />
              </div>
            </div>

            <div className="rcp-review-section rcp-basic-info-grid">
              <h3>{t("editRecipe.basicInformation")}</h3>
              <div className="rcp-edit-info-grid">
                <div className="rcp-edit-info-item"><h4>{t("editRecipe.origin")}</h4><p>{recipe.origin}</p></div>
                <div className="rcp-edit-info-item"><h4>{t("editRecipe.difficulty")}</h4><p>{recipe.difficulty}</p></div>
                <div className="rcp-edit-info-item"><h4>{t("editRecipe.prepTime")}</h4><p>{recipe.preptime}</p></div>
                <div className="rcp-edit-info-item"><h4>{t("editRecipe.cookTime")}</h4><p>{recipe.cooktime}</p></div>
                <div className="rcp-edit-info-item"><h4>{t("editRecipe.category")}</h4><p>{recipe.category}</p></div>
              </div>
            </div>

            <div className="rcp-review-section rcp-basic-info-grid">
              <h3>{t("editRecipe.culturalContext")}</h3>
              <div className="rcp-edit-info-grid">
                <div className="rcp-edit-info-item"><h4>{t("editRecipe.description")}</h4><p>{recipe.englishDesc}</p></div>
              </div>
            </div>

            <div className="rcp-review-section rcp-info-grid">
              <h3>{t("editRecipe.ingredients")}</h3>
              <div className="rcp-info-grid">
                <div className="rcp-info-item"><h4>{t("editRecipe.serving")}</h4><p>{recipe.serving}</p></div>
                <div className="rcp-info-item"><h4>{t("editRecipe.ingredients")}</h4><p>{recipe.ingredientsEN}</p></div>
              </div>
            </div>

            <div className="rcp-review-section rcp-info-grid">
              <h3>{t("editRecipe.preparationSteps")}</h3>
              <div className="rcp-info-grid">
                <div className="rcp-info-item">
                  <ol>
                    {recipe.steps.map((s, i) => <li key={i}>{s}</li>)}
                  </ol>
                </div>
              </div>
            </div>

            <div className="rcp-review-section rcp-info-grid">
              <h3>{t("editRecipe.additionalNotes")}</h3>
              <div className="rcp-info-grid">
                <div className="rcp-info-item"><h4>{t("editRecipe.funFact")}</h4><p>{recipe.fact}</p></div>
                <div className="rcp-info-item"><h4>{t("editRecipe.tips")}</h4><p>{recipe.tips}</p></div>
                <div className="rcp-info-item"><h4>{t("editRecipe.dietaryPreference")}</h4><p>{recipe.dietary}</p></div>
              </div>
            </div>

            <div className="rcp-review-section rcp-basic-info-grid">
              <h3>{t("editRecipe.adminFeedback")}</h3>
              <div className="rcp-edit-info-grid">
                <div className="rcp-edit-info-item full-width">
                  <textarea
                    className="admin-feedback-input"
                    placeholder={t("editRecipe.feedbackPlaceholder")}
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
                      {t("editRecipe.sendFeedback")}
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
            <h3>{t("editRecipe.warningTitle")}</h3>
            
            {modalType === "approve" ? (
              <p>{t("editRecipe.warningApprove")}</p>
            ) : (
              <>
                <p>{t("editRecipe.warningReject", "Please provide a reason for rejecting this recipe. This is mandatory.")}</p>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder={t("editRecipe.feedbackPlaceholder", "e.g., Recipe is missing steps, unclear measurements...")}
                  rows="4"
                  style={{ width: "100%", padding: "10px", marginTop: "10px", marginBottom: "10px", borderRadius: "5px", border: "1px solid #ccc", fontFamily: "inherit" }}
                />
              </>
            )}

            <div className="confirm-buttons">
              <button className="cancel-btn" onClick={() => setShowModal(false)}>
                {t("editRecipe.cancel")}
              </button>
              
              <button
                className={modalType === "approve" ? "approve-btn" : "delete-btn"}
                disabled={modalType === "reject" && rejectReason.trim().length === 0}
                style={{ 
                  opacity: (modalType === "reject" && rejectReason.trim().length === 0) ? 0.5 : 1, 
                  cursor: (modalType === "reject" && rejectReason.trim().length === 0) ? "not-allowed" : "pointer" 
                }}
                onClick={async () => {
                  const newStatus = modalType === "approve" ? "Approved" : "Rejected";
                  // Use the reason from the popup if rejecting, otherwise use the bottom box
                  const feedbackToSend = modalType === "reject" ? rejectReason.trim() : (adminFeedback ? adminFeedback.trim() : ""); 

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
                      title: newStatus === "Approved" ? t("editRecipe.approvedTitle") : t("editRecipe.rejectedTitle"),
                      message: `${t("editRecipe.adminFeedbackLabel")}\n${feedbackToSend}`,
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
                      title: t("editRecipe.failedToUpdateStatus"),
                      message: err.message || t("editRecipe.couldNotUpdateStatus"),
                      icon: <FaExclamationTriangle />,
                    });
                  }
                }}
              >
                {modalType === "approve" ? t("editRecipe.approve") : t("editRecipe.reject")}
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