import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { FaCamera, FaExclamationTriangle, FaInfoCircle } from "react-icons/fa"; 
import "../css/ReviseRecipePage.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const DIET_OPTIONS = [
  "gluten-free",
  "dairy-free",
  "vegetarian",
  "vegan",
  "halal",
  "low-fat",
  "high-protein",
  "spicy",
];

export default function ReviseRecipePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get real data from navigation state passed from UserProfilePage
  const { contribution, adminFeedback, fieldsWithIssues } = location.state || {};

  const [form, setForm] = useState({
    name: "",
    origin: "",
    difficulty: "Easy",
    prepTime: "",
    cookTime: "",
    servings: "",
    imageData: "",
    description: "",
    ingredients: "",
    instructions: "",
    funFact: "",
    chefTips: "",
    dietaryTags: [],
    foodType: "Poultry"
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize form with real contribution data
  useEffect(() => {
    if (contribution) {
      console.log("📝 Initializing form with real contribution:", contribution);
      setForm({
        name: contribution.title || "",
        origin: contribution.origin || "",
        difficulty: contribution.difficulty || "Easy",
        prepTime: contribution.prepTime || "",
        cookTime: contribution.cookTime || "",
        servings: contribution.servings || "",
        imageData: contribution.image || "",
        description: contribution.description || "",
        ingredients: contribution.ingredients || "",
        instructions: contribution.instructions || "",
        funFact: contribution.funFact || "",
        chefTips: contribution.chefTips || "",
        dietaryTags: Array.isArray(contribution.dietaryTags) ? contribution.dietaryTags : [],
        foodType: contribution.foodType || "Poultry"
      });
    }
    setIsInitializing(false);
  }, [contribution]);

  const onChangeForm = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const toggleDiet = (tag) => {
    setForm(prev => {
      const exists = prev.dietaryTags.includes(tag);
      return {
        ...prev,
        dietaryTags: exists
          ? prev.dietaryTags.filter(t => t !== tag)
          : [...prev.dietaryTags, tag],
      };
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm(prev => ({ ...prev, imageData: reader.result }));
    reader.readAsDataURL(file);
  };

  const addRecipe = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      console.log('🚀 Starting recipe revision for ID:', id);

      // Build the data in the same format as your create endpoint
      const revisedData = {
        name: form.name,
        origin: form.origin,
        difficulty: form.difficulty,
        prepTime: form.prepTime,
        cookTime: form.cookTime,
        servings: form.servings,
        image: form.imageData,
        description: form.description,
        foodType: form.foodType,
        dietaryTags: [
          ...form.dietaryTags,
        ],
        ingredients: form.ingredients,
        instructions: form.instructions,
        funFact: form.funFact,
        chefTips: form.chefTips,
      };

      console.log('📤 Sending update request with data:', revisedData);

      // Use your update endpoint instead of create endpoint
      const response = await fetch(`${API_BASE_URL}/api/recipe/update/recipes/${id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json" 
        },
        credentials: "include",
        body: JSON.stringify(revisedData),
      });

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Server error response:', errorText);
        throw new Error(`Failed to update recipe (${response.status}): ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Update successful:', result);

      if (result.success || result.message) {
        alert("Recipe revised successfully! It will be reviewed again.");
        navigate("/profile");
      } else {
        throw new Error(result.error || "Update failed");
      }
    } catch (error) {
      console.error("❌ Update error:", error);
      alert(error.message || "Failed to update recipe. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check which fields need fixing
  const needsFix = new Set(fieldsWithIssues || []);
  
  const fieldLabels = {
    name: "Recipe Name",
    origin: "Origin",
    description: "Description", 
    images: "Image",
    ingredients: "Ingredients",
    instructions: "Instructions",
    dietaryTags: "Dietary Tags"
  };

  if (isInitializing) {
    return (
      <div className="revise-recipe-page">
        <Header />
        <div className="upp-page">
          <div className="upp-loading">Loading recipe data...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!contribution) {
    return (
      <div className="upp-wrap">
        <button className="lrp-btn lrp-btn-outline rcp-back" onClick={() => navigate("/profile")}>← Back to Profile</button>
        <h2 className="upp-404-h2">This contribution isn't available to revise.</h2>
        <p className="upp-muted">
            It may have been re-submitted or reviewed already. Try refreshing your profile's "Pending" tab.
        </p>      
      </div>
    );
  }

  return (
    <div className="revise-recipe-page">
      <Header />
      <div className="upp-page">
        <div className="upp-wrap">
          <button className="lrp-btn lrp-btn-outline rcp-back" onClick={() => navigate("/profile")}>← Back to Profile</button>
          <div className="rcp-wrap">
          <h2 className="rp-title">Revise Recipe</h2>
          
          {/* ✅ ADDED ADMIN ALERT BOX */}
          <div className="rcp-admin-alert">
            <div className="rcp-alert-header">
              <FaExclamationTriangle className="rcp-alert-icon" />
              <h3>Revision Required - Admin Feedback</h3>
            </div>
            
            <div className="rcp-alert-content">
              {adminFeedback ? (
                <p className="rcp-feedback-message">{adminFeedback}</p>
              ) : (
                <p className="rcp-feedback-message">
                  Your recipe requires revisions before it can be approved. Please address the issues highlighted below.
                </p>
              )}
              
              {needsFix.size > 0 && (
                <div className="rcp-issues-list">
                  <p className="rcp-issues-title">
                    <FaInfoCircle /> Fields that need attention:
                  </p>
                  <ul>
                    {Array.from(needsFix).map(field => (
                      <li key={field}>• {fieldLabels[field] || field}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <p className="upp-muted" style={{ marginBottom: 16 }}>
            Fix the highlighted fields and resubmit. Your original submission date: {contribution.submittedDate ? new Date(contribution.submittedDate).toLocaleDateString() : "Unknown"}
          </p>

          <form className="rp-form" onSubmit={addRecipe}>
            <div className="rp-grid-2">
              <div className={`rp-field ${needsFix.has("name") ? "needs-fix" : ""}`}>
                <label>Name *</label>
                <input name="name" value={form.name} onChange={onChangeForm} placeholder="e.g., Manok Pansoh" required />
                {needsFix.has("name") && <div className="field-issue-hint">Please review and correct this field</div>}
              </div>
              <div className={`rp-field ${needsFix.has("origin") ? "needs-fix" : ""}`}>
                <label>Origin *</label>
                <input name="origin" value={form.origin} onChange={onChangeForm} placeholder="e.g., Iban, Melanau…" required />
                {needsFix.has("origin") && <div className="field-issue-hint">Please review and correct this field</div>}
              </div>
            </div>

            <div className="rp-grid-3">
              <div className="rp-field">
                <label>Difficulty *</label>
                <select name="difficulty" value={form.difficulty} onChange={onChangeForm} required>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
              <div className="rp-field">
                <label>Prep Time (min) *</label>
                <input type="number" name="prepTime" value={form.prepTime} onChange={onChangeForm} required />
              </div>
              <div className="rp-field">
                <label>Cook Time (min) *</label>
                <input type="number" name="cookTime" value={form.cookTime} onChange={onChangeForm} required />
              </div>
            </div>

            <div className="rp-grid-2">
              <div className="rp-field">
                <label>Food Type</label>
                <select
                  name="foodType"
                  value={form.foodType}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "__other__") {
                      setForm(prev => ({ ...prev, foodType: v, otherFoodEnabled: true }));
                    } else {
                      setForm(prev => ({ ...prev, foodType: v, otherFoodEnabled: false, otherFoodText: "" }));
                    }
                  }}
                >
                  {[
                    "Poultry","Seafood","Vegetables","Fermented","Dessert","Rice Dish","Noodles","Soup","Meat",
                  ].map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                  <option value="__other__">Other…</option>
                </select>
              </div>

              {form.otherFoodEnabled && (
                <div className="rp-field">
                  <label>Specify Food Type</label>
                  <input
                    type="text"
                    placeholder="e.g., Beverage, Snack"
                    value={form.otherFoodText}
                    onChange={(e) => setForm(prev => ({ ...prev, otherFoodText: e.target.value }))}
                  />
                </div>
              )}
            </div>

            <div className="rp-grid-2">
              <div className={`rp-field ${needsFix.has("description") ? "needs-fix" : ""}`}>
                <label>Description *</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={onChangeForm}
                  placeholder="A short description about the dish"
                  required
                />
                {needsFix.has("description") && <div className="field-issue-hint">Please review and correct this field</div>}
              </div>

              <div className={`rp-field ${needsFix.has("images") ? "needs-fix" : ""}`}>
                <label>Upload Photo *</label>
                <div
                  className="upload-box"
                  onClick={() => document.getElementById("recipe-file-input").click()}
                  role="button"
                  tabIndex={0}
                >
                  {form.imageData ? (
                    <img src={form.imageData} alt="Preview" className="preview-img" />
                  ) : (
                    <div className="upload-placeholder">
                      <FaCamera className="camera-icon" />
                      <p>Upload Photo</p>
                    </div>
                  )}
                </div>
                <input
                  id="recipe-file-input"
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleImageUpload}
                  required={!form.imageData}
                />
                {needsFix.has("images") && <div className="field-issue-hint">Please upload a clear, appropriate image</div>}
              </div>
            </div>

            <div className="rp-field">
              <label>Servings *</label>
              <input type="number" name="servings" value={form.servings} onChange={onChangeForm} required />
            </div>

            <div className="rp-grid-2">
              <div className={`rp-field ${needsFix.has("ingredients") ? "needs-fix" : ""}`}>
                <label>Ingredients *</label>
                <textarea
                  name="ingredients"
                  value={form.ingredients}
                  onChange={onChangeForm}
                  placeholder={"One per line, e.g.\n1kg chicken\n3 stalks lemongrass\n2-inch ginger"}
                  required
                />
                {needsFix.has("ingredients") && <div className="field-issue-hint">Please review and correct ingredients list</div>}
              </div>
              <div className={`rp-field ${needsFix.has("instructions") ? "needs-fix" : ""}`}>
                <label>Instructions *</label>
                <textarea
                  name="instructions"
                  value={form.instructions}
                  onChange={onChangeForm}
                  placeholder={"One step per line, e.g.\n1) Clean and cut chicken\n2) Marinate for 30 min\n3) Cook in bamboo 2-3h"}
                  required
                />
                {needsFix.has("instructions") && <div className="field-issue-hint">Please review and correct instructions</div>}
              </div>
            </div>

            <div className="rp-field">
              <label>Dietary Preferences</label>
              <div className="rp-diet-grid">
                {DIET_OPTIONS.map(tag => (
                  <label key={tag} className="rp-diet-item">
                    <input
                      type="checkbox"
                      checked={form.dietaryTags.includes(tag)}
                      onChange={() => toggleDiet(tag)}
                    />
                    <span>{tag.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase())}</span>
                  </label>
                ))}
              </div>

              <div className="rp-diet-other">
                <label className="rp-diet-item">
                  <input
                    type="checkbox"
                    checked={form.otherDietEnabled}
                    onChange={(e) => setForm(prev => ({ ...prev, otherDietEnabled: e.target.checked }))}
                  />
                  <span>Other</span>
                </label>

                {form.otherDietEnabled && (
                  <input
                    className="rp-input rp-input--sm"
                    type="text"
                    placeholder="Type custom tags, comma-separated (e.g. halal, keto)"
                    value={form.otherDietText}
                    onChange={(e) => setForm(prev => ({ ...prev, otherDietText: e.target.value }))}
                  />
                )}
              </div>
            </div>

            <div className="rp-grid-2">
              <div className="rp-field">
                <label>Fun Fact</label>
                <textarea
                  name="funFact"
                  value={form.funFact}
                  onChange={onChangeForm}
                  placeholder="Any surprising or interesting facts?"
                />
              </div>
              <div className="rp-field">
                <label>Tips</label>
                <textarea
                  name="chefTips"
                  value={form.chefTips}
                  onChange={onChangeForm}
                  placeholder="E.g., best cut, heat control, or prep secrets…"
                />
              </div>
            </div>

            <div className="rp-actions">
              <button 
                className="rp-btn rp-submit" 
                type="submit" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Revision'}
              </button>
              <button
                className="rp-btn rp-btn-muted"
                type="button"
                onClick={() => navigate("/profile")}
              >
                Cancel
              </button>
            </div>
          </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}