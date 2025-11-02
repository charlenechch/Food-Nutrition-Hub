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
  
  // Get data from navigation state passed from UserProfilePage
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
  
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState("");

  // Initialize form with real contribution data
  useEffect(() => {
    const initializeForm = async () => {
      try {
        console.log("📝 Initializing form with contribution:", contribution);
        
        if (contribution) {
          // Use data from navigation state
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
        } else {
          // If no state data, fetch from API
          console.log("🔄 Fetching recipe data from API for ID:", id);
          const res = await fetch(`${API_BASE_URL}/api/recipe/${id}`, {
            credentials: "include"
          });
          
          if (res.ok) {
            const recipeData = await res.json();
            console.log("✅ Recipe data fetched:", recipeData);
            
            if (recipeData.success && recipeData.data) {
              const data = recipeData.data;
              setForm({
                name: data.name || data.title || "",
                origin: data.origin || "",
                difficulty: data.difficulty || "Easy",
                prepTime: data.prepTime || "",
                cookTime: data.cookTime || "",
                servings: data.servings || "",
                imageData: data.image || (data.images?.[0] || ""),
                description: data.description || "",
                ingredients: data.ingredients || "",
                instructions: data.instructions || "",
                funFact: data.funFact || "",
                chefTips: data.chefTips || "",
                dietaryTags: Array.isArray(data.dietaryTags) ? data.dietaryTags : [],
                foodType: data.foodType || "Poultry"
              });
            }
          } else {
            console.error("❌ Failed to fetch recipe data");
          }
        }
      } catch (err) {
        console.error("❌ Error initializing form:", err);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeForm();
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
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, GIF, WebP)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setForm(prev => ({ ...prev, imageData: reader.result }));
    reader.readAsDataURL(file);
  };

  const submitRevision = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      console.log("📤 Submitting recipe revision for ID:", id);
      console.log("📤 Form data:", form);

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
        dietaryTags: form.dietaryTags,
        ingredients: form.ingredients,
        instructions: form.instructions,
        funFact: form.funFact,
        chefTips: form.chefTips,
        status: "pending" // Reset to pending for review
      };

      const response = await fetch(`${API_BASE_URL}/api/recipe/update/${id}`, {
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
        throw new Error(`Failed to update recipe (${response.status}): ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Update successful:', result);

      if (result.success) {
        alert("Recipe revised successfully! It will be reviewed again.");
        navigate("/profile");
      } else {
        throw new Error(result.error || "Update failed");
      }
    } catch (err) {
      console.error("❌ Update error:", err);
      setError(err.message);
      alert(err.message || "Failed to update recipe. Please try again.");
    } finally {
      setIsLoading(false);
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

  if (!contribution && !form.name) {
    return (
      <div className="revise-recipe-page">
        <Header />
        <div className="upp-page">
          <div className="upp-wrap">
            <button className="lrp-btn lrp-btn-outline rcp-back" onClick={() => navigate("/profile")}>
              ← Back to Profile
            </button>
            <h2 className="upp-404-h2">Recipe not found</h2>
            <p className="upp-muted">
              This recipe isn't available for revision. It may have been deleted or already approved.
            </p>      
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="revise-recipe-page">
      <Header />
      <div className="upp-page">
        <div className="upp-wrap">
          <button className="lrp-btn lrp-btn-outline rcp-back" onClick={() => navigate("/profile")}>
            ← Back to Profile
          </button>
          
          <div className="rcp-wrap">
            <h2 className="rp-title">Revise Recipe</h2>
            
            {/* Admin Feedback Section */}
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
              Fix the highlighted fields and resubmit. {contribution?.submittedDate && 
                `Original submission date: ${new Date(contribution.submittedDate).toLocaleDateString()}`
              }
            </p>

            {error && (
              <div className="rcp-error-message">
                {error}
              </div>
            )}

            <form className="rp-form" onSubmit={submitRevision}>
              {/* Your existing form fields remain the same */}
              <div className="rp-grid-2">
                <div className={`rp-field ${needsFix.has("name") ? "needs-fix" : ""}`}>
                  <label>Name *</label>
                  <input 
                    name="name" 
                    value={form.name} 
                    onChange={onChangeForm} 
                    placeholder="e.g., Manok Pansoh" 
                    required 
                  />
                  {needsFix.has("name") && <div className="field-issue-hint">Please review and correct this field</div>}
                </div>
                
                <div className={`rp-field ${needsFix.has("origin") ? "needs-fix" : ""}`}>
                  <label>Origin *</label>
                  <input 
                    name="origin" 
                    value={form.origin} 
                    onChange={onChangeForm} 
                    placeholder="e.g., Iban, Melanau…" 
                    required 
                  />
                  {needsFix.has("origin") && <div className="field-issue-hint">Please review and correct this field</div>}
                </div>
              </div>

              {/* ... rest of your form fields ... */}

              <div className="rp-actions">
                <button 
                  className="rp-btn rp-submit" 
                  type="submit" 
                  disabled={isLoading}
                >
                  {isLoading ? 'Submitting...' : 'Submit Revision'}
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