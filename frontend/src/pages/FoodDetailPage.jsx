import React, { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../css/FoodDetailPage.css";
import { Share2, Info, TriangleAlert, MessagesSquare } from "lucide-react";

export const sarawakFoods = [
  {
    id: 1,
    name: "Manok Pansoh",
    category: "Poultry",
    origin: "Iban",
    description: "Traditional Iban chicken cooked in bamboo with aromatic herbs and spices.",
    image: "https://images.unsplash.com/photo-1643185720431-9c050eebbc9a",
    calories: 285, protein: 35, carbs: 8, fat: 12,
    ingredients: ["chicken","lemongrass","ginger","garlic","bamboo","tapioca leaves","salt","shallots"],
    culturalSignificance: "Commonly served during Gawai and family gatherings; symbolizes sharing and community.",
    traditionalPreparation: "Seasoned chicken is stuffed into bamboo with herbs and tapioca leaves, sealed, and slow-cooked over fire."
  },
  {
    id: 2,
    name: "Umai",
    category: "Seafood",
    origin: "Melanau",
    description: "Fresh fish salad marinated with lime juice, onions, and chilies.",
    image: "https://images.unsplash.com/photo-1612755657417-9c6885e5ece9",
    calories: 165, protein: 28, carbs: 6, fat: 3,
    ingredients: ["fresh fish","lime juice","onion","chili","salt","sugar","ginger","coriander leaves"],
    culturalSignificance: "A coastal staple among Melanau communities, often eaten fresh after fishing.",
    traditionalPreparation: "Thinly slice very fresh fish; marinate in lime juice, then toss with onions, chilies, and seasoning. No heat used."
  },
  {
    id: 3,
    name: "Kasam Babi",
    category: "Fermented",
    origin: "Dayak",
    description: "Fermented pork with salt and rice wine, aged for several months.",
    image: "https://images.unsplash.com/photo-1658218615053-955e8af55947",
    calories: 320, protein: 42, carbs: 2, fat: 15,
    ingredients: ["pork","salt","rice wine","garlic","ginger","pepper","onion","sugar"],
    culturalSignificance: "Preservation technique for meat, providing food security and distinctive festive flavors.",
    traditionalPreparation: "Cure pork with salt and tuak, pack tightly in sealed jars, and ferment for weeks to months before cooking."
  },
  {
    id: 4,
    name: "Midin Belacan",
    category: "Vegetables",
    origin: "Native",
    description: "Jungle fern stir-fried with shrimp paste and chilies.",
    image: "https://images.unsplash.com/photo-1741004580357-15d116ef4ba3",
    calories: 95, protein: 8, carbs: 12, fat: 4,
    ingredients: ["midin fern","belacan (shrimp paste)","garlic","chili","onion","salt","oil"],
    culturalSignificance: "Beloved local vegetable highlighting Sarawak’s rainforest produce; common in kopitiams and home cooking.",
    traditionalPreparation: "Rinse young fern tips; stir-fry quickly on high heat with belacan, garlic, and chilies to keep them crisp."
  },
  {
    id: 5,
    name: "Linut",
    category: "Dessert",
    origin: "Bidayuh",
    description: "Sticky sago dish served with grated coconut and palm sugar.",
    image: "https://images.unsplash.com/photo-1708597523963-40b30f846281",
    calories: 210, protein: 4, carbs: 42, fat: 6,
    ingredients: ["sago starch","boiling water","grated coconut","palm sugar","salt"],
    culturalSignificance: "Sago-based delicacy reflecting traditional staple foods of interior communities.",
    traditionalPreparation: "Stir sago starch with hot water until elastic and glossy; serve with grated coconut and palm sugar syrup."
  },
  {
    id: 6,
    name: "Bubur Pedas",
    category: "Rice Dish",
    origin: "Dayak",
    description: "Spicy rice porridge cooked with coconut milk and aromatic spices.",
    image: "https://munchmalaysia.com/wp-content/uploads/2023/11/sarawak-spicy-porridge.jpg",
    calories: 245, protein: 12, carbs: 38, fat: 8,
    ingredients: ["rice","coconut milk","lemongrass","shallots","chili paste","ginger","turmeric","beef","carrot","celery"],
    culturalSignificance: "Often prepared in Ramadan bazaars and communal events; comfort food with local spice blends.",
    traditionalPreparation: "Toast rice and spices, grind to paste, then simmer with coconut milk, aromatics, and optional meat/vegetables."
  },
  {
    id: 7,
    name: "Ayam Pansuh",
    category: "Poultry",
    origin: "Dayak",
    description: "Chicken cooked in bamboo with lemongrass and tapioca leaves.",
    image: "https://images.unsplash.com/photo-1598103442097-8b74394b95c6",
    calories: 290, protein: 32, carbs: 5, fat: 14,
    ingredients: ["chicken","bamboo","lemongrass","ginger","garlic","tapioca leaves","salt"],
    culturalSignificance: "Closely related to Manok Pansoh traditions; communal cooking during festivals and gatherings.",
    traditionalPreparation: "Marinate chicken, pack into bamboo with lemongrass, ginger, and leaves; seal and cook over embers."
  },
  {
    id: 8,
    name: "Kek Lapis Sarawak",
    category: "Dessert",
    origin: "Chinese-Malay",
    description: "Colorful layered cake with intricate patterns and flavors.",
    image: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e",
    calories: 385, protein: 6, carbs: 52, fat: 18,
    ingredients: ["butter","flour","eggs","condensed milk","sugar","food coloring","spices","vanilla extract"],
    culturalSignificance: "Iconic festive cake gifted during Hari Raya and celebrations; showcases Sarawak’s creative baking culture.",
    traditionalPreparation: "Bake thin layers one by one, sometimes broiled for caramelization; assemble patterns with precise layering."
  },
  {
    id: 9,
    name: "Laksa Sarawak",
    category: "Noodles",
    origin: "Chinese-Malay",
    description: "Rich and spicy noodle soup with rice vermicelli, coconut milk, prawns, chicken, and sambal belacan.",
    image: "https://asianinspirations.com.au/wp-content/uploads/2018/08/R01024_Sarawak-Laksa-940x627.jpg",
    calories: 430, protein: 24, carbs: 48, fat: 18,
    ingredients: ["rice vermicelli","coconut milk","prawns","chicken","bean sprouts","egg","sambal belacan","lime","spices"],
    culturalSignificance: "Signature Sarawak dish enjoyed at breakfast; regional pride with family-guarded spice paste recipes.",
    traditionalPreparation: "Simmer spice paste with stock and coconut milk; blanch noodles and toppings; assemble with sambal and lime."
  },
  {
    id: 10,
    name: "Terung Dayak Soup",
    category: "Soup",
    origin: "Dayak",
    description: "Sour soup made from native yellow eggplant with lemongrass and dried prawns or fish.",
    image: "https://www.periuk.my/static/54323c3fc953cc12ea8264c2fd746856/f6085/PRec-Terung-Dayak-with-Mackerel.jpg",
    calories: 180, protein: 10, carbs: 15, fat: 6,
    ingredients: ["terung dayak (yellow eggplant)","lemongrass","dried prawns","garlic","onion","salt","oil","turmeric"],
    culturalSignificance: "Home-style sour soup highlighting local produce; common in interior households.",
    traditionalPreparation: "Slice terung dayak and simmer with lemongrass and dried prawns; season to a bright, tangy broth."
  }
];

export default function FoodDetailPage({ food, onBack, onViewDiscussion }) {
  if (!food) return null;

  const [saved, setSaved] = useState(false);

  const getHealthAlerts = (f) => {
    const alerts = [];
    if (Number(f.calories) > 250) alerts.push({ type: "warning", message: "High calorie dish - consume in moderation" });
    if (Number(f.protein) > 25) alerts.push({ type: "info", message: "Excellent source of protein" });
    if ((f.name || "").includes("Kasam") || (f.name || "").includes("Belacan")) alerts.push({ type: "warning", message: "High in sodium - limit if hypertensive" });
    if (f.category === "Vegetables") alerts.push({ type: "info", message: "Rich in dietary fiber" });
    return alerts;
  };

  const healthAlerts = getHealthAlerts(food);
  const ingredients = food.ingredients  || [];

  const handleShare = async () => {
    try {
      const url = window.location?.href || "";
      await navigator.clipboard.writeText(url);
      alert("Link copied to clipboard");
    } catch {
      alert("Unable to copy link");
    }
  };

  return (
    <div className="food-detail-page">
        <Header />
        <div className="fdp-container">
        {/* Top bar */}
        <div className="fdp-topbar">
            <button type="button" className="lrp-btn lrp-btn-outline fdp-back" onClick={onBack}>← Back to Foods</button>
        </div>

        <div className="fdp-grid">
            {/* Left column */}
            <div className="fdp-left">
            {/* Hero */}
            <div className="fdp-card fdp-hero">
                <div className="fdp-hero-media">
                <img src={food.image} alt={food.name} />
                <div className="fdp-hero-overlay" />
                <div className="fdp-hero-text">
                    <div className="fdp-badges">
                    {food.origin && <span className="fdp-badge">{food.origin}</span>}
                    {food.category && <span className="fdp-badge">{food.category}</span>}
                    </div>
                    <h1 className="fdp-title">{food.name}</h1>
                    {food.description && <p className="fdp-desc">{food.description}</p>}
                </div>
                </div>
            </div>

            {/* Cultural / Preparation */}
            <div className="fdp-card">
                <p className="fdp-section-title"><Info size={18} color={"#8B4513"}/> Cultural Heritage</p>
                {food.culturalSignificance  && (
                <div className="fdp-block">
                    <h4 className="fdp-block-title">Cultural Significance</h4>
                    <p className="fdp-text">{food.culturalSignificance}</p>
                </div>
                )}
                <div className="fdp-block">
                <h4 className="fdp-block-title">Traditional Preparation</h4>
                <p className="fdp-text">{food.traditionalPreparation}</p>
                </div>
            </div>

            {/* Ingredients */}
            {ingredients.length > 0 && (
                <div className="fdp-card">
                <p className="fdp-section-title">Common Ingredients</p>
                <div className="fdp-chip-grid">
                    {ingredients.map((ing, i) => (
                    <span key={i} className="fdp-chip">{ing}</span>
                    ))}
                </div>
                </div>
            )}
            </div>

            {/* Right column */}
            <div className="fdp-right">
            {/* Actions */}
            <div className="fdp-actions">
                <button type="button" className="lrp-btn lrp-btn-primary fdp-save" onClick={() => setSaved((s) => !s)}>
                {saved ? "✓ Saved" : "❤ Save Food"}
                </button>
                <button type="button" className="lrp-btn lrp-btn-outline fdp-share" onClick={handleShare}><Share2 size={18} /></button>
            </div>

            {/* Nutrition */}
            <div className="fdp-card">
                <p className="fdp-section-title">Nutritional Information</p>
                <p className="fdp-muted">Per serving</p>
                <div className="fdp-nutri-grid">
                <div className="fdp-nutri">
                    <div className="fdp-nutri-value">{food.calories ?? "-"}</div>
                    <div className="fdp-nutri-label">Calories</div>
                </div>
                <div className="fdp-nutri">
                    <div className="fdp-nutri-value">{food.protein ?? "-"}g</div>
                    <div className="fdp-nutri-label">Protein</div>
                </div>
                <div className="fdp-nutri">
                    <div className="fdp-nutri-value">{food.carbs ?? "-"}g</div>
                    <div className="fdp-nutri-label">Carbohydrates</div>
                </div>
                <div className="fdp-nutri">
                    <div className="fdp-nutri-value">{food.fat ?? "-"}g</div>
                    <div className="fdp-nutri-label">Fat</div>
                </div>
                </div>
            </div>

            {/* Health alerts */}
            {healthAlerts.length > 0 && (
                <div className="fdp-card">
                <p className="fdp-section-title"><TriangleAlert size={18} color={"#8B4513"}/> Health Information</p>
                <div className="fdp-alerts">
                    {healthAlerts.map((a, idx) => (
                    <div key={idx} className={`fdp-alert ${a.type === "warning" ? "fdp-alert-warn" : "fdp-alert-info"}`}>
                        {a.message}
                    </div>
                    ))}
                </div>
                </div>
            )}

            {/* Discussion preview */}
            <div className="fdp-card">
                <div className="fdp-disc-header">
                <p className="fdp-section-title"><MessagesSquare size={18} color={"#8B4513"}/> Community Discussion</p>
                {onViewDiscussion && (
                    <button type="button" className="lrp-btn lrp-btn-outline fdp-small" onClick={onViewDiscussion}>View More</button>
                )}
                </div>
                {onViewDiscussion ? (
                <div className="fdp-comments">
                    <div className="fdp-comment">
                    <div className="fdp-comment-head"><span className="fdp-avatar">A</span><span className="fdp-user">Ahmad Rahman</span><span className="fdp-time">2h</span></div>
                    <p className="fdp-comment-text">This is one of my favorite traditional Sarawakian dishes! My grandmother used to make it every Sunday.</p>
                    </div>
                    <div className="fdp-comment">
                    <div className="fdp-comment-head"><span className="fdp-avatar">S</span><span className="fdp-user">Sarah Lim</span><span className="fdp-time">1h</span></div>
                    <p className="fdp-comment-text">Any tips on where to find good quality bamboo shoots?</p>
                    </div>
                    <button type="button" className="lrp-btn lrp-btn-outline">View More (10+ comments)</button>
                </div>
                ) : (
                <p className="fdp-muted fdp-center">Sign in to view and join community discussions.</p>
                )}
            </div>
            </div>
        </div>
        </div>
        <Footer />
    </div>
  );
}