import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../css/RecipesPage.css";
import Modal from "../components/Modal";
import { FaCamera, FaTimes } from "react-icons/fa";
import { GrDocumentMissing } from "react-icons/gr";
import { PiChefHat } from "react-icons/pi";
import { Filter, Sliders, X } from "lucide-react";
import { translateTexts } from "../hooks/useAITranslation";
import { getTierById } from "../utils/gamificationTiers";

// Guest detection + modal
import { useAuth } from "../context/AuthContext";
import LoginPromptModal from "../components/LoginPromptModal";

const PER_PAGE = 9;

export default function RecipesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, i18n } = useTranslation();

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

  const [translatedRecipes, setTranslatedRecipes] = useState({});

  useEffect(() => {
    if (!recipes.length || i18n.language === "en") {
      setTranslatedRecipes({});
      return;
    }
    const texts = {};
    recipes.forEach(r => {
      texts[`name_${r.id}`] = r.name;
      texts[`desc_${r.id}`] = r.description;
    });
    translateTexts(texts, i18n.language).then(setTranslatedRecipes);
  }, [recipes, i18n.language]);

  useEffect(() => {
    setSearchQuery(searchParams.get("q") || "");
  }, [searchParams]);

  // Fetch recipes
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
    category: [],  
  });

  // Filters
  const [selectedOrigin, setSelectedOrigin] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
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
        r.name, r.origin, r.category, r.description, r.ingredients, r.instructions,
        Array.isArray(r.dietaryTags) ? r.dietaryTags.join(" ") : r.dietaryTags, r.difficulty
      ].map(norm).join(" ");

      const matchSearch = terms.length === 0 || terms.every(t => haystack.includes(t));
      const originNorm = norm(r.origin);
      const diffNorm = norm(r.difficulty);
      const categoryNorm = norm(r.category);

      const matchOrigin = selectedOrigin === "all" || originNorm === norm(selectedOrigin);
      const matchDifficulty = selectedDifficulty === "all" || diffNorm === norm(selectedDifficulty);
      const recipeCats = r.category ? r.category.split(',').map(norm) : [];
      const matchCategory = selectedCategories.length === 0 || 
        selectedCategories.every(cat => recipeCats.includes(norm(cat)));

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
        matchPrepBucket && matchCookBucket && matchCategory && matchDiet
      );
    });
  }, [recipes, searchQuery, selectedOrigin, selectedDifficulty, selectedPrepTime, selectedCookTime, selectedCategories, dietFilters]);

  useEffect(() => {
    setPage(1);
  }, [recipes.length, searchQuery, selectedOrigin, selectedDifficulty, selectedPrepTime, selectedCookTime, selectedCategories.join(","), dietFilters.join(",")]);

  const clearAll = () => {
    setSearchQuery("");
    setSelectedOrigin("all");
    setSelectedDifficulty("all");
    setSelectedPrepTime("all");
    setSelectedCookTime("all");
    setSelectedCategories([]);
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
      confirmText: t("recipes.ok"), 
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
        title: t("recipes.missingFields"),
        body: t("recipes.missingFieldsMsg"),
        icon: <GrDocumentMissing />,
      });
      setIsSubmitting(false);
      return;
    }

    const parseCustom = (s) =>
      s.split(/[,;\n]+/).map(v => v.trim()).filter(Boolean).map(v => v.toLowerCase().replace(/\s+/g, "-"));

    const customTags = form.otherDietEnabled ? parseCustom(form.otherDietText) : [];
    
    const finalCategory = form.category.join(", ");

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
        category: finalCategory,
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
        name: "", origin: "", difficulty: "Easy", prepTime: "", cookTime: "", servings: "", imageData: "", description: "", ingredients: "", instructions: "", funFact: "", chefTips: "", dietaryTags: [], otherDietEnabled: false, otherDietText: "", category: [],
      });
      setExpanded(false);
            
      setInfo({
        open: true,
        title: t("recipes.submitSuccess"),
        body: t("recipes.submitSuccessMsg"),
        icon: <PiChefHat />,
        
        // Primary Action
        confirmText: t("recipes.trackMyPost"),
        onPrimary: () => {
          closeInfo();
          navigate("/profile?tab=status");
        },

        // Secondary Action
        secondaryText: t("recipes.close"),
        onSecondary: () => {
          closeInfo();
        }
      });

    } catch (err) {
      console.error('Error creating recipe:', err);
      showInfo({
        title: t("recipes.submitError"),
        body: t("recipes.submitErrorMsg"),
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
      showInfo({ title: t("recipes.imageTooLarge"), body: t("recipes.imageTooLargeMsg"), icon: <FaCamera /> });
      e.target.value = ''; 
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      showInfo({ title: t("recipes.invalidImageType"), body: t("recipes.invalidImageTypeMsg"), icon: <FaCamera /> });
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

  const CATEGORY_OPTIONS = ["Poultry", "Seafood", "Vegetables", "Fermented", "Dessert", "Rice Dish", "Noodles", "Soup", "Meat"];
  const DIET_OPTIONS = ["vegetarian", "gluten-free", "dairy-free", "spicy", "paleo", "halal", "keto", "nut-free"];

  function toggleCategory(cat) {
    setForm(prev => {
      const has = prev.category.includes(cat);
      return {
        ...prev,
        category: has ? prev.category.filter(c => c !== cat) : [...prev.category, cat],
      };
    });
  }

  function toggleDiet(tag) {
    setForm(prev => {
      const has = prev.dietaryTags.includes(tag);
      return {
        ...prev,
        dietaryTags: has ? prev.dietaryTags.filter(t => t !== tag) : [...prev.dietaryTags, tag],
      };
    });
  }

  const handleProfileClick = (e, authorProfileID) => {
    e.stopPropagation(); // Prevents clicking the card and navigating to the recipe detail
    if (!authorProfileID) return;
    
    // Fallback checks to find the correct current user ID
    const currentUID = user?.userProfileID || user?.userID || user?.id;
    
    if (currentUID && String(currentUID) === String(authorProfileID)) {
      navigate("/profile"); 
    } else {
      navigate(`/profile/${authorProfileID}`); 
    }
  };

  if (loading) return <div className="loading">{t("recipes.loading")}</div>;

  return (
    <div>
      <div className="recipes-page">
        <Header />

        {showLoginModal && (
          <LoginPromptModal
            message={t("recipes.loginToShare")}
            onClose={() => setShowLoginModal(false)}
            onLogin={() => navigate("/loginregister")}
          />
        )}

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
          <h1 className="rp-title">{t("recipes.pageTitle")}</h1>
          <p className="rp-sub">{t("recipes.pageSubtitle")}</p>
        </div>

        {/* Add form (expandable) */}
        <section className={`rp-card ${expanded ? "is-open" : ""}`}>
          <div className="rp-card-head">
            <h3>{t("recipes.shareTitle")}</h3>
            <p>{t("recipes.shareSubtitle")}</p>
            {!expanded && (
              <button className="rp-add-btn" onClick={handleExpand}>{t("recipes.addRecipeBtn")}</button>
            )}
          </div>

          {expanded && !isGuest && (
            <form className="rp-form" onSubmit={addRecipe}>
              <div className="rp-grid-2">
                <div className="rp-field">
                  <label>{t("recipes.formName")}</label>
                  <input name="name" value={form.name} onChange={onChangeForm} placeholder={t("recipes.formNamePlaceholder")} required />
                </div>
                <div className="rp-field">
                  <label>{t("recipes.formOrigin")}</label>
                  <select name="origin" value={form.origin} onChange={onChangeForm} required>
                    <option value="">{t("recipes.selectOrigin")}</option>
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
                  <label>{t("recipes.formDifficulty")}</label>
                  <select name="difficulty" value={form.difficulty} onChange={onChangeForm} required>
                    <option>{t("explore.easy")}</option>
                    <option>{t("explore.medium")}</option>
                    <option>{t("explore.hard")}</option>
                  </select>
                </div>
                <div className="rp-field">
                  <label>{t("recipes.formPrepTime")}</label>
                  <input type="number" name="prepTime" value={form.prepTime} onChange={onChangeForm} required/>
                </div>
                <div className="rp-field">
                  <label>{t("recipes.formCookTime")}</label>
                  <input type="number" name="cookTime" value={form.cookTime} onChange={onChangeForm} required/>
                </div>
              </div>

              <div className="rp-field">
                <label>{t("recipes.formCategory")}</label>
                <div className="rp-diet-grid">
                  {CATEGORY_OPTIONS.map(cat => (
                    <label key={cat} className="rp-diet-item">
                      <input 
                        type="checkbox" 
                        checked={form.category.includes(cat)} 
                        onChange={() => toggleCategory(cat)} 
                      />
                      <span>{t(`explore.cat_${cat.toLowerCase().replace(" ", "_")}`) || cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="rp-grid-2">
                <div className="rp-field">
                  <label>{t("recipes.formDescription")}</label>
                  <textarea name="description" className="rp-desc" value={form.description} onChange={onChangeForm} placeholder={t("recipes.formDescriptionPlaceholder")} required/>
                </div>
                <div className="rp-field">
                  <label>{t("recipes.uploadPhoto")}</label>
                  <div className="upload-box" onClick={() => document.getElementById("recipe-file-input").click()} role="button" tabIndex={0}>
                    {form.imageData ? (
                      <img src={form.imageData} alt="Preview" className="preview-img" />
                    ) : (
                      <div className="upload-placeholder">
                        <FaCamera className="camera-icon" />
                        <p>{t("recipes.uploadPhoto")}</p>
                      </div>
                    )}
                  </div>
                  <input id="recipe-file-input" className="rp-pic-input" type="file" accept="image/*" onChange={handleImageUpload} required />
                </div>
              </div>

              <div className="rp-field">
                <label>{t("recipes.formServings")}</label>
                <input type="number" name="servings" value={form.servings} onChange={onChangeForm} required/>
              </div>

              <div className="rp-grid-2">
                <div className="rp-field">
                  <label>{t("recipes.formIngredients")}</label>
                  <textarea name="ingredients" value={form.ingredients} onChange={onChangeForm} placeholder={t("recipes.formIngredientsPlaceholder")} required />
                </div>
                <div className="rp-field">
                  <label>{t("recipes.formInstructions")}</label>
                  <textarea name="instructions" value={form.instructions} onChange={onChangeForm} placeholder={t("recipes.formInstructionsPlaceholder")} required />
                </div>
              </div>

              <div className="rp-field">
                <label>{t("explore.dietaryPrefs")}</label>
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
                    <span>{t("recipes.other")}</span>
                  </label>
                  {form.otherDietEnabled && (
                    <input className="rp-input rp-input--sm" type="text" placeholder={t("recipes.otherDietPlaceholder")} value={form.otherDietText} onChange={(e) => setForm(prev => ({ ...prev, otherDietText: e.target.value }))} />
                  )}
                </div>
              </div>

              <div className="rp-grid-2">
                <div className="rp-field">
                  <label>{t("recipes.formFunFact")}</label>
                  <textarea name="funFact" value={form.funFact} onChange={onChangeForm} placeholder={t("recipes.formFunFactPlaceholder")} />
                </div>
                <div className="rp-field">
                  <label>{t("recipes.formTips")}</label>
                  <textarea name="chefTips" value={form.chefTips} onChange={onChangeForm} placeholder={t("recipes.formTipsPlaceholder")} />
                </div>
              </div>
              
              <div className="rp-actions">
                <button className="rp-btn rp-submit" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? t("recipes.submitting") : t("recipes.submitBtn")}
                </button>
                <button className="rp-btn rp-btn-muted" type="button" onClick={() => setForm({
                  name: "", origin: "", difficulty: "Easy", prepTime: "", cookTime: "", servings: "", imageData: "", description: "", ingredients: "", instructions: "", funFact: "", chefTips: "", dietaryTags: [], otherDietEnabled: false, otherDietText: "", category: [], 
                })} disabled={isSubmitting}>{t("recipes.clear")}</button>
                <button className="rp-btn rp-btn-muted" type="button" onClick={() => setExpanded(false)}>{t("recipes.close")}</button>
              </div>
            </form>
          )}
        </section>

        {/* Filters */}
        <div className="rp-filter-card efp-controls">
          <div className="efp-search-row">
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t("recipes.searchPlaceholder")} className="efp-input" />
            <div className="efp-btn-group">
              <button type="button" className="efp-btn" onClick={() => setShowFilters(v => !v)}><Sliders size={18} /> {t("explore.filters")}</button>
              <button type="button" className="efp-btn" onClick={clearAll}><X size={18} /> {t("explore.clearAll")}</button>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="rp-filter-card efp-card efp-filters-card">
            <div className="efp-filters">
              <div className="efp-filters-header"><Filter className="efp-filter-icon" size={18} /><h2 className="efp-filters-title">{t("explore.filter")}</h2></div>
              <div className="efp-grid-2">
                <div className="efp-filter-item">
                  <label className="efp-label">{t("explore.culturalOrigin")}</label>
                  <select value={selectedOrigin} onChange={(e) => setSelectedOrigin(e.target.value)} className="efp-select">
                    {origins.map(o => <option key={o} value={o}>{o === "all" ? t("explore.allOrigins") : o}</option>)}
                  </select>
                </div>
                <div className="efp-filter-item">
                  <label className="efp-label">{t("explore.difficulty")}</label>
                  <select value={selectedDifficulty} onChange={(e) => setSelectedDifficulty(e.target.value)} className="efp-select">
                    <option value="all">{t("recipes.allDifficulties")}</option>
                    <option value="Easy">{t("explore.easy")}</option>
                    <option value="Medium">{t("explore.medium")}</option>
                    <option value="Hard">{t("explore.hard")}</option>
                  </select>
                </div>
              </div>
              <hr className="efp-sep" />
              <div className="efp-grid-2">
                <div className="efp-filter-item">
                  <label className="efp-label">{t("explore.prepTime")}</label>
                  <select className="efp-select" value={selectedPrepTime} onChange={(e) => setSelectedPrepTime(e.target.value)}>
                    <option value="all">{t("explore.allCategories")}</option>
                    <option value="under30">{t("explore.under30")}</option>
                    <option value="under120">{t("explore.under120")}</option>
                    <option value="over120">{t("explore.over120")}</option>
                  </select>
                </div>
                <div className="efp-filter-item">
                  <label className="efp-label">{t("recipes.cookTime")}</label>
                  <select className="efp-select" value={selectedCookTime} onChange={(e) => setSelectedCookTime(e.target.value)}>
                    <option value="all">{t("explore.allCategories")}</option>
                    <option value="under30">{t("explore.under30")}</option>
                    <option value="under120">{t("explore.under120")}</option>
                    <option value="over120">{t("explore.over120")}</option>
                  </select>
                </div>
              </div>
              <hr className="efp-sep" />
              <div>
                <label className="efp-label">{t("explore.categories")}</label>
                <div className="efp-checkbox-grid">
                  {["Poultry", "Seafood", "Vegetables", "Fermented", "Dessert", "Rice Dish", "Noodles", "Soup", "Meat"].map((cat) => (
                    <label key={cat} className="efp-checkbox-item">
                      <input 
                        type="checkbox" 
                        className="efp-checkbox" 
                        checked={selectedCategories.includes(cat)} 
                        onChange={() => setSelectedCategories(prev => 
                          prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
                        )} 
                      />
                      <span className="efp-checkbox-text">
                        {t(`explore.cat_${cat.toLowerCase().replace(" ", "_")}`) || cat}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <hr className="efp-sep" />
              <div>
                <label className="efp-label">{t("explore.dietaryPrefs")}</label>
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
          <p className="efp-results-count">{t("recipes.recipesFound", { count: filtered.length })}</p>
          {(dietFilters.length > 0 || selectedCategories.length > 0) && (
            <div className="efp-active-filters">
              {selectedCategories.map((cat) => (
                <button key={cat} type="button" className="efp-chip efp-chip--removable" onClick={() => setSelectedCategories(prev => prev.filter(c => c !== cat))}>
                  <span>{t(`explore.cat_${cat.toLowerCase().replace(" ", "_")}`) || cat}</span>
                  <X size={14} />
                </button>
              ))}
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
            const recipeId = r._id || r.id;
            const diffClass = (r.difficulty || "").toLowerCase() === "easy" ? "efp-badge efp-badge--ok" : (r.difficulty || "").toLowerCase() === "medium" ? "efp-badge efp-badge--warn" : "efp-badge efp-badge--high";

            return (
              <div 
                key={`recipe-${recipeId}-${index}`} 
                className="efp-food-card"
                onClick={() => navigate(`/recipes/${recipeId}`)}
                style={{ cursor: "pointer" }}
              >
                <div className="efp-food-media">
                  <img src={r.image || 'https://via.placeholder.com/300x200?text=No+Image'} alt={r.name} className="efp-image" loading="lazy" />
                  <div className="efp-badges"><span className={diffClass}>{r.difficulty || t("explore.easy")}</span></div>
                  {Array.isArray(r.dietaryTags) && r.dietaryTags.includes("vegetarian") && <span className="efp-badge-topright">V</span>}
                </div>
                <div className="efp-food-body">
                  <div 
                    className="rp-author-info"
                    onClick={(e) => handleProfileClick(e, r.authorId || r.userProfileID)}
                    style={{ cursor: "pointer" }}
                    title={`View ${r.author}'s profile`}
                  >
                    {/* ✅ UPDATED: Added UI Avatars and onError Fallback */}
                    <img 
                      src={r.authorImage || `https://ui-avatars.com/api/?name=${r.author || "User"}&background=8b5e3c&color=fff&rounded=true`} 
                      alt={r.author} 
                      className="rp-author-img" 
                      loading="lazy"
                      onError={(e) => {
                        e.target.onerror = null; // prevents infinite loop if fallback also fails
                        e.target.src = `https://ui-avatars.com/api/?name=${r.author || "User"}&background=8b5e3c&color=fff&rounded=true`;
                      }}
                    />
                    <span className="rp-author-name">
                      {r.author}
                      {r.equippedBadge && r.equippedBadge !== 'null' && r.equippedBadge !== 'novice' && (
                      <span className="user-badge-inline">
                        {getTierById(r.equippedBadge).icon}
                        <span className="badge-tooltip-mini" style={{ color: getTierById(r.equippedBadge).color }}>
                          {getTierById(r.equippedBadge).title}
                        </span>
                      </span>
                    )}
                  </span>
                  </div>
                  <h3 className="efp-food-title">{translatedRecipes[`name_${r.id}`] || r.name || t("recipes.unknownRecipe")}</h3>
                  <p className="efp-desc">{translatedRecipes[`desc_${r.id}`] || r.description || t("recipes.noDescription")}</p>
                  <button 
                    className="efp-card-cta" 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/recipes/${recipeId}`);
                    }}
                  >
                    {t("recipes.viewRecipe")}
                  </button>
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
                {t("explore.prev")}
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
                {t("explore.next")}
              </button>
            </div>
          )}
      </div>
      <Footer />
    </div>
  );
}