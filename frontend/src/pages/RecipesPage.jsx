import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../css/RecipesPage.css";
import { FaCamera } from "react-icons/fa";
import { Filter, Sliders, X } from "lucide-react";

// Seed data (you can replace with API later)
const SEED = [
  {
    id: 1,
    name: "Manok Pansoh",
    category: "Dessert",
    origin: "Iban",
    difficulty: "Medium",
    prepTime: 30,
    cookTime: 150,
    servings: 4,
    image: "https://images.unsplash.com/photo-1643185720431-9c050eebbc9a",
    description: "Traditional Iban chicken cooked in bamboo with herbs.",
    dietaryTags: ["paleo","nut-free"]
  },
  {
    id: 2,
    name: "Umai",
    category: "Poultry",
    origin: "Melanau",
    difficulty: "Easy",
    prepTime: 20,
    cookTime: 0,
    servings: 4,
    image: "https://images.unsplash.com/photo-1612755657417-9c6885e5ece9",
    description: "Fresh fish salad marinated with lime, onions and chilies.",
    dietaryTags: ["dairy-free","gluten-free"]
  },
];

const LS_KEY = "recipes_data_v1";
const PER_PAGE = 9;

export default function RecipesPage() {
  const navigate = useNavigate();

  // Load + persist
  const [recipes, setRecipes] = useState(() => {
    const fromLS = localStorage.getItem(LS_KEY);
    const raw = fromLS ? (() => { try { return JSON.parse(fromLS); } catch { return SEED; } })() : SEED;
    return raw.map(r => ({
      ...r,
      foodType: r.foodType || r.category || "Other",
    }));
  });
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(recipes));
  }, [recipes]);

  // Form state (add new)
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

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrigin, setSelectedOrigin] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedType, setSelectedType] = useState("all");
  const [selectedPrepTime, setSelectedPrepTime] = useState("all");
  const [selectedCookTime, setSelectedCookTime] = useState("all");
  const [dietFilters, setDietFilters] = useState([]);

  const inBucket = (minutes, bucket) => {
    const m = Number(minutes) || 0;
    if (bucket === "all") return true;
    if (bucket === "under30")  return m <= 30;
    if (bucket === "under120") return m <= 120;
    if (bucket === "over120")  return m > 120;
    return true;
  };

  // derive unique origins (reuse your existing logic)
  const origins = useMemo(() => {
    const set = new Set(recipes.map(r => r.origin).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [recipes]);

  // Filtered list (replaces your current `filtered`)
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return recipes.filter(r => {
      const name = (r.name || "").toLowerCase();
      const origin = (r.origin || "").toLowerCase();
      const desc = (r.description || "").toLowerCase();

      const matchSearch = !q || name.includes(q) || origin.includes(q) || desc.includes(q);
      const matchOrigin = selectedOrigin === "all" || r.origin === selectedOrigin;
      const matchDifficulty = selectedDifficulty === "all" || r.difficulty === selectedDifficulty;

      const pt = Number(r.prepTime) || 0;
      const ct = Number(r.cookTime) || 0;
      const matchPrepBucket = inBucket(pt, selectedPrepTime);
      const matchCookBucket = inBucket(ct, selectedCookTime);
      
      const matchFoodType = selectedType === "all" || r.foodType === selectedType;
      
      const tags = Array.isArray(r.dietaryTags) ? r.dietaryTags : [];
      const matchDiet = dietFilters.length === 0 || dietFilters.every(t => tags.includes(t));

      return (
        matchSearch &&
        matchOrigin &&
        matchDifficulty &&
        matchPrepBucket &&
        matchCookBucket &&
        matchFoodType &&
        matchDiet
      );
    });
  }, [recipes, searchQuery, selectedOrigin, selectedDifficulty, selectedPrepTime, selectedCookTime, selectedType, dietFilters]);

  // Reset page if filters or data change
  useEffect(() => {
    setPage(1);
  }, [recipes.length, searchQuery, selectedOrigin, selectedDifficulty, selectedPrepTime, selectedCookTime, selectedType, dietFilters.join(",")]);

  // Clear button
  const clearAll = () => {
    setSearchQuery("");
    setSelectedOrigin("all");
    setSelectedDifficulty("all");
    setSelectedPrepTime("all");
    setSelectedCookTime("all");
    setSelectedType("all");
    setDietFilters([]);
  };

  // Pagination
  const [page, setPage] = useState(1);

  // Pagination slice
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const startIndex = (page - 1) * PER_PAGE;
  const current = filtered.slice(startIndex, startIndex + PER_PAGE);

  function onChangeForm(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  function addRecipe(e) {
    e.preventDefault();
    const name = form.name.trim();
    const origin = form.origin.trim();
    if (!name || !origin) return alert("Please fill at least Name and Origin.");

    const toLines = (s) =>
      s.split(/\r?\n/).map(x => x.trim()).filter(Boolean);

    const parseCustom = (s) =>
      s.split(/[,;\n]+/)
        .map(v => v.trim())
        .filter(Boolean)
        .map(v => v.toLowerCase().replace(/\s+/g, "-")); // e.g. "Low Sugar" -> "low-sugar"

    const customTags = form.otherDietEnabled ? parseCustom(form.otherDietText) : [];
    const dedup = (arr) => Array.from(new Set(arr));

    const finalFoodType =
      form.foodType === "__other__"
        ? (form.otherFoodText.trim() || "Other")
        : form.foodType;

    const newItem = {
      id: Date.now(),
      name,
      origin,
      difficulty: form.difficulty,
      prepTime: Number(form.prepTime),
      cookTime: Number(form.cookTime),
      servings: Number(form.servings),
      image: form.imageData,
      description: form.description.trim(),
      ingredients: toLines(form.ingredients),
      instructions: toLines(form.instructions),
      funFact: form.funFact.trim(),
      chefTips: form.chefTips.trim(),
      dietaryTags: dedup([...(form.dietaryTags || []), ...customTags]),
      foodType: finalFoodType, 
    };

    setRecipes(prev => [newItem, ...prev]);
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
    setExpanded(false);
  }

  function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setForm(prev => ({ ...prev, imageData: reader.result })); // base64
    };
    reader.readAsDataURL(file);
  }

  // checkboxes
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
  setForm(prev => {
    const has = prev.dietaryTags.includes(tag);
    return {
      ...prev,
      dietaryTags: has
        ? prev.dietaryTags.filter(t => t !== tag)
        : [...prev.dietaryTags, tag],
    };
  });
}

  return (
    <div className="recipes-page">
      <Header />
      <div className="rp-header">
        <h1 className="rp-title">Traditional Recipes</h1>
        <p className="rp-sub">Authentic Sarawakian recipes with cultural stories</p>
      </div>

      {/* Add form (expandable) */}
      <section className={`rp-card ${expanded ? "is-open" : ""}`}>
        <div className="rp-card-head">
          <h3>Share Your Recipe</h3>
          <p>Every dish tells a story. Share yours with the world!</p>
          {!expanded && (
            <button className="share-btn" onClick={() => setExpanded(true)}>Add Recipe</button>
          )}
        </div>

        {expanded && (
          <form className="rp-form" onSubmit={addRecipe}>
            <div className="rp-grid-2">
              <div className="rp-field">
                <label>Name *</label>
                <input name="name" value={form.name} onChange={onChangeForm} placeholder="e.g., Manok Pansoh" required />
              </div>
              <div className="rp-field">
                <label>Origin *</label>
                <input name="origin" value={form.origin} onChange={onChangeForm} placeholder="e.g., Iban, Melanau…" required/>
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
                <input type="number" name="prepTime" value={form.prepTime} onChange={onChangeForm} required/>
              </div>
              <div className="rp-field">
                <label>Cook Time (min) *</label>
                <input type="number" name="cookTime" value={form.cookTime} onChange={onChangeForm} required/>
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
                    "Poultry",
                    "Seafood",
                    "Vegetables",
                    "Fermented",
                    "Dessert",
                    "Rice Dish",
                    "Noodles",
                    "Soup",
                    "Meat",
                  ].map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                  <option value="__other__">Other…</option>
                </select>
              </div>

              {/* Only show when Other is selected */}
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
              <div className="rp-field">
                <label>Description *</label>
                <textarea name="description" value={form.description} onChange={onChangeForm} placeholder="A short description about the dish" required/>
              </div>
                <div className="rp-field">
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
                    required
                  />
                </div>
              </div>

            <div className="rp-field">
              <label>Servings *</label>
              <input type="number" name="servings" value={form.servings} onChange={onChangeForm} required/>
            </div>
            {/* ingredients + instructions */}
            <div className="rp-grid-2">
              <div className="rp-field">
                <label>Ingredients *</label>
                <textarea
                  name="ingredients"
                  value={form.ingredients}
                  onChange={onChangeForm}
                  placeholder={"One per line, e.g.\n1kg chicken\n3 stalks lemongrass\n2-inch ginger"}
                  required
                />
              </div>
              <div className="rp-field">
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
                    <span>
                      {tag.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase())}
                    </span>
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

            {/* fun fact + chef tips */}
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
              <button className="rp-btn rp-submit" type="submit">Submit Recipe</button>
              <button
                className="rp-btn rp-btn-muted"
                type="button"
                onClick={() => setForm({
                  name: "", origin: "", difficulty: "Easy", prepTime: "", cookTime: "", servings: "", imageData: "", description: "", ingredients: "", instructions: "", funFact: "", chefTips: "", dietaryTags: [], otherDietEnabled: false, otherDietText: "", foodType: "Poultry", otherFoodEnabled: false, otherFoodText: "", 
                })}
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

      {/* Search + Filters */}
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
              <Sliders size={18} aria-hidden="true" />
              Filters
            </button>
            <button type="button" className="efp-btn" onClick={clearAll}>
              <X size={18} aria-hidden="true" />
              Clear All
            </button>
          </div>
        </div>
        {/* Dietary chips row */}
        <div className="rp-tags-row" aria-label="Food type filters">
          {["all","Poultry","Seafood","Vegetables","Fermented","Dessert",
            "Rice Dish","Noodles","Soup","Meat","Other"].map((ft) => {
            const isActive = selectedType === ft;
            return (
              <button
                key={ft}
                type="button"
                className={`efp-chip ${isActive ? "is-active" : ""}`}
                title={ft === "all" ? "Show all types" : `Filter by ${ft}`}
                onClick={() => setSelectedType(ft)}
              >
                {ft === "all" ? "All Categories" : ft}
              </button>
            );
          })}
        </div>
      </div>

      {showFilters && (
        <div className="rp-filter-card efp-card efp-filters-card" role="region" aria-label="Filters">
          <div className="efp-filters">
            <div className="efp-filters-header">
              <Filter className="efp-filter-icon" size={18} aria-hidden="true" />
              <h2 id="filters-heading" className="efp-filters-title">Filter</h2>
            </div>
            {/* Row 1: Origin + Difficulty */}
            <div className="efp-grid-3">
              <div className="efp-filter-item">
                <label className="efp-label">Cultural Origin</label>
                <select
                  value={selectedOrigin}
                  onChange={(e) => setSelectedOrigin(e.target.value)}
                  className="efp-select"
                >
                  {origins.map(o => (
                    <option key={o} value={o}>
                      {o === "all" ? "All Origins" : o}
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
                  <option value="all">All Difficulties</option>
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
                </select>
              </div>
            </div>

            <hr className="efp-sep" />

            {/* Row 2: Prep Time + Cook Time dropdowns */}
            <div className="efp-grid-2">
              <div className="efp-filter-item">
                <label className="efp-label">Prep Time</label>
                <select
                  className="efp-select"
                  value={selectedPrepTime}
                  onChange={(e) => setSelectedPrepTime(e.target.value)}
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
                  className="efp-select"
                  value={selectedCookTime}
                  onChange={(e) => setSelectedCookTime(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  <option value="under30">Under 30 minutes</option>
                  <option value="under120">Under 2 hours</option>
                  <option value="over120">Over 2 hours</option>
                </select>
              </div>
            </div>

            <hr className="efp-sep" />

            {/* Row 3: Dietary Preferences checkboxes */}
            <div>
              <label className="efp-label">Dietary Preferences</label>
              <div className="efp-checkbox-grid">
                {DIET_OPTIONS.map(tag => {
                  const checked = dietFilters.includes(tag);
                  return (
                    <label key={tag} className="efp-checkbox-item">
                      <input
                        type="checkbox"
                        className="efp-checkbox"
                        checked={checked}
                        onChange={() =>
                          setDietFilters(prev =>
                            checked ? prev.filter(t => t !== tag) : [...prev, tag]
                          )
                        }
                      />
                      <span className="efp-checkbox-text">
                        {tag.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase())}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="rp-results-head">
        <span>{filtered.length} recipes found</span>
      </div>

      <section className="rp-grid">
        {current.map(r => (
          <div key={r.id} className="rp-card rp-recipe-card">
            <div className="rp-thumb">
              <img src={r.image} alt={r.name} />
              <span className={`rp-badge ${r.difficulty.toLowerCase()}`}>{r.difficulty}</span>
            </div>
            <div className="rp-recipe-body">
              <h3 className="rp-recipe-title">{r.name}</h3>
              <p className="rp-recipe-meta">{r.foodType} • Origin: {r.origin} • Prep {r.prepTime}m • Cook {r.cookTime}m • 👥 {r.servings}</p>
              <p className="rp-recipe-desc">{r.description}</p>

              <button className="rp-btn rp-ghost" onClick={() => navigate(`/recipes/${r.id}`)}>
                View Details
              </button>
            </div>
          </div>
        ))}
      </section>

      {filtered.length === 0 && (
        <div className="rp-empty">
          <p>No recipes match your search.</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="rp-pagination">
          <button className="rp-btn rp-btn-muted" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹ Prev</button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              className={`rp-btn ${page === i + 1 ? "is-active" : ""}`}
              onClick={() => setPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          <button className="rp-btn rp-btn-muted" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next ›</button>
        </div>
      )}
      <Footer />
    </div>
  );
}
