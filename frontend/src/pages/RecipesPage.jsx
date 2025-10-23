// ✅ FULL RecipesPage.jsx — With Guest Block + Login Modal (Design Fully Preserved)

import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../css/RecipesPage.css";
import { FaCamera } from "react-icons/fa";
import { Filter, Sliders, X } from "lucide-react";
import LoginPromptModal from "../components/LoginPromptModal"; // ✅ Modal
import { useAuth } from "../context/AuthContext"; // ✅ Auth for guest detection

const PER_PAGE = 9;

// ✅ Get only first sentence for recipe card
const getFirstSentence = (description) => {
  if (!description) return "";
  const period = description.indexOf(".");
  return period !== -1 ? description.substring(0, period + 1) : description;
};

export default function RecipesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth(); // ✅ check login
  const isGuest = !user || user.role === "guest"; // ✅ if guest

  // ✅ Show login modal
  const [showLoginModal, setShowLoginModal] = useState(false);

  const initialQ = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(initialQ);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Expand form state + form data
  const [expanded, setExpanded] = useState(false);
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

  // ✅ Filters (unchanged)
  const [selectedOrigin, setSelectedOrigin] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedType, setSelectedType] = useState("all");
  const [selectedPrepTime, setSelectedPrepTime] = useState("all");
  const [selectedCookTime, setSelectedCookTime] = useState("all");
  const [dietFilters, setDietFilters] = useState([]);
  const [page, setPage] = useState(1);

  // ✅ Fetch recipes from backend
  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const API_BASE_URL =
          import.meta.env.VITE_API_URL || "http://localhost:5000";
        const res = await fetch(`${API_BASE_URL}/api/recipe/all/recipes`);
        const data = await res.json();
        setRecipes(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching recipes:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecipes();
  }, []);

  // ✅ Debug console log
  useEffect(() => {
    if (recipes.length > 0) {
      console.log("Sample Recipe:", recipes[0]);
    }
  }, [recipes]);

  // ✅ Guest-protected expand logic
  const handleExpand = () => {
    if (isGuest) {
      setShowLoginModal(true);
      return;
    }
    setExpanded(true);
  };

  // ✅ Form change handler
  function onChangeForm(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  // ✅ Add recipe (protected for guest)
  const addRecipe = async (e) => {
    e.preventDefault();
    if (isGuest) {
      setShowLoginModal(true);
      return;
    }
    if (!form.name.trim() || !form.origin.trim()) {
      return alert("Please fill in name and origin");
    }

    const toLines = (s) =>
      s.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);

    const parseCustom = (s) =>
      s
        .split(/[,;\n]+/)
        .map((v) => v.trim())
        .filter(Boolean)
        .map((v) => v.toLowerCase().replace(/\s+/g, "-"));

    const customDiet =
      form.otherDietEnabled && form.otherDietText
        ? parseCustom(form.otherDietText)
        : [];

    const finalFoodType =
      form.foodType === "__other__"
        ? form.otherFoodText.trim() || "Other"
        : form.foodType;

    try {
      const API_BASE_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000";
      const res = await fetch(`${API_BASE_URL}/api/recipe/create/recipes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: form.name,
          origin: form.origin,
          difficulty: form.difficulty,
          prepTime: Number(form.prepTime),
          cookTime: Number(form.cookTime),
          servings: Number(form.servings),
          image: form.imageData,
          description: form.description,
          foodType: finalFoodType,
          dietaryTags: [...form.dietaryTags, ...customDiet],
          ingredients: toLines(form.ingredients).join("\n"),
          instructions: toLines(form.instructions).join("\n"),
          funFact: form.funFact,
          chefTips: form.chefTips,
        }),
      });

      if (!res.ok) throw new Error("Failed to add recipe");

      alert("Recipe added successfully!");
      setExpanded(false);
      setForm({
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
    } catch (err) {
      console.error(err);
      alert("Error submitting recipe.");
    }
  };

  // ✅ Diet toggle logic unchanged
  const DIET_OPTIONS = [
    "vegetarian",
    "gluten-free",
    "dairy-free",
    "spicy",
    "paleo",
    "halal",
    "keto",
    "nut-free",
  ];

  function toggleDiet(tag) {
    setForm((prev) => {
      const has = prev.dietaryTags.includes(tag);
      return {
        ...prev,
        dietaryTags: has
          ? prev.dietaryTags.filter((t) => t !== tag)
          : [...prev.dietaryTags, tag],
      };
    });
  }

  // ✅ Render Modal
  const renderModal = () =>
    showLoginModal && (
      <LoginPromptModal
        message="Please log in or register to share your recipe."
        onClose={() => setShowLoginModal(false)}
        onLogin={() => navigate("/loginregister")}
      />
    );

  if (loading) return <div>Loading recipes...</div>;

  return (
    <div className="recipes-page">
      <Header />

      {/* ✅ Login Popup Modal */}
      {renderModal()}

      {/* ---------- Page Header ---------- */}
      <div className="rp-header">
        <h1 className="rp-title">Traditional Recipes</h1>
        <p className="rp-sub">
          Authentic Sarawakian recipes with cultural stories
        </p>
      </div>

      {/* ---------- Share Recipe Section ---------- */}
      <section className={`rp-card ${expanded ? "is-open" : ""}`}>
        <div className="rp-card-head">
          <h3>Share Your Recipe</h3>
          <p>Every dish tells a story. Share yours!</p>
          {!expanded && (
            <button className="share-btn" onClick={handleExpand}>
              Add Recipe
            </button>
          )}
        </div>
        {/* ✅ Only show full form to logged-in users */}
        {expanded && !isGuest && (
          <form className="rp-form" onSubmit={addRecipe}>
            {/* Name + Origin */}
            <div className="rp-grid-2">
              <div className="rp-field">
                <label>Name *</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={onChangeForm}
                  placeholder="e.g., Manok Pansoh"
                  required
                />
              </div>
              <div className="rp-field">
                <label>Origin *</label>
                <input
                  name="origin"
                  value={form.origin}
                  onChange={onChangeForm}
                  placeholder="e.g., Iban, Melanau…"
                  required
                />
              </div>
            </div>

            {/* Difficulty + Prep + Cook Time */}
            <div className="rp-grid-3">
              <div className="rp-field">
                <label>Difficulty *</label>
                <select
                  name="difficulty"
                  value={form.difficulty}
                  onChange={onChangeForm}
                  required
                >
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
                </select>
              </div>
              <div className="rp-field">
                <label>Prep Time (min) *</label>
                <input
                  type="number"
                  name="prepTime"
                  value={form.prepTime}
                  onChange={onChangeForm}
                  required
                />
              </div>
              <div className="rp-field">
                <label>Cook Time (min) *</label>
                <input
                  type="number"
                  name="cookTime"
                  value={form.cookTime}
                  onChange={onChangeForm}
                  required
                />
              </div>
            </div>

            {/* Food Type + Custom Type */}
            <div className="rp-grid-2">
              <div className="rp-field">
                <label>Food Type</label>
                <select
                  name="foodType"
                  value={form.foodType}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "__other__") {
                      setForm((prev) => ({
                        ...prev,
                        foodType: v,
                        otherFoodEnabled: true,
                      }));
                    } else {
                      setForm((prev) => ({
                        ...prev,
                        foodType: v,
                        otherFoodEnabled: false,
                        otherFoodText: "",
                      }));
                    }
                  }}
                >
                  {[
                    "Poultry",
                    "Seafood",
                    "Vegetables",
                    "Fermented",
                    "Dessert",
                    "Rice Dish",
                    "Noodles",
                    "Soup",
                    "Meat",
                  ].map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
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
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        otherFoodText: e.target.value,
                      }))
                    }
                  />
                </div>
              )}
            </div>

            {/* Description + Upload Image */}
            <div className="rp-grid-2">
              <div className="rp-field">
                <label>Description *</label>
                <textarea
                  name="description"
                  className="rp-desc"
                  value={form.description}
                  onChange={onChangeForm}
                  required
                />
              </div>
              <div className="rp-field">
                <label>Upload Photo *</label>
                <div
                  className="upload-box"
                  onClick={() =>
                    document.getElementById("recipe-file-input").click()
                  }
                >
                  {form.imageData ? (
                    <img
                      src={form.imageData}
                      alt="Preview"
                      className="preview-img"
                    />
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
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () =>
                      setForm((prev) => ({
                        ...prev,
                        imageData: reader.result,
                      }));
                    reader.readAsDataURL(file);
                  }}
                  required
                />
              </div>
            </div>

            {/* Servings */}
            <div className="rp-field">
              <label>Servings *</label>
              <input
                type="number"
                name="servings"
                value={form.servings}
                onChange={onChangeForm}
                required
              />
            </div>

            {/* Ingredients + Instructions */}
            <div className="rp-grid-2">
              <div className="rp-field">
                <label>Ingredients *</label>
                <textarea
                  name="ingredients"
                  value={form.ingredients}
                  onChange={onChangeForm}
                  placeholder="One per line..."
                  required
                />
              </div>
              <div className="rp-field">
                <label>Instructions *</label>
                <textarea
                  name="instructions"
                  value={form.instructions}
                  onChange={onChangeForm}
                  placeholder="One step per line..."
                  required
                />
              </div>
            </div>

            {/* Dietary Preferences */}
            <div className="rp-field">
              <label>Dietary Preferences</label>
              <div className="rp-diet-grid">
                {DIET_OPTIONS.map((tag) => (
                  <label key={tag} className="rp-diet-item">
                    <input
                      type="checkbox"
                      checked={form.dietaryTags.includes(tag)}
                      onChange={() => toggleDiet(tag)}
                    />
                    <span>
                      {tag.replace("-", " ").replace(/\b\w/g, (c) =>
                        c.toUpperCase()
                      )}
                    </span>
                  </label>
                ))}
              </div>

              {/* Other Diet */}
              <div className="rp-diet-other">
                <label className="rp-diet-item">
                  <input
                    type="checkbox"
                    checked={form.otherDietEnabled}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        otherDietEnabled: e.target.checked,
                      }))
                    }
                  />
                  <span>Other</span>
                </label>

                {form.otherDietEnabled && (
                  <input
                    className="rp-input rp-input--sm"
                    type="text"
                    placeholder="Custom diet tags, comma-separated"
                    value={form.otherDietText}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        otherDietText: e.target.value,
                      }))
                    }
                  />
                )}
              </div>
            </div>

            {/* Fun Fact + Chef Tips */}
            <div className="rp-grid-2">
              <div className="rp-field">
                <label>Fun Fact</label>
                <textarea
                  name="funFact"
                  value={form.funFact}
                  onChange={onChangeForm}
                />
              </div>
              <div className="rp-field">
                <label>Chef Tips</label>
                <textarea
                  name="chefTips"
                  value={form.chefTips}
                  onChange={onChangeForm}
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="rp-actions">
              <button className="rp-btn rp-submit" type="submit">
                Submit Recipe
              </button>
              <button
                className="rp-btn rp-btn-muted"
                type="button"
                onClick={() =>
                  setForm({
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
                  })
                }
              >
                Clear
              </button>
              <button
                className="rp-btn rp-btn-muted"
                type="button"
                onClick={() => setExpanded(false)}
              >
                Close
              </button>
            </div>
          </form>
        )}
      </section>
      {/* ================= SEARCH + FILTER BAR ================= */}
      <div className="rp-filter-card efp-controls">
        <div className="efp-search-row">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search recipes, origins, or descriptions..."
            className="efp-input"
          />
          <div className="efp-btn-group">
            <button type="button" className="efp-btn" onClick={() => setShowFilters(v => !v)}>
              <Sliders size={18} />
              Filters
            </button>
            <button type="button" className="efp-btn" onClick={clearAll}>
              <X size={18} />
              Clear All
            </button>
          </div>
        </div>

        {/* Category Chips */}
        <div className="rp-tags-row">
          {["all", "Poultry", "Seafood", "Vegetables", "Fermented", "Dessert",
            "Rice Dish", "Noodles", "Soup", "Meat", "Other"].map((ft) => (
            <button
              key={ft}
              className={`efp-chip ${selectedType === ft ? "is-active" : ""}`}
              onClick={() => setSelectedType(ft)}
            >
              {ft === "all" ? "All Categories" : ft}
            </button>
          ))}
        </div>
      </div>

      {/* ================= FILTER PANEL (TOGGLE) ================= */}
      {showFilters && (
        <div className="rp-filter-card efp-card efp-filters-card">
          <div className="efp-filters">
            <div className="efp-filters-header">
              <Filter className="efp-filter-icon" size={18} />
              <h2 className="efp-filters-title">Filter</h2>
            </div>

            {/* Origin + Difficulty */}
            <div className="efp-grid-2">
              <div className="efp-filter-item">
                <label className="efp-label">Cultural Origin</label>
                <select
                  value={selectedOrigin}
                  onChange={(e) => setSelectedOrigin(e.target.value)}
                  className="efp-select"
                >
                  {origins.map((o) => (
                    <option key={o} value={o}>
                      {o === "all" ? "All" : o}
                    </option>
                  ))}
                </select>
              </div>

              <div className="efp-filter-item">
                <label className="efp-label">Difficulty</label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="efp-select"
                >
                  <option value="all">All</option>
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
                </select>
              </div>
            </div>

            <hr className="efp-sep" />

            {/* Prep + Cook Time */}
            <div className="efp-grid-2">
              <div className="efp-filter-item">
                <label className="efp-label">Prep Time</label>
                <select
                  value={selectedPrepTime}
                  onChange={(e) => setSelectedPrepTime(e.target.value)}
                  className="efp-select"
                >
                  <option value="all">All Categories</option>
                  <option value="under30">Under 30 minutes</option>
                  <option value="under120">Under 2 hours</option>
                  <option value="over120">Over 2 hours</option>
                </select>
              </div>

              <div className="efp-filter-item">
                <label className="efp-label">Cook Time</label>
                <select
                  value={selectedCookTime}
                  onChange={(e) => setSelectedCookTime(e.target.value)}
                  className="efp-select"
                >
                  <option value="all">All Categories</option>
                  <option value="under30">Under 30 minutes</option>
                  <option value="under120">Under 2 hours</option>
                  <option value="over120">Over 2 hours</option>
                </select>
              </div>
            </div>

            <hr className="efp-sep" />

            {/* Dietary Preference Filters */}
            <div>
              <label className="efp-label">Dietary Preferences</label>
              <div className="efp-checkbox-grid">
                {DIET_OPTIONS.map((tag) => (
                  <label key={tag} className="efp-checkbox-item">
                    <input
                      type="checkbox"
                      checked={dietFilters.includes(tag)}
                      onChange={() =>
                        setDietFilters((prev) =>
                          prev.includes(tag)
                            ? prev.filter((t) => t !== tag)
                            : [...prev, tag]
                        )
                      }
                    />
                    <span>
                      {tag.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= RESULTS + ACTIVE FILTER TAGS ================= */}
      <div className="rp-results-head">
        <p className="efp-results-count">{filtered.length} recipes found</p>
        {dietFilters.length > 0 && (
          <div className="efp-active-filters">
            {dietFilters.map((tag) => (
              <button
                key={tag}
                className="efp-chip efp-chip--removable"
                onClick={() =>
                  setDietFilters((prev) => prev.filter((t) => t !== tag))
                }
              >
                {tag.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                <X size={14} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ================= RECIPE GRID ================= */}
      <div className="rp-grid">
        {current.map((r, index) => {
          const id = r.id || r.foodID || index;
          const img = r.image || r.imageData || "https://via.placeholder.com/300x200?text=No+Image";

          return (
            <div className="efp-food-card" key={id}>
              {/* Image */}
              <div className="efp-food-media">
                <img src={img} alt={r.name} className="efp-image" loading="lazy" />
                <div className="efp-badges">
                  <span className={`efp-badge efp-badge--${(r.difficulty || "Easy").toLowerCase()}`}>
                    {r.difficulty || "Easy"}
                  </span>
                </div>
              </div>

              {/* Card Content */}
              <div className="efp-food-body">
                <div className="efp-food-headline">
                  <h3 className="efp-food-title">{r.name}</h3>
                  <span className="efp-badge-cat">{r.foodType || "Other"}</span>
                </div>

                <p className="efp-desc">{getFirstSentence(r.description)}</p>

                <div className="efp-meta">
                  <span className="muted">Origin: {r.origin}</span>
                </div>

                <div className="efp-nutri">
                  <div className="efp-nutri-item">
                    <div>{r.prepTime}m</div>
                    <div className="muted">Prep</div>
                  </div>
                  <div className="efp-nutri-item">
                    <div>{r.cookTime}m</div>
                    <div className="muted">Cook</div>
                  </div>
                  <div className="efp-nutri-item">
                    <div>{r.servings}</div>
                    <div className="muted">Serves</div>
                  </div>
                </div>

                {/* View Details */}
                <button
                  className="efp-card-cta"
                  onClick={() => navigate(`/recipes/${id}`)}
                >
                  View Recipe
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* No results message */}
      {filtered.length === 0 && (
        <div className="rp-empty">
          <p>No recipes match your search.</p>
        </div>
      )}

      {/* ================= PAGINATION ================= */}
      {totalPages > 1 && (
        <div className="efp-pagination">
          <button
            className="efp-btn"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            ‹ Prev
          </button>

          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              className={`efp-btn ${page === i + 1 ? "is-active" : ""}`}
              onClick={() => setPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}

          <button
            className="efp-btn"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next ›
          </button>
        </div>
      )}

      <Footer />
    </div>
  );
}
