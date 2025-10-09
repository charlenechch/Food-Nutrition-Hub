import React, { useMemo, useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../css/ExploreFoodPage.css";

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
    dietaryTags: [
      "vegetarian",
      "gluten-free",
      "dairy-free",
      "high-fiber",
    ],
    preparationTime: 15,
    difficulty: "easy",
    foodType: "vegetable",
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
  },
];

export default function ExploreFoodPage({ onFoodSelect = () => {} }) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedOrigin, setSelectedOrigin] = useState("all");
  const [calorieRange, setCalorieRange] = useState([0, 500]);
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [nutritionFocus, setNutritionFocus] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const filteredFoods = useMemo(() => {
    return sarawakFoods.filter((food) => {
      const matchesSearch =
        food.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        food.origin.toLowerCase().includes(searchQuery.toLowerCase());

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

      return (
        matchesSearch &&
        matchesCategory &&
        matchesOrigin &&
        matchesCalories &&
        matchesDifficulty &&
        matchesNutrition
      );
    });
  }, [
    searchQuery,
    selectedCategory,
    selectedOrigin,
    calorieRange,
    selectedDifficulty,
    nutritionFocus,
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
  ]);

  const getCalorieRangeLabel = (cal) => {
    if (cal < 150) return "Low";
    if (cal < 300) return "Medium";
    return "High";
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
                Filters
              </button>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                  setSelectedOrigin("all");
                  setCalorieRange([0, 500]);
                  setSelectedDifficulty("all");
                  setNutritionFocus("all");
                }}
                className="efp-btn"
              >
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

          {/* Expanded Filter Panel */}
          {showFilters && (
            <div className="efp-filters">
              <div className="efp-filter-item">
                <label>Origin</label>
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
                <label>Difficulty</label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="efp-select"
                >
                  <option value="all">All Levels</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div className="efp-filter-item">
                <label>Nutrition Focus</label>
                <select
                  value={nutritionFocus}
                  onChange={(e) => setNutritionFocus(e.target.value)}
                  className="efp-select"
                >
                  <option value="all">All</option>
                  <option value="high-protein">High Protein</option>
                  <option value="low-fat">Low Fat</option>
                  <option value="high-fiber">High Fiber</option>
                </select>
              </div>

              <div className="efp-filter-item efp-filter-wide">
                <label>
                  Calories (max): <b>{calorieRange[1]} kcal</b>
                </label>
                <input
                  type="range"
                  min="0"
                  max="500"
                  value={calorieRange[1]}
                  onChange={(e) =>
                    setCalorieRange([0, Number(e.target.value)])
                  }
                  className="efp-range"
                />
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="efp-result-head">
          <p className="efp-results-count">
            {filteredFoods.length} dishes found
          </p>
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
