import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

const LS_KEY = "recipes_data_v1";

export default function RecipeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const list = (() => {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); }
    catch { return []; }
  })();

  const recipe = list.find(r => String(r.id) === String(id));

  if (!recipe) {
    return (
      <div style={{ padding: "120px 5% 80px" }}>
        <Header />
        <p>Recipe not found.</p>
        <button onClick={() => navigate("/recipes")}>Back to Recipes</button>
        <Footer />
      </div>
    );
  }

  return (
    <div style={{ padding: "120px 5% 80px", background: "#fdfbf9", minHeight: "100vh" }}>
      <Header />
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <button
          onClick={() => navigate("/recipes")}
          style={{ marginBottom: 16, background: "#fff", border: "1px solid #c4b5a0", padding: "8px 12px", borderRadius: 8, cursor: "pointer" }}
        >
          ← Back
        </button>

        <div style={{ background: "#fff", border: "1px solid #ebdfd0", borderRadius: 12, overflow: "hidden" }}>
          <img
            src={recipe.image || "https://via.placeholder.com/1200x600?text=Recipe"}
            alt={recipe.name}
            style={{ width: "100%", height: 320, objectFit: "cover" }}
          />
          <div style={{ padding: 16 }}>
            <h1 style={{ margin: "0 0 8px", color: "#7a4d2a" }}>{recipe.name}</h1>
            <p style={{ color: "#6b5c4d", margin: "0 0 10px" }}>
              Origin: {recipe.origin} • Difficulty: {recipe.difficulty} • Prep {recipe.prepTime}m • Cook {recipe.cookTime}m • 👥 {recipe.servings}
            </p>
            <p style={{ color: "#4d3d2f", lineHeight: 1.6 }}>{recipe.description}</p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
