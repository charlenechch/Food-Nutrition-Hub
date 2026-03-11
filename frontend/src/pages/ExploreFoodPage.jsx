import React, { useMemo, useState, useEffect, useRef, useLayoutEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../css/ExploreFoodPage.css";
import { Filter, Sliders, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { translateTexts } from "../hooks/useAITranslation";

export default function ExploreFoodPage({ onFoodSelect = () => {} }) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [translatedFoods, setTranslatedFoods] = useState({});
  const [isTranslating, setIsTranslating] = useState(false);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch foods on mount
  useEffect(() => {
    const fetchFoods = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const res = await fetch(`${API_BASE_URL}/api/exploreFood`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();

        const transformedData = data.map(food => {
          const normalizedTags = parseDietaryTags(food.dietaryTags ?? food.dietary_tags).map(toSlug);
          const servings = Math.max(1, Number(food.servings || 1));
          const num = (v) => (v == null ? 0 : Number(v));
          const Energy_kcal = num(food.Energy_kcal);
          const Protein_g = num(food.Protein_g);
          const Fat_g = num(food.Fat_g);
          const Carbohydrates_g = num(food.Carbohydrates_g);
          const Fiber_g = num(food.Fiber_g);
          const VitaminC_mg = num(food.VitaminC_mg);
          const Energy_kcal_ps = num(food.Energy_kcal_ps) || +(Energy_kcal / servings).toFixed(2);
          const Protein_g_ps = num(food.Protein_g_ps) || +(Protein_g / servings).toFixed(2);
          const Fat_g_ps = num(food.Fat_g_ps) || +(Fat_g / servings).toFixed(2);
          const Carbohydrates_g_ps = num(food.Carbohydrates_g_ps) || +(Carbohydrates_g / servings).toFixed(2);
          const Fiber_g_ps = num(food.Fiber_g_ps) || +(Fiber_g / servings).toFixed(2);
          const VitaminC_mg_ps = num(food.VitaminC_mg_ps) || +(VitaminC_mg / servings).toFixed(2);
          return {
            ...food, category: food.category || "", dietaryTags: normalizedTags,
            Energy_kcal, Protein_g, Fat_g, Carbohydrates_g, Fiber_g, VitaminC_mg,
            servings, Energy_kcal_ps, Protein_g_ps, Fat_g_ps,
            Carbohydrates_g_ps, Fiber_g_ps, VitaminC_mg_ps,
          };
        });
        setFoods(transformedData);
      } catch (err) {
        console.error("Failed to fetch foods:", err);
        setFoods([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFoods();
  }, []);

  const rawCalMax = useMemo(() => foods.reduce((m, f) => Math.max(m, parseFloat(f.Energy_kcal_ps) || 0), 0), [foods]);
  const calMax = useMemo(() => Math.ceil(rawCalMax / 50) * 50, [rawCalMax]);
  const calMin = 0;

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPrepTime, setSelectedPrepTime] = useState("all");
  const [selectedDietaryTags, setSelectedDietaryTags] = useState([]);
  const itemsPerPage = 9;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedOrigin, setSelectedOrigin] = useState("all");
  const [calorieRange, setCalorieRange] = useState([calMin, calMax]);
  const [minCalInput, setMinCalInput] = useState(String(calMin));
  const [maxCalInput, setMaxCalInput] = useState(String(calMax));
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [nutritionFocus, setNutritionFocus] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => { setCalorieRange(([lo, hi]) => [Math.min(lo, calMax), Math.min(hi, calMax)]); }, [calMax]);
  useEffect(() => { setMinCalInput(String(calorieRange[0])); setMaxCalInput(String(calorieRange[1])); }, [calorieRange]);
  useEffect(() => {
    if (foods.length > 0 && calMax > 0) { setCalorieRange([0, calMax]); setMinCalInput("0"); setMaxCalInput(String(calMax)); }
  }, [foods, calMax]);

  const norm = (s) => String(s ?? "").toLowerCase().trim();

  const filteredFoods = useMemo(() => {
    const terms = norm(searchQuery).split(/\s+/).filter(Boolean);
    return foods.filter((food) => {
      const matchesSearch = terms.length === 0 || terms.every(term => {
        const haystack = [food.name, food.origin, food.category, food.description,
          Array.isArray(food.commonIngredients) ? food.commonIngredients.join(" ") : food.commonIngredients,
          Array.isArray(food.dietaryTags) ? food.dietaryTags.join(" ") : food.dietaryTags
        ].map(norm).join(" ");
        return haystack.includes(term);
      });
      const foodCats = food.category ? food.category.split(',').map(s => s.trim()) : [];
      const matchesCategory = selectedCategories.length === 0 || 
        selectedCategories.some(cat => foodCats.includes(cat));
      const matchesOrigin = selectedOrigin === "all" || food.origin === selectedOrigin;
      const foodCalories = parseFloat(food.Energy_kcal_ps) || 0;
      const matchesCalories = foodCalories >= calorieRange[0] && foodCalories <= calorieRange[1];
      const matchesDifficulty = selectedDifficulty === "all" || food.difficulty === selectedDifficulty;
      const matchesNutrition = nutritionFocus === "all" ||
        (nutritionFocus === "high-protein" && (parseFloat(food.Protein_g_ps) || 0) >= 20) ||
        (nutritionFocus === "low-fat" && (parseFloat(food.Fat_g_ps) || 0) <= 10) ||
        (nutritionFocus === "high-fiber" && (parseFloat(food.Fiber_g_ps) || 0) >= 5) ||
        (nutritionFocus === "low-carbs" && (parseFloat(food.Carbohydrates_g_ps) || 0) <= 25);
      const matchesPrepTime = selectedPrepTime === "all" ||
        (selectedPrepTime === "under30" && food.prepTime <= 30) ||
        (selectedPrepTime === "under120" && food.prepTime <= 120) ||
        (selectedPrepTime === "over120" && food.prepTime > 120);
      const matchesDietary = selectedDietaryTags.length === 0 || selectedDietaryTags.every((tag) => food.dietaryTags.includes(tag));
      return matchesSearch && matchesCategory && matchesOrigin && matchesCalories &&
        matchesDifficulty && matchesNutrition && matchesPrepTime && matchesDietary;
    });
  }, [foods, searchQuery, selectedCategories, selectedOrigin, calorieRange, selectedDifficulty, nutritionFocus, selectedDietaryTags, selectedPrepTime]);

  const totalPages = Math.ceil(filteredFoods.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentFoods = filteredFoods.slice(startIndex, startIndex + itemsPerPage);

  // Fixed: Changed dependency from selectedCategory to selectedCategories
  useEffect(() => { setCurrentPage(1); }, [foods, searchQuery, selectedCategories, selectedOrigin, calorieRange, selectedDifficulty, nutritionFocus, selectedDietaryTags, selectedPrepTime]);

  const getCalorieRangeLabel = (cal) => {
    if (cal < 100) return t("explore.calLow");
    if (cal < 400) return t("explore.calModerate");
    return t("explore.calHigh");
  };

  const STEP = 1;
  const MIN_GAP = 10;
  const commitMin = () => {
    let raw = parseFloat(minCalInput, 10);
    if (Number.isNaN(raw)) raw = calMin;
    raw = Math.round(raw / STEP) * STEP;
    const clamped = Math.max(calMin, Math.min(raw, calorieRange[1] - MIN_GAP));
    setCalorieRange([clamped, calorieRange[1]]); setMinCalInput(String(clamped));
  };
  const commitMax = () => {
    let raw = parseFloat(maxCalInput, 10);
    if (Number.isNaN(raw)) raw = calMax;
    raw = Math.round(raw / STEP) * STEP;
    const clamped = Math.min(calMax, Math.max(raw, calorieRange[0] + MIN_GAP));
    setCalorieRange([calorieRange[0], clamped]); setMaxCalInput(String(clamped));
  };
  const onMinKeyDown = (e) => { if (e.key === "Enter") { e.preventDefault(); commitMin(); } };
  const onMaxKeyDown = (e) => { if (e.key === "Enter") { e.preventDefault(); commitMax(); } };

  const trackBoxRef = useRef(null);
  const trackRef = useRef(null);
  const progressRef = useRef(null);

  const updateProgress = useCallback(() => {
    const track = trackRef.current; const bar = progressRef.current;
    if (!track || !bar) return;
    const rect = track.getBoundingClientRect(); const pad = 10.5;
    const usable = Math.max(0, rect.width - 2 * pad);
    const n = v => (v - calMin) / (calMax - calMin);
    const loPx = pad + n(calorieRange[0]) * usable;
    const hiPx = pad + n(calorieRange[1]) * usable;
    bar.style.left = `${loPx}px`;
    bar.style.right = `${Math.max(0, rect.width - hiPx)}px`;
    bar.style.removeProperty("width");
  }, [calorieRange, calMin, calMax]);

  useLayoutEffect(() => { updateProgress(); }, [updateProgress]);
  useEffect(() => {
    const box = trackBoxRef.current; if (!box) return;
    const ro = new ResizeObserver(() => requestAnimationFrame(updateProgress));
    ro.observe(box);
    const onWinResize = () => requestAnimationFrame(updateProgress);
    window.addEventListener("resize", onWinResize);
    const raf = requestAnimationFrame(updateProgress);
    return () => { ro.disconnect(); window.removeEventListener("resize", onWinResize); cancelAnimationFrame(raf); };
  }, [updateProgress]);

  const toSlug = (s) => String(s ?? "").trim().toLowerCase().replace(/[_\s]+/g, "-");
  const humanize = (slug) => String(slug ?? "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const parseDietaryTags = (raw) => {
    if (Array.isArray(raw)) return raw;
    if (raw == null) return [];
    const str = String(raw).trim();
    if (str.startsWith("[")) { try { const arr = JSON.parse(str); return Array.isArray(arr) ? arr : []; } catch { return []; } }
    return str.split(",").map(s => s.trim()).filter(Boolean);
  };

  // Translation
  useEffect(() => {
    if (!foods.length || i18n.language === "en") {
      setTranslatedFoods({});
      return;
    }
    setIsTranslating(true);
    const texts = {};
    foods.forEach(f => {
      texts[`name_${f.id}`] = f.name;
      texts[`desc_${f.id}`] = f.description;
    });
    translateTexts(texts, i18n.language).then(result => {
      setTranslatedFoods(result);
      setIsTranslating(false);
    });
  }, [foods, i18n.language]);

  return (
    <div className="explore-foods-page">
      <Header />
      <main className="efp-container">
        <div className="efp-heading">
          <h1 className="efp-title">{t("explore.title")}</h1>
          <p className="efp-subtitle">{t("explore.subtitle")}</p>
        </div>

        {/* Search + Filters */}
        <div className="efp-card efp-controls">
          <div className="efp-search-row">
            <input
              type="text" value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("explore.searchPlaceholder")}
              className="efp-input"
            />
            <div className="efp-btn-group">
              <button onClick={() => setShowFilters(!showFilters)} className="efp-btn">
                <Sliders size={18} aria-hidden="true" /> {t("explore.filters")}
              </button>
              <button onClick={() => {
                setSearchQuery(""); 
                setSelectedCategories([]);
                setSelectedOrigin("all");
                setCalorieRange([calMin, calMax]); 
                setSelectedDifficulty("all");
                setNutritionFocus("all");
                setSelectedPrepTime("all"); 
                setSelectedDietaryTags([]);
              }} className="efp-btn">
                <X size={18} aria-hidden="true" /> {t("explore.clearAll")}
              </button>
            </div>
          </div>
        </div>

        {/* Expanded Filter Panel */}
        {showFilters && (
          <div className="efp-card efp-filters-card" id="filters-panel" role="region" aria-label="Filters">
            <div className="efp-filters">
              <div className="efp-filters-header">
                <Filter className="efp-filter-icon" size={18} aria-hidden="true" />
                <h2 className="efp-filters-title">{t("explore.filter")}</h2>
              </div>

              <div className="efp-grid-3">
                <div className="efp-filter-item">
                  <label className="efp-label">{t("explore.culturalOrigin")}</label>
                  <select value={selectedOrigin} onChange={(e) => setSelectedOrigin(e.target.value)} className="efp-select">
                    <option value="all">{t("explore.allOrigins")}</option>
                    <option value="Iban">Iban</option>
                    <option value="Melanau">Melanau</option>
                    <option value="Dayak">Dayak</option>
                    <option value="Native">Native</option>
                    <option value="Chinese">Chinese</option>
                    <option value="Malay">Malay</option>
                    <option value="Bidayuh">Bidayuh</option>
                  </select>
                </div>

                <div className="efp-filter-item efp-filter-wide">
                  <label className="efp-label">{t("explore.categories")}</label>
                  <div className="efp-checkbox-grid">
                    {["Poultry", "Seafood", "Vegetables", "Fermented", "Dessert", "Rice Dish", "Noodles", "Soup", "Meat"].map((cat) => (
                      <label key={cat} className="efp-checkbox-item">
                        <input 
                          type="checkbox" 
                          className="efp-checkbox"
                          checked={selectedCategories.includes(cat)}
                          onChange={() => setSelectedCategories((prev) =>
                            prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
                          )} 
                        />
                        <span className="efp-checkbox-text">
                          {t(`explore.cat_${cat.toLowerCase().replace(" ", "_")}`) || cat}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="efp-filter-item">
                  <label className="efp-label">{t("explore.nutritionFocus")}</label>
                  <select value={nutritionFocus} onChange={(e) => setNutritionFocus(e.target.value)} className="efp-select">
                    <option value="all">{t("explore.allCategories")}</option>
                    <option value="high-protein">{t("explore.highProtein")}</option>
                    <option value="low-fat">{t("explore.lowFat")}</option>
                    <option value="high-fiber">{t("explore.highFiber")}</option>
                    <option value="low-carbs">{t("explore.lowCarbs")}</option>
                  </select>
                </div>
              </div>

              <hr className="efp-sep" />

              <div className="efp-filter-item efp-filter-wide">
                <label className="efp-label">{t("explore.calorieRange")}</label>
                <div className="efp-range-controls">
                  <input type="number" className="efp-input" min={calMin} max={calorieRange[1] - MIN_GAP} step={STEP}
                    value={minCalInput} onChange={(e) => setMinCalInput(e.target.value)}
                    onBlur={commitMin} onKeyDown={onMinKeyDown} aria-label="Minimum calories" />
                  <span className="efp-range-sep">-</span>
                  <input type="number" className="efp-input" min={calorieRange[0] + MIN_GAP} max={calMax} step={STEP}
                    value={maxCalInput} onChange={(e) => setMaxCalInput(e.target.value)}
                    onBlur={commitMax} onKeyDown={onMaxKeyDown} aria-label="Maximum calories" />
                  <span className="efp-range-unit">kcal</span>
                </div>
                <div className="efp-dual-range" ref={trackBoxRef}>
                  <div ref={trackRef} className="efp-range-track" />
                  <div ref={progressRef} className="efp-range-progress" />
                  <input type="range" min={calMin} max={calMax} step={STEP} value={calorieRange[0]}
                    onChange={(e) => setCalorieRange(([_, hi]) => [Math.min(Number(e.target.value), hi - MIN_GAP), hi])}
                    className="efp-range efp-range--left" aria-label="Minimum calories slider" />
                  <input type="range" min={calMin} max={calMax} step={STEP} value={calorieRange[1]}
                    onChange={(e) => setCalorieRange(([lo, _]) => [lo, Math.max(Number(e.target.value), lo + MIN_GAP)])}
                    className="efp-range efp-range--right" aria-label="Maximum calories slider" />
                </div>
                <div className="efp-range-summary">{calorieRange[0]} - {calorieRange[1]} kcal</div>
              </div>

              <hr className="efp-sep" />

              <div>
                <label className="efp-label">{t("explore.dietaryPrefs")}</label>
                <div className="efp-checkbox-grid">
                  {["vegetarian", "gluten-free", "dairy-free", "low-fat", "high-protein", "high-fiber", "spicy", "paleo"].map((tag) => (
                    <label key={tag} className="efp-checkbox-item">
                      <input type="checkbox" className="efp-checkbox"
                        checked={selectedDietaryTags.includes(tag)}
                        onChange={() => setSelectedDietaryTags((prev) =>
                          prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                        )} />
                      <span className="efp-checkbox-text">{t(`explore.dietary_${tag}`) || humanize(tag)}</span>
                    </label>
                  ))}
                </div>
              </div>

              <hr className="efp-sep" />

              <div className="efp-grid-2">
                <div className="efp-filter-item">
                  <label className="efp-label">{t("explore.difficulty")}</label>
                  <select value={selectedDifficulty} onChange={(e) => setSelectedDifficulty(e.target.value)} className="efp-select">
                    <option value="all">{t("explore.allCategories")}</option>
                    <option value="Easy">{t("explore.easy")}</option>
                    <option value="Medium">{t("explore.medium")}</option>
                    <option value="Hard">{t("explore.hard")}</option>
                  </select>
                </div>
                <div className="efp-filter-item">
                  <label className="efp-label">{t("explore.prepTime")}</label>
                  <select value={selectedPrepTime} onChange={(e) => setSelectedPrepTime(e.target.value)} className="efp-select">
                    <option value="all">{t("explore.allCategories")}</option>
                    <option value="under30">{t("explore.under30")}</option>
                    <option value="under120">{t("explore.under120")}</option>
                    <option value="over120">{t("explore.over120")}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="efp-result-head">
          <p className="efp-results-count">{t("explore.dishesFound", { count: filteredFoods.length })}</p>
          {(selectedDietaryTags.length > 0 || selectedCategories.length > 0) && (
            <div className="efp-active-filters">
              {selectedCategories.map((cat) => (
                <button key={cat} type="button" className="efp-chip efp-chip--removable"
                  onClick={() => setSelectedCategories((prev) => prev.filter((c) => c !== cat))}>
                  <span>{cat}</span>
                  <X size={14} />
                </button>
              ))}
              {selectedDietaryTags.map((tag) => (
                <button key={tag} type="button" className="efp-chip efp-chip--removable"
                  onClick={() => setSelectedDietaryTags((prev) => prev.filter((t) => t !== tag))}
                  aria-label={`Remove ${humanize(tag)}`}>
                  <span>{humanize(tag)}</span>
                  <X size={14} aria-hidden="true" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="efp-grid">
          {currentFoods.map((food) => {
            const calorieLabel = getCalorieRangeLabel(food.Energy_kcal_ps);
            const calorieClass = calorieLabel === t("explore.calLow") ? "efp-badge efp-badge--ok"
              : calorieLabel === t("explore.calModerate") ? "efp-badge efp-badge--warn"
              : "efp-badge efp-badge--high";
            const diff = (food.difficulty || "").toLowerCase();
            const diffLabel = diff ? diff[0].toUpperCase() + diff.slice(1) : "";
            const diffClass = diff === "easy" ? "efp-badge efp-badge--ok"
              : diff === "medium" ? "efp-badge efp-badge--warn"
              : diff === "hard" ? "efp-badge efp-badge--high" : "efp-badge";

            return (
              <div key={food.foodID} className="efp-food-card" onClick={() => onFoodSelect(food)}>
                <div className="efp-food-media">
                  <img src={food.image} alt={food.name} className="efp-image" loading="lazy" />
                  <div className="efp-badges">
                    {diff && <span className={diffClass}>{diffLabel}</span>}
                  </div>
                  <div className="efp-badges efp-badges-calorie">
                    <span className={calorieClass}>{calorieLabel} {t("explore.calorie")}</span>
                  </div>
                  {food.dietaryTags.includes("vegetarian") && <span className="efp-badge-topright">V</span>}
                </div>

                <div className="efp-food-body">
                  <div className="efp-food-headline">
                    <h3 className="efp-food-title">{translatedFoods[`name_${food.id}`] || food.name}</h3>
                    <span className="efp-badge-cat">{food.category}</span>
                  </div>
                  <p className="efp-desc">{translatedFoods[`desc_${food.id}`] || food.description}</p>
                  <div className="efp-meta">
                    <span className="muted">{t("explore.origin")}: {food.origin}</span>
                    <span className="efp-cal">{Math.round(food.Energy_kcal_ps)} {t("explore.calories")}</span>
                  </div>
                  <div className="efp-nutri">
                    <div className="efp-nutri-item">
                      <div>{food.Protein_g_ps.toFixed(1)}g</div>
                      <div className="muted">{t("explore.protein")}</div>
                    </div>
                    <div className="efp-nutri-item">
                      <div>{food.Carbohydrates_g_ps.toFixed(1)}g</div>
                      <div className="muted">{t("explore.carbs")}</div>
                    </div>
                    <div className="efp-nutri-item">
                      <div>{food.Fat_g_ps.toFixed(1)}g</div>
                      <div className="muted">{t("explore.fat")}</div>
                    </div>
                  </div>
                  {food.dietaryTags?.length > 0 && (
                    <div className="efp-tags">
                      {Array.from(new Set(food.dietaryTags)).map((tag) => (
                        <button key={tag} type="button" className="efp-tag"
                          onClick={(e) => { e.stopPropagation(); setSelectedDietaryTags((prev) => prev.includes(tag) ? prev : [...prev, tag]); }}
                          title={`Filter by ${humanize(tag)}`}>
                          {humanize(tag)}
                        </button>
                      ))}
                    </div>
                  )}
                  <button className="efp-card-cta"
                    onClick={(e) => { e.stopPropagation(); if (food.foodID) navigate(`/fooddetail/${food.foodID}`); }}>
                    {t("explore.viewDetails")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredFoods.length === 0 && (
          <div className="efp-empty">
            <p className="efp-empty-title">{t("explore.noResults")}</p>
            <p className="efp-empty-sub">{t("explore.tryAdjusting")}</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="community-pagination">
            <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1} className="community-page-btn nav-btn">
              ← {t("explore.prev")}
            </button>
            <div className="page-numbers">
              {[...Array(totalPages)].map((_, i) => (
                <button key={i + 1} onClick={() => setCurrentPage(i + 1)}
                  className={`community-page-btn page-num ${currentPage === i + 1 ? "active" : ""}`}>
                  {i + 1}
                </button>
              ))}
            </div>
            <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages} className="community-page-btn nav-btn">
              {t("explore.next")} →
            </button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}