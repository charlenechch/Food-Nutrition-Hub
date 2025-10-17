import React, { useMemo, useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
// If you already use FaCamera somewhere else, keep this:
import { FaCamera } from "react-icons/fa"; 
import LS_KEY from "./UserProfilePage"; 
// If you prefer lucide instead, replace with Camera and update the JSX.

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

export default function ReviseContributionPage() {
  const { id } = useParams();              // /revise/:id
  const navigate = useNavigate();
  const { state } = useLocation();
    const users = useMemo(loadUsers, []);
    const { ownerUsername, item } = useMemo(() => {
    const targetId = state?.id || id;
    for (const [uname, u] of Object.entries(users)) {
        const hit = (u?.pending || []).find(p => String(p.id) === String(targetId));
        if (hit) return { ownerUsername: uname, item: hit };
    }
    if (state?.snapshot && state?.owner) {
        return { ownerUsername: state.owner, item: state.snapshot };
    }
    return { ownerUsername: null, item: null };
    }, [users, id, state]);

  if (!item) {
    return (
      <div className="upp-wrap">
        <button className="lrp-btn lrp-btn-outline rcp-back" onClick={() => navigate(-1)}>← Back</button>
        <h2 className="upp-404-h2">This contribution isn’t available to revise.</h2>
        <p className="upp-muted">
            It may have been re-submitted or reviewed already. Try refreshing your profile’s “Pending” tab.
        </p>      
      </div>
    );
  }

  const needsFix = new Set(item.fieldsWithIssues || []);

  // Map the stored payload into the form shape used by your Recipe page
  const [initial] = useState(() => {
    const p = item.payload || {};
    return {
      name: p.name || p.title || "",
      origin: p.origin || "",
      difficulty: p.difficulty || "Easy",
      prepTime: p.prepTime ?? "",
      cookTime: p.cookTime ?? "",
      servings: p.servings ?? "",
      imageData: p.imageData || (p.images?.[0] ?? ""),
      description: p.description || "",
      ingredients: p.ingredients || "",
      instructions: p.instructions || "",
      funFact: p.funFact || "",
      chefTips: p.chefTips || "",
      dietaryTags: p.dietaryTags || [],
      otherDietEnabled: !!p.otherDietEnabled,
      otherDietText: p.otherDietText || "",
      foodType: p.foodType || "Poultry",
      otherFoodEnabled: !!p.otherFoodEnabled,
      otherFoodText: p.otherFoodText || "",
    };
  });

  const [form, setForm] = useState(initial);
  
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

  const addRecipe = (e) => {
    e.preventDefault();

    // Build revised payload (keep same keys your backend expects)
    const revisedPayload = {
      ...item.payload,
      title: form.name,             // keep both title & name if you want
      name: form.name,
      origin: form.origin,
      difficulty: form.difficulty,
      prepTime: form.prepTime,
      cookTime: form.cookTime,
      servings: form.servings,
      imageData: form.imageData,
      images: form.imageData ? [form.imageData] : item.payload?.images || [],
      description: form.description,
      ingredients: form.ingredients,
      instructions: form.instructions,
      funFact: form.funFact,
      chefTips: form.chefTips,
      dietaryTags: [
        ...form.dietaryTags,
        ...(form.otherDietEnabled && form.otherDietText
          ? form.otherDietText.split(",").map(s => s.trim()).filter(Boolean)
          : []),
      ],
      foodType: form.foodType === "__other__" ? (form.otherFoodText || "Other") : form.foodType,
    };

    // Update users -> pending (same item id), set status back to under_review (or "resubmitted")
    const nextUsers = { ...users };
    const list = nextUsers[ownerUsername].pending.map(p => {
      if (String(p.id) !== String(item.id)) return p;
      return {
        ...p,
        status: "under_review",
        feedback: "",                 // clear old feedback after revision
        fieldsWithIssues: [],
        payload: revisedPayload,
      };
    });
    nextUsers[ownerUsername] = { ...nextUsers[ownerUsername], pending: list };
    saveUsers(nextUsers);

    alert("Revision submitted! We’ll review it shortly.");
    navigate(-1);
  };
  useEffect(() => {
    if (!item) return;
    const p = item.payload || {};
    setForm(prev => ({
        ...prev,
        name: p.name || p.title || "",
        origin: p.origin || "",
        difficulty: p.difficulty || "Easy",
        prepTime: p.prepTime ?? "",
        cookTime: p.cookTime ?? "",
        foodType: p.foodType || "Poultry",
        otherFoodEnabled: !!p.otherFoodEnabled,
        otherFoodText: p.otherFoodText || "",
        description: p.description || "",
        imageData: p.imageData || (p.images?.[0] ?? ""),
        servings: p.servings ?? "",
        ingredients: p.ingredients || "",
        instructions: p.instructions || "",
        dietaryTags: p.dietaryTags || [],
        otherDietEnabled: !!p.otherDietEnabled,
        otherDietText: p.otherDietText || "",
        funFact: p.funFact || "",
        chefTips: p.chefTips || ""
    }));
  }, [item]);

  return (
    <div className="revise-contribution-page">
      <Header />
      <div className="upp-page">
        <div className="upp-wrap">
          <button className="lrp-btn lrp-btn-outline rcp-back" onClick={() => navigate(-1)}>← Back</button>
          <div className="rcp-wrap">
          <h2 className="rp-title">Revise Contribution</h2>
          <p className="upp-muted" style={{ marginBottom: 16 }}>
            Fix the highlighted fields and resubmit. Your original submission date: {new Date(item.submittedDate).toLocaleDateString()}
          </p>

          {item.feedback ? (
            <div className="upp-card" style={{ borderColor: "#ffd6d6", background: "#fff8f8" }}>
              <div className="upp-strong" style={{ marginBottom: 6 }}>Reviewer Feedback</div>
              <div>{item.feedback}</div>
            </div>
          ) : null}

          <form className="rp-form" onSubmit={addRecipe}>
            <div className="rp-grid-2">
              <div className={`rp-field ${needsFix.has("name") ? "needs-fix" : ""}`}>
                <label>Name *</label>
                <input name="name" value={form.name} onChange={onChangeForm} placeholder="e.g., Manok Pansoh" required />
              </div>
              <div className={`rp-field ${needsFix.has("origin") ? "needs-fix" : ""}`}>
                <label>Origin *</label>
                <input name="origin" value={form.origin} onChange={onChangeForm} placeholder="e.g., Iban, Melanau…" required />
              </div>
            </div>

            <div className="rp-grid-3">
              <div className="rp-field">
                <label>Difficulty *</label>
                <select name="difficulty" value={form.difficulty} onChange={onChangeForm} required>
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
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
              <button className="rp-btn rp-submit" type="submit">Submit Revision</button>
              <button
                className="rp-btn rp-btn-muted"
                type="button"
                onClick={() => setForm(initial)}
              >
                Reset
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
      <Footer />
    </div>
  );
}
