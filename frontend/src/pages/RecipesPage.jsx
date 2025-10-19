import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../css/RecipesPage.css";
import { FaCamera } from "react-icons/fa";
import { Filter, Sliders, X } from "lucide-react";

const PER_PAGE = 9;

export default function RecipesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialQ = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(initialQ);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add this after your recipes state
useEffect(() => {
  console.log('Recipes data:', recipes);
  if (recipes && recipes.length > 0) {
    console.log('First recipe structure:', recipes[0]);
    console.log('Recipe IDs:', recipes.map(r => r?.id || r?.foodID || 'no-id'));
  }
}, [recipes]);

  useEffect(() => {
    setSearchQuery(searchParams.get("q") || "");
  }, [searchParams]);

  // Fetch recipes from backend
  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
        console.log('Fetching from:', `${API_BASE_URL}/api/recipe/all/recipes`);
        
        const res = await fetch(`${API_BASE_URL}/api/recipe/all/recipes`);
        
        console.log('Response status:', res.status);
      console.log('Response ok:', res.ok);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Response error:', errorText);
        throw new Error(`Failed to fetch recipes: ${res.status} ${errorText}`);
      }
      
      const data = await res.json();
      console.log('Received data:', data);
      console.log('Data type:', typeof data);
      console.log('Data length:', Array.isArray(data) ? data.length : 'Not array');
      
      if (Array.isArray(data) && data.length > 0) {
        console.log('First item structure:', data[0]);
      }
        setRecipes(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching recipes:', err);
        setLoading(false);
      }
    };

    fetchRecipes();
  }, []);

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

  // derive unique origins
  const origins = useMemo(() => {
    const set = new Set(recipes.map(r => r.origin).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [recipes]);

  // Filtered list
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

  // Updated addRecipe to send to backend
  const addRecipe = async (e) => {
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
        .map(v => v.toLowerCase().replace(/\s+/g, "-"));

    const customTags = form.otherDietEnabled ? parseCustom(form.otherDietText) : [];
    const dedup = (arr) => Array.from(new Set(arr));

    const finalFoodType =
      form.foodType === "__other__"
        ? (form.otherFoodText.trim() || "Other")
        : form.foodType;

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const res = await fetch(`${API_BASE_URL}/api/recipe/create/recipes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name,
          origin: origin,
          difficulty: form.difficulty,
          prepTime: Number(form.prepTime),
          cookTime: Number(form.cookTime),
          servings: Number(form.servings),
          image: form.imageData,
          description: form.description.trim(),
          foodType: finalFoodType,
          dietaryTags: dedup([...(form.dietaryTags || []), ...customTags]),
          ingredients: toLines(form.ingredients).join('\n'),
          instructions: toLines(form.instructions).join('\n'),
          funFact: form.funFact.trim(),
          chefTips: form.chefTips.trim(),
        }),
      });

      if (!res.ok) throw new Error('Failed to create recipe');

      // Refresh the recipes list
      const refreshRes = await fetch(`${API_BASE_URL}/api/all/recipes`);
      const allRecipes = await refreshRes.json();
      setRecipes(allRecipes);
      
      // Reset form
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
      
      alert('Recipe created successfully!');
      
    } catch (err) {
      console.error('Error creating recipe:', err);
      alert('Failed to create recipe. Please try again.');
    }
  };

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

 // if (loading) return <div className="loading">Loading recipes...</div>;

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
                <textarea name="description" className="rp-desc" value={form.description} onChange={onChangeForm} placeholder="A short description about the dish" required/>
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
            <div className="efp-grid-2">
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
        <p className="efp-results-count">{filtered.length} recipes found</p>

        {dietFilters.length > 0 && (
          <div className="efp-active-filters" aria-label="Active dietary filters">
            {dietFilters.map((tag) => (
              <button
                key={tag}
                type="button"
                className="efp-chip efp-chip--removable"
                onClick={() => setDietFilters(prev => prev.filter(t => t !== tag))}
                aria-label={`Remove ${tag.replace("-", " ")}`}
                title={`Remove ${tag.replace("-", " ")}`}
              >
                <span>{tag.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase())}</span>
                <X size={14} aria-hidden="true" />
              </button>
            ))}
          </div>
        )}
      </div>

      
<div className="rp-grid">
  {current.map((r, index) => {
    // Debug the recipe object
    console.log('Recipe data:', r);
    
    // Ensure we have a proper recipe object with an id
    if (!r || typeof r !== 'object') {
      console.warn('Invalid recipe data:', r);
      return null;
    }

    const recipeId = r.id || r.foodID || index;
    const recipeName = r.name || 'Unknown Recipe';
    const recipeImage = r.image || 'https://via.placeholder.com/300x200?text=No+Image';
    const recipeDescription = r.description || 'No description available';
    const recipeOrigin = r.origin || 'Unknown Origin';
    const recipeFoodType = r.foodType || r.category || 'Other';
    const recipeDifficulty = r.difficulty || 'Easy';
    const recipePrepTime = r.prepTime || 0;
    const recipeCookTime = r.cookTime || 0;
    const recipeServings = r.servings || 0;
    const recipeDietaryTags = Array.isArray(r.dietaryTags) ? r.dietaryTags : [];

    // Map difficulty to EFP badge colors
    const diff = (recipeDifficulty || "").toLowerCase();
    const diffClass =
      diff === "easy" ? "efp-badge efp-badge--ok"
      : diff === "medium" ? "efp-badge efp-badge--warn"
      : "efp-badge efp-badge--high";

    return (
      <div
        key={`recipe-${recipeId}-${index}`} // Unique key
        className="efp-food-card"
      >
        <div className="efp-food-media">
          <img
            src={recipeImage}
            alt={recipeName}
            className="efp-image"
            loading="lazy"
            onError={(e) => {
              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
            }}
          />
          <div className="efp-badges">
            <span className={diffClass}>{recipeDifficulty}</span>
          </div>
          {/* Optional corner badge */}
          {recipeDietaryTags.includes("vegetarian") && (
            <span className="efp-badge-topright">V</span>
          )}
        </div>

        <div className="efp-food-body">
          <div className="efp-food-headline">
            <h3 className="efp-food-title">{recipeName}</h3>
            <span className="efp-badge-cat">{recipeFoodType}</span>
          </div>

          <p className="efp-desc">{recipeDescription}</p>

          <div className="efp-meta">
            <span className="muted">Origin: {recipeOrigin}</span>
          </div>

          <div className="efp-nutri">
            <div className="efp-nutri-item">
              <div>{recipePrepTime}m</div>
              <div className="muted">Prep Time</div>
            </div>
            <div className="efp-nutri-item">
              <div>{recipeCookTime}m</div>
              <div className="muted">Cook Time</div>
            </div>
            <div className="efp-nutri-item">
              <div>{recipeServings}</div>
              <div className="muted">Servings</div>
            </div>
          </div>

          {/* Dietary tags row */}
          {recipeDietaryTags.length > 0 && (
            <div className="efp-tags" aria-label={`${recipeName} dietary tags`}>
              {recipeDietaryTags.map((tag, tagIndex) => (
                <button
                  key={`${recipeId}-tag-${tagIndex}`}
                  type="button"
                  className="efp-tag"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDietFilters((prev) =>
                      prev.includes(tag) ? prev : [...prev, tag]
                    );
                  }}
                  title={`Filter by ${tag}`}
                >
                  {tag.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </button>
              ))}
            </div>
          )}

          <button
            className="efp-card-cta"
            onClick={() => navigate(`/recipes/${recipeId}`)} 
          >
            View Recipe
          </button>
        </div>
      </div>
    );
  })}
</div>

      {filtered.length === 0 && (
        <div className="rp-empty">
          <p>No recipes match your search.</p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="efp-pagination">
          <button
            className="efp-btn"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            ‹ Prev
          </button>

          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              className={`efp-btn ${
                page === i + 1 ? "is-active" : ""
              }`}
              onClick={() => setPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}

          <button
            className="efp-btn"
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            Next ›
          </button>
        </div>
      )}
      <Footer />
    </div>
  );
}