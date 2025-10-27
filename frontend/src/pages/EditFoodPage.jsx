import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/EditFoodPage.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { MdOutlineFileUpload } from "react-icons/md";
import { FaArrowLeftLong } from "react-icons/fa6";
import { FiSave } from "react-icons/fi";

const EditFoodPage = () => {
    const navigate = useNavigate();
    const [selectedImage, setSelectedImage] = useState(null);
  const [food, setFood] = useState({
    name_en: "Manok Pansoh",
    name_ms: "",
    category: "",
    origin: "",
    description_en: "",
    description_ms: "",
    cultural_en: "",
    cultural_ms: "",
    calories: "285",
    protein: "25",
    carbs: "",
    fat: "",
    fiber: "",
    sodium: "",
    serving: "",
    time: "",
    difficulty: "",
    ingredients: "",
    benefits: "",
    tags: "",
  });

  const handleChange = (e) => {
    setFood({ ...food, [e.target.name]: e.target.value });
  };

  return (
    <div className="edit-food-page">
      <Header />

      <div className="edit-food-container">
        <div className="edit-topbar">
            <button className="admin-edit-food-back-btn" onClick={() => navigate("/admin")}>
                <span className="admin-edit-food-back-icon"><FaArrowLeftLong /></span>
                 Back to Dashboard
             </button>

            <div className="edit-title">
                <h2>Edit Food Item</h2>
                <p>{food.name_en}</p>
            </div>

            <button className="admin-edit-food-save-btn">
                <span className="admin-edit-food-save-icon"><FiSave /></span> 
                Save Changes
            </button>
        </div>

        <div className="edit-grid">
          {/* === Food Image Section === */}
          <div className="edit-food-image-upload-section">
            <h3>Food Image</h3>
            <div className="image-preview">
                {selectedImage ? (
                <img src={URL.createObjectURL(selectedImage)} alt="Preview" />
                ) : (
                <p>No Image</p>
                )}
            </div>

            <input
                type="file"
                id="fileInput"
                accept="image/*"
                onChange={(e) => setSelectedImage(e.target.files[0])}
                style={{ display: "none" }}
            />
            
            <button
                className="admin-edit-food-upload-btn"
                onClick={() => document.getElementById("fileInput").click()}
            >
                <span className="admin-edit-food-upload-icon"><MdOutlineFileUpload /></span>
                Upload New Image
            </button>
            </div>

          {/* === Basic Info Section === */}
          <div className="edit-food-basic-info-card">
            <h3>Basic Information</h3>
            <div className="two-col">
              <div>
                <label>Food Name</label>
                <input
                  name="name_en"
                  value={food.name_en}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label>Name (Bahasa Malaysia)</label>
                <input
                  name="name_ms"
                  value={food.name_ms}
                  onChange={handleChange}
                />
              </div>
            </div>

            <label>Category</label>
            <select
              name="category"
              value={food.category}
              onChange={handleChange}
            >
              <option value="">Select category</option>
              <option value="Poultry">Poultry</option>
              <option value="Seafood">Seafood</option>
              <option value="Vegetables">Vegetables</option>
              <option value="Rice Dish">Rice Dish</option>
              <option value="Dessert">Dessert</option>
              <option value="Fermented">Fermented</option>
              <option value="Noodles">Noodles</option>
              <option value="Soup">Soup</option>
              <option value="Meat">Meat</option>
            </select>

            <label>Region of Origin</label>
            <input
              name="origin"
              value={food.origin}
              onChange={handleChange}
              placeholder="e.g., Kuching, Sibu, Miri"
            />

            <label>Description</label>
            <textarea
              name="description_en"
              value={food.description_en}
              onChange={handleChange}
            />

          </div>
        </div>

        {/* === Cultural Context === */}
        <div className="edit-cultural-context-card">
          <h3>Cultural Context</h3>
          <label>Cultural Context</label>
          <textarea
            name="cultural_en"
            value={food.cultural_en}
            onChange={handleChange}
          />
        </div>

        {/* === Nutritional Info === */}
        <div className="edit-cultural-context-card">
          <h3 className="section-title">
            Nutritional Information <span className="serving-note">(per serving)</span>
         </h3>
          <div className="nutrition-grid">
            {[
              "Calories",
              "Protein (g)",
              "Carbohydrates (g)",
              "Total Fat (g)",
              "Dietary Fiber (g)",
              "Sodium (mg)",
            ].map((label, index) => (
              <div key={index}>
                <label>{label}</label>
                <input />
              </div>
            ))}
          </div>
        </div>

        {/* === Additional Info === */}
        <div className="edit-food-additional-info-card">
          <h3>Additional Information</h3>

          <label>Common Ingredients</label>
          <textarea placeholder="List ingredients separated by commas" />

          <label>Health Benefits</label>
          <textarea />

          <label>Tags (comma separated)</label>
          <input placeholder="traditional, spicy, vegetarian, etc." />
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default EditFoodPage;
