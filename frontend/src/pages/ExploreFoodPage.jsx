import React, { useMemo, useState, useEffect, useRef, useLayoutEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../css/ExploreFoodPage.css";
import { Filter, Sliders, X } from "lucide-react";

export default function ExploreFoodPage({ onFoodSelect = () => {} }) {
  const navigate = useNavigate();
  const [foods, setFoods] = useState([]); 
  const [loading, setLoading] = useState(true); // Fetch food data from backend 
  useEffect(() => { 
    const fetchFoods = async () => { 
      try { const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000"; 
        const res = await fetch(`${API_BASE_URL}/api/exploreFood`); 
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json(); 
        console.log("Raw fetched foods:", data);
        console.log("Number of foods:", data.length);

        const transformedData = data.map(food => {
          const normalizedTags = parseDietaryTags(food.dietaryTags ?? food.dietary_tags).map(toSlug);

          const servings = Math.max(1, Number(food.servings || 1)); // backend may add this; default 1
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
            ...food,
            category: food.category || "",
            dietaryTags: normalizedTags,

            // keep numeric totals
            Energy_kcal,
            Protein_g,
            Fat_g,
            Carbohydrates_g,
            Fiber_g,
            VitaminC_mg,

            // serving + per serving
            servings,
            Energy_kcal_ps,
            Protein_g_ps,
            Fat_g_ps,
            Carbohydrates_g_ps,
            Fiber_g_ps,
            VitaminC_mg_ps,
          };
        });
        
        setFoods(transformedData);
      } catch (err) { 
        console.error("Failed to fetch foods:", err); 
        setFoods([]); // Set empty array on error
      } finally { 
        setLoading(false); 
        } }; 
        fetchFoods(); 
    }, []);

  // Dynamically derive the max calories from the dataset
  const rawCalMax = useMemo(
  () => foods.reduce((m, f) => Math.max(m, parseFloat(f.Energy_kcal_ps) || 0), 0),
  [foods]
);

  // round up to a nicer number to the next 50
  const calMax = useMemo(() => Math.ceil(rawCalMax / 50) * 50, [rawCalMax]);
  const calMin = 0;
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFoodType, setSelectedFoodType] = useState("all");
  const [selectedPrepTime, setSelectedPrepTime] = useState("all");
  const [selectedDietaryTags, setSelectedDietaryTags] = useState([]);
  const itemsPerPage = 9;

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedOrigin, setSelectedOrigin] = useState("all");
  const [calorieRange, setCalorieRange] = useState([calMin, calMax]);
  const [minCalInput, setMinCalInput] = useState(String(calMin));
  const [maxCalInput, setMaxCalInput] = useState(String(calMax));
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [nutritionFocus, setNutritionFocus] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // useEffect(() => {
  //   setCalorieRange(([lo, hi]) => [Math.min(lo, calMax), Math.min(hi, calMax)]);
  // }, [calMax]);

  // useEffect(() => {
  //   setMinCalInput(String(calorieRange[0]));
  //   setMaxCalInput(String(calorieRange[1]));
  // }, [calorieRange]);
// ... other state

  useEffect(() => {
    setCalorieRange(([lo, hi]) => [Math.min(lo, calMax), Math.min(hi, calMax)]);
  }, [calMax]);

  useEffect(() => {
    setMinCalInput(String(calorieRange[0]));
    setMaxCalInput(String(calorieRange[1]));
  }, [calorieRange]);

  useEffect(() => {
    if (foods.length > 0 && calMax > 0) {
      setCalorieRange([0, calMax]);
      setMinCalInput("0");
      setMaxCalInput(String(calMax));
    }
  }, [foods, calMax]);

  const norm = (s) => String(s ?? "").toLowerCase().trim();

  const filteredFoods = useMemo(() => {
    console.log("=== FILTERING DEBUG ===");
    console.log("Total foods:", foods.length);
    console.log("First food item:", foods[0]);

    const terms = norm(searchQuery).split(/\s+/).filter(Boolean);
    
    const result = foods.filter((food) => {

      const matchesSearch = terms.length === 0 || terms.every(term => {
        const haystack = [
          food.name,
          food.origin,
          food.category,
          food.description,
          Array.isArray(food.commonIngredients) 
            ? food.commonIngredients.join(" ")
            : food.commonIngredients,
          Array.isArray(food.dietaryTags) 
            ? food.dietaryTags.join(" ")
            : food.dietaryTags
        ].map(norm).join(" ");

        return haystack.includes(term);
      });

      const matchesCategory =
        selectedCategory === "all" || food.category === selectedCategory;

      const matchesOrigin =
        selectedOrigin === "all" || food.origin === selectedOrigin;

      const foodCalories = parseFloat(food.Energy_kcal_ps) || 0;
      const matchesCalories = foodCalories >= calorieRange[0] && foodCalories <= calorieRange[1];
        console.log(`Food: ${food.name}, Calories: ${foodCalories}, Range: [${calorieRange[0]}, ${calorieRange[1]}], In range: ${matchesCalories}`);

        console.log(`Food: ${food.name}, Calories: ${food.Energy_kcal_ps}, In range: ${matchesCalories}`);

      const matchesDifficulty =
        selectedDifficulty === "all" || food.difficulty === selectedDifficulty;

      const matchesNutrition =
        nutritionFocus === "all" ||
        (nutritionFocus === "high-protein" && (parseFloat(food.Protein_g_ps) || 0) >= 20) ||
        (nutritionFocus === "low-fat" && (parseFloat(food.Fat_g_ps) || 0) <= 10) ||
        (nutritionFocus === "high-fiber" && (parseFloat(food.Fiber_g_ps) || 0) >= 5) ||
        (nutritionFocus === "low-carbs" && (parseFloat(food.Carbohydrates_g_ps) || 0) <= 25);

      const matchesFoodType =
        selectedFoodType === "all" || food.foodType === selectedFoodType;

      const matchesPrepTime =
        selectedPrepTime === "all" ||
        (selectedPrepTime === "under30" && food.prepTime <= 30) ||
        (selectedPrepTime === "under120" && food.prepTime <= 120) ||
        (selectedPrepTime === "over120" && food.prepTime > 120);

      const matchesDietary =
        selectedDietaryTags.length === 0 ||
        selectedDietaryTags.every((tag) => food.dietaryTags.includes(tag));

        // Debug logging for each filter
      console.log(`Food: ${food.name}`, {
        matchesSearch,
        matchesCategory,
        matchesOrigin,
        matchesCalories,
        matchesDifficulty,
        matchesNutrition,
        matchesFoodType,
        matchesPrepTime,
        matchesDietary,
        searchQuery,
        selectedCategory,
        selectedOrigin,
        calorieRange,
        foodCalories: food.Energy_kcal
      });
      
      return (
        matchesSearch &&
        matchesCategory &&
        matchesOrigin &&
        matchesCalories &&
        matchesDifficulty &&
        matchesNutrition &&
        matchesFoodType &&
        matchesPrepTime &&
        matchesDietary
      );
    });
    console.log("Filtered results:", result.length);
    console.log("Filtered foods:", result);
    return result;
  }, [
    foods,
    searchQuery,
    selectedCategory,
    selectedOrigin,
    calorieRange,
    selectedDifficulty,
    nutritionFocus,
    selectedDietaryTags,
    selectedFoodType, 
    selectedPrepTime  
  ]);

  const totalPages = Math.ceil(filteredFoods.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentFoods = filteredFoods.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  console.log("Current foods to display:", currentFoods);
  console.log("Total pages:", totalPages);
  console.log("Current page:", currentPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    foods,
    searchQuery,
    selectedCategory,
    selectedOrigin,
    calorieRange,
    selectedDifficulty,
    nutritionFocus,
    selectedDietaryTags,   
    selectedFoodType,     
    selectedPrepTime 
  ]);

  const getCalorieRangeLabel = (cal) => {
    if (cal < 100) return "Low";
    if (cal < 400) return "Moderate";
    return "High";
  };

  // Dual-range slider config
  const STEP = 1;
  const MIN_GAP = 10; // minimum distance between thumbs (calories)

  const pct = (v) => calMax === calMin ? 0 : ((v - calMin) * 100) / (calMax - calMin);

  const clampToStep = (v) => Math.round(v / STEP) * STEP;
  

  const commitMin = () => {
    let raw = parseFloat(minCalInput, 10);
    if (Number.isNaN(raw)) raw = calMin;
    raw = clampToStep(raw);
    const clamped = Math.max(calMin, Math.min(raw, calorieRange[1] - MIN_GAP));
    setCalorieRange([clamped, calorieRange[1]]);
    setMinCalInput(String(clamped)); // normalize display
  };

  const commitMax = () => {
    let raw = parseFloat(maxCalInput, 10);
    if (Number.isNaN(raw)) raw = calMax;
    raw = clampToStep(raw);
    const clamped = Math.min(calMax, Math.max(raw, calorieRange[0] + MIN_GAP));
    setCalorieRange([calorieRange[0], clamped]);
    setMaxCalInput(String(clamped)); // normalize display
  };

  const onMinKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commitMin();
    }
  };
  const onMaxKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commitMax();
    }
  };

  const trackBoxRef = useRef(null); 
  const trackRef = useRef(null); 
  const progressRef = useRef(null); 

  const updateProgress = useCallback(() => {
    const track = trackRef.current;
    const bar   = progressRef.current;
    if (!track || !bar) return;

    const rect = track.getBoundingClientRect();
    const pad   = 10.5;

    const usable = Math.max(0, rect.width - 2 * pad);
    const norm   = v => (v - calMin) / (calMax - calMin);

    const loPx = pad + norm(calorieRange[0]) * usable;
    const hiPx = pad + norm(calorieRange[1]) * usable;


    bar.style.left  = `${loPx}px`;
    bar.style.right = `${Math.max(0, rect.width - hiPx)}px`;
    bar.style.removeProperty('width'); 
  }, [calorieRange, calMin, calMax]);

  // Recalculate when values or bounds change
  useLayoutEffect(() => { updateProgress(); }, [updateProgress]);

  // Recalculate on container resize + window resize
  useEffect(() => {
    const box = trackBoxRef.current;
    if (!box) return;

    const ro = new ResizeObserver(() => {
      // next frame ensures layout numbers are final after CSS changes
      requestAnimationFrame(updateProgress);
    });
    ro.observe(box);

    const onWinResize = () => requestAnimationFrame(updateProgress);
    window.addEventListener('resize', onWinResize);

    // also run once in next frame after first paint (fonts, etc.)
    const raf = requestAnimationFrame(updateProgress);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', onWinResize);
      cancelAnimationFrame(raf);
    };
  }, [updateProgress]);

const toSlug = (s) =>
  String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");

const humanize = (slug) =>
  String(slug ?? "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const parseDietaryTags = (raw) => {
  if (Array.isArray(raw)) return raw;
  if (raw == null) return [];
  const str = String(raw).trim();
  // JSON array stored in VARCHAR/TEXT: '["halal","vegan"]'
  if (str.startsWith("[")) {
    try { 
      const arr = JSON.parse(str);
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  }
  // CSV fallback: "halal, vegan , gluten-free"
  return str.split(",").map(s => s.trim()).filter(Boolean);
};


  return (
    <div className="explore-foods-page">
      <Header />

      <main className="efp-container">
        <div className="efp-heading">
          <h1 className="efp-title">Enhanced Food Discovery</h1>
          <p className="efp-subtitle">
            Explore Sarawak's culinary heritage with advanced filtering
          </p>
        </div>

        {/* Search + Filters */}
        <div className="efp-card efp-controls">
          <div className="efp-search-row">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes, origins, or ingredients..."
              className="efp-input"
            />
            <div className="efp-btn-group">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="efp-btn"
              >
                <Sliders size={18} aria-hidden="true" />
                Filters
              </button>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                  setSelectedOrigin("all");
                  setCalorieRange([calMin, calMax]);
                  setSelectedDifficulty("all");
                  setNutritionFocus("all");
                  setSelectedFoodType("all");
                  setSelectedPrepTime("all");
                  setSelectedDietaryTags([]);
                }}
                className="efp-btn"
              >
                <X size={18} aria-hidden="true" />
                Clear All
              </button>
            </div>
          </div>

          {/* Quick categories */}
          <div className="efp-category-row">
            {[
              "all",
              "Poultry",
              "Seafood",
              "Vegetables",
              "Fermented",
              "Dessert",
              "Rice Dish",
              "Noodles",
              "Soup",
              "Meat",
            ].map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCategory(c)}
                className={`efp-chip ${
                  selectedCategory === c ? "is-active" : ""
                }`}
              >
                {c === "all" ? "All Categories" : c}
              </button>
            ))}
          </div>
        </div>

        {/* Expanded Filter Panel */}
        {showFilters && (
          <div className="efp-card efp-filters-card" id="filters-panel" role="region" aria-label="Filters">
            <div className="efp-filters">
              <div className="efp-filters-header">
                <Filter className="efp-filter-icon" size={18} aria-hidden="true" />
                <h2 id="filters-heading" className="efp-filters-title">Filter</h2>
              </div>
              {/* Row 1: Origin, Food Type, Nutrition Focus */}
              <div className="efp-grid-3">
                <div className="efp-filter-item">
                  <label className="efp-label">Cultural Origin</label>
                  <select
                    value={selectedOrigin}
                    onChange={(e) => setSelectedOrigin(e.target.value)}
                    className="efp-select"
                  >
                    <option value="all">All Origins</option>
                    <option value="Iban">Iban</option>
                    <option value="Melanau">Melanau</option>
                    <option value="Dayak">Dayak</option>
                    <option value="Native">Native</option>
                    <option value="Chinese">Chinese</option>
                    <option value="Malay">Malay</option>
                    <option value="Bidayuh">Bidayuh</option>
                  </select>
                </div>

                <div className="efp-filter-item">
                  <label className="efp-label">Food Type</label>
                  <select
                    value={selectedFoodType}
                    onChange={(e) => setSelectedFoodType(e.target.value)}
                    className="efp-select"
                  >
                    <option value="all">All Categories</option>
                    <option value="main-dish">Main Dish</option>
                    <option value="appetizer">Appetizer</option>
                    <option value="vegetable">Vegetable</option>
                    <option value="dessert">Dessert</option>
                    <option value="preserved">Preserved</option>
                    <option value="side-dish">Side Dish</option>
                    <option value="noodles">Noodles</option>
                    <option value="soup">Soup</option>
                  </select>
                </div>

                <div className="efp-filter-item">
                  <label className="efp-label">Nutrition Focus</label>
                  <select
                    value={nutritionFocus}
                    onChange={(e) => setNutritionFocus(e.target.value)}
                    className="efp-select"
                  >
                    <option value="all">All Categories</option>
                    <option value="high-protein">High Protein</option>
                    <option value="low-fat">Low Fat</option>
                    <option value="high-fiber">High Fiber</option>
                    <option value="low-carbs">Low Carbs</option>
                  </select>
                </div>
              </div>

              <hr className="efp-sep" />

              {/* Row 2: Calorie slider */}
              <div className="efp-filter-item efp-filter-wide">
                <label className="efp-label">Calorie Range</label>

                {/* Min/Max numeric inputs (step=5) */}
                <div className="efp-range-controls">
                  <input
                    type="number"
                    className="efp-input"
                    min={calMin}
                    max={calorieRange[1] - MIN_GAP}
                    step={STEP}
                    value={minCalInput}
                    onChange={(e) =>setMinCalInput(e.target.value)}
                    onBlur={commitMin}                               
                    onKeyDown={onMinKeyDown}                         
                    aria-label="Minimum calories"
                  />
                  <span className="efp-range-sep">-</span>
                  <input
                    type="number"
                    className="efp-input"
                    min={calorieRange[0] + MIN_GAP}
                    max={calMax}
                    step={STEP}
                    value={maxCalInput}
                    onChange={(e) => setMaxCalInput(e.target.value)}
                    onBlur={commitMax}
                    onKeyDown={onMaxKeyDown}
                    aria-label="Maximum calories"
                  />
                  <span className="efp-range-unit">kcal</span>
                </div>

                {/* Dual slider (step=5) */}
                <div className="efp-dual-range" ref={trackBoxRef}>
                  <div ref={trackRef} className="efp-range-track" />
                  <div
                    ref={progressRef}
                    className="efp-range-progress"
                  />
                  <input
                    type="range"
                    min={calMin}
                    max={calMax}
                    step={STEP}
                    value={calorieRange[0]}
                    onChange={(e) =>
                      setCalorieRange(([_, hi]) => [
                        Math.min(Number(e.target.value), hi - MIN_GAP),
                        hi,
                      ])
                    }
                    className="efp-range efp-range--left"
                    aria-label="Minimum calories slider"
                  />
                  <input
                    type="range"
                    min={calMin}
                    max={calMax}
                    step={STEP}
                    value={calorieRange[1]}
                    onChange={(e) =>
                      setCalorieRange(([lo, _]) => [
                        lo,
                        Math.max(Number(e.target.value), lo + MIN_GAP),
                      ])
                    }
                    className="efp-range efp-range--right"
                    aria-label="Maximum calories slider"
                  />
                </div>

                <div className="efp-range-summary">
                  {calorieRange[0]} - {calorieRange[1]} kcal
                </div>
              </div>

              <hr className="efp-sep" />

              {/* Row 3: Dietary preferences (checkbox grid) */}
              <div>
                <label className="efp-label">Dietary Preferences</label>
                <div className="efp-checkbox-grid">
                  {[
                    "vegetarian",
                    "gluten-free",
                    "dairy-free",
                    "low-fat",
                    "high-protein",
                    "high-fiber",
                    "spicy",
                    "paleo",
                  ].map((tag) => (
                    <label key={tag} className="efp-checkbox-item">
                      <input
                        type="checkbox"
                        className="efp-checkbox"
                        checked={selectedDietaryTags.includes(tag)}
                        onChange={() =>
                          setSelectedDietaryTags((prev) =>
                            prev.includes(tag)
                              ? prev.filter((t) => t !== tag)
                              : [...prev, tag]
                          )
                        }
                      />
                      <span className="efp-checkbox-text">
                        {tag
                          .replace("-", " ")
                          .replace(/\b\w/g, (c) => c.toUpperCase())}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <hr className="efp-sep" />

              {/* Row 4: Difficulty + Prep Time */}
              <div className="efp-grid-2">
                <div className="efp-filter-item">
                  <label className="efp-label">Difficulty</label>
                  <select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                    className="efp-select"
                  >
                    <option value="all">All Categories</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

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
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="efp-result-head">
          <p className="efp-results-count">
            {filteredFoods.length} dishes found
          </p>
          {selectedDietaryTags.length > 0 && (
            <div className="efp-active-filters" aria-label="Active dietary filters">
              {selectedDietaryTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className="efp-chip efp-chip--removable"
                  onClick={() =>
                    setSelectedDietaryTags((prev) => prev.filter((t) => t !== tag))
                  }
                  aria-label={`Remove ${tag.replace("-", " ")}`}
                  title={`Remove ${tag.replace("-", " ")}`}
                >
                  <span>{tag.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase())}</span>
                  <X size={14} aria-hidden="true" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="efp-grid">
          {currentFoods.map((food) => {
            const calorieLabel = getCalorieRangeLabel(food.Energy_kcal_ps);
            const calorieClass =
              calorieLabel === "Low"
                ? "efp-badge efp-badge--ok"
                : calorieLabel === "Medium"
                ? "efp-badge efp-badge--warn"
                : "efp-badge efp-badge--high";

            const diff = (food.difficulty || food.difficultyNorm || "").toLowerCase();
            const diffLabel = diff ? diff[0].toUpperCase() + diff.slice(1) : "";
            const diffClass =
              diff === "easy"   ? "efp-badge efp-badge--ok"   :
              diff === "medium" ? "efp-badge efp-badge--warn" :
              diff === "hard"   ? "efp-badge efp-badge--high" :
              "efp-badge";

            return (
              <div
                key={food.foodID}
                className="efp-food-card"
                onClick={() => onFoodSelect(food)}
              >
                <div className="efp-food-media">
                  <img
                    src={food.image}
                    alt={food.name}
                    className="efp-image"
                    loading="lazy"
                  />
                  <div className="efp-badges">
                    {diff && <span className={diffClass} title={`Difficulty: ${diffLabel}`}>{diffLabel}</span>}
                  </div>
                  <div className="efp-badges efp-badges-calorie">
                    <span className={calorieClass}>{calorieLabel} Calorie</span>
                  </div>
                  {food.dietaryTags.includes("vegetarian") && (
                    <span className="efp-badge-topright">V</span>
                  )}
                </div>

                <div className="efp-food-body">
                  <div className="efp-food-headline">
                    <h3 className="efp-food-title">{food.name}</h3>
                    <span className="efp-badge-cat">{food.category}</span>
                  </div>

                  <p className="efp-desc">{food.description}</p>

                  <div className="efp-meta">
                    <span className="muted">Origin: {food.origin}</span>
                    <span className="efp-cal">{Math.round(food.Energy_kcal_ps)} calories</span>
                  </div>

                  <div className="efp-nutri">
                    <div className="efp-nutri-item">
                      <div>{food.Protein_g_ps.toFixed(1)}g</div>
                      <div className="muted">Protein</div>
                    </div>
                    <div className="efp-nutri-item">
                      <div>{food.Carbohydrates_g_ps.toFixed(1)}g</div>
                      <div className="muted">Carbs</div>
                    </div>
                    <div className="efp-nutri-item">
                      <div>{food.Fat_g_ps.toFixed(1)}g</div>
                      <div className="muted">Fat</div>
                    </div>
                  </div>

                  {/* Dietary tags row */}
                  {food.dietaryTags?.length > 0 && (
                    <div className="efp-tags" aria-label={`${food.name} dietary tags`}>
                      {Array.from(new Set(food.dietaryTags)).map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          className="efp-tag"
                          onClick={(e) => {
                            e.stopPropagation(); // don’t trigger card click
                            setSelectedDietaryTags((prev) => (prev.includes(tag) ? prev : [...prev, tag]));
                          }}
                          title={`Filter by ${humanize(tag)}`}
                        >
                          {humanize(tag)}
                        </button>
                      ))}
                    </div>
                  )}

                  <button
                    className="efp-card-cta"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('Navigating to food ID:', food.foodID);
                      
                      if (food.foodID) {
                        navigate(`/fooddetail/${food.foodID}`);
                      } else {
                        console.error('No food ID found');
                      }
                    }}
                  >
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredFoods.length === 0 && (
          <div className="efp-empty">
            <p className="efp-empty-title">No dishes match your criteria</p>
            <p className="efp-empty-sub">Try adjusting your filters</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="efp-pagination">
            <button
              className="efp-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              ‹ Prev
            </button>

            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                className={`efp-btn ${
                  currentPage === i + 1 ? "is-active" : ""
                }`}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}

            <button
              className="efp-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Next ›
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
