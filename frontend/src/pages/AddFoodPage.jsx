import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../css/EditFoodPage.css"; 
import Header from "../components/Header";
import Footer from "../components/Footer";
import { MdOutlineFileUpload } from "react-icons/md";
import { FaArrowLeftLong } from "react-icons/fa6";
import { FiPlus, FiCheck } from "react-icons/fi"; 

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Standard options matching your database
const ORIGIN_OPTIONS = [
  "Malay", "Chinese", "Iban", "Melanau", "Kadazan", "Bidayuh", "Dayak",
];

// Removed CATEGORY_OPTIONS as we are using Food Type to handle this now

const FOOD_TYPE_OPTIONS = [
  "Poultry", "Seafood", "Vegetables", "Fermented", "Dessert", 
  "Rice Dish", "Noodles", "Soup", "Meat", "Other..."
];

const DIFFICULTY_OPTIONS = ["Easy", "Medium", "Hard"];

// Predefined lists for Tags and Ingredients
const DIETARY_TAG_OPTIONS = [
  "Vegetarian", "Vegan", "Halal", "Gluten Free", 
  "Dairy Free", "Low Fat", "High Protein", "Spicy"
];

const COMMON_INGREDIENTS_LIST = [
  "Chicken", "Rice", "Garlic", "Onion", "Ginger", 
  "Salt", "Sugar", "Chili", "Lemongrass", "Soy Sauce"
];

const AddFoodPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // --- States ---
  const [selectedImage, setSelectedImage] = useState(null);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [csrfToken, setCsrfToken] = useState("");
  
  const [showNotification, setShowNotification] = useState({
    visible: false,
    message: "",
    type: "",
  });

  // Main Food State
  const [food, setFood] = useState({
    name: "",
    // category removed (derived from foodType)
    origin: "",
    description: "",
    culturalSignificance: "",
    traditionalPreparation: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
    fiber: "",
    vitaminc: "",
    // Visible fields
    foodType: "Poultry", 
    customFoodType: "", 
    difficulty: "Medium", 
    prepTime: "",
    healthTips: ""
  });

  // --- Multi-Select States ---
  const [selectedDietary, setSelectedDietary] = useState([]);
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [showOtherIngredient, setShowOtherIngredient] = useState(false);
  const [otherIngredientText, setOtherIngredientText] = useState("");

  // --- Fetch CSRF Token ---
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const res = await fetch(`${API_URL}/api/csrf-token`, { credentials: "include" });
        const data = await res.json();
        setCsrfToken(data.csrfToken);
      } catch (err) {
        console.error("Failed to fetch CSRF token", err);
      }
    };
    fetchCsrfToken();
  }, []);

  // --- Input Change Handler ---
  const handleChange = (e) => {
    setFood({ ...food, [e.target.name]: e.target.value });
  };

  // --- Toggle Handlers for Multi-Select ---
  const toggleDietary = (tag) => {
    setSelectedDietary((prev) => 
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const toggleIngredient = (ing) => {
    setSelectedIngredients((prev) => 
      prev.includes(ing) ? prev.filter((i) => i !== ing) : [...prev, ing]
    );
  };

  // --- Image Upload Logic ---
  const handleImageUpload = async (file) => {
    if (!file) return ""; 
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.onloadend = async () => {
        const base64Image = reader.result;
        try {
          const uploadRes = await fetch(`${API_URL}/api/foods/upload/food-image`, {
            method: "POST",
            credentials: "include",
            headers: { 
                "Content-Type": "application/json",
                "X-CSRF-Token": csrfToken 
            },
            body: JSON.stringify({ image: base64Image }),
          });
          const uploadResult = await uploadRes.json();
          if (uploadResult.success && uploadResult.imageUrl) {
            resolve(uploadResult.imageUrl);
          } else {
            reject(new Error(uploadResult.error || "Upload failed"));
          }
        } catch (err) {
            reject(err);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // --- Main Add Logic ---
  const handleConfirmAdd = async () => {
    setShowSaveConfirm(false);

    // Validation
    if (!food.origin) {
        setShowNotification({
            visible: true,
            message: "Please select a Region of Origin.",
            type: "error"
        });
        return;
    }

    if (food.foodType === "Other..." && !food.customFoodType.trim()) {
      setShowNotification({
          visible: true,
          message: "Please specify the food type.",
          type: "error"
      });
      return;
    }

    try {
      let finalImageUrl = "";
      if (selectedImage) {
        try {
            finalImageUrl = await handleImageUpload(selectedImage);
        } catch (error) {
            setShowNotification({
                visible: true, 
                message: "Image upload failed. Try a smaller image.", 
                type: "error"
            });
            return;
        }
      }

      // 1. Process Custom Food Type
      const finalFoodType = food.foodType === "Other..." ? food.customFoodType : food.foodType;

      // 2. Process Multi-Selects into Strings
      const dietaryString = selectedDietary.join(", ");
      
      // Combine selected ingredients + custom "Other" text
      let ingredientsString = selectedIngredients.join(", ");
      if (showOtherIngredient && otherIngredientText.trim()) {
        if (ingredientsString) ingredientsString += ", ";
        ingredientsString += otherIngredientText.trim();
      }

      // 3. Prepare Data Object
      const newFoodData = {
        name: food.name,
        // Map "Category" to be the same as "Food Type" since they are redundant
        category: finalFoodType,
        origin: food.origin,
        description: food.description,
        culturalSignificance: food.culturalSignificance,
        traditionalPreparation: food.traditionalPreparation,
        Energy_kcal: Number(food.calories) || 0,
        Protein_g: Number(food.protein) || 0,
        Carbohydrates_g: Number(food.carbs) || 0,
        Fat_g: Number(food.fat) || 0,
        Fiber_g: Number(food.fiber) || 0,
        VitaminC_mg: Number(food.vitaminc) || 0,
        image: finalImageUrl,
        
        difficulty: food.difficulty,
        prepTime: food.prepTime || "0",
        foodType: finalFoodType,

        // Use our processed strings
        commonIngredients: ingredientsString,
        dietaryTags: dietaryString,
        healthTips: food.healthTips
      };

      const response = await fetch(`${API_URL}/api/foods`, {
        method: "POST", 
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify(newFoodData),
        credentials: "include",
      });

      const data = await response.json();

      if (data.success) {
        setShowNotification({
            visible: true,
            message: "Food added successfully!",
            type: "success"
        });
        setTimeout(() => navigate("/admin"), 1500);
      } else {
        setShowNotification({
            visible: true,
            message: "Failed to add food: " + (data.error || "Unknown error"),
            type: "error"
        });
      }

    } catch (error) {
      console.error("Network error:", error);
      setShowNotification({
        visible: true,
        message: "Network error. Could not connect to server.",
        type: "error"
      });
    }
  };

  const handleCloseNotification = () => {
      setShowNotification({ visible: false, message: "", type: "" });
  };

  // --- Inline Styles for Chip Selection ---
  const chipContainerStyle = {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginTop: "8px",
    marginBottom: "16px"
  };

  const getChipStyle = (isSelected) => ({
    padding: "8px 16px",
    borderRadius: "20px",
    border: `1px solid ${isSelected ? "#d97706" : "#ddd"}`,
    backgroundColor: isSelected ? "#fff7ed" : "white",
    color: isSelected ? "#d97706" : "#555",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: isSelected ? "600" : "400",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    gap: "6px"
  });

  return (
    <>
    <div className="edit-food-page">
      <Header />
      <div className="edit-food-container">
        
        <div className="edit-topbar">
          <button className="admin-edit-food-back-btn" onClick={() => navigate("/admin")}>
            <span className="admin-edit-food-back-icon"><FaArrowLeftLong /></span>
            Back to Dashboard
          </button>

          <div className="edit-title">
            <h2>Add New Food Item</h2>
          </div>

          <button className="admin-edit-food-save-btn" onClick={() => setShowSaveConfirm(true)}>
            <span className="admin-edit-food-save-icon"><FiPlus /></span>
            Add Food
          </button>
        </div>

        <div className="edit-grid">
          {/* === Image Section === */}
          <div className="edit-food-image-upload-section">
            <h3>Food Image</h3>
            <div className="image-preview">
              {selectedImage ? (
                <img src={URL.createObjectURL(selectedImage)} alt="Preview" />
              ) : (
                <p>No Image Selected</p>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => setSelectedImage(e.target.files[0])}
            />
            
            <button
              className="admin-edit-food-upload-btn"
              onClick={() => fileInputRef.current.click()}
            >
              <span className="admin-edit-food-upload-icon"><MdOutlineFileUpload /></span>
              Select Image
            </button>
          </div>

          {/* === Basic Info === */}
          <div className="edit-food-basic-info-card">
            <h3>Basic Information</h3>
            
            <label className="basic-info-label">Food Name</label>
            <input
              className="edit-food-input"
              name="name"
              value={food.name}
              onChange={handleChange}
              placeholder="e.g. Laksa Sarawak"
            />

            {/* REMOVED: Redundant Category Dropdown */}

            {/* Origin Dropdown */}
            <div className="food-origin-field">
              <label className="basic-info-label">Region of Origin</label>
              <div className="custom-select-wrapper">
                <select 
                    className="edit-food-select" 
                    name="origin" 
                    value={food.origin} 
                    onChange={handleChange}
                >
                    <option value="">Select an origin</option>
                    {ORIGIN_OPTIONS.map((origin) => (
                        <option key={origin} value={origin}>{origin}</option>
                    ))}
                </select>
              </div>
            </div>

            {/* Food Type Dropdown (Acts as Category) */}
            {food.foodType === "Other..." ? (
              <div className="edit-food-basic-info-two-col" style={{ marginTop: "1rem" }}>
                <div>
                  <label className="basic-info-label">Food Type</label>
                  <div className="custom-select-wrapper">
                    <select
                      className="edit-food-select"
                      name="foodType"
                      value={food.foodType}
                      onChange={handleChange}
                    >
                      {FOOD_TYPE_OPTIONS.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="basic-info-label">Specify Food Type</label>
                  <input
                    className="edit-food-input"
                    name="customFoodType"
                    value={food.customFoodType}
                    onChange={handleChange}
                    placeholder="e.g. Beverage, Snack"
                  />
                </div>
              </div>
            ) : (
              <div className="food-origin-field" style={{ marginTop: "1rem" }}>
                <label className="basic-info-label">Food Type</label>
                <div className="custom-select-wrapper">
                  <select
                    className="edit-food-select"
                    name="foodType"
                    value={food.foodType}
                    onChange={handleChange}
                  >
                    {FOOD_TYPE_OPTIONS.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* === Recipe Details === */}
        <div className="edit-cultural-context-card">
          <h3>Recipe Details</h3>
          <div className="edit-food-basic-info-two-col">
            <div>
              <label className="basic-info-label">Difficulty Level</label>
              <div className="custom-select-wrapper">
                <select 
                  className="edit-food-select" 
                  name="difficulty" 
                  value={food.difficulty} 
                  onChange={handleChange}
                >
                  {DIFFICULTY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="basic-info-label">Prep Time (minutes)</label>
              <input
                type="number"
                className="edit-food-input"
                name="prepTime"
                value={food.prepTime}
                onChange={handleChange}
                placeholder="e.g. 30"
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
            name="description" 
            value={food.description} 
            onChange={handleChange} 
            rows={4} 
            placeholder="Briefly describe the food..."
          />

          <label className="basic-info-label">Cultural Significance</label>
          <textarea 
            className="edit-food-textarea" 
            name="culturalSignificance" 
            value={food.culturalSignificance} 
            onChange={handleChange} 
            rows={4} 
            placeholder="Describe the cultural background behind this dish..."
          />

          <label className="basic-info-label">Traditional Preparation</label>
          <textarea 
            className="edit-food-textarea" 
            name="traditionalPreparation" 
            value={food.traditionalPreparation} 
            onChange={handleChange} 
            rows={4} 
            placeholder="Describe how this dish is traditionally prepared..."
          />
        </div>

        {/* === Nutritional Info === */}
        <div className="edit-cultural-context-card">
          <h3 className="edit-food-section-title">Nutritional Information <span className="serving-note">(per serving)</span></h3>
          <div className="nutrition-grid">
            {[
              { label: "Calories", name: "calories", placeholder: "e.g. 350" },
              { label: "Protein (g)", name: "protein", placeholder: "e.g. 15" },
              { label: "Carbohydrates (g)", name: "carbs", placeholder: "e.g. 45" },
              { label: "Total Fat (g)", name: "fat", placeholder: "e.g. 12" },
              { label: "Dietary Fiber (g)", name: "fiber", placeholder: "e.g. 4" },
              { label: "Vitamin C (mg)", name: "vitaminc", placeholder: "e.g. 2.5" },
            ].map((item) => (
              <div key={item.name}>
                <label className="basic-info-label">{item.label}</label>
                <input 
                    type="number" 
                    className="edit-food-input" 
                    name={item.name} 
                    value={food[item.name]} 
                    onChange={handleChange}
                    placeholder={item.placeholder}
                />
              </div>
            ))}
          </div>
        </div>

        {/* === NEW: Additional Details with Selection Chips === */}
        <div className="edit-cultural-context-card">
          <h3>Additional Details</h3>
          
          {/* Common Ingredients Selection */}
          <label className="basic-info-label">Common Ingredients (Select all that apply)</label>
          <div style={chipContainerStyle}>
            {COMMON_INGREDIENTS_LIST.map((ing) => {
              const isSelected = selectedIngredients.includes(ing);
              return (
                <button
                  key={ing}
                  type="button"
                  style={getChipStyle(isSelected)}
                  onClick={() => toggleIngredient(ing)}
                >
                  {ing}
                  {isSelected && <FiPlus style={{transform: 'rotate(45deg)'}} />}
                </button>
              );
            })}
            {/* Other Option */}
            <button
              type="button"
              style={getChipStyle(showOtherIngredient)}
              onClick={() => setShowOtherIngredient(!showOtherIngredient)}
            >
              Other...
              {showOtherIngredient && <FiCheck />}
            </button>
          </div>

          {/* Conditional Input for Other Ingredients */}
          {showOtherIngredient && (
            <div style={{ marginBottom: "16px" }}>
              <label className="basic-info-label" style={{fontSize: "0.9rem", color: "#666"}}>Specify other ingredients (comma separated)</label>
              <textarea 
                className="edit-food-textarea" 
                value={otherIngredientText}
                onChange={(e) => setOtherIngredientText(e.target.value)}
                rows={2} 
                placeholder="e.g. Turmeric leaves, Belacan, Black pepper..."
              />
            </div>
          )}

          {/* Dietary Tags Selection */}
          <label className="basic-info-label">Dietary Preferences</label>
          <div style={chipContainerStyle}>
            {DIETARY_TAG_OPTIONS.map((tag) => {
              const isSelected = selectedDietary.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  style={getChipStyle(isSelected)}
                  onClick={() => toggleDietary(tag)}
                >
                  {tag}
                  {isSelected && <FiCheck />}
                </button>
              );
            })}
          </div>

          {/* Health Tips */}
          <label className="basic-info-label" style={{marginTop: "10px"}}>Health Tips</label>
          <textarea 
            className="edit-food-textarea" 
            name="healthTips" 
            value={food.healthTips} 
            onChange={handleChange} 
            rows={2} 
            placeholder="e.g. Rich in fiber, good for digestion..."
          />
        </div>

      </div>

      {/* Confirmation Modal */}
      {showSaveConfirm && (
        <div className="modal-overlay">
            <div className="delete-modal">
            <h3>Confirm Add</h3>
            <p>Are you sure you want to add <strong>{food.name || "this item"}</strong> to the database?</p>
            <div className="modal-actions">
                <button className="save-cancel-btn" onClick={() => setShowSaveConfirm(false)}>Cancel</button>
                <button className="confirm-save-btn" onClick={handleConfirmAdd}>Yes, Add Food</button>
            </div>
            </div>
        </div>
      )}

      {/* Success/Error Notification Modal */}
      {showNotification.visible && (
        <div className="modal-overlay">
          <div className={`notification-modal ${showNotification.type}`}>
            <h3 style={{ color: showNotification.type === "error" ? "#a33b3b" : "#387346" }}>
              {showNotification.type === "success" ? "Success!" : "Error!"}
            </h3>
            <p>{showNotification.message}</p>
            <div className="modal-actions" style={{ justifyContent: "center" }}>
              <button
                className="confirm-save-btn"
                onClick={handleCloseNotification}
                style={{ backgroundColor: showNotification.type === "error" ? "#a33b3b" : "#7b4b26" }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
    <Footer />
    </>
  );
};

export default AddFoodPage;