import React, { useMemo, useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { FaCamera, FaExclamationTriangle, FaInfoCircle } from "react-icons/fa"; 
import LS_KEY from "./UserProfilePage"; 
import "../css/ReviseRecipePage.css"; // Import the CSS
import Modal from "../components/Modal";
import { CheckCircle2, AlertTriangle } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Helper to load users from localStorage (same shape as your profile page)
function loadUsers() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
function saveUsers(obj) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(obj));
  } catch {}
}

// You can keep these in a shared constants file if you like
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
  const { state } = useLocation();
  const { contribution, adminFeedback, fieldsWithIssues } = state || {};
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [item, setItem] = useState(contribution); // Make item stateful
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
    otherDietEnabled: false,
    otherDietText: "",
    foodType: "Poultry",
    otherFoodEnabled: false,
    otherFoodText: "",
  });

  const [infoDlg, setInfoDlg] = useState({
    open: false,
    title: "",
    message: "",
    icon: null,
    primaryText: "OK",
  });

  const openInfo = ({ title, message, icon, primaryText = "OK" }) =>
    setInfoDlg({ open: true, title, message, icon, primaryText });

  const closeInfo = () => setInfoDlg((d) => ({ ...d, open: false }));

  const needsFix = new Set(item?.fieldsWithIssues || []);

  useEffect(() => {
    const initializeForm = () => {
      // Use the contribution from state if available
      if (contribution) {
        console.log("📝 Using state contribution:", contribution);
        setItem(contribution);
        
        const p = contribution.payload || contribution;
        const initialForm = {
          name: p.name || p.title || "",
          origin: p.origin || "",
          difficulty: p.difficulty || "Easy",
          prepTime: p.prepTime ?? "",
          cookTime: p.cookTime ?? "",
          servings: p.servings ?? "",
          imageData: p.imageData || p.image || "",
          description: p.description || "",
          ingredients: p.ingredients || "",
          instructions: p.instructions || p.steps || "",
          funFact: p.funFact || p.DidYouKnow || "",
          chefTips: p.chefTips || "",
          dietaryTags: Array.isArray(p.dietaryTags) ? p.dietaryTags : [],
          otherDietEnabled: false,
          otherDietText: "",
          foodType: p.foodType || "Poultry",
          otherFoodEnabled: false,
          otherFoodText: "",
        };
        
        setForm(initialForm);
        setIsLoading(false);
      }
    };

    const fetchRecipeData = async () => {
      try {
        const recipeId = id;
        console.log("🎯 Using recipe ID from URL:", recipeId);
        console.log("🔍 Available IDs:", { 
          urlId: id, 
          contributionId: contribution?.id, 
          itemId: item?.id 
        });

        if (!recipeId) {
          throw new Error("No recipe ID provided in URL");
        }

        const response = await fetch(`${API_BASE_URL}/api/recipe/recipes/${recipeId}`);
        
        console.log("📡 Response status:", response.status);

        if (!response.ok) {
          throw new Error(`Failed to fetch recipe: ${response.status}`);
        }

        const recipeData = await response.json();
        console.log("✅ Recipe data received:", {
          id: recipeData.id,
          name: recipeData.name,
          origin: recipeData.origin
        });

        // ✅ FIX: Use the actual recipeData variable (not p)
        setItem(prev => ({
          ...prev,
          ...recipeData, // Use recipeData, not p
          id: recipeId
        }));

        setForm(prev => ({
          ...prev,
          name: recipeData.name || "",
          origin: recipeData.origin || "",
          difficulty: recipeData.difficulty || "Easy",
          prepTime: recipeData.prepTime ?? "",
          cookTime: recipeData.cookTime ?? "",
          servings: recipeData.servings ?? "",
          imageData: recipeData.image || "",
          description: recipeData.description || "",
          ingredients: recipeData.ingredients || "",
          instructions: recipeData.instructions || "",
          funFact: recipeData.funFact || recipeData.DidYouKnow || "",
          chefTips: recipeData.chefTips || "",
          dietaryTags: Array.isArray(recipeData.dietaryTags) ? recipeData.dietaryTags : [],
          foodType: recipeData.foodType || "",
          category: recipeData.category || "",
          status: recipeData.status || "Pending"
        }));

        console.log("🧾 Form state after mapping:", {
          name: recipeData.name,
          imageData: recipeData.image,
          description: recipeData.description,
          ingredients: recipeData.ingredients,
          instructions: recipeData.instructions
        });

      } catch (error) {
        console.error("❌ Error fetching from API, using state data:", error);
        // Fall back to state data
        initializeForm();
      } finally {
        setIsLoading(false);
      }
    };

    if (contribution) {
      fetchRecipeData();
    } else {
      // If no state data, we can't proceed
      setIsLoading(false);
    }
  }, [id, contribution]);
  
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
      console.log('🚀 Starting recipe revision for ID:', id); // ✅ FIX: Use id

      // Build the data in the same format as your create endpoint
      const revisedData = {
        name: form.name,
        origin: form.origin,
        difficulty: form.difficulty,
        prepTime: parseInt(form.prepTime) || 0, // ✅ Convert to number
        cookTime: parseInt(form.cookTime) || 0, // ✅ Convert to number
        servings: parseInt(form.servings) || 1, // ✅ Convert to number
        image: form.imageData,
        description: form.description,
        foodType: form.foodType,
        //dietaryTags: form.dietaryTags,
        ingredients: form.ingredients,
        instructions: form.instructions,
        funFact: form.funFact,
        chefTips: form.chefTips,
        status: "Pending"
      };

      console.log('📤 Sending update request with data:', revisedData);

      const users = loadUsers();
      const ownerUsername = "currentUser";

      const response = await fetch(`${API_BASE_URL}/api/recipe/revise/recipes/${id}`, {
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

      let result;
      try {
        result = await response.json();
        console.log('✅ Update successful:', result);
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        throw new Error('Invalid response from server');
      }

      if (result.success || result.message || result.id) {
      // Only update localStorage if user exists and has pending array
      try {
        const users = loadUsers();
        const ownerUsername = "currentUser";
        
        if (users[ownerUsername] && Array.isArray(users[ownerUsername].pending)) {
          const list = users[ownerUsername].pending.map(p => {
            if (String(p.id) !== String(id)) return p;
            return {
              ...p,
              status: "Pending",
              feedback: "",
              fieldsWithIssues: [],
              payload: revisedData,
              resubmittedDate: new Date().toISOString(),
            };
          });
          nextUsers[ownerUsername] = { ...nextUsers[ownerUsername], pending: list };
          saveUsers(nextUsers);
          console.log('✅ localStorage updated successfully');
        } else {
          console.log('⚠️ User or pending array not found in localStorage, skipping update');
        }
      } catch (localStorageError) {
        console.warn('⚠️ localStorage update failed:', localStorageError);
      }

      openInfo({
        title: "Recipe revised successfully!",
        message: "It will be reviewed again.",
        icon: <CheckCircle2 />,
      });
      setTimeout(() => {
        navigate(-1);
      }, 2000); 
    } else {
      throw new Error(result.error || "Update failed");
    }
  } catch (error) {
    console.error("❌ Update error:", error);
    openInfo({
      title: "Failed to update recipe.",
      message: error?.message || "Please try again.",
      icon: <AlertTriangle />,
    });
  } finally {
    setIsSubmitting(false);
  }
};

  const fieldLabels = {
    name: "Recipe Name",
    origin: "Origin",
    description: "Description", 
    images: "Image",
    ingredients: "Ingredients",
    instructions: "Instructions",
    dietaryTags: "Dietary Tags"
  };

  if (isLoading) {
    return (
      <div className="revise-recipe-page">
        <Header />
        <div className="upp-page">
          <div className="upp-wrap">
            <div className="loading-state">Loading recipe data...</div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="upp-wrap">
        <button className="lrp-btn lrp-btn-outline rcp-back" onClick={() => navigate(-1)}>← Back</button>
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
          <button className="lrp-btn lrp-btn-outline rcp-back" onClick={() => navigate(-1)}>← Back</button>
          <div className="rcp-wrap">
          <h2 className="rp-title">Revise Recipe</h2>
          
          {/* ✅ ADDED ADMIN ALERT BOX */}
          <div className="rcp-admin-alert">
            <div className="rcp-alert-header">
              <FaExclamationTriangle className="rcp-alert-icon" />
              <h3>Revision Required - Admin Feedback</h3>
            </div>
            
            <div className="rcp-alert-content">
              {item.feedback ? (
                <p className="rcp-feedback-message">{item.feedback}</p>
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
            Fix the highlighted fields and resubmit. Your original submission date: {new Date(item.submittedDate).toLocaleDateString()}
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
                onClick={() => navigate(-1)}
              >
                Cancel
              </button>
            </div>
          </form>
          </div>
        </div>
      </div>
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
}