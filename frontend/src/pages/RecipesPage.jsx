// ✅ FULL RecipesPage.jsx — Guest Block + LoginPromptModal (keeps full fields & filters)

import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import LoginPromptModal from "../components/LoginPromptModal"; // ✅ Pop-up for guests
import "../css/RecipesPage.css";
import { FaCamera } from "react-icons/fa";
import { Sliders, X, Filter } from "lucide-react";
import { useAuth } from "../context/AuthContext";

// Constants
const PER_PAGE = 9;

// Small helpers
const toLower = (v) => (typeof v === "string" ? v.toLowerCase() : "");

const timeToMinutes = (t) => {
  // Accepts "45", "45m", "1h 20m", "1:20", etc.
  if (!t) return 0;
  const s = String(t).trim().toLowerCase();
  if (/^\d+$/.test(s)) return parseInt(s, 10);
  let m = 0;
  const hMatch = s.match(/(\d+)\s*h/);
  const mMatch = s.match(/(\d+)\s*m/);
  const colon = s.match(/^(\d+):(\d+)$/);
  if (hMatch) m += parseInt(hMatch[1], 10) * 60;
  if (mMatch) m += parseInt(mMatch[1], 10);
  if (colon) m += parseInt(colon[1], 10) * 60 + parseInt(colon[2], 10);
  if (!hMatch && !mMatch && !colon) {
    const num = parseInt(s.replace(/[^\d]/g, ""), 10);
    if (!isNaN(num)) m += num;
  }
  return m;
};

export default function RecipesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  // ✅ Detect if guest or not logged in
  const isGuest = !user || user.role === "guest";
  const [showLoginModal, setShowLoginModal] = useState(false);

  // ✅ Data
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Add Recipe Expand + Form
  const [expanded, setExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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
    foodType: "Poultry",
    dietTags: [], // e.g., ["Vegetarian", "Gluten-Free"]
  });

  // ✅ Filters & UI toggles
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedOrigin, setSelectedOrigin] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [selectedPrepTime, setSelectedPrepTime] = useState("all"); // e.g., "<=15", "<=30", "<=60", ">60"
  const [selectedCookTime, setSelectedCookTime] = useState("all");
  const [selectedType, setSelectedType] = useState("all"); // e.g., Poultry/Seafood/Vegetarian/etc.
  const [dietFilters, setDietFilters] = useState([]); // array of strings
  const [showFilters, setShowFilters] = useState(false);

  // ✅ Pagination
  const [page, setPage] = useState(1);

  // --- Fetch recipes ---
  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const res = await fetch(`${API_BASE_URL}/api/recipe/all/recipes`);
        const data = await res.json();
        setRecipes(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching recipes:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecipes();
  }, []);

  // --- Expand logic for Add Recipe (guest gets blocked with modal) ---
  const handleExpand = useCallback(() => {
    if (isGuest) {
      setShowLoginModal(true);
      return;
    }
    setExpanded(true);
  }, [isGuest]);

  // --- Form handlers ---
  const onChangeForm = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onToggleDietTag = (tag) => {
    setForm((prev) => {
      const exists = prev.dietTags.includes(tag);
      return {
        ...prev,
        dietTags: exists
          ? prev.dietTags.filter((t) => t !== tag)
          : [...prev.dietTags, tag],
      };
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((prev) => ({ ...prev, imageData: reader.result }));
    reader.readAsDataURL(file);
  };

  // --- Submit recipe ---
  const addRecipe = async (e) => {
    e.preventDefault();
    if (isGuest) {
      setShowLoginModal(true);
      return;
    }
    if (!form.name.trim() || !form.origin.trim()) {
      alert("Please fill in both Name and Origin.");
      return;
    }
    try {
      setSubmitting(true);
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const res = await fetch(`${API_BASE_URL}/api/recipe/create/recipes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to submit recipe");
      alert("✅ Recipe submitted!");

      // Reset + collapse
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
        foodType: "Poultry",
        dietTags: [],
      });

      // Optionally refresh list
      try {
        const res2 = await fetch(`${API_BASE_URL}/api/recipe/all/recipes`, { credentials: "include" });
        const data2 = await res2.json();
        setRecipes(Array.isArray(data2) ? data2 : []);
      } catch {}
    } catch (err) {
      console.error(err);
      alert("❌ Failed to submit recipe");
    } finally {
      setSubmitting(false);
    }
  };

  // --- Clear all filters ---
  const clearFilters = () => {
    setSelectedOrigin("all");
    setSelectedDifficulty("all");
    setSelectedPrepTime("all");
    setSelectedCookTime("all");
    setSelectedType("all");
    setDietFilters([]);
    setSearchQuery("");
    setPage(1);
  };

  // --- Apply filters ---
  const filtered = useMemo(() => {
    const q = toLower(searchQuery);
    return recipes.filter((r) => {
      const name = toLower(r.name || "");
      const origin = toLower(r.origin || "");
      const diff = toLower(r.difficulty || "");
      const type = toLower(r.foodType || "");
      const prep = timeToMinutes(r.prepTime);
      const cook = timeToMinutes(r.cookTime);
      const tags = Array.isArray(r.dietTags) ? r.dietTags.map(toLower) : [];

      // search text
      const matchesSearch =
        !q ||
        name.includes(q) ||
        origin.includes(q) ||
        toLower(r.description || "").includes(q);

      // origin filter
      const matchesOrigin =
        selectedOrigin === "all" || origin === toLower(selectedOrigin);

      // difficulty
      const matchesDiff =
        selectedDifficulty === "all" || diff === toLower(selectedDifficulty);

      // type
      const matchesType =
        selectedType === "all" || type === toLower(selectedType);

      // prep time bucket
      const prepOk =
        selectedPrepTime === "all"
          ? true
          : selectedPrepTime === "<=15"
          ? prep <= 15
          : selectedPrepTime === "<=30"
          ? prep <= 30
          : selectedPrepTime === "<=60"
          ? prep <= 60
          : selectedPrepTime === ">60"
          ? prep > 60
          : true;

      // cook time bucket
      const cookOk =
        selectedCookTime === "all"
          ? true
          : selectedCookTime === "<=15"
          ? cook <= 15
          : selectedCookTime === "<=30"
          ? cook <= 30
          : selectedCookTime === "<=60"
          ? cook <= 60
          : selectedCookTime === ">60"
          ? cook > 60
          : true;

      // diet tags (AND of all selected filters)
      const dietOk =
        dietFilters.length === 0 ||
        dietFilters.every((f) => tags.includes(toLower(f)));

      return (
        matchesSearch &&
        matchesOrigin &&
        matchesDiff &&
        matchesType &&
        prepOk &&
        cookOk &&
        dietOk
      );
    });
  }, [
    recipes,
    searchQuery,
    selectedOrigin,
    selectedDifficulty,
    selectedType,
    selectedPrepTime,
    selectedCookTime,
    dietFilters,
  ]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE) || 1;
  const current = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  if (loading) return <div>Loading recipes...</div>;

  return (
    <div className="recipes-page">
      <Header />

      {/* ✅ Login Prompt Modal appears when guest tries to add recipe */}
      {showLoginModal && (
        <LoginPromptModal
          show={true}
          message="Please log in or register to share your recipe."
          onClose={() => setShowLoginModal(false)}
          onLogin={() => navigate("/loginregister")}
        />
      )}

      {/* ====== HEADER SECTION ====== */}
      <div className="rp-header">
        <h1 className="rp-title">Traditional Recipes</h1>
        <p className="rp-sub">Authentic Sarawakian recipes with cultural stories</p>
      </div>

      {/* ====== FILTER BAR TOGGLER ====== */}
      <div className="rp-toolbar">
        <div className="rp-search">
          <input
            type="text"
            placeholder="Search recipes, origins, stories…"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <button
          className="rp-filter-toggle"
          onClick={() => setShowFilters((s) => !s)}
          aria-expanded={showFilters ? "true" : "false"}
        >
          <Sliders size={18} style={{ marginRight: 6 }} />
          Filters
        </button>
        {(selectedOrigin !== "all" ||
          selectedDifficulty !== "all" ||
          selectedType !== "all" ||
          selectedPrepTime !== "all" ||
          selectedCookTime !== "all" ||
          dietFilters.length > 0 ||
          searchQuery) && (
          <button className="rp-clear" onClick={clearFilters} title="Clear all">
            <X size={16} /> Clear
          </button>
        )}
      </div>
      {/* ====== FILTERS PANEL ====== */}
      {showFilters && (
        <div className="rp-filters">
          <div className="rp-filter-row">
            <div className="rp-filter">
              <label>Origin</label>
              <select
                value={selectedOrigin}
                onChange={(e) => {
                  setSelectedOrigin(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All</option>
                <option value="sarawak">Sarawak</option>
                <option value="sabah">Sabah</option>
                <option value="penang">Penang</option>
                <option value="melaka">Melaka</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="rp-filter">
              <label>Difficulty</label>
              <select
                value={selectedDifficulty}
                onChange={(e) => {
                  setSelectedDifficulty(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div className="rp-filter">
              <label>Prep Time</label>
              <select
                value={selectedPrepTime}
                onChange={(e) => {
                  setSelectedPrepTime(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All</option>
                <option value="<=15">≤ 15 min</option>
                <option value="<=30">≤ 30 min</option>
                <option value="<=60">≤ 60 min</option>
                <option value=">60">&gt; 60 min</option>
              </select>
            </div>

            <div className="rp-filter">
              <label>Cook Time</label>
              <select
                value={selectedCookTime}
                onChange={(e) => {
                  setSelectedCookTime(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All</option>
                <option value="<=15">≤ 15 min</option>
                <option value="<=30">≤ 30 min</option>
                <option value="<=60">≤ 60 min</option>
                <option value=">60">&gt; 60 min</option>
              </select>
            </div>

            <div className="rp-filter">
              <label>Type</label>
              <select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All</option>
                <option value="poultry">Poultry</option>
                <option value="seafood">Seafood</option>
                <option value="beef">Beef</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="vegan">Vegan</option>
                <option value="dessert">Dessert</option>
              </select>
            </div>
          </div>

          <div className="rp-filter-row">
            <div className="rp-filter rp-diet">
              <label>Diet</label>
              <div className="rp-diet-tags">
                {["Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free", "Halal"].map((t) => {
                  const active = dietFilters.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      className={`diet-tag ${active ? "active" : ""}`}
                      onClick={() => {
                        const next = active
                          ? dietFilters.filter((x) => x !== t)
                          : [...dietFilters, t];
                        setDietFilters(next);
                        setPage(1);
                      }}
                    >
                      {t} {active && <X size={14} />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====== ADD RECIPE SECTION ====== */}
      <section className={`rp-card ${expanded ? "is-open" : ""}`}>
        <div className="rp-card-head">
          <div className="rp-card-head-left">
            <h3>Share Your Recipe</h3>
            <p>Every dish tells a story. Share yours!</p>
          </div>

          {!expanded && (
            <button className="share-btn" onClick={handleExpand} title="Add Recipe">
              <Filter size={16} style={{ marginRight: 6 }} />
              Add Recipe
            </button>
          )}
        </div>

        {/* ✅ Form only visible for logged-in users; guests see modal instead */}
        {expanded && !isGuest && (
          <form className="rp-form" onSubmit={addRecipe}>
            {/* Row: Name + Origin */}
            <div className="rp-form-row">
              <div className="rp-form-field">
                <label>Recipe Name<span className="req">*</span></label>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g., Ayam Pansuh"
                  value={form.name}
                  onChange={onChangeForm}
                  required
                />
              </div>

              <div className="rp-form-field">
                <label>Origin<span className="req">*</span></label>
                <input
                  type="text"
                  name="origin"
                  placeholder="e.g., Sarawak"
                  value={form.origin}
                  onChange={onChangeForm}
                  required
                />
              </div>
            </div>

            {/* Row: Difficulty + Food Type */}
            <div className="rp-form-row">
              <div className="rp-form-field">
                <label>Difficulty</label>
                <select
                  name="difficulty"
                  value={form.difficulty}
                  onChange={onChangeForm}
                >
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
                </select>
              </div>

              <div className="rp-form-field">
                <label>Food Type</label>
                <select
                  name="foodType"
                  value={form.foodType}
                  onChange={onChangeForm}
                >
                  <option>Poultry</option>
                  <option>Seafood</option>
                  <option>Beef</option>
                  <option>Vegetarian</option>
                  <option>Vegan</option>
                  <option>Dessert</option>
                </select>
              </div>
            </div>

            {/* Row: Prep + Cook + Servings */}
            <div className="rp-form-row">
              <div className="rp-form-field">
                <label>Prep Time (min / 1h 20m)</label>
                <input
                  type="text"
                  name="prepTime"
                  placeholder="e.g., 20m"
                  value={form.prepTime}
                  onChange={onChangeForm}
                />
              </div>

              <div className="rp-form-field">
                <label>Cook Time (min / 1h 20m)</label>
                <input
                  type="text"
                  name="cookTime"
                  placeholder="e.g., 45m"
                  value={form.cookTime}
                  onChange={onChangeForm}
                />
              </div>

              <div className="rp-form-field">
                <label>Servings</label>
                <input
                  type="number"
                  min="1"
                  name="servings"
                  placeholder="e.g., 4"
                  value={form.servings}
                  onChange={onChangeForm}
                />
              </div>
            </div>

            {/* Row: Diet Tags */}
            <div className="rp-form-row">
              <div className="rp-form-field">
                <label>Diet Tags</label>
                <div className="rp-diet-tags">
                  {["Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free", "Halal"].map((t) => {
                    const active = form.dietTags.includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        className={`diet-tag ${active ? "active" : ""}`}
                        onClick={() => onToggleDietTag(t)}
                      >
                        {t} {active && <X size={14} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Row: Image Upload */}
            <div className="rp-form-row">
              <div className="rp-form-field">
                <label>Cover Image</label>
                <label className="upload-image">
                  <FaCamera /> Upload Image
                  <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
                </label>
                {form.imageData && (
                  <div className="rp-image-preview">
                    <img src={form.imageData} alt="preview" />
                  </div>
                )}
              </div>
            </div>

            {/* Row: Description */}
            <div className="rp-form-row">
              <div className="rp-form-field">
                <label>Description</label>
                <textarea
                  name="description"
                  placeholder="Describe your recipe, taste, aroma, cultural story..."
                  value={form.description}
                  onChange={onChangeForm}
                  rows={4}
                />
              </div>
            </div>

            {/* Row: Ingredients */}
            <div className="rp-form-row">
              <div className="rp-form-field">
                <label>Ingredients (one per line)</label>
                <textarea
                  name="ingredients"
                  placeholder={`e.g.\n• 500g chicken\n• 2 stalks lemongrass\n• 1 tbsp salt`}
                  value={form.ingredients}
                  onChange={onChangeForm}
                  rows={6}
                />
              </div>
            </div>

            {/* Row: Instructions */}
            <div className="rp-form-row">
              <div className="rp-form-field">
                <label>Instructions (steps)</label>
                <textarea
                  name="instructions"
                  placeholder={`e.g.\n1) Marinate chicken...\n2) Prepare bamboo...\n3) Cook over charcoal...`}
                  value={form.instructions}
                  onChange={onChangeForm}
                  rows={8}
                />
              </div>
            </div>

            {/* Row: Fun Fact + Chef Tips */}
            <div className="rp-form-row">
              <div className="rp-form-field">
                <label>Fun Fact</label>
                <textarea
                  name="funFact"
                  placeholder="Share a cultural or historical fact about this dish!"
                  value={form.funFact}
                  onChange={onChangeForm}
                  rows={3}
                />
              </div>
              <div className="rp-form-field">
                <label>Chef Tips</label>
                <textarea
                  name="chefTips"
                  placeholder="Any pro tips for perfect results?"
                  value={form.chefTips}
                  onChange={onChangeForm}
                  rows={3}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="rp-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setExpanded(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Recipe"}
              </button>
            </div>
          </form>
        )}
      </section>
      {/* ====== RECIPE GRID ====== */}
      {current.length === 0 ? (
        <p className="rp-empty">No recipes found.</p>
      ) : (
        <div className="rp-grid">
          {current.map((recipe) => {
            const img = recipe.image || recipe.imageData || recipe.coverImage;
            return (
              <div
                className="efp-food-card"
                key={recipe.id || recipe.recipeID || `${recipe.name}-${recipe.origin}-${Math.random()}`}
                onClick={() => navigate(`/recipes/${recipe.id || recipe.recipeID || ""}`)}
                role="button"
                tabIndex={0}
              >
                <div className="efp-food-thumb">
                  {img ? (
                    <img src={img} alt={recipe.name} />
                  ) : (
                    <div className="efp-food-thumb--placeholder">No image</div>
                  )}
                </div>
                <div className="efp-food-meta">
                  <h3 className="efp-food-title">{recipe.name}</h3>
                  <div className="efp-food-sub">
                    <span className="badge">{recipe.origin || "—"}</span>
                    <span className="badge">{recipe.difficulty || "—"}</span>
                    {recipe.foodType && <span className="badge">{recipe.foodType}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ====== PAGINATION ====== */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="page-btn"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </button>
          <span className="page-info">
            Page {page} of {totalPages}
          </span>
          <button
            className="page-btn"
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      )}

      <Footer />
    </div>
  );
}
