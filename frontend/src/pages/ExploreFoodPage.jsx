import React, { useMemo, useState, useEffect, useRef, useLayoutEffect, useCallback } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../css/ExploreFoodPage.css";
import { Filter, Sliders, X } from "lucide-react";

const sarawakFoods = [
  {
    id: 1,
    name: "Manok Pansoh",
    category: "Poultry",
    origin: "Iban",
    description:
      "Traditional Iban chicken cooked in bamboo with aromatic herbs and spices",
    image: "https://images.unsplash.com/photo-1643185720431-9c050eebbc9a",
    calories: 285,
    protein: 35,
    carbs: 8,
    fat: 12,
    fiber: 2,
    sodium: 450,
    dietaryTags: ["gluten-free", "dairy-free"],
    preparationTime: 120,
    difficulty: "medium",
    foodType: "main-dish",
    ingredients: [
      "chicken",
      "lemongrass",
      "ginger",
      "garlic",
      "bamboo",
      "salt",
      "tapioca leaves",
      "shallots"
    ],
  },
  {
    id: 2,
    name: "Umai",
    category: "Seafood",
    origin: "Melanau",
    description:
      "Fresh fish salad marinated with lime juice, onions, and chilies",
    image: "https://images.unsplash.com/photo-1612755657417-9c6885e5ece9",
    calories: 165,
    protein: 28,
    carbs: 6,
    fat: 3,
    fiber: 1,
    sodium: 320,
    dietaryTags: ["gluten-free", "dairy-free", "low-fat"],
    preparationTime: 30,
    difficulty: "easy",
    foodType: "appetizer",
    ingredients: [
      "fresh fish",
      "lime juice",
      "onion",
      "chili",
      "salt",
      "sugar",
      "ginger",
      "coriander leaves"
    ],
  },
  {
    id: 3,
    name: "Kasam Babi",
    category: "Fermented",
    origin: "Dayak",
    description:
      "Fermented pork with salt and rice wine, aged for several months",
    image: "https://images.unsplash.com/photo-1658218615053-955e8af55947",
    calories: 320,
    protein: 42,
    carbs: 2,
    fat: 15,
    fiber: 0,
    sodium: 890,
    dietaryTags: ["gluten-free", "dairy-free", "high-protein"],
    preparationTime: 1440,
    difficulty: "hard",
    foodType: "preserved",
    ingredients: [
      "pork",
      "salt",
      "rice wine",
      "garlic",
      "ginger",
      "pepper",
      "onion",
      "sugar"
    ],
  },
  {
    id: 4,
    name: "Midin Belacan",
    category: "Vegetables",
    origin: "Native",
    description: "Jungle fern stir-fried with shrimp paste and chilies",
    image: "https://images.unsplash.com/photo-1741004580357-15d116ef4ba3",
    calories: 95,
    protein: 8,
    carbs: 12,
    fat: 4,
    fiber: 5,
    sodium: 280,
    dietaryTags: ["vegetarian", "gluten-free", "dairy-free", "high-fiber"],
    preparationTime: 15,
    difficulty: "easy",
    foodType: "vegetable",
    ingredients: [
      "midin fern",
      "belacan (shrimp paste)",
      "garlic",
      "chili",
      "onion",
      "salt",
      "oil"
    ],
  },
  {
    id: 5,
    name: "Linut",
    category: "Dessert",
    origin: "Bidayuh",
    description: "Sticky rice balls served with grated coconut and palm sugar",
    image: "https://images.unsplash.com/photo-1708597523963-40b30f846281",
    calories: 210,
    protein: 4,
    carbs: 42,
    fat: 6,
    fiber: 2,
    sodium: 15,
    dietaryTags: ["vegetarian", "gluten-free", "dairy-free"],
    preparationTime: 60,
    difficulty: "medium",
    foodType: "dessert",
    ingredients: [
      "sago starch",
      "boiling water",
      "grated coconut",
      "palm sugar",
      "salt"
    ],
  },
  {
    id: 6,
    name: "Bubur Pedas",
    category: "Rice Dish",
    origin: "Dayak",
    description:
      "Spicy rice porridge cooked with coconut milk and aromatic spices",
    image:
      "https://munchmalaysia.com/wp-content/uploads/2023/11/sarawak-spicy-porridge.jpg",
    calories: 245,
    protein: 12,
    carbs: 38,
    fat: 8,
    fiber: 3,
    sodium: 520,
    dietaryTags: ["gluten-free", "spicy"],
    preparationTime: 180,
    difficulty: "medium",
    foodType: "main-dish",
    ingredients: [
      "rice",
      "coconut milk",
      "lemongrass",
      "shallots",
      "chili paste",
      "ginger",
      "turmeric",
      "beef",
      "carrot",
      "celery"
    ],
  },
  {
    id: 7,
    name: "Ayam Pansuh",
    category: "Poultry",
    origin: "Dayak",
    description: "Chicken cooked in bamboo with lemongrass and tapioca leaves",
    image: "https://images.unsplash.com/photo-1598103442097-8b74394b95c6",
    calories: 290,
    protein: 32,
    carbs: 5,
    fat: 14,
    fiber: 1,
    sodium: 380,
    dietaryTags: ["gluten-free", "dairy-free", "paleo"],
    preparationTime: 150,
    difficulty: "hard",
    foodType: "main-dish",
    ingredients: [
      "chicken",
      "bamboo",
      "lemongrass",
      "ginger",
      "garlic",
      "tapioca leaves",
      "salt"
    ],
  },
  {
    id: 8,
    name: "Kek Lapis Sarawak",
    category: "Dessert",
    origin: "Chinese-Malay",
    description:
      "Colorful layered cake with intricate patterns and flavors",
    image: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e",
    calories: 385,
    protein: 6,
    carbs: 52,
    fat: 18,
    fiber: 1,
    sodium: 220,
    dietaryTags: ["vegetarian"],
    preparationTime: 240,
    difficulty: "hard",
    foodType: "dessert",
    ingredients: [
      "butter",
      "flour",
      "eggs",
      "condensed milk",
      "sugar",
      "food coloring",
      "spices",
      "vanilla extract"
    ],
  },
  {
    id: 9,
    name: "Laksa Sarawak",
    category: "Noodles",
    origin: "Chinese-Malay",
    description:
      "Rich and spicy noodle soup made with rice vermicelli, coconut milk, prawns, chicken, and sambal belacan.",
    image:
      "https://asianinspirations.com.au/wp-content/uploads/2018/08/R01024_Sarawak-Laksa-940x627.jpg",
    calories: 430,
    protein: 24,
    carbs: 48,
    fat: 18,
    fiber: 3,
    sodium: 720,
    dietaryTags: ["spicy", "dairy-free"],
    preparationTime: 60,
    difficulty: "medium",
    foodType: "main-dish",
    ingredients: [
      "rice vermicelli",
      "coconut milk",
      "prawns",
      "chicken",
      "bean sprouts",
      "egg",
      "sambal belacan",
      "lime",
      "spices"
    ],
  },
  {
    id: 10,
    name: "Terung Dayak Soup",
    category: "Soup",
    origin: "Dayak",
    description:
      "Sour soup made from native yellow eggplant (Terung Dayak) cooked with lemongrass and dried fish or prawns.",
    image:
      "https://www.periuk.my/static/54323c3fc953cc12ea8264c2fd746856/f6085/PRec-Terung-Dayak-with-Mackerel.jpg",
    calories: 180,
    protein: 10,
    carbs: 15,
    fat: 6,
    fiber: 4,
    sodium: 300,
    dietaryTags: ["gluten-free", "dairy-free", "high-fiber"],
    preparationTime: 40,
    difficulty: "easy",
    foodType: "side-dish",
    ingredients: [
      "terung dayak (yellow eggplant)",
      "lemongrass",
      "dried prawns",
      "garlic",
      "onion",
      "salt",
      "oil",
      "turmeric"
    ],
  },
];

export default function ExploreFoodPage({ onFoodSelect = () => {} }) {
  // Dynamically derive the max calories from the dataset
  const rawCalMax = useMemo(
    () => sarawakFoods.reduce((m, f) => Math.max(m, f.calories), 0),
    []
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

  useEffect(() => {
    setCalorieRange(([lo, hi]) => [Math.min(lo, calMax), Math.min(hi, calMax)]);
  }, [calMax]);

  useEffect(() => {
    setMinCalInput(String(calorieRange[0]));
    setMaxCalInput(String(calorieRange[1]));
  }, [calorieRange]);

  const filteredFoods = useMemo(() => {
    return sarawakFoods.filter((food) => {
      const matchesSearch =
        food.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        food.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (food.ingredients &&
          food.ingredients.join(" ").toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        selectedCategory === "all" || food.category === selectedCategory;

      const matchesOrigin =
        selectedOrigin === "all" || food.origin === selectedOrigin;

      const matchesCalories =
        food.calories >= calorieRange[0] && food.calories <= calorieRange[1];

      const matchesDifficulty =
        selectedDifficulty === "all" || food.difficulty === selectedDifficulty;

      const matchesNutrition =
        nutritionFocus === "all" ||
        (nutritionFocus === "high-protein" && food.protein >= 25) ||
        (nutritionFocus === "low-fat" && food.fat <= 5) ||
        (nutritionFocus === "high-fiber" && food.fiber >= 4);
      
      const matchesFoodType =
        selectedFoodType === "all" || food.foodType === selectedFoodType;

      const matchesPrepTime =
        selectedPrepTime === "all" ||
        (selectedPrepTime === "under30" && food.preparationTime <= 30) ||
        (selectedPrepTime === "under120" && food.preparationTime <= 120) ||
        (selectedPrepTime === "over120" && food.preparationTime > 120);

      const matchesDietary =
        selectedDietaryTags.length === 0 ||
        selectedDietaryTags.every((tag) => food.dietaryTags.includes(tag));

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
  }, [
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

  useEffect(() => {
    setCurrentPage(1);
  }, [
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
    if (cal < 150) return "Low";
    if (cal < 300) return "Medium";
    return "High";
  };

  // Dual-range slider config
  const STEP = 5;
  const MIN_GAP = 10; // minimum distance between thumbs (calories)

  const pct = (v) => calMax === calMin ? 0 : ((v - calMin) * 100) / (calMax - calMin);

  const clampToStep = (v) => Math.round(v / STEP) * STEP;

  const commitMin = () => {
    let raw = parseInt(minCalInput, 10);
    if (Number.isNaN(raw)) raw = calMin;
    raw = clampToStep(raw);
    const clamped = Math.max(calMin, Math.min(raw, calorieRange[1] - MIN_GAP));
    setCalorieRange([clamped, calorieRange[1]]);
    setMinCalInput(String(clamped)); // normalize display
  };

  const commitMax = () => {
    let raw = parseInt(maxCalInput, 10);
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
  const trackRef     = useRef(null); 
  const progressRef  = useRef(null); 

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
                    <option value="Chinese-Malay">Chinese-Malay</option>
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
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
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
            const calorieLabel = getCalorieRangeLabel(food.calories);
            const calorieClass =
              calorieLabel === "Low"
                ? "efp-badge efp-badge--ok"
                : calorieLabel === "Medium"
                ? "efp-badge efp-badge--warn"
                : "efp-badge efp-badge--high";

            return (
              <div
                key={food.id}
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
                    <span className={calorieClass}>{calorieLabel}</span>
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
                    <span className="efp-cal">{food.calories} calories</span>
                  </div>

                  <div className="efp-nutri">
                    <div className="efp-nutri-item">
                      <div>{food.protein}g</div>
                      <div className="muted">Protein</div>
                    </div>
                    <div className="efp-nutri-item">
                      <div>{food.carbs}g</div>
                      <div className="muted">Carbs</div>
                    </div>
                    <div className="efp-nutri-item">
                      <div>{food.fat}g</div>
                      <div className="muted">Fat</div>
                    </div>
                  </div>

                  {/* Dietary tags row */}
                  {food.dietaryTags?.length > 0 && (
                    <div className="efp-tags" aria-label={`${food.name} dietary tags`}>
                      {food.dietaryTags.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          className="efp-tag"
                          onClick={(e) => {
                            e.stopPropagation(); // don’t trigger card click
                            setSelectedDietaryTags((prev) => (prev.includes(tag) ? prev : [...prev, tag]));
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
                    onClick={(e) => {
                      e.stopPropagation();
                      onFoodSelect(food);
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
