// src/pages/EditRecipePage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../css/EditRecipe.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { FaArrowLeft } from "react-icons/fa";
import { FiSave } from "react-icons/fi";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function EditRecipePage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/recipe/recipes/${id}`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error(`Failed to fetch recipe (status ${res.status})`);
        const data = await res.json();

        const normalized = {
          id: data.id ?? id,
          name: data.name ?? "",
          author: data.author ?? data.authorName ?? "",
          email: data.authorEmail ?? "",
          submissionDate: data.submissionDate ?? data.date ?? "",
          status: data.status ?? "Pending",
          origin: data.origin ?? "",
          difficulty: data.difficulty ?? "",
          prepTime: data.prepTime ?? data.preptime ?? 0,
          cookTime: data.cookTime ?? data.cooktime ?? 0,
          foodType: data.foodType ?? data.foodtype ?? data.category ?? "",
          description: data.description ?? data.englishDesc ?? "",
          servings: data.servings ?? data.serving ?? 1,
          dietaryTags:
            Array.isArray(data.dietaryTags) ? data.dietaryTags :
            typeof data.dietaryTags === "string" && data.dietaryTags.length > 0
              ? data.dietaryTags.split(",").map((s) => s.trim()).filter(Boolean)
              : [],
          ingredients:
            Array.isArray(data.ingredients) ? data.ingredients :
            typeof data.ingredients === "string" && data.ingredients.length > 0
              ? data.ingredients.split("\n").map((s) => s.trim()).filter(Boolean)
              : [],
          instructions:
            Array.isArray(data.instructions) ? data.instructions :
            typeof data.instructions === "string" && data.instructions.length > 0
              ? data.instructions.split("\n").map((s) => s.trim()).filter(Boolean)
              : [],
          funFact: data.funFact ?? data.DidYouKnow ?? "",
          chefTips: data.chefTips ?? "",
          image: data.image ?? "",
          feedback: data.feedback ?? "",
        };

        setRecipe(normalized);
      } catch (err) {
        console.error("Error loading recipe:", err);
        alert("Failed to load recipe. See console for details.");
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [id]);

  if (loading) return <p style={{ textAlign: "center" }}>Loading...</p>;
  if (!recipe) return <p style={{ textAlign: "center" }}>Recipe not found.</p>;

  const isApproved = recipe.status === "Approved";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setRecipe((prev) => ({ ...prev, [name]: value }));
  };

  const handleIngredientsChange = (e) => {
    const lines = e.target.value.split("\n").map((s) => s.trim()).filter(Boolean);
    setRecipe((prev) => ({ ...prev, ingredients: lines }));
  };

  const handleInstructionsChange = (e) => {
    const lines = e.target.value.split("\n").map((s) => s.trim()).filter(Boolean);
    setRecipe((prev) => ({ ...prev, instructions: lines }));
  };

  const handleDietaryChange = (e) => {
    const value = e.target.value;
    const arr = value.split(",").map((s) => s.trim()).filter(Boolean);
    setRecipe((prev) => ({ ...prev, dietaryTags: arr }));
  };

  const handleSaveContent = async () => {
    if (!isApproved) {
      alert("Only approved recipes can be edited and saved.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: recipe.name ?? "",
        origin: recipe.origin ?? "",
        difficulty: recipe.difficulty ?? "",
        prepTime: Number(recipe.prepTime) || 0,
        cookTime: Number(recipe.cookTime) || 0,
        image: recipe.image ?? "",
        description: recipe.description ?? "",
        foodType: recipe.foodType ?? "",
        dietaryTags: Array.isArray(recipe.dietaryTags) ? recipe.dietaryTags : [],
        servings: Number(recipe.servings) || 1,
        ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
        instructions: Array.isArray(recipe.instructions) ? recipe.instructions : [],
        funFact: recipe.funFact ?? "",
        chefTips: recipe.chefTips ?? "",
        status: recipe.status ?? "Approved",
      };

      console.log("PUT /revise/recipes payload:", payload);

      const res = await fetch(`${API_URL}/revise/recipes/${recipe.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let errText = `Failed to save changes (status ${res.status})`;
        try {
          const errJson = await res.json();
          errText = errJson.error || errJson.message || errText;
        } catch {}
        throw new Error(errText);
      }

      alert("✅ Recipe updated successfully.");
      navigate("/admin");
    } catch (err) {
      console.error("Failed to save changes:", err);
      alert("Error saving recipe: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (isApproved) return;

    setUpdatingStatus(true);
    try {
      const payload = { status: newStatus, feedback: recipe.feedback ?? "" };
      console.log("PATCH /api/recipe/updateStatus payload:", payload);

      const res = await fetch(`${API_URL}/api/recipe/updateStatus/${recipe.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let errText = `Failed to update status (status ${res.status})`;
        try {
          const errJson = await res.json();
          errText = errJson.error || errJson.message || errText;
        } catch {}
        throw new Error(errText);
      }

      alert(`✅ Recipe marked as ${newStatus}.`);
      navigate("/admin");
    } catch (err) {
      console.error("Failed to update status:", err);
      alert("Error updating status: " + err.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="admin-review-page">
      <Header />

      <div className="admin-review-header">
        <button
          className="admin-recipe-edit-back-btn"
          onClick={() => navigate("/admin")}
        >
          <FaArrowLeft /> Back to Moderation
        </button>

        <div className="review-title">
          <h2>Edit Recipe</h2>
          <p>{recipe.name}</p>
        </div>

        <div className="rcp-edit-save-actions">
          {isApproved ? (
            <button
              className="admin-edit-food-save-btn"
              onClick={handleSaveContent}
              disabled={saving}
              title="Save changes"
            >
              <span className="admin-edit-food-save-icon">
                <FiSave />
              </span>{" "}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          ) : (
            <div className="rcp-edit-review-actions">
              <button
                className="rcp-edit-approve-btn"
                onClick={() => handleUpdateStatus("Approved")}
                disabled={updatingStatus}
              >
                Approve
              </button>
              <button
                className="rcp-edit-reject-btn"
                onClick={() => handleUpdateStatus("Rejected")}
                disabled={updatingStatus}
              >
                Reject
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="review-container">
        <div className="review-layout">
          {/* Left Sidebar */}
          <div className="review-left-sidebar">
            <h3>Submission Details</h3>
            <div className="review-info">
              <div className="info-label">Submitted by</div>
              <strong>{recipe.author}</strong>
              <p className="email">{recipe.email}</p>
            </div>
            <div className="review-info">
              <div className="info-label">Submission Date</div>
              <strong>{recipe.submissionDate || "—"}</strong>
            </div>
            <div className="review-info">
              <div className="info-label">Status</div>
              <span className="status-tag">{recipe.status}</span>
            </div>
          </div>

          {/* Right Content */}
          <div className="review-main">
            {/* Image */}
            <div className="rcp-review-section uploaded-image-card">
              <h3>Uploaded Image</h3>
              <div className="uploaded-img-box">
                {recipe.image ? (
                  <img src={recipe.image} alt="Recipe" className="uploaded-img" />
                ) : (
                  <div style={{ color: "#777" }}>No image</div>
                )}
              </div>
            </div>

            {/* Basic Info */}
            <div className="rcp-review-section rcp-basic-info-grid">
              <h3>Basic Information</h3>
              <div className="rcp-edit-info-grid">
                {/* Recipe Name */}
                <div className="rcp-edit-info-item">
                  <h4>Recipe Name</h4>
                  <input
                    className="edit-food-input"
                    name="name"
                    value={recipe.name ?? ""}
                    onChange={handleChange}
                    disabled={!isApproved}
                  />
                </div>

                {/* Origin Dropdown */}
                <div className="rcp-edit-info-item">
                  <h4>Origin</h4>
                  <select
                    name="origin"
                    value={recipe.origin ?? ""}
                    onChange={handleChange}
                    disabled={!isApproved}
                    className="edit-food-input"
                  >
                    <option value="" disabled>Select origin</option>
                    {['Malay','Chinese','Iban','Melanau','Kadazan','Bidayuh','Dayak'].map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>

                {/* Difficulty Dropdown */}
                <div className="rcp-edit-info-item">
                  <h4>Difficulty</h4>
                  <select
                    name="difficulty"
                    value={recipe.difficulty ?? ""}
                    onChange={handleChange}
                    disabled={!isApproved}
                    className="edit-food-input"
                  >
                    <option value="" disabled>Select difficulty</option>
                    {['Easy','Medium','Hard'].map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                {/* Prep Time */}
                <div className="rcp-edit-info-item">
                  <h4>Prep Time (min)</h4>
                  <input
                    className="edit-food-input"
                    name="prepTime"
                    value={recipe.prepTime ?? ""}
                    onChange={handleChange}
                    disabled={!isApproved}
                  />
                </div>

                {/* Cook Time */}
                <div className="rcp-edit-info-item">
                  <h4>Cook Time (min)</h4>
                  <input
                    className="edit-food-input"
                    name="cookTime"
                    value={recipe.cookTime ?? ""}
                    onChange={handleChange}
                    disabled={!isApproved}
                  />
                </div>

                {/* Food Type Dropdown */}
                <div className="rcp-edit-info-item">
                  <h4>Food Type</h4>
                  <select
                    name="foodType"
                    value={recipe.foodType ?? ""}
                    onChange={handleChange}
                    disabled={!isApproved}
                    className="edit-food-input"
                  >
                    <option value="" disabled>Select food type</option>
                    {['Dessert', 'Main Course', 'Appetizer', 'Snack', 'Beverage'].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Cultural Context */}
            <div className="rcp-review-section rcp-basic-info-grid">
              <h3>Cultural Context</h3>
              <div className="rcp-edit-info-grid">
                <div className="rcp-edit-info-item full-width">
                  <h4>Description</h4>
                  <textarea
                    className="edit-food-textarea"
                    name="description"
                    value={recipe.description}
                    onChange={handleChange}
                    rows={5}
                    disabled={!isApproved}
                  />
                </div>

                <div className="rcp-edit-info-item full-width">
                  <h4>Fun Fact</h4>
                  <textarea
                    className="edit-food-textarea"
                    name="funFact"
                    value={recipe.funFact}
                    onChange={handleChange}
                    rows={3}
                    disabled={!isApproved}
                  />
                </div>

                <div className="rcp-edit-info-item full-width">
                  <h4>Tips</h4>
                  <textarea
                    className="edit-food-textarea"
                    name="chefTips"
                    value={recipe.chefTips}
                    onChange={handleChange}
                    rows={3}
                    disabled={!isApproved}
                  />
                </div>
              </div>
            </div>

            {/* Ingredients */}
            <div className="rcp-review-section rcp-info-grid">
              <h3>Ingredients</h3>
              <div className="rcp-info-grid">
                <div className="rcp-info-item">
                  <h4>Servings</h4>
                  <input
                    className="edit-food-input"
                    name="servings"
                    value={recipe.servings ?? ""}
                    onChange={handleChange}
                    disabled={!isApproved}
                  />
                </div>

                <div className="rcp-info-item full-width">
                  <h4>Ingredients (one per line)</h4>
                  <textarea
                    className="edit-food-textarea"
                    value={recipe.ingredients.join("\n")}
                    onChange={handleIngredientsChange}
                    rows={6}
                    disabled={!isApproved}
                  />
                </div>
              </div>
            </div>

            {/* Preparation Steps */}
            <div className="rcp-review-section rcp-info-grid">
              <h3>Preparation Steps</h3>
              <div className="rcp-info-grid">
                <div className="rcp-info-item full-width">
                  <textarea
                    className="edit-food-textarea"
                    value={recipe.instructions.join("\n")}
                    onChange={handleInstructionsChange}
                    rows={8}
                    disabled={!isApproved}
                  />
                </div>
              </div>
            </div>

            {/* Dietary Tags */}
            <div className="rcp-review-section rcp-info-grid">
              <h3>Dietary Tags</h3>
              <div className="rcp-info-grid">
                <div className="rcp-info-item full-width">
                  <input
                    className="edit-food-input"
                    value={(recipe.dietaryTags || []).join(", ")}
                    onChange={handleDietaryChange}
                    placeholder="e.g. Vegetarian, Gluten-Free"
                    disabled={!isApproved}
                  />
                </div>
              </div>
            </div>

            {/* Admin Feedback */}
            <div className="rcp-review-section rcp-basic-info-grid">
              <h3>Admin Feedback</h3>
              <div className="rcp-edit-info-grid">
                <div className="rcp-edit-info-item full-width">
                  <textarea
                    className="admin-feedback-input"
                    placeholder="Enter feedback for the submitter..."
                    rows={4}
                    value={recipe.feedback}
                    onChange={(e) => setRecipe({ ...recipe, feedback: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
