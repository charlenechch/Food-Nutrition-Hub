import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../css/EditFoodPage.css"; 
import Header from "../components/Header";
import Footer from "../components/Footer";
import { CiSearch } from "react-icons/ci";
import { MdOutlineFileUpload } from "react-icons/md";
import { FaArrowLeftLong } from "react-icons/fa6";
import { FiCheck, FiLink } from "react-icons/fi"; 
import { FiPlus } from "react-icons/fi";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const ORIGIN_OPTIONS = [
  "Malay", "Chinese", "Iban", "Melanau", "Kadazan", "Bidayuh", "Dayak",
];

const FOOD_TYPE_OPTIONS = [
  "Poultry", "Seafood", "Vegetables", "Fermented", "Dessert", 
  "Rice Dish", "Noodles", "Soup", "Meat"
];

const DIETARY_TAG_OPTIONS = [
  "Vegetarian", "Vegan", "Halal", "Gluten Free", 
  "Dairy Free", "Low Fat", "High Protein", "Spicy"
];

const COMMON_INGREDIENTS_LIST = [
  "Chicken", "Rice", "Garlic", "Onion", "Ginger", 
  "Salt", "Sugar", "Chili", "Lemongrass", "Soy Sauce"
];

const LinkFoodPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
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

  const [selectedRecipeId, setSelectedRecipeId] = useState("");
  const [recipeSearchTerm, setRecipeSearchTerm] = useState("");
  const [existingRecipes, setExistingRecipes] = useState([
    // Dummy data!!!!!
    { id: "101", name: "Authentic Sarawak Laksa", author: "Chef Amin" },
    { id: "102", name: "Traditional Manok Pansoh", author: "Auntie Rose" },
    { id: "103", name: "Classic Kolo Mee", author: "John Doe" },
    { id: "104", name: "Sarawak Layer Cake (Kek Lapis)", author: "Maria" },
    { id: "105", name: "Stir-fried Midin with Belacan", author: "Uncle Bob" },
    { id: "106", name: "Kampua Mee", author: "Chef Lee" },
    { id: "107", name: "Tomato Crispy Mee", author: "Ahmad" },
    { id: "108", name: "Umai Iban (Raw Fish Salad)", author: "Nenek" },
    { id: "109", name: "Linut (Sago Flour)", author: "Sarah" },
    { id: "110", name: "Tebaloi (Sago Biscuit)", author: "Makcik Siti" },
    { id: "111", name: "Kacangma Chicken", author: "Chef Ali" },
    { id: "112", name: "Nasi Goreng Dabai", author: "Pak Abu" },
    { id: "113", name: "Sup Terung Dayak", author: "Auntie Florence" },
    { id: "114", name: "Kueh Jala", author: "Nadia" },
    { id: "115", name: "Nasi Lelapan", author: "Chef Zam" }
  ]);

  const [food, setFood] = useState({
    name: "",
    alternative: "",
    altDescription: "",
    origin: "",
    category: [],
    description: "",
    culturalSignificance: "",
    traditionalPreparation: "",
    didYouKnow: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
    fiber: "",
    vitaminc: "", 
    healthTips: ""
  });

  const [selectedDietary, setSelectedDietary] = useState([]);
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [showOtherIngredient, setShowOtherIngredient] = useState(false);
  const [otherIngredientText, setOtherIngredientText] = useState("");

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const csrfRes = await fetch(`${API_URL}/api/csrf-token`, { credentials: "include" });
        const csrfData = await csrfRes.json();
        setCsrfToken(csrfData.csrfToken);

        const recipeRes = await fetch(`${API_URL}/api/recipe/recipes`);
        if (recipeRes.ok) {
          const recipeData = await recipeRes.json();
          // Remember to uncomment this when baackend is ready or if you have better way of putting it , because this is to remove all recipes that already have a food linked to the recipe.
          // setExistingRecipes(recipeData || []); 
        }
      } catch (err) {
        console.error("Failed to fetch initial data", err);
      }
    };
    fetchInitialData();
  }, []);

  const handleChange = (e) => {
    setFood({ ...food, [e.target.name]: e.target.value });
  };

  const toggleCategory = (cat) => {
    setFood((prev) => {
      const currentCats = Array.isArray(prev.category) ? prev.category : [];
      const isSelected = currentCats.includes(cat);
      const newCats = isSelected ? currentCats.filter((c) => c !== cat) : [...currentCats, cat];
      return { ...prev, category: newCats };
    });
  };

  const toggleDietary = (tag) => {
    setSelectedDietary((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };

  const toggleIngredient = (ing) => {
    setSelectedIngredients((prev) => prev.includes(ing) ? prev.filter((i) => i !== ing) : [...prev, ing]);
  };

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
            headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
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

  const handleConfirmLink = async () => {
    setShowSaveConfirm(false);

    if (!selectedRecipeId) {
      setShowNotification({ visible: true, message: t("addFood.selectRecipeError"), type: "error" });
      return;
    }
    if (!food.origin) {
      setShowNotification({ visible: true, message: t("addFood.selectOrigin"), type: "error" });
      return;
    }

    try {
      let finalImageUrl = "";
      if (selectedImage) {
        try {
          finalImageUrl = await handleImageUpload(selectedImage);
        } catch (error) {
          setShowNotification({ visible: true, message: t("addFood.imageUploadFailed"), type: "error" });
          return;
        }
      }

      const dietaryString = selectedDietary.join(", ");
      let ingredientsString = selectedIngredients.join(", ");
      if (showOtherIngredient && otherIngredientText.trim()) {
        if (ingredientsString) ingredientsString += ", ";
        ingredientsString += otherIngredientText.trim();
      }

      const newFoodData = {
        recipeId: selectedRecipeId, 
        name: food.name,
        alternative: food.alternative,
        altDescription: food.altDescription,
        category: Array.isArray(food.category) ? food.category.join(", ") : food.category,
        origin: food.origin,
        description: food.description,
        culturalSignificance: food.culturalSignificance,
        traditionalPreparation: food.traditionalPreparation,
        didYouKnow: food.didYouKnow,
        Energy_kcal: Number(food.calories) || 0,
        Protein_g: Number(food.protein) || 0,
        Carbohydrates_g: Number(food.carbs) || 0,
        Fat_g: Number(food.fat) || 0,
        Fiber_g: Number(food.fiber) || 0,
        VitaminC_mg: Number(food.vitaminc) || 0,
        image: finalImageUrl,
        commonIngredients: ingredientsString,
        dietaryTags: dietaryString,
        healthTips: food.healthTips
      };

      const response = await fetch(`${API_URL}/api/foods/link`, {
        method: "POST", 
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
        body: JSON.stringify(newFoodData),
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setShowNotification({ visible: true, message: t("addFood.linkedSuccess"), type: "success" });
        setTimeout(() => navigate("/admin"), 1500);
      } else {
        setShowNotification({ visible: true, message: t("addFood.addFailed", { error: data.error || "Unknown error" }), type: "error" });
      }

    } catch (error) {
      console.error("Network error:", error);
      setShowNotification({ visible: true, message: t("addFood.networkError"), type: "error" });
    }
  };

  const handleCloseNotification = () => {
    setShowNotification({ visible: false, message: "", type: "" });
  };

  const chipContainerStyle = {
    display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "8px", marginBottom: "16px"
  };

  const getChipStyle = (isSelected) => ({
    padding: "8px 16px", borderRadius: "20px", border: `1px solid ${isSelected ? "#d97706" : "#ddd"}`,
    backgroundColor: isSelected ? "#fff7ed" : "white", color: isSelected ? "#d97706" : "#555",
    cursor: "pointer", fontSize: "0.9rem", fontWeight: isSelected ? "600" : "400",
    transition: "all 0.2s ease", display: "flex", alignItems: "center", gap: "6px"
  }); 
  
  const filteredRecipes = existingRecipes.filter(recipe => 
    recipe.name.toLowerCase().includes(recipeSearchTerm.toLowerCase()) || 
    (recipe.author && recipe.author.toLowerCase().includes(recipeSearchTerm.toLowerCase()))
  );

  return (
    <>
    <div className="edit-food-page">
      <Header />
      <div className="edit-food-container">
        
        {/* === Topbar === */}
        <div className="edit-topbar">
          <button className="admin-edit-food-back-btn" onClick={() => navigate("/admin")}>
            <span className="admin-edit-food-back-icon"><FaArrowLeftLong /></span>
            {t("addFood.backToDashboard")}
          </button>

          <div className="edit-title">
            <h2>{t("addFood.linkRecipeTitle")}</h2>
          </div>

          <button className="admin-edit-food-save-btn" onClick={() => setShowSaveConfirm(true)}>
            <span className="admin-edit-food-save-icon"><FiLink /></span>
            {t("addFood.linkBtn")}
          </button>
        </div>

        {/* === Recipe Selection Card === */}
        <div className="edit-food-basic-info-card" style={{ marginBottom: "25px", border: "2px solid #caa781", backgroundColor: "#fdfbf9" }}>
          <h3 style={{ color: "#916848", display: "flex", alignItems: "center", gap: "8px" }}>
            <FiLink /> {t("addFood.selectRecipeHeader")}
          </h3>
          <p style={{ color: "#7a6b5a", fontSize: "0.95rem", marginBottom: "15px" }}>
            {t("addFood.selectRecipeDesc")}
          </p>
{/* Search Box */}
          <div className="search-box" style={{ marginBottom: "15px" }}>
            <CiSearch className="search-icon" />
            <input 
              type="text" 
              placeholder={t("addFood.searchRecipePlaceholder")}
              value={recipeSearchTerm}
              onChange={(e) => setRecipeSearchTerm(e.target.value)}
              style={{ width: "100%", padding: "10px 14px 10px 38px", borderRadius: "8px", border: "1px solid #d8c9b6", outline: "none", fontSize: "15px" }}
            />
          </div>

          <div className="recipe-selection-list">
            {filteredRecipes.length > 0 ? (
              filteredRecipes.map(recipe => (
                <div 
                  key={recipe.id}
                  className={`recipe-selection-item ${selectedRecipeId === recipe.id ? "selected" : ""}`}
                  onClick={() => setSelectedRecipeId(recipe.id)}
                >
                  <div className="recipe-selection-info">
                    <div className="recipe-selection-name">{recipe.name}</div>
                    {recipe.author && <div className="recipe-selection-author">By {recipe.author}</div>}
                  </div>
                  {selectedRecipeId === recipe.id && (
                    <div className="recipe-selection-check">
                      <FiCheck size={20} />
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="recipe-selection-empty">
                {t("addFood.noRecipesFound")}
              </div>
            )}
          </div>
        </div>

        <div className="edit-grid">
          {/* === Image Section === */}
          <div className="edit-food-image-upload-section">
            <h3>{t("addFood.foodImage")}</h3>
            <div className="image-preview">
              {selectedImage ? (
                <img src={URL.createObjectURL(selectedImage)} alt="Preview" />
              ) : (
                <p>{t("addFood.noImageSelected")}</p>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => setSelectedImage(e.target.files[0])}
            />
            
            <button className="admin-edit-food-upload-btn" onClick={() => fileInputRef.current.click()}>
              <span className="admin-edit-food-upload-icon"><MdOutlineFileUpload /></span>
              {t("addFood.selectImage")}
            </button>
          </div>

          {/* === Basic Info === */}
          <div className="edit-food-basic-info-card">
            <h3>{t("addFood.basicInfo")}</h3>
            
            <label className="basic-info-label">{t("addFood.foodName")}</label>
            <input
              className="edit-food-input"
              name="name"
              value={food.name}
              onChange={handleChange}
              placeholder={t("addFood.foodNamePlaceholder")}
            />

            <div className="edit-food-basic-info-two-col" style={{ marginTop: 0, marginBottom: "15px" }}>
              <div>
                <label className="basic-info-label">{t("addFood.alternativeName")}</label>
                <input
                  className="edit-food-input"
                  name="alternative"
                  value={food.alternative}
                  onChange={handleChange}
                  placeholder="e.g. Nasi Lemak Ayam"
                />
              </div>
              <div>
                <label className="basic-info-label">{t("addFood.altDescription")}</label>
                <input
                  className="edit-food-input"
                  name="altDescription"
                  value={food.altDescription}
                  onChange={handleChange}
                  placeholder="Brief alternative description"
                />
              </div>
            </div>

            <div className="food-origin-field">
              <label className="basic-info-label">{t("addFood.regionOfOrigin")}</label>
              <div className="custom-select-wrapper">
                <select 
                  className="edit-food-select" 
                  name="origin" 
                  value={food.origin} 
                  onChange={handleChange}
                >
                  <option value="">{t("addFood.selectOriginOption")}</option>
                  {ORIGIN_OPTIONS.map((origin) => (
                    <option key={origin} value={origin}>{origin}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="food-category-field afp-category">
              <label className="basic-info-label">{t("addFood.category")}</label>
              <div className="dietary-preferences-grid">
                {FOOD_TYPE_OPTIONS.map((cat) => {
                  const currentCats = Array.isArray(food.category) ? food.category : [];
                  return (
                    <label key={cat} className="dietary-option">
                      <input type="checkbox" checked={currentCats.includes(cat)} onChange={() => toggleCategory(cat)} />
                      <span>{t(`explore.cat_${cat.toLowerCase().replace(" ", "_")}`) || cat}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* === Cultural Context === */}
        <div className="edit-cultural-context-card">
          <h3>{t("addFood.culturalContext")}</h3>
          <label className="basic-info-label">{t("addFood.description")}</label>
          <textarea 
            className="edit-food-textarea" name="description" value={food.description} 
            onChange={handleChange} rows={4} placeholder={t("addFood.descriptionPlaceholder")}
          />

          <label className="basic-info-label">{t("addFood.culturalSignificance")}</label>
          <textarea 
            className="edit-food-textarea" name="culturalSignificance" value={food.culturalSignificance} 
            onChange={handleChange} rows={4} placeholder={t("addFood.culturalSignificancePlaceholder")}
          />

          <label className="basic-info-label">{t("addFood.traditionalPreparation")}</label>
          <textarea 
            className="edit-food-textarea" name="traditionalPreparation" value={food.traditionalPreparation} 
            onChange={handleChange} rows={4} placeholder={t("addFood.traditionalPreparationPlaceholder")}
          />

          <label className="basic-info-label">{t("addFood.didYouKnow")}</label>
          <textarea 
            className="edit-food-textarea" name="didYouKnow" value={food.didYouKnow} 
            onChange={handleChange} rows={2} placeholder="Optional interesting fact about this food"
          />
        </div>

        {/* === Nutritional Info === */}
        <div className="edit-cultural-context-card">
          <h3 className="edit-food-section-title">
            {t("addFood.nutritionalInfo")} <span className="serving-note">({t("addFood.perServing")})</span>
          </h3>
          <div className="nutrition-grid">
            {[
              { labelKey: "addFood.calories",      name: "calories",  placeholder: "e.g. 350" },
              { labelKey: "addFood.protein",        name: "protein",   placeholder: "e.g. 15" },
              { labelKey: "addFood.carbohydrates",  name: "carbs",     placeholder: "e.g. 45" },
              { labelKey: "addFood.totalFat",       name: "fat",       placeholder: "e.g. 12" },
              { labelKey: "addFood.dietaryFiber",   name: "fiber",     placeholder: "e.g. 4" },
              { labelKey: "addFood.vitaminC",       name: "vitaminc",  placeholder: "e.g. 2.5" },
            ].map((item) => (
              <div key={item.name}>
                <label className="basic-info-label">{t(item.labelKey)}</label>
                <input 
                  type="number" className="edit-food-input" name={item.name} 
                  value={food[item.name]} onChange={handleChange} placeholder={item.placeholder}
                />
              </div>
            ))}
          </div>
        </div>

        {/* === Additional Details === */}
        <div className="edit-cultural-context-card">
          <h3>{t("addFood.additionalDetails")}</h3>
          
          <label className="basic-info-label">{t("addFood.commonIngredients")}</label>
          <div style={chipContainerStyle}>
            {COMMON_INGREDIENTS_LIST.map((ing) => {
              const isSelected = selectedIngredients.includes(ing);
              return (
                <button
                  key={ing} type="button" style={getChipStyle(isSelected)} onClick={() => toggleIngredient(ing)}
                >
                  {ing} {isSelected && <FiPlus style={{transform: 'rotate(45deg)'}} />}
                </button>
              );
            })}
            <button type="button" style={getChipStyle(showOtherIngredient)} onClick={() => setShowOtherIngredient(!showOtherIngredient)}>
              {t("addFood.other")} {showOtherIngredient && <FiCheck />}
            </button>
          </div>

          {showOtherIngredient && (
            <div style={{ marginBottom: "16px" }}>
              <label className="basic-info-label" style={{fontSize: "0.9rem", color: "#666"}}>
                {t("addFood.otherIngredientsLabel")}
              </label>
              <textarea 
                className="edit-food-textarea" value={otherIngredientText} onChange={(e) => setOtherIngredientText(e.target.value)}
                rows={2} placeholder={t("addFood.otherIngredientsPlaceholder")}
              />
            </div>
          )}

          <label className="basic-info-label">{t("addFood.dietaryPreferences")}</label>
          <div style={chipContainerStyle}>
            {DIETARY_TAG_OPTIONS.map((tag) => {
              const isSelected = selectedDietary.includes(tag);
              return (
                <button key={tag} type="button" style={getChipStyle(isSelected)} onClick={() => toggleDietary(tag)}>
                  {tag} {isSelected && <FiCheck />}
                </button>
              );
            })}
          </div>

          <label className="basic-info-label" style={{marginTop: "10px"}}>{t("addFood.healthTips")}</label>
          <textarea 
            className="edit-food-textarea" name="healthTips" value={food.healthTips} 
            onChange={handleChange} rows={2} placeholder={t("addFood.healthTipsPlaceholder")}
          />
        </div>

      </div>

      {/* Confirmation Modal */}
      {showSaveConfirm && (
        <div className="modal-overlay">
          <div className="delete-modal">
            <h3>{t("addFood.confirmLinkTitle")}</h3>
            <p>{t("addFood.confirmLinkMsg")}</p>
            <div className="modal-actions">
              <button className="save-cancel-btn" onClick={() => setShowSaveConfirm(false)}>{t("addFood.cancel")}</button>
              <button className="confirm-save-btn" onClick={handleConfirmLink}>{t("addFood.yesLinkFood")}</button>
            </div>
          </div>
        </div>
      )}

      {/* Success/Error Notification Modal */}
      {showNotification.visible && (
        <div className="modal-overlay">
          <div className={`notification-modal ${showNotification.type}`}>
            <h3 style={{ color: showNotification.type === "error" ? "#a33b3b" : "#387346" }}>
              {showNotification.type === "success" ? t("addFood.successTitle") : t("addFood.errorTitle")}
            </h3>
            <p>{showNotification.message}</p>
            <div className="modal-actions" style={{ justifyContent: "center" }}>
              <button
                className="confirm-save-btn"
                onClick={handleCloseNotification}
                style={{ backgroundColor: showNotification.type === "error" ? "#a33b3b" : "#7b4b26" }}
              >
                {t("addFood.ok")}
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

export default LinkFoodPage;