import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../css/EditRecipe.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { FaArrowLeft, FaUser, FaCalendarAlt, FaFileAlt, FaCheck, FaTimes } from "react-icons/fa";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const EditRecipePage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(""); // 'approve' or 'reject'

  // ✅ Recipe state now fetched from backend (instead of hardcoded mock data)
  const [recipe, setRecipe] = useState(null);

  // ✅ Fetch real recipe data from backend
  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        console.log(`Fetching recipe ID ${id} from backend...`);
        const response = await fetch(`${API_URL}/api/recipe/recipes/${id}`);
        if (!response.ok) throw new Error("Failed to fetch recipe");
        const data = await response.json();

        console.log("✅ Loaded recipe:", data);

        // 🧩 Normalize data to match your original field names for display
        const normalized = {
          name: data.name || "Untitled Recipe",
          author: data.authorName || "Unknown Author",
          email: data.authorEmail || "N/A",
          submissionDate: new Date().toISOString().split("T")[0], // placeholder if backend doesn’t store submissionDate
          type: "Recipe",
          status: data.status || "Pending Review",
          origin: data.origin || "-",
          difficulty: data.difficulty || "-",
          preptime: data.prepTime || 0,
          cooktime: data.cookTime || 0,
          foodtype: data.foodType || "-",
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
        };

        setRecipe(normalized);
      } catch (err) {
        console.error("❌ Error loading recipe:", err);
      }
    };

    fetchRecipe();
  }, [id]);

  if (!recipe) return <p>Loading...</p>;

  return (
    <div className="admin-review-page">
      <Header />

      {/* === Header === */}
      <div className="admin-review-header">
        <button className="admin-recipe-edit-back-btn" onClick={() => navigate("/admin")}>
          <span className="recipe-edit-btn"><FaArrowLeft /></span> Back to Moderation
        </button>
        <div className="review-title">
          <h2>Review Submission</h2>
          <p>{recipe.name}</p>
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

      {/* === Content === */}
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
              <strong>{recipe.author}</strong>
              <p className="email">{recipe.email}</p>
            </div>

            <div className="review-info">
              <p><FaCalendarAlt /> Submission Date</p>
              <strong>{recipe.submissionDate}</strong>
            </div>

            <div className="review-info">
              <p>Status</p>
              <span className="status-tag">{recipe.status}</span>
            </div>
          </div>

          {/* Right Content */}
          <div className="review-main">
            {/* === Uploaded Image === */}
            <div className="review-section uploaded-image-card">
              <h3><FaFileAlt /> Uploaded Image</h3>
              <div className="uploaded-img-box">
                <img
                  src={recipe.image}
                  alt="Uploaded recipe"
                  className="uploaded-img"
                />
              </div>
            </div>

            {/* === Basic Info === */}
            <div className="rcp-review-section rcp-basic-info-grid">
              <h3>Basic Information</h3>
              <div className="rcp-edit-info-grid">
                <div className="rcp-edit-info-item">
                  <h4>Origin</h4>
                  <p>{recipe.origin}</p>
                </div>
                <div className="rcp-edit-info-item">
                  <h4>Difficulty</h4>
                  <p>{recipe.difficulty}</p>
                </div>
                <div className="rcp-edit-info-item">
                  <h4>Prep Time (min)</h4>
                  <p>{recipe.preptime}</p>
                </div>
                <div className="rcp-edit-info-item">
                  <h4>Cook Time (min)</h4>
                  <p>{recipe.cooktime}</p>
                </div>
                <div className="rcp-edit-info-item">
                  <h4>Food Type</h4>
                  <p>{recipe.foodtype}</p>
                </div>
              </div>
            </div>

            {/* === Cultural Context === */}
            <div className="rcp-review-section rcp-basic-info-grid">
              <h3>Cultural Context</h3>
              <div className="rcp-edit-info-grid">
                <div className="rcp-edit-info-item">
                  <h4>Description</h4>
                  <p>{recipe.englishDesc}</p>
                </div>
              </div>
            </div>

            {/* === Ingredients === */}
            <div className="rcp-review-section rcp-info-grid">
              <h3>Ingredients</h3>
              <div className="rcp-info-grid">
                <div className="rcp-info-item">
                  <h4>Serving</h4>
                  <p>{recipe.serving}</p>
                </div>
                <div className="rcp-info-item">
                  <h4>Ingredients</h4>
                  <p>{recipe.ingredientsEN}</p>
                </div>
              </div>
            </div>

            {/* === Preparation Steps === */}
            <div className="rcp-review-section rcp-info-grid">
              <h3>Preparation Steps</h3>
              <div className="rcp-info-grid">
                <div className="rcp-info-item">
                  <ol>
                    {recipe.steps.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>

            {/* === Notes === */}
            <div className="rcp-review-section rcp-info-grid">
              <h3>Additional Notes</h3>
              <div className="rcp-info-grid">
                <div className="rcp-info-item">
                  <h4>Fun Fact</h4>
                  <p>{recipe.fact}</p>
                </div>
                <div className="rcp-info-item">
                  <h4>Tips</h4>
                  <p>{recipe.tips}</p>
                </div>
                <div className="rcp-info-item">
                  <h4>Dietary Preference</h4>
                  <p>{recipe.dietary}</p>
                </div>
              </div>
            </div>

            {/* === Admin Feedback === */}
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
              <strong>{modalType === "approve" ? "approve" : "reject"}</strong> this recipe submission?
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
                onClick={() => {
                  const feedback =
                    document.querySelector(".admin-feedback-input")?.value.trim() ||
                    "No feedback provided.";
                  setShowModal(false);
                  alert(
                    `${modalType === "approve" ? "✅ Approved" : "❌ Rejected"}\n\nAdmin Feedback:\n${feedback}`
                  );
                  navigate("/admin");
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

export default EditRecipePage;
