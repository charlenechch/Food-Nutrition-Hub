import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useSearchParams  } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../css/RecipesPage.css";
import { FaCamera } from "react-icons/fa";
import { Filter, Sliders, X } from "lucide-react";

// Seed data (you can replace with API later)
// Seed data for RecipesPage (derived from sarawakFoods)
const SEED = [
  {
    id: 1,
    name: "Manok Pansoh",
    origin: "Iban",
    difficulty: "Medium",
    prepTime: 30,
    cookTime: 120,
    servings: 4,
    image: "https://images.unsplash.com/photo-1643185720431-9c050eebbc9a",
    description:
      "Traditional Iban chicken cooked in bamboo with aromatic herbs and spices",
    foodType: "Poultry",
    dietaryTags: ["gluten-free", "dairy-free"],
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
    instructions: [
      "Clean and cut chicken into pieces.",
      "Season with salt and aromatics; stuff into bamboo with tapioca leaves.",
      "Seal the bamboo and cook slowly over fire/heat until tender.",
      "Rest 10 minutes, then split bamboo and serve hot."
    ],
    funFact:
      "Commonly served during Gawai and family gatherings; symbolizes sharing and community.",
    chefTips:
      "Seasoned chicken is stuffed into bamboo with herbs and tapioca leaves, sealed, and slow-cooked over fire."
  },
  {
    id: 2,
    name: "Umai",
    origin: "Melanau",
    difficulty: "Easy",
    prepTime: 20,
    cookTime: 0,
    servings: 4,
    image: "https://images.unsplash.com/photo-1612755657417-9c6885e5ece9",
    description:
      "Fresh fish salad marinated with lime juice, onions, and chilies",
    foodType: "Seafood",
    dietaryTags: ["gluten-free", "dairy-free", "low-fat"],
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
    instructions: [
      "Slice very fresh fish thinly.",
      "Marinate briefly in lime juice until opaque.",
      "Toss with onions, chilies, and seasonings.",
      "Garnish with coriander and serve immediately."
    ],
    funFact:
      "A coastal staple among Melanau communities, often eaten fresh after fishing.",
    chefTips:
      "Thinly slice very fresh fish; marinate in lime juice, then toss with onions, chilies, and seasoning. No heat used."
  },
  {
    id: 3,
    name: "Kasam Babi",
    origin: "Dayak",
    difficulty: "Hard",
    prepTime: 60,
    cookTime: 30,
    servings: 4,
    image: "https://images.unsplash.com/photo-1658218615053-955e8af55947",
    description:
      "Fermented pork with salt and rice wine, aged for several months",
    foodType: "Fermented",
    dietaryTags: ["gluten-free", "dairy-free", "high-protein"],
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
    instructions: [
      "Cut pork and cure with salt, spices, and rice wine.",
      "Pack tightly in a clean jar; ferment for weeks to months.",
      "Rinse lightly, then cook to serve (stir-fry or stew).",
      "Serve with rice and fresh chilies."
    ],
    funFact:
      "Preservation technique for meat, providing food security and distinctive festive flavors.",
    chefTips:
      "Cure pork with salt and tuak, pack tightly in sealed jars, and ferment before cooking."
  },
  {
    id: 4,
    name: "Midin Belacan",
    origin: "Native",
    difficulty: "Easy",
    prepTime: 10,
    cookTime: 5,
    servings: 4,
    image: "https://images.unsplash.com/photo-1741004580357-15d116ef4ba3",
    description: "Jungle fern stir-fried with shrimp paste and chilies",
    foodType: "Vegetables",
    dietaryTags: ["vegetarian", "gluten-free", "dairy-free", "high-fiber"],
    ingredients: [
      "midin fern",
      "belacan (shrimp paste)",
      "garlic",
      "chili",
      "onion",
      "salt",
      "oil"
    ],
    instructions: [
      "Rinse young midin tips; drain well.",
      "Pound or mix belacan with chili and aromatics.",
      "Stir-fry aromatics on high heat; add midin and toss quickly.",
      "Season and serve crisp-tender."
    ],
    funFact:
      "Beloved local vegetable highlighting Sarawak’s rainforest produce; common in kopitiams and home cooking.",
    chefTips:
      "Rinse young fern tips; stir-fry quickly on high heat with belacan, garlic, and chilies to keep them crisp."
  },
  {
    id: 5,
    name: "Linut",
    origin: "Bidayuh",
    difficulty: "Medium",
    prepTime: 20,
    cookTime: 40,
    servings: 4,
    image: "https://images.unsplash.com/photo-1708597523963-40b30f846281",
    description: "Sticky sago dish served with grated coconut and palm sugar",
    foodType: "Dessert",
    dietaryTags: ["vegetarian", "gluten-free", "dairy-free"],
    ingredients: ["sago starch", "boiling water", "grated coconut", "palm sugar", "salt"],
    instructions: [
      "Stir sago starch with hot water until elastic and glossy.",
      "Shape or serve in bowls.",
      "Top with grated coconut and palm sugar syrup.",
      "Serve warm."
    ],
    funFact:
      "Sago-based delicacy reflecting traditional staple foods of interior communities.",
    chefTips:
      "Stir sago starch with hot water until elastic and glossy; serve with grated coconut and palm sugar syrup."
  },
  {
    id: 6,
    name: "Bubur Pedas",
    origin: "Dayak",
    difficulty: "Medium",
    prepTime: 30,
    cookTime: 120,
    servings: 4,
    image:
      "https://munchmalaysia.com/wp-content/uploads/2023/11/sarawak-spicy-porridge.jpg",
    description: "Spicy rice porridge cooked with coconut milk and spices",
    foodType: "Rice Dish",
    dietaryTags: ["gluten-free", "spicy"],
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
    instructions: [
      "Toast rice and spices; grind to a paste.",
      "Sauté aromatics; add paste and cook until fragrant.",
      "Add coconut milk, stock, and ingredients; simmer until thick.",
      "Season and serve hot."
    ],
    funFact:
      "Often prepared in Ramadan bazaars and communal events; comfort food with local spice blends.",
    chefTips:
      "Toast rice and spices, grind to paste, then simmer with coconut milk, aromatics, and optional meat/vegetables."
  },
  {
    id: 7,
    name: "Ayam Pansuh",
    origin: "Dayak",
    difficulty: "Hard",
    prepTime: 30,
    cookTime: 120,
    servings: 4,
    image: "https://images.unsplash.com/photo-1598103442097-8b74394b95c6",
    description: "Chicken cooked in bamboo with lemongrass and tapioca leaves",
    foodType: "Poultry",
    dietaryTags: ["gluten-free", "dairy-free", "paleo"],
    ingredients: [
      "chicken",
      "bamboo",
      "lemongrass",
      "ginger",
      "garlic",
      "tapioca leaves",
      "salt"
    ],
    instructions: [
      "Season chicken with aromatics.",
      "Pack into bamboo with tapioca leaves; seal.",
      "Cook over gentle fire/heat until tender.",
      "Open and serve with rice."
    ],
    funFact:
      "Often prepared at communal events; a showcase of bamboo cooking technique.",
    chefTips:
      "Slow heat is key; don’t overfill the bamboo to allow steam circulation."
  },
  {
    id: 8,
    name: "Kek Lapis Sarawak",
    origin: "Chinese-Malay",
    difficulty: "Hard",
    prepTime: 60,
    cookTime: 180,
    servings: 4,
    image: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e",
    description: "Colorful layered cake with intricate patterns and flavors",
    foodType: "Dessert",
    dietaryTags: ["vegetarian"],
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
    instructions: [
      "Prepare rich batter and divide; tint/flavor as desired.",
      "Bake thin layers one by one, brushing lightly between layers.",
      "Stack to form patterns; cool completely.",
      "Slice cleanly and serve."
    ],
    funFact:
      "Requires patience and precision; a festive showstopper with many regional patterns.",
    chefTips:
      "Bake in thin layers and press gently; chill before slicing for sharper layers."
  },
  {
    id: 9,
    name: "Laksa Sarawak",
    origin: "Chinese-Malay",
    difficulty: "Medium",
    prepTime: 20,
    cookTime: 40,
    servings: 4,
    image:
      "https://asianinspirations.com.au/wp-content/uploads/2018/08/R01024_Sarawak-Laksa-940x627.jpg",
    description:
      "Rich and spicy noodle soup with rice vermicelli, coconut milk, prawns and chicken",
    foodType: "Noodles",
    dietaryTags: ["spicy", "dairy-free"],
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
    instructions: [
      "Simmer laksa paste with stock and coconut milk.",
      "Blanch vermicelli; prepare toppings (prawn, chicken, sprouts).",
      "Assemble noodles with broth and toppings.",
      "Serve with sambal and lime."
    ],
    funFact:
      "Iconic bowl that blends Chinese and Malay influences unique to Sarawak.",
    chefTips:
      "Use a good laksa paste and don’t boil coconut milk vigorously to prevent splitting."
  },
  {
    id: 10,
    name: "Terung Dayak Soup",
    origin: "Dayak",
    difficulty: "Easy",
    prepTime: 15,
    cookTime: 25,
    servings: 4,
    image:
      "https://www.periuk.my/static/54323c3fc953cc12ea8264c2fd746856/f6085/PRec-Terung-Dayak-with-Mackerel.jpg",
    description:
      "Sour soup from native yellow eggplant with lemongrass and dried seafood",
    foodType: "Soup",
    dietaryTags: ["gluten-free", "dairy-free", "high-fiber"],
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
    instructions: [
      "Slice terung dayak; bruise lemongrass.",
      "Sauté aromatics; add water/stock and eggplant.",
      "Simmer with dried prawns until tender and tangy.",
      "Season to taste and serve warm."
    ],
    funFact:
      "Showcases native produce; prized for its bright sourness in home cooking.",
    chefTips:
      "Balance sourness with salt and a touch of sweetness; don’t overcook the eggplant."
  }
];

const LS_KEY = "recipes_data_v2";
const PER_PAGE = 9;

export default function RecipesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialQ = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(initialQ);
  useEffect(() => {
    setSearchQuery(searchParams.get("q") || "");
  }, [searchParams]);

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
        {current.map((r) => {
          // Map difficulty to EFP badge colors
          const diff = (r.difficulty || "").toLowerCase();
          const diffClass =
            diff === "easy" ? "efp-badge efp-badge--ok"
            : diff === "medium" ? "efp-badge efp-badge--warn"
            : "efp-badge efp-badge--high";

          return (
            <div
              key={r.id}
              className="efp-food-card"
            >
              <div className="efp-food-media">
                <img
                  src={r.image}
                  alt={r.name}
                  className="efp-image"
                  loading="lazy"
                />
                <div className="efp-badges">
                  <span className={diffClass}>{r.difficulty}</span>
                </div>
                {/* Optional corner badge like EFP’s “V” — show “GF”/“V” if tags exist */}
                {r.dietaryTags?.includes("vegetarian") && (
                  <span className="efp-badge-topright">V</span>
                )}
              </div>

              <div className="efp-food-body">
                <div className="efp-food-headline">
                  <h3 className="efp-food-title">{r.name}</h3>
                  <span className="efp-badge-cat">{r.foodType}</span>
                </div>

                <p className="efp-desc">{r.description}</p>

                <div className="efp-meta">
                  <span className="muted">Origin: {r.origin}</span>
                </div>

                <div className="efp-nutri">
                  <div className="efp-nutri-item">
                    <div>{r.prepTime}m</div>
                    <div className="muted">Prep Time</div>
                  </div>
                  <div className="efp-nutri-item">
                    <div>{r.cookTime}m</div>
                    <div className="muted">Cook Time</div>
                  </div>
                  <div className="efp-nutri-item">
                    <div>{r.servings}</div>
                    <div className="muted">Servings</div>
                  </div>
                </div>

                {/* Dietary tags row (click to add filter like EFP) */}
                {r.dietaryTags?.length > 0 && (
                  <div className="efp-tags" aria-label={`${r.name} dietary tags`}>
                    {r.dietaryTags.map((tag) => (
                      <button
                        key={tag}
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
                  onClick={() => navigate(`/recipes/${r.id}`)}
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
