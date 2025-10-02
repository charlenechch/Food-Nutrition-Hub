import React, { useMemo, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../css/ExploreFoodPage.css";

/** Simple image with fallback (keeps your figma idea) */
function ImageWithFallback({ src, alt, className }) {
  const [err, setErr] = useState(false);
  const fallback =
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1200&auto=format&fit=crop";
  return (
    <img
      src={err ? fallback : src}
      onError={() => setErr(true)}
      alt={alt}
      className={className}
      loading="lazy"
    />
  );
}

/** ---- i18n strings (EN/MS) ---- */
const content = {
  en: {
    title: "Enhanced Food Discovery",
    subtitle: "Explore Sarawak's culinary heritage with advanced filtering",
    searchPlaceholder: "Search dishes, origins, or ingredients...",
    filters: "Filters",
    clearFilters: "Clear All",
    categories: "Food Categories",
    allCategories: "All Categories",
    culturalOrigin: "Cultural Origin",
    allOrigins: "All Origins",
    calorieRange: "Calorie Range",
    calories: "calories",
    nutritionProfile: "Nutrition Focus",
    dietaryPreferences: "Dietary Preferences",
    foodType: "Food Type",
    difficulty: "Difficulty",
    preparationTime: "Prep Time",
    origin: "Origin",
    viewDetails: "View Details",
    resultsFound: "dishes found",
    noResults: "No dishes match your criteria",
    adjustFilters: "Try adjusting your filters",
    vegetarian: "Vegetarian",
    glutenFree: "Gluten Free",
    dairyFree: "Dairy Free",
    lowFat: "Low Fat",
    highProtein: "High Protein",
    highFiber: "High Fiber",
    spicy: "Spicy",
    paleo: "Paleo",
    mainDish: "Main Dish",
    appetizer: "Appetizer",
    dessert: "Dessert",
    vegetable: "Vegetable",
    preserved: "Preserved",
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
    under30min: "Under 30 min",
    under2hrs: "Under 2 hours",
    over2hrs: "Over 2 hours",
    dayak: "Dayak",
    melanau: "Melanau",
    iban: "Iban",
    bidayuh: "Bidayuh",
    chinese: "Chinese",
    malay: "Malay",
    indigenous: "Indigenous",
    multiEthnic: "Multi-ethnic",
  },
  ms: {
    title: "Penemuan Makanan Dipertingkat",
    subtitle: "Jelajahi warisan kulinari Sarawak dengan penapisan canggih",
    searchPlaceholder: "Cari hidangan, asal-usul, atau bahan...",
    filters: "Penapis",
    clearFilters: "Kosongkan Semua",
    categories: "Kategori Makanan",
    allCategories: "Semua Kategori",
    culturalOrigin: "Asal Budaya",
    allOrigins: "Semua Asal",
    calorieRange: "Julat Kalori",
    calories: "kalori",
    nutritionProfile: "Fokus Nutrisi",
    dietaryPreferences: "Keutamaan Diet",
    foodType: "Jenis Makanan",
    difficulty: "Kesukaran",
    preparationTime: "Masa Penyediaan",
    origin: "Asal",
    viewDetails: "Lihat Butiran",
    resultsFound: "hidangan ditemui",
    noResults: "Tiada hidangan sepadan dengan kriteria",
    adjustFilters: "Cuba laraskan penapis anda",
    vegetarian: "Vegetarian",
    glutenFree: "Bebas Gluten",
    dairyFree: "Bebas Tenusu",
    lowFat: "Rendah Lemak",
    highProtein: "Tinggi Protein",
    highFiber: "Tinggi Serat",
    spicy: "Pedas",
    paleo: "Paleo",
    mainDish: "Hidangan Utama",
    appetizer: "Pembuka Selera",
    dessert: "Pencuci Mulut",
    vegetable: "Sayuran",
    preserved: "Diawet",
    easy: "Mudah",
    medium: "Sederhana",
    hard: "Sukar",
    under30min: "Bawah 30 min",
    under2hrs: "Bawah 2 jam",
    over2hrs: "Lebih 2 jam",
    dayak: "Dayak",
    melanau: "Melanau",
    iban: "Iban",
    bidayuh: "Bidayuh",
    chinese: "Cina",
    malay: "Melayu",
    indigenous: "Orang Asli",
    multiEthnic: "Pelbagai Etnik",
  },
};

/** ---- sample data ---- */
const sarawakFoods = [
  {
    id: 1,
    name: "Manok Pansoh",
    nameMs: "Manok Pansoh",
    category: "Poultry",
    categoryMs: "Unggas",
    origin: "Iban",
    culturalGroup: "Dayak",
    description:
      "Traditional Iban chicken cooked in bamboo with aromatic herbs and spices",
    descriptionMs:
      "Ayam tradisional Iban dimasak dalam buluh dengan rempah ratus wangi",
    image: "https://images.unsplash.com/photo-1643185720431-9c050eebbc9a",
    calories: 285,
    protein: 35,
    carbs: 8,
    fat: 12,
    fiber: 2,
    sodium: 450,
    culturalNote:
      "Cooked during special occasions and festivals, representing unity and tradition",
    culturalNoteMs:
      "Dimasak semasa majlis khas dan perayaan, melambangkan perpaduan dan tradisi",
    dietaryTags: ["gluten-free", "dairy-free"],
    preparationTime: 120,
    difficulty: "medium",
    foodType: "main-dish",
  },
  {
    id: 2,
    name: "Umai",
    nameMs: "Umai",
    category: "Seafood",
    categoryMs: "Makanan Laut",
    origin: "Melanau",
    culturalGroup: "Melanau",
    description: "Fresh fish salad marinated with lime juice, onions, and chilies",
    descriptionMs: "Salad ikan segar dengan jus limau, bawang, dan cili",
    image: "https://images.unsplash.com/photo-1612755657417-9c6885e5ece9",
    calories: 165,
    protein: 28,
    carbs: 6,
    fat: 3,
    fiber: 1,
    sodium: 320,
    culturalNote:
      "A celebration dish that showcases the Melanau fishing heritage",
    culturalNoteMs:
      "Hidangan perayaan yang menunjukkan warisan nelayan Melanau",
    dietaryTags: ["gluten-free", "dairy-free", "low-fat"],
    preparationTime: 30,
    difficulty: "easy",
    foodType: "appetizer",
  },
  {
    id: 3,
    name: "Kasam Babi",
    nameMs: "Kasam Babi",
    category: "Fermented",
    categoryMs: "Penapaian",
    origin: "Dayak",
    culturalGroup: "Dayak",
    description:
      "Fermented pork with salt and rice wine, aged for several months",
    descriptionMs: "Daging babi yang ditapai dengan garam dan tuak, disimpan beberapa bulan",
    image: "https://images.unsplash.com/photo-1658218615053-955e8af55947",
    calories: 320,
    protein: 42,
    carbs: 2,
    fat: 15,
    fiber: 0,
    sodium: 890,
    culturalNote:
      "A preserved delicacy passed down through generations of Dayak communities",
    culturalNoteMs:
      "Makanan istimewa yang diwariskan turun-temurun dalam masyarakat Dayak",
    dietaryTags: ["gluten-free", "dairy-free", "high-protein"],
    preparationTime: 1440,
    difficulty: "hard",
    foodType: "preserved",
  },
  {
    id: 4,
    name: "Midin Belacan",
    nameMs: "Midin Belacan",
    category: "Vegetables",
    categoryMs: "Sayuran",
    origin: "Native",
    culturalGroup: "Indigenous",
    description: "Jungle fern stir-fried with shrimp paste and chilies",
    descriptionMs: "Paku hutan ditumis dengan belacan dan cili",
    image: "https://images.unsplash.com/photo-1741004580357-15d116ef4ba3",
    calories: 95,
    protein: 8,
    carbs: 12,
    fat: 4,
    fiber: 5,
    sodium: 280,
    culturalNote:
      "Foraged from Borneo rainforests, representing sustainable indigenous cuisine",
    culturalNoteMs:
      "Dipetik dari hutan hujan Borneo, mewakili masakan asli yang mampan",
    dietaryTags: ["vegetarian", "gluten-free", "dairy-free", "high-fiber"],
    preparationTime: 15,
    difficulty: "easy",
    foodType: "vegetable",
  },
  {
    id: 5,
    name: "Linut",
    nameMs: "Linut",
    category: "Dessert",
    categoryMs: "Pencuci Mulut",
    origin: "Bidayuh",
    culturalGroup: "Dayak",
    description:
      "Sticky rice balls served with grated coconut and palm sugar",
    descriptionMs: "Bebola pulut dengan kelapa parut dan gula kabung",
    image: "https://images.unsplash.com/photo-1708597523963-40b30f846281",
    calories: 210,
    protein: 4,
    carbs: 42,
    fat: 6,
    fiber: 2,
    sodium: 15,
    culturalNote:
      "Traditional Bidayuh dessert served during harvest festivals",
    culturalNoteMs:
      "Pencuci mulut tradisional Bidayuh dihidang semasa festival menuai",
    dietaryTags: ["vegetarian", "gluten-free", "dairy-free"],
    preparationTime: 60,
    difficulty: "medium",
    foodType: "dessert",
  },
  {
    id: 6,
    name: "Bubur Pedas",
    nameMs: "Bubur Pedas",
    category: "Rice Dish",
    categoryMs: "Hidangan Beras",
    origin: "Dayak",
    culturalGroup: "Dayak",
    description:
      "Spicy rice porridge cooked with coconut milk and aromatic spices",
    descriptionMs: "Bubur beras pedas dimasak dengan santan dan rempah ratus",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b",
    calories: 245,
    protein: 12,
    carbs: 38,
    fat: 8,
    fiber: 3,
    sodium: 520,
    culturalNote: "Communal dish prepared during Gawai celebrations",
    culturalNoteMs: "Hidangan berkongsi yang disediakan semasa perayaan Gawai",
    dietaryTags: ["gluten-free", "spicy"],
    preparationTime: 180,
    difficulty: "medium",
    foodType: "main-dish",
  },
  {
    id: 7,
    name: "Ayam Pansuh",
    nameMs: "Ayam Pansuh",
    category: "Poultry",
    categoryMs: "Unggas",
    origin: "Dayak",
    culturalGroup: "Dayak",
    description: "Chicken cooked in bamboo with lemongrass and tapioca leaves",
    descriptionMs: "Ayam dimasak dalam buluh dengan serai dan daun ubi",
    image: "https://images.unsplash.com/photo-1598103442097-8b74394b95c6",
    calories: 290,
    protein: 32,
    carbs: 5,
    fat: 14,
    fiber: 1,
    sodium: 380,
    culturalNote: "Ancient cooking method preserving authentic flavors",
    culturalNoteMs: "Kaedah masakan kuno yang mengekalkan rasa asli",
    dietaryTags: ["gluten-free", "dairy-free", "paleo"],
    preparationTime: 150,
    difficulty: "hard",
    foodType: "main-dish",
  },
  {
    id: 8,
    name: "Kek Lapis Sarawak",
    nameMs: "Kek Lapis Sarawak",
    category: "Dessert",
    categoryMs: "Pencuci Mulut",
    origin: "Chinese-Malay",
    culturalGroup: "Multi-ethnic",
    description:
      "Colorful layered cake with intricate patterns and flavors",
    descriptionMs:
      "Kek berlapis berwarna-warni dengan corak dan rasa yang rumit",
    image: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e",
    calories: 385,
    protein: 6,
    carbs: 52,
    fat: 18,
    fiber: 1,
    sodium: 220,
    culturalNote:
      "Modern Sarawakian innovation blending cultural influences",
    culturalNoteMs:
      "Inovasi moden Sarawak yang menggabungkan pengaruh budaya",
    dietaryTags: ["vegetarian"],
    preparationTime: 240,
    difficulty: "hard",
    foodType: "dessert",
  },
];

/** ---- page component ---- */
export default function ExploreFoodPage({
  language = "en",
  onFoodSelect = () => {},
}) {
  const t = content[language];

  // ---- filters state ----
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedOrigin, setSelectedOrigin] = useState("all");
  const [calorieRange, setCalorieRange] = useState([0, 500]);
  const [selectedDietaryTags, setSelectedDietaryTags] = useState([]);
  const [selectedFoodType, setSelectedFoodType] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [selectedPrepTime, setSelectedPrepTime] = useState("all");
  const [nutritionFocus, setNutritionFocus] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const categories = [
    { id: "all", name: t.allCategories },
    { id: "Poultry", name: language === "en" ? "Poultry" : "Unggas" },
    { id: "Seafood", name: language === "en" ? "Seafood" : "Makanan Laut" },
    { id: "Vegetables", name: language === "en" ? "Vegetables" : "Sayuran" },
    { id: "Fermented", name: language === "en" ? "Fermented" : "Penapaian" },
    { id: "Dessert", name: language === "en" ? "Dessert" : "Pencuci Mulut" },
    { id: "Rice Dish", name: language === "en" ? "Rice Dish" : "Hidangan Beras" },
  ];

  const origins = [
    { id: "all", name: t.allOrigins },
    { id: "Dayak", name: t.dayak },
    { id: "Melanau", name: t.melanau },
    { id: "Iban", name: t.iban },
    { id: "Bidayuh", name: t.bidayuh },
    { id: "Native", name: t.indigenous },
    { id: "Chinese-Malay", name: t.multiEthnic },
  ];

  const dietaryOptions = [
    { id: "vegetarian", name: t.vegetarian },
    { id: "gluten-free", name: t.glutenFree },
    { id: "dairy-free", name: t.dairyFree },
    { id: "low-fat", name: t.lowFat },
    { id: "high-protein", name: t.highProtein },
    { id: "high-fiber", name: t.highFiber },
    { id: "spicy", name: t.spicy },
    { id: "paleo", name: t.paleo },
  ];

  const foodTypes = [
    { id: "all", name: t.allCategories },
    { id: "main-dish", name: t.mainDish },
    { id: "appetizer", name: t.appetizer },
    { id: "dessert", name: t.dessert },
    { id: "vegetable", name: t.vegetable },
    { id: "preserved", name: t.preserved },
  ];

  const difficulties = [
    { id: "all", name: t.allCategories },
    { id: "easy", name: t.easy },
    { id: "medium", name: t.medium },
    { id: "hard", name: t.hard },
  ];

  const prepTimes = [
    { id: "all", name: t.allCategories },
    { id: "under30", name: t.under30min },
    { id: "under120", name: t.under2hrs },
    { id: "over120", name: t.over2hrs },
  ];

  const toggleDietaryTag = (tag) => {
    setSelectedDietaryTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedOrigin("all");
    setCalorieRange([0, 500]);
    setSelectedDietaryTags([]);
    setSelectedFoodType("all");
    setSelectedDifficulty("all");
    setSelectedPrepTime("all");
    setNutritionFocus("all");
  };

  const filteredFoods = useMemo(() => {
    return sarawakFoods.filter((food) => {
      // search (by name or origin/cultural group)
      const text = (language === "en" ? food.name : food.nameMs).toLowerCase();
      const matchesSearch =
        text.includes(searchQuery.toLowerCase()) ||
        food.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
        food.culturalGroup.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "all" || food.category === selectedCategory;

      const matchesOrigin =
        selectedOrigin === "all" ||
        food.origin === selectedOrigin ||
        food.culturalGroup === selectedOrigin;

      const matchesCalories =
        food.calories >= calorieRange[0] && food.calories <= calorieRange[1];

      const matchesDietary =
        selectedDietaryTags.length === 0 ||
        selectedDietaryTags.every((tag) => food.dietaryTags.includes(tag));

      const matchesFoodType =
        selectedFoodType === "all" || food.foodType === selectedFoodType;

      const matchesDifficulty =
        selectedDifficulty === "all" || food.difficulty === selectedDifficulty;

      const matchesPrepTime =
        selectedPrepTime === "all" ||
        (selectedPrepTime === "under30" && food.preparationTime <= 30) ||
        (selectedPrepTime === "under120" && food.preparationTime <= 120) ||
        (selectedPrepTime === "over120" && food.preparationTime > 120);

      const matchesNutrition =
        nutritionFocus === "all" ||
        (nutritionFocus === "high-protein" && food.protein >= 25) ||
        (nutritionFocus === "low-fat" && food.fat <= 5) ||
        (nutritionFocus === "high-fiber" && food.fiber >= 4);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesOrigin &&
        matchesCalories &&
        matchesDietary &&
        matchesFoodType &&
        matchesDifficulty &&
        matchesPrepTime &&
        matchesNutrition
      );
    });
  }, [
    language,
    searchQuery,
    selectedCategory,
    selectedOrigin,
    calorieRange,
    selectedDietaryTags,
    selectedFoodType,
    selectedDifficulty,
    selectedPrepTime,
    nutritionFocus,
  ]);

  const getCalorieRangeLabel = (cal) => {
    if (cal < 150) return "Low";
    if (cal < 300) return "Medium";
    return "High";
  };

  return (
    <div className="explore-page">
      <Header />

      <main className="ef-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="ef-title">{t.title}</h1>
          <p className="ef-subtitle">{t.subtitle}</p>
        </div>

        {/* Search + actions */}
        <div className="ef-card ef-controls bg-white border rounded-xl shadow-sm mb-6">
          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="ef-input"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowFilters((s) => !s)}
                className="ef-btn"
              >
                {t.filters}
              </button>
              <button
                onClick={clearAllFilters}
                className="ef-btn"
              >
                {t.clearFilters}
              </button>
            </div>
          </div>

          {/* quick categories */}
          <div className="flex flex-wrap gap-2 mt-4">
            {categories.slice(0, 6).map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`ef-chip ${selectedCategory === c.id ? "is-active" : ""
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Advanced filters */}
        {showFilters && (
          <div className="ef-card ef-filters">
            {/* 1) Top row: Origin, Food type, Nutrition focus */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Origin */}
              <div>
                <label className="ef-section-title">{t.culturalOrigin}</label>
                <select
                  value={selectedOrigin}
                  onChange={(e) => setSelectedOrigin(e.target.value)}
                  className="ef-select"
                >
                  {origins.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Food type */}
              <div>
                <label className="ef-section-title">{t.foodType}</label>
                <select
                  value={selectedFoodType}
                  onChange={(e) => setSelectedFoodType(e.target.value)}
                  className="ef-select"
                >
                  {foodTypes.map((ft) => (
                    <option key={ft.id} value={ft.id}>
                      {ft.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nutrition focus */}
              <div>
                <label className="ef-section-title">{t.nutritionProfile}</label>
                <select
                  value={nutritionFocus}
                  onChange={(e) => setNutritionFocus(e.target.value)}
                  className="ef-select"
                >
                  {[
                    { id: "all", name: t.allCategories },
                    { id: "high-protein", name: t.highProtein },
                    { id: "low-fat", name: t.lowFat },
                    { id: "high-fiber", name: t.highFiber },
                  ].map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <hr className="ef-sep" />

            {/* 2) Calories (dual range sliders) */}
            <div>
              <label className="ef-section-title">
                {t.calorieRange}: {calorieRange[0]} - {calorieRange[1]} {t.calories}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={500}
                  step={25}
                  value={calorieRange[0]}
                  onChange={(e) =>
                    setCalorieRange([Number(e.target.value), calorieRange[1]])
                  }
                  className="ef-range"
                  aria-label="Minimum calories"
                />
                <input
                  type="range"
                  min={0}
                  max={500}
                  step={25}
                  value={calorieRange[1]}
                  onChange={(e) =>
                    setCalorieRange([calorieRange[0], Number(e.target.value)])
                  }
                  className="ef-range"
                  aria-label="Maximum calories"
                />
              </div>
            </div>

            <hr className="ef-sep" />

            {/* 3) Dietary preferences */}
            <div>
              <label className="ef-section-title">{t.dietaryPreferences}</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {dietaryOptions.map((opt) => (
                  <label key={opt.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="ef-checkbox"
                      checked={selectedDietaryTags.includes(opt.id)}
                      onChange={() => toggleDietaryTag(opt.id)}
                    />
                    {opt.name}
                  </label>
                ))}
              </div>
            </div>

            <hr className="ef-sep" />

            {/* 4) Difficulty + Prep time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="ef-section-title">{t.difficulty}</label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="ef-select"
                >
                  {[
                    { id: "all", name: t.allCategories },
                    { id: "easy", name: t.easy },
                    { id: "medium", name: t.medium },
                    { id: "hard", name: t.hard },
                  ].map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="ef-section-title">{t.preparationTime}</label>
                <select
                  value={selectedPrepTime}
                  onChange={(e) => setSelectedPrepTime(e.target.value)}
                  className="ef-select"
                >
                  {[
                    { id: "all", name: t.allCategories },
                    { id: "under30", name: t.under30min },
                    { id: "under120", name: t.under2hrs },
                    { id: "over120", name: t.over2hrs },
                  ].map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}


        {/* Results header */}
        <div className="ef-result-head">
          <p className="ef-results-count">
            {filteredFoods.length} {t.resultsFound}
          </p>

          {selectedDietaryTags.length > 0 && (
            <div className="ef-active-chips">
              {selectedDietaryTags.map((tag) => {
                const name = dietaryOptions.find((opt) => opt.id === tag)?.name || tag;
                return (
                  <span key={tag} className="ef-chip ef-chip--removable">
                    {name}
                    <button
                      type="button"
                      className="ef-chip-remove"
                      aria-label={`remove ${name}`}
                      onClick={() => toggleDietaryTag(tag)}
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
          )}
        </div>


        {/* Food grid */}
        <div className="ef-grid">
          {filteredFoods.map((food) => {
            const calorieLabel = getCalorieRangeLabel(food.calories); // "Low" | "Medium" | "High"
            const calorieClass =
              calorieLabel === "Low"
                ? "ef-badge ef-badge--ok"
                : calorieLabel === "Medium"
                ? "ef-badge ef-badge--warn"
                : "ef-badge ef-badge--high";

            return (
              <div
                key={food.id}
                className="ef-food-card"
                onClick={() => onFoodSelect(food)}
              >
                {/* media */}
                <div className="ef-food-media">
                  <ImageWithFallback
                    src={food.image}
                    alt={language === "en" ? food.name : food.nameMs}
                    className="" /* ef-food-media already sizes the image */
                  />

                  {/* badges on image */}
                  <div className="ef-badges">
                    <span className="ef-badge">{food.origin}</span>
                    <span className={calorieClass}>{calorieLabel}</span>
                  </div>

                  {/* vegetarian mark (top-right) */}
                  {food.dietaryTags.includes("vegetarian") && (
                    <span className="ef-badge-topright">V</span>
                  )}
                </div>

                {/* body */}
                <div className="ef-food-body">
                  <div className="ef-food-headline">
                    <h3 className="ef-food-title">
                      {language === "en" ? food.name : food.nameMs}
                    </h3>
                    <span className="ef-badge-cat">
                      {language === "en" ? food.category : food.categoryMs}
                    </span>
                  </div>

                  <p className="ef-desc">
                    {language === "en" ? food.description : food.descriptionMs}
                  </p>

                  <div className="ef-meta">
                    <span className="muted">
                      {t.origin}: {food.culturalGroup}
                    </span>
                    <span className="ef-cal">
                      {food.calories} {t.calories}
                    </span>
                  </div>

                  {/* nutrition quick view */}
                  <div className="ef-nutri">
                    <div className="ef-nutri-item">
                      <div>{food.protein}g</div>
                      <div className="muted">Protein</div>
                    </div>
                    <div className="ef-nutri-item">
                      <div>{food.carbs}g</div>
                      <div className="muted">Carbs</div>
                    </div>
                    <div className="ef-nutri-item">
                      <div>{food.fat}g</div>
                      <div className="muted">Fat</div>
                    </div>
                  </div>

                  {/* dietary tags */}
                  {food.dietaryTags.length > 0 && (
                    <div className="ef-tags">
                      {food.dietaryTags.slice(0, 3).map((tag) => (
                        <span key={tag} className="ef-tag">
                          {dietaryOptions.find((o) => o.id === tag)?.name}
                        </span>
                      ))}
                      {food.dietaryTags.length > 3 && (
                        <span className="ef-tag">+{food.dietaryTags.length - 3}</span>
                      )}
                    </div>
                  )}

                  <button
                    className="ef-card-cta"
                    onClick={(e) => {
                      e.stopPropagation();
                      onFoodSelect(food);
                    }}
                  >
                    {t.viewDetails}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty state */}
        {filteredFoods.length === 0 && (
          <div className="ef-empty">
            <p className="text-lg mb-2">{t.noResults}</p>
            <p className="text-sm">{t.adjustFilters}</p>
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
