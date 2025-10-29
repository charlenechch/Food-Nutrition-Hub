import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/EditFoodPage.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { MdOutlineFileUpload } from "react-icons/md";
import { FaArrowLeftLong } from "react-icons/fa6";
import { FiSave } from "react-icons/fi";

const AddRecipePage = () => {
    const navigate = useNavigate();
    const [selectedImage, setSelectedImage] = useState(null);
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  const [food, setFood] = useState({
    name_en: "Ayam Pansuh",
    name_ms: "",
    category: "",
    origin: "",
    description_en: "",
    ingredients: "",
    instructions: "",
    calories: "285",
    protein: "25",
    carbs: "",
    fat: "",
    fiber: "",
    sodium: "",
    serving: "",
    time: "",
    difficulty: "",
    //ingredients: "",
    benefits: "",
    tags: "",
  });

  const handleChange = (e) => {
    setFood({ ...food, [e.target.name]: e.target.value });
  };

  const handleSaveClick = () => {
        setShowSaveConfirm(true);
    };

    const handleCancelSave = () => {
        setShowSaveConfirm(false);
    };

    const handleConfirmSave = () => {
        console.log("✅ Changes saved:", food);
        // TODO: Add actual save logic here (API call, database update, etc.)
        setShowSaveConfirm(false);
        navigate("/admin"); // redirect to dashboard after saving
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
                <h2>Add New Recipe</h2>
            </div>

            <button className="admin-edit-food-save-btn" onClick={handleSaveClick}>
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
                className="edit-food-input"
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
            <div className="edit-food-basic-info-two-col">
              <div>
                <label className="basic-info-label">Food Name</label>
                <input
                  className="edit-food-input"
                  name="name_en"
                  value={food.name_en}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="basic-info-label">Name (Bahasa Malaysia)</label>
                <input
                  className="edit-food-input"
                  name="name_ms"
                  value={food.name_ms}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="food-category-field">
              <label className="basic-info-label">Category</label>
              <select
                className="edit-food-select"
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
            </div>

            <div className="food-origin-field">
              <label className="basic-info-label">Region of Origin</label>
              <input
                className="edit-food-input"
                name="origin"
                value={food.origin}
                onChange={handleChange}
                placeholder="e.g., Kuching, Sibu, Miri"
              />
            </div>
          </div>
        </div>

        {/* === Cultural Context === */}
        <div className="edit-cultural-context-card">
          <h3>Cultural Context</h3>

          <label className="basic-info-label">Description</label>
            <textarea
              className="edit-food-textarea"
              name="description_en"
              value={food.description_en}
              onChange={handleChange}
            />

          <label className="basic-info-label">Ingredients</label>
          <textarea
            className="edit-food-textarea"
            name="ingredients"
            value={food.ingredients}
            onChange={handleChange}
            placeholder={`List the ingredients for this dish...\n1) 1 clove of garlic\n2) 1kg of chicken breast`}
            rows="5"
          />

          <label className="basic-info-label">Instructions</label>
          <textarea
            className="edit-food-textarea"
            name="instructions"
            value={food.instructions}
            onChange={handleChange}
            placeholder="Describe how this dish is traditionally prepared — cooking method, tools, rituals, etc."
          />
        </div>


        <div className="edit-cultural-context-card">
            <h3 className="edit-food-section-title">Cooking Information</h3>
            <div className="nutrition-grid">
                {[
                "Serving",
                "Prep Time (min)",
                "Cook Time (min)",
                "Difficulty",
                ].map((label, index) => (
                <div key={index}>
                    <label className="basic-info-label">{label}</label>

                    {label === "Difficulty" ? (
                    <select className="edit-food-input">
                        <option value="">Select difficulty...</option>
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                    </select>
                    ) : (
                    <input className="edit-food-input" />
                    )}
                </div>
                ))}
            </div>
        </div>


        {/* === Additional Info === */}
        <div className="edit-food-additional-info-card">
          <h3>Additional Information</h3>

          <label className="basic-info-label">Fun Fact</label>
          <textarea className="edit-food-textarea" placeholder="Fun Fact about the dish" />

          <label className="basic-info-label">Tips</label>
          <textarea className="edit-food-textarea" />

          <label className="basic-info-label">Dietary Preferences</label>
            <div className="dietary-preferences-grid">
            {[
                "Vegetarian",
                "Gluten Free",
                "Dairy Free",
                "Spicy",
                "Paleo",
                "Halal",
                "Keto",
                "Nut Free",
                "Other",
            ].map((option, index) => (
                <label key={index} className="dietary-option">
                <input type="checkbox" name="dietary" value={option} />
                {option}
                </label>
            ))}
            </div>
        </div>
      </div>

      {showSaveConfirm && (
        <div className="modal-overlay">
            <div className="delete-modal">
            <h3>Confirmation</h3>
            <p>
                Are you sure you want to <strong>save these changes</strong>?<br />
                This will overwrite the existing food information.
            </p>
            <div className="modal-actions">
                <button className="save-cancel-btn" onClick={handleCancelSave}>
                Cancel
                </button>
                <button className="confirm-save-btn" onClick={handleConfirmSave}>
                Save
                </button>
            </div>
            </div>
        </div>
        )}

      <Footer />
    </div>
  );
};

export default AddRecipePage;
