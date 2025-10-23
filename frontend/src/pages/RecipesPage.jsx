import React, { useState, useEffect } from "react";
import "../css/RecipesPage.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import LoginPromptModal from "../components/LoginPromptModal"; // ✅ Modal

export default function RecipesPage() {
  const { user } = useAuth(); // ✅ user === null → guest
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // ✅ Recipe form data
  const [formData, setFormData] = useState({
    recipeName: "",
    origin: "",
    story: "",
    ingredients: "",
  });

  // ✅ Load all approved recipes
  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const res = await fetch(`${API_BASE_URL}/api/recipes`);
      const data = await res.json();
      setRecipes(data || []);
    } catch (error) {
      console.error("Error loading recipes:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Show modal if guest clicks "Add Recipe"
  const handleAddRecipeClick = () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    setShowAddForm(true);
  };

  // ✅ Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmitRecipe = async (e) => {
    e.preventDefault();
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const res = await fetch(`${API_BASE_URL}/api/recipes/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          userID: user.userID, // ✅ Use logged-in user
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("✅ Recipe submitted for admin approval!");
        setShowAddForm(false);
        setFormData({ recipeName: "", origin: "", story: "", ingredients: "" });
        fetchRecipes();
      } else {
        alert("❌ Failed to submit recipe: " + data.message);
      }
    } catch (error) {
      alert("❌ Error submitting recipe.");
    }
  };

  return (
    <div className="recipes-page">
      <Header />

      {/* ✅ Show modal only if guest tries to add */}
      {showLoginPrompt && (
        <LoginPromptModal onClose={() => setShowLoginPrompt(false)} />
      )}

      {/* ✅ Title */}
      <h1 className="page-title">Traditional Recipes</h1>
      <p className="page-subtitle">
        Authentic Sarawakian recipes with cultural stories
      </p>

      {/* ✅ Add Recipe Section */}
      <section className="share-recipe-card">
        <h3>➕ Share Your Recipe</h3>
        <p>Every dish tells a story. Share yours with the world!</p>
        <button className="recipe-btn" onClick={handleAddRecipeClick}>
          Add Recipe
        </button>
      </section>

      {/* ✅ Recipe Upload Form (only for logged-in users) */}
      {showAddForm && user && (
        <form className="recipe-form" onSubmit={handleSubmitRecipe}>
          <h2>Submit Your Recipe</h2>

          <label>Recipe Name *</label>
          <input
            type="text"
            name="recipeName"
            value={formData.recipeName}
            onChange={handleChange}
            required
          />

          <label>Origin *</label>
          <select
            name="origin"
            value={formData.origin}
            onChange={handleChange}
            required
          >
            <option value="">Select Cultural Origin</option>
            <option value="Malay">Malay</option>
            <option value="Chinese">Chinese</option>
            <option value="Iban">Iban</option>
            <option value="Bidayuh">Bidayuh</option>
            <option value="Melanau">Melanau</option>
            <option value="Dayak">Dayak</option>
          </select>

          <label>Cultural Story *</label>
          <textarea
            name="story"
            value={formData.story}
            onChange={handleChange}
            required
          />

          <label>Ingredients *</label>
          <textarea
            name="ingredients"
            value={formData.ingredients}
            onChange={handleChange}
            required
          />

          <button type="submit" className="submit-btn">
            Submit Recipe
          </button>
          <button
            type="button"
            className="cancel-btn"
            onClick={() => setShowAddForm(false)}
          >
            Cancel
          </button>
        </form>
      )}

      {/* ✅ Recipe Cards */}
      {loading ? (
        <p className="loading">Loading recipes...</p>
      ) : (
        <div className="recipes-grid">
          {recipes.length === 0 ? (
            <p>No recipes found.</p>
          ) : (
            recipes.map((recipe) => (
              <div className="recipe-card" key={recipe.id}>
                <img
                  src={recipe.image || "https://via.placeholder.com/300"}
                  alt={recipe.recipeName}
                />
                <h3>{recipe.recipeName}</h3>
                <p className="recipe-origin">{recipe.origin}</p>
              </div>
            ))
          )}
        </div>
      )}

      <Footer />
    </div>
  );
}
