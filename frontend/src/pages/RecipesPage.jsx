import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../css/RecipesPage.css";
import Modal from "../components/Modal";
import { FaCamera, FaTimes } from "react-icons/fa";
import { GrDocumentMissing } from "react-icons/gr";
import { PiChefHat } from "react-icons/pi";
import { Filter, Sliders, X } from "lucide-react";

// Guest detection + modal
import { useAuth } from "../context/AuthContext";
import LoginPromptModal from "../components/LoginPromptModal";

const PER_PAGE = 9;

export default function RecipesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Guest detection
  const { user } = useAuth();
  const isGuest = !user || user.role === "guest";
  const [showLoginModal, setShowLoginModal] = useState(false);

  const initialQ = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(initialQ);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const norm = (s) => String(s ?? "").toLowerCase().trim();
  const tokenize = (s) => norm(s).split(/\s+/).filter(Boolean);

  // CSRF
  const [csrfToken, setCsrfToken] = useState("");

  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const res = await fetch(`${API_BASE_URL}/api/csrf-token`, { credentials: "include" });
        const data = await res.json();
        setCsrfToken(data.csrfToken);
      } catch (err) {
        console.error("Failed to fetch CSRF token", err);
      }
    };
    fetchCsrfToken();
  }, []);

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

  // Fetch recipes (Logs Restored)
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

  useEffect(() => {
    fetchRecipes();
  }, []);

  // Form state
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

  // Filter Logic
  const origins = useMemo(() => {
    const set = new Set(recipes.map(r => r.origin).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [recipes]);

  const filtered = useMemo(() => {
    const terms = tokenize(searchQuery);

    return recipes.filter((r) => {
      const haystack = [
        r.name, r.origin, r.foodType, r.description, r.ingredients, r.instructions,
        Array.isArray(r.dietaryTags) ? r.dietaryTags.join(" ") : r.dietaryTags, r.difficulty
      ].map(norm).join(" ");

      const matchSearch = terms.length === 0 || terms.every(t => haystack.includes(t));
      const originNorm = norm(r.origin);
      const diffNorm = norm(r.difficulty);
      const foodTypeNorm = norm(r.foodType);

      const matchOrigin = selectedOrigin === "all" || originNorm === norm(selectedOrigin);
      const matchDifficulty = selectedDifficulty === "all" || diffNorm === norm(selectedDifficulty);
      const matchFoodType = selectedType === "all" || foodTypeNorm === norm(selectedType);

      const pt = Number(r.prepTime) || 0;
      const ct = Number(r.cookTime) || 0;

      const inBucket = (minutes, bucket) => {
        const m = Number(minutes) || 0;
        if (bucket === "all") return true;
        if (bucket === "under30")  return m <= 30;
        if (bucket === "under120") return m <= 120;
        if (bucket === "over120")  return m > 120;
        return true;
      };

      const matchPrepBucket = inBucket(pt, selectedPrepTime);
      const matchCookBucket = inBucket(ct, selectedCookTime);

      const tags = Array.isArray(r.dietaryTags) ? r.dietaryTags.map(norm) : [];
      const matchDiet = dietFilters.length === 0 || dietFilters.every(t => tags.includes(norm(t)));

      return (
        matchSearch && matchOrigin && matchDifficulty &&
        matchPrepBucket && matchCookBucket && matchFoodType && matchDiet
      );
    });
  }, [recipes, searchQuery, selectedOrigin, selectedDifficulty, selectedPrepTime, selectedCookTime, selectedType, dietFilters]);

  useEffect(() => {
    setPage(1);
  }, [recipes.length, searchQuery, selectedOrigin, selectedDifficulty, selectedPrepTime, selectedCookTime, selectedType, dietFilters.join(",")]);

  const clearAll = () => {
    setSearchQuery("");
    setSelectedOrigin("all");
    setSelectedDifficulty("all");
    setSelectedPrepTime("all");
    setSelectedCookTime("all");
    setSelectedType("all");
    setDietFilters([]);
  };

  const [info, setInfo] = useState({
    open: false,
    title: "",
    body: "",
    icon: null,
    confirmText: "OK",
    onPrimary: null, 
    secondaryText: null, 
    onSecondary: null 
  });

  const showInfo = (opts) =>
    setInfo({ 
      open: true, 
      title: "", 
      body: "", 
      confirmText: "OK", 
      icon: null, 
      onPrimary: null,
      secondaryText: null,
      onSecondary: null,
      ...opts 
    });

  const closeInfo = () => setInfo((s) => ({ ...s, open: false }));

  // Pagination
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const startIndex = (page - 1) * PER_PAGE;
  const current = filtered.slice(startIndex, startIndex + PER_PAGE);

  function onChangeForm(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  const handleExpand = () => {
    if (isGuest) {
      setShowLoginModal(true);
      return;
    }
    setExpanded(true);
  };

  const addRecipe = async (e) => {
    e.preventDefault();

    if (isGuest) {
      setShowLoginModal(true);
      return;
    }

    setIsSubmitting(true);

    const name = form.name.trim();
    const origin = form.origin.trim();
    if (!name || !origin) {
      showInfo({
        title: "Missing Required Fields",
        body: "Please fill at least Name and Origin to continue.",
        icon: <GrDocumentMissing />,
      });
      setIsSubmitting(false);
      return;
    }

    const parseCustom = (s) =>
      s.split(/[,;\n]+/).map(v => v.trim()).filter(Boolean).map(v => v.toLowerCase().replace(/\s+/g, "-"));

    const customTags = form.otherDietEnabled ? parseCustom(form.otherDietText) : [];
    
    const finalFoodType =
      form.foodType === "__other__"
        ? (form.otherFoodText.trim() || "Other")
        : form.foodType;

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

      const payload = {
        name: name,
        origin: origin,
        difficulty: form.difficulty,
        prepTime: Number(form.prepTime),
        cookTime: Number(form.cookTime),
        servings: Number(form.servings),
        image: form.imageData,
        description: form.description.trim(),
        foodType: finalFoodType,
        dietaryTags: [...(form.dietaryTags || []), ...customTags],
        ingredients: form.ingredients, 
        instructions: form.instructions, 
        funFact: form.funFact.trim(),
        chefTips: form.chefTips.trim(),
      };

      const res = await fetch(`${API_BASE_URL}/api/recipe/create/recipes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error('Backend error:', errorData); 
        throw new Error(errorData.details || errorData.error || 'Failed to create recipe');
      }

      const result = await res.json();
      console.log('Recipe created:', result); 

      // Refresh list
      fetchRecipes();
      
      // Reset form
      setForm({
        name: "", origin: "", difficulty: "Easy", prepTime: "", cookTime: "", servings: "", imageData: "", description: "", ingredients: "", instructions: "", funFact: "", chefTips: "", dietaryTags: [], otherDietEnabled: false, otherDietText: "", foodType: "Poultry", otherFoodEnabled: false, otherFoodText: "",
      });
      setExpanded(false);
            
      setInfo({
        open: true,
        title: "Recipe Submitted Successfully!",
        // Educational message
        body: "Thanks for sharing! Your recipe has been sent to the Admins for approval. It is currently in Pending. You can track its progress in your Profile under the Contributions tab.",
        icon: <PiChefHat />,
        
        // Primary Action
        confirmText: "Track My Post",
        onPrimary: () => {
          closeInfo();
          if (user?.id || user?.userID) {
            const uid = user.id || user.userID;
            navigate(`/profile/${uid}?tab=status`); 
          } else {
            navigate("/profile?tab=status");
          }
        },

        // Secondary Action
        secondaryText: "Close",
        onSecondary: () => {
          closeInfo();
        }
      });

    } catch (err) {
      console.error('Error creating recipe:', err);
      showInfo({
        title: "Failed to create recipe.",
        body: "Please try again.",
        icon: <FaTimes />,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 2 * 1024 * 1024; // 2MB limit
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

    if (file.size > maxSize) {
      showInfo({ title: "Image Too Large!", body: "Please choose an image smaller than 2 MB.", icon: <FaCamera /> });
      e.target.value = ''; 
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      showInfo({ title: "Invalid image type!", body: "Please select a valid image (JPEG, JPG, PNG, or WebP).", icon: <FaCamera /> });
      e.target.value = ''; 
      return;
    }

    const formatSize = (bytes) => {
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };
    
    console.log(`✅ Image selected: ${file.name} (${formatSize(file.size)})`); 

    const reader = new FileReader();
    reader.onload = () => {
      setForm(prev => ({ ...prev, imageData: reader.result }));
    };
    reader.readAsDataURL(file);
  }

  const DIET_OPTIONS = ["vegetarian", "gluten-free", "dairy-free", "spicy", "paleo", "halal", "keto", "nut-free"];

  function toggleDiet(tag) {
    setForm(prev => {
      const has = prev.dietaryTags.includes(tag);
      return {
        ...prev,
        dietaryTags: has ? prev.dietaryTags.filter(t => t !== tag) : [...prev.dietaryTags, tag],
      };
    });
  }

  if (loading) return <div className="loading">Loading recipes...</div>;

  return (
    <div>
      <div className="recipes-page">
        <Header />

        {showLoginModal && (
          <LoginPromptModal
            message="Please log in or register to share your recipe."
            onClose={() => setShowLoginModal(false)}
            onLogin={() => navigate("/loginregister")}
          />
        )}

        {/* UPDATED MODAL: Now accepts secondary buttons and dynamic actions */}
        <Modal
          open={info.open}
          title={info.title}
          titleId="recipes-info-title"
          icon={info.icon}               
          primaryText={info.confirmText}
          secondaryText={info.secondaryText}
          onClose={closeInfo}
          onPrimary={info.onPrimary || closeInfo}
          onSecondary={info.onSecondary}
        >
          {info.body}
        </Modal>

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
              <button className="share-btn" onClick={handleExpand}>Add Recipe</button>
            )}
          </div>

          {expanded && !isGuest && (
            <form className="rp-form" onSubmit={addRecipe}>
              <div className="rp-grid-2">
                <div className="rp-field">
                  <label>Name *</label>
                  <input name="name" value={form.name} onChange={onChangeForm} placeholder="e.g., Manok Pansoh" required />
                </div>
                <div className="rp-field">
                  <label>Origin *</label>
                  <select name="origin" value={form.origin} onChange={onChangeForm} required>
                    <option value="">Select Origin</option>
                    <option value="Malay">Malay</option>
                    <option value="Chinese">Chinese</option>
                    <option value="Iban">Iban</option>
                    <option value="Melanau">Melanau</option>
                    <option value="Bidayuh">Bidayuh</option>
                    <option value="Dayak">Dayak</option>
                  </select>
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
                  <select name="foodType" value={form.foodType} onChange={(e) => {
                      const v = e.target.value;
                      if (v === "__other__") {
                        setForm(prev => ({ ...prev, foodType: v, otherFoodEnabled: true }));
                      } else {
                        setForm(prev => ({ ...prev, foodType: v, otherFoodEnabled: false, otherFoodText: "" }));
                      }
                    }}
                  >
                    {["Poultry","Seafood","Vegetables","Fermented","Dessert","Rice Dish","Noodles","Soup","Meat"].map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                    <option value="__other__">Other…</option>
                  </select>
                </div>

                {form.otherFoodEnabled && (
                  <div className="rp-field">
                    <label>Specify Food Type</label>
                    <input type="text" placeholder="e.g., Beverage, Snack" value={form.otherFoodText} onChange={(e) => setForm(prev => ({ ...prev, otherFoodText: e.target.value }))} />
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
                  <div className="upload-box" onClick={() => document.getElementById("recipe-file-input").click()} role="button" tabIndex={0}>
                    {form.imageData ? (
                      <img src={form.imageData} alt="Preview" className="preview-img" />
                    ) : (
                      <div className="upload-placeholder">
                        <FaCamera className="camera-icon" />
                        <p>Upload Photo</p>
                      </div>
                    )}
                  </div>
                  <input id="recipe-file-input" type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageUpload} required />
                </div>
              </div>

              <div className="rp-field">
                <label>Servings *</label>
                <input type="number" name="servings" value={form.servings} onChange={onChangeForm} required/>
              </div>

              <div className="rp-grid-2">
                <div className="rp-field">
                  <label>Ingredients *</label>
                  <textarea name="ingredients" value={form.ingredients} onChange={onChangeForm} placeholder={"One per line, e.g.\n1kg chicken\n3 stalks lemongrass\n2-inch ginger"} required />
                </div>
                <div className="rp-field">
                  <label>Instructions *</label>
                  <textarea name="instructions" value={form.instructions} onChange={onChangeForm} placeholder={"One step per line, e.g.\n1) Clean and cut chicken\n2) Marinate for 30 min\n3) Cook in bamboo 2-3h"} required />
                </div>
              </div>

              <div className="rp-field">
                <label>Dietary Preferences</label>
                <div className="rp-diet-grid">
                  {DIET_OPTIONS.map(tag => (
                    <label key={tag} className="rp-diet-item">
                      <input type="checkbox" checked={form.dietaryTags.includes(tag)} onChange={() => toggleDiet(tag)} />
                      <span>{tag.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase())}</span>
                    </label>
                  ))}
                </div>
                <div className="rp-diet-other">
                  <label className="rp-diet-item">
                    <input type="checkbox" checked={form.otherDietEnabled} onChange={(e) => setForm(prev => ({ ...prev, otherDietEnabled: e.target.checked }))} />
                    <span>Other</span>
                  </label>
                  {form.otherDietEnabled && (
                    <input className="rp-input rp-input--sm" type="text" placeholder="Type custom tags, comma-separated (e.g. halal, keto)" value={form.otherDietText} onChange={(e) => setForm(prev => ({ ...prev, otherDietText: e.target.value }))} />
                  )}
                </div>
              </div>

              <div className="rp-grid-2">
                <div className="rp-field">
                  <label>Fun Fact</label>
                  <textarea name="funFact" value={form.funFact} onChange={onChangeForm} placeholder="Any surprising or interesting facts?" />
                </div>
                <div className="rp-field">
                  <label>Tips</label>
                  <textarea name="chefTips" value={form.chefTips} onChange={onChangeForm} placeholder="E.g., best cut, heat control, or prep secrets…" />
                </div>
              </div>
              
              <div className="rp-actions">
                <button className="rp-btn rp-submit" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Recipe"}
                </button>
                <button className="rp-btn rp-btn-muted" type="button" onClick={() => setForm({
                  name: "", origin: "", difficulty: "Easy", prepTime: "", cookTime: "", servings: "", imageData: "", description: "", ingredients: "", instructions: "", funFact: "", chefTips: "", dietaryTags: [], otherDietEnabled: false, otherDietText: "", foodType: "Poultry", otherFoodEnabled: false, otherFoodText: "", 
                })} disabled={isSubmitting}>Clear</button>
                <button className="rp-btn rp-btn-muted" type="button" onClick={() => setExpanded(false)}>Close</button>
              </div>
            </form>
          )}
        </section>

        {/* Filters */}
        <div className="rp-filter-card efp-controls">
          <div className="efp-search-row">
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search recipes, origins, or descriptions..." className="efp-input" />
            <div className="efp-btn-group">
              <button type="button" className="efp-btn" onClick={() => setShowFilters(v => !v)}><Sliders size={18} /> Filters</button>
              <button type="button" className="efp-btn" onClick={clearAll}><X size={18} /> Clear All</button>
            </div>
          </div>
          <div className="rp-tags-row">
            {["all","Poultry","Seafood","Vegetables","Fermented","Dessert","Rice Dish","Noodles","Soup","Meat","Other"].map((ft) => (
              <button key={ft} type="button" className={`efp-chip ${selectedType === ft ? "is-active" : ""}`} onClick={() => setSelectedType(ft)}>
                {ft === "all" ? "All Categories" : ft}
              </button>
            ))}
          </div>
        </div>

        {showFilters && (
          <div className="rp-filter-card efp-card efp-filters-card">
            <div className="efp-filters">
              <div className="efp-filters-header"><Filter className="efp-filter-icon" size={18} /><h2 className="efp-filters-title">Filter</h2></div>
              <div className="efp-grid-2">
                <div className="efp-filter-item">
                  <label className="efp-label">Cultural Origin</label>
                  <select value={selectedOrigin} onChange={(e) => setSelectedOrigin(e.target.value)} className="efp-select">
                    {origins.map(o => <option key={o} value={o}>{o === "all" ? "All Origins" : o}</option>)}
                  </select>
                </div>
                <div className="efp-filter-item">
                  <label className="efp-label">Difficulty</label>
                  <select value={selectedDifficulty} onChange={(e) => setSelectedDifficulty(e.target.value)} className="efp-select">
                    <option value="all">All Difficulties</option>
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                  </select>
                </div>
              </div>
              <hr className="efp-sep" />
              <div className="efp-grid-2">
                <div className="efp-filter-item">
                  <label className="efp-label">Prep Time</label>
                  <select className="efp-select" value={selectedPrepTime} onChange={(e) => setSelectedPrepTime(e.target.value)}>
                    <option value="all">All Categories</option>
                    <option value="under30">Under 30 minutes</option>
                    <option value="under120">Under 2 hours</option>
                    <option value="over120">Over 2 hours</option>
                  </select>
                </div>
                <div className="efp-filter-item">
                  <label className="efp-label">Cook Time</label>
                  <select className="efp-select" value={selectedCookTime} onChange={(e) => setSelectedCookTime(e.target.value)}>
                    <option value="all">All Categories</option>
                    <option value="under30">Under 30 minutes</option>
                    <option value="under120">Under 2 hours</option>
                    <option value="over120">Over 2 hours</option>
                  </select>
                </div>
              </div>
              <hr className="efp-sep" />
              <div>
                <label className="efp-label">Dietary Preferences</label>
                <div className="efp-checkbox-grid">
                  {DIET_OPTIONS.map(tag => (
                    <label key={tag} className="efp-checkbox-item">
                      <input type="checkbox" className="efp-checkbox" checked={dietFilters.includes(tag)} onChange={() => setDietFilters(prev => dietFilters.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])} />
                      <span className="efp-checkbox-text">{tag.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase())}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="rp-results-head">
          <p className="efp-results-count">{filtered.length} recipes found</p>
          {dietFilters.length > 0 && (
            <div className="efp-active-filters">
              {dietFilters.map((tag) => (
                <button key={tag} type="button" className="efp-chip efp-chip--removable" onClick={() => setDietFilters(prev => prev.filter(t => t !== tag))}>
                  <span>{tag.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase())}</span>
                  <X size={14} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Grid */}
        <div className="rp-grid">
          {current.map((r, index) => {
            if (!r || typeof r !== 'object') return null;
            const recipeId = r.id || r.foodID || index;
            const diffClass = (r.difficulty || "").toLowerCase() === "easy" ? "efp-badge efp-badge--ok" : (r.difficulty || "").toLowerCase() === "medium" ? "efp-badge efp-badge--warn" : "efp-badge efp-badge--high";

            return (
              <div key={`recipe-${recipeId}-${index}`} className="efp-food-card">
                <div className="efp-food-media">
                  <img src={r.image || 'https://via.placeholder.com/300x200?text=No+Image'} alt={r.name} className="efp-image" loading="lazy" />
                  <div className="efp-badges"><span className={diffClass}>{r.difficulty || 'Easy'}</span></div>
                  {Array.isArray(r.dietaryTags) && r.dietaryTags.includes("vegetarian") && <span className="efp-badge-topright">V</span>}
                </div>
                <div className="efp-food-body">
                  <div className="efp-food-headline"><h3 className="efp-food-title">{r.name || 'Unknown Recipe'}</h3></div>
                  <p className="efp-desc">{r.description || 'No description available'}</p>
                  <button className="efp-card-cta" onClick={() => navigate(`/recipes/${recipeId}`)}>View Recipe</button>
                </div>
              </div>
            );
          })}
        </div>

          {totalPages > 1 && (
            <div className="community-pagination">
              <button 
                onClick={() => setPage(p => Math.max(p - 1, 1))} 
                disabled={page === 1} 
                className="community-page-btn nav-btn"
              >
                ← Prev
              </button>
              <div className="page-numbers">
                {[...Array(totalPages)].map((_, i) => (
                  <button 
                    key={i + 1} 
                    onClick={() => setPage(i + 1)} 
                    className={`community-page-btn page-num ${page === i + 1 ? "active" : ""}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setPage(p => Math.min(p + 1, totalPages))} 
                disabled={page === totalPages} 
                className="community-page-btn nav-btn"
              >
                Next →
              </button>
            </div>
          )}
      </div>
      <Footer />
    </div>
  );
}