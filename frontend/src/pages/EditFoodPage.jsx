import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../css/EditFoodPage.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useTranslation } from "react-i18next";
import { MdOutlineFileUpload } from "react-icons/md";
import { FaArrowLeftLong } from "react-icons/fa6";
import { FiSave, FiPlus, FiCheck } from "react-icons/fi";

// Get the API URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Define the options for the Region of Origin dropdown
const ORIGIN_OPTIONS = [
  "Malay",
  "Chinese",
  "Iban",
  "Melanau",
  "Kadazan",
  "Bidayuh",
  "Dayak",
];

const FOOD_TYPE_OPTIONS = [
  "Poultry", "Seafood", "Vegetables", "Fermented", 
  "Dessert", "Rice Dish", "Noodles", "Soup", "Meat"
];

const DIFFICULTY_OPTIONS = ["Easy", "Medium", "Hard"];

const DIETARY_TAG_OPTIONS = [
  "Vegetarian", "Vegan", "Halal", "Gluten Free", 
  "Dairy Free", "Low Fat", "High Protein", "Spicy"
];

const COMMON_INGREDIENTS_LIST = [
  "Chicken", "Rice", "Garlic", "Onion", "Ginger", 
  "Salt", "Sugar", "Chili", "Lemongrass", "Soy Sauce"
];

const EditFoodPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const fileInputRef = useRef(null);

  const [selectedImage, setSelectedImage] = useState(null);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [existingImageUrl, setExistingImageUrl] = useState("");
  const [showNotification, setShowNotification] = useState({
    visible: false,
    message: "",
    type: "",
  });
  
  // Separate food and recipe data
  const [food, setFood] = useState(null);
  const [recipe, setRecipe] = useState(null);
  const [hasExistingRecipe, setHasExistingRecipe] = useState(false);

  const [selectedDietary, setSelectedDietary] = useState([]);
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [showOtherIngredient, setShowOtherIngredient] = useState(false);
  const [otherIngredientText, setOtherIngredientText] = useState("");

  //================
  // CSRF
  //================
  const [csrfToken, setCsrfToken] = useState("");

  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const res = await fetch(`${API_BASE_URL}/api/csrf-token`, { credentials: "include" });
        const data = await res.json();
        setCsrfToken(data.csrfToken);
      } catch (err) {
        console.error("Failed to fetch CSRF token", err);
      }
    };
    fetchCsrfToken();
  }, []);

  // --- Fetch Food and Recipe Data on Load ---
  useEffect(() => {
    const fetchFoodAndRecipe = async () => {
      try {
        setLoading(true);
        
        // Fetch food data
        const foodRes = await fetch(`${API_URL}/api/foods/${id}`, {
          credentials: "include",
        });
        const foodData = await foodRes.json();

        if (foodData.success) {
          // Set food data
          setFood({
            name: foodData.data.name || "",
            alternative: foodData.data.alternative || "",
            altDescription: foodData.data.altDescription || "",
            origin: foodData.data.origin || "",
            category: foodData.data.category ? foodData.data.category.split(',').map(s => s.trim()).filter(Boolean) : [],
            description: foodData.data.description || "",
            culturalSignificance: foodData.data.culturalSignificance || "",
            traditionalPreparation: foodData.data.traditionalPreparation || "",
            healthTips: foodData.data.healthTips || "",
            image: foodData.data.image || "",
            difficulty: foodData.data.difficulty || "Medium",
            prepTime: foodData.data.prepTime || "",
            Energy_kcal: foodData.data.Energy_kcal || "",
            Protein_g: foodData.data.Protein_g || "",
            Carbohydrates_g: foodData.data.Carbohydrates_g || "",
            Fat_g: foodData.data.Fat_g || "",
            Fiber_g: foodData.data.Fiber_g || "",
            VitaminC_mg: foodData.data.VitaminC_mg || "",
          });

          if (foodData.data.dietaryTags) {
            setSelectedDietary(foodData.data.dietaryTags.split(',').map(s => s.trim()).filter(Boolean));
          }
          if (foodData.data.commonIngredients) {
            setSelectedIngredients(foodData.data.commonIngredients.split(',').map(s => s.trim()).filter(Boolean));
          }

          setExistingImageUrl(foodData.data.image || "");
        } else {
          console.error("Failed to fetch food:", foodData.error);
          return;
        }
        
        // Fetch recipe data by foodID
        const recipeRes = await fetch(`${API_URL}/api/recipe/recipes/food/${id}`, {
          credentials: "include",
        });
        const recipeData = await recipeRes.json();
        
        if (recipeData.success && recipeData.data) {
          setHasExistingRecipe(true);
          setRecipe({
            recipeID: recipeData.data.recipeID,
            description: recipeData.data.description || "",
            ingredients: recipeData.data.ingredients || "",
            steps: recipeData.data.steps || "",
            cookTime: recipeData.data.cookTime || "",
            servings: recipeData.data.servings || "1",
            DidYouKnow: recipeData.data.DidYouKnow || "",
            chefTips: recipeData.data.chefTips || "",
          });
        } 
        
      } catch (err) {
        console.error("Error fetching data:", err);
        setShowNotification({
          visible: true,
          message: "Failed to load data. Please try again.",
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFoodAndRecipe();
  }, [id]);

  // --- Handle Input Changes ---
  const handleFoodChange = (e) => {
    setFood({ ...food, [e.target.name]: e.target.value });
  };

  const handleRecipeChange = (e) => {
    setRecipe({ ...recipe, [e.target.name]: e.target.value });
  };

  const toggleCategory = (cat) => {
    setFood((prev) => {
      const currentCats = Array.isArray(prev.category) ? prev.category : [];
      const isSelected = currentCats.includes(cat);
      const newCats = isSelected 
        ? currentCats.filter((c) => c !== cat) 
        : [...currentCats, cat];
      return { ...prev, category: newCats };
    });
  };

  // --- Buttons / Notifications ---
  const handleSaveClick = () => {
    setShowSaveConfirm(true);
    setShowNotification({ visible: false, message: "", type: "" });
  };
  const handleCancelSave = () => setShowSaveConfirm(false);
  const handleCloseNotification = () =>
    setShowNotification({ visible: false, message: "", type: "" });

  // --- Robust Image Upload (Base64 -> Cloudinary) ---
  const handleImageUpload = async (file) => {
    if (!file) {
      return existingImageUrl;
    }

    const maxBytes = 10 * 1024 * 1024;
    if (file.size > maxBytes) {
      setShowNotification({
        visible: true,
        message: t("editFood.imageTooLarge"),
        type: "error",
      });
      throw new Error("File too large");
    }
    if (!file.type.startsWith("image/")) {
      setShowNotification({
        visible: true,
        message: t("editFood.invalidImageType"),
        type: "error",
      });
      throw new Error("Invalid file type");
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onerror = (err) => {
        console.error("[upload] FileReader error:", err);
        setShowNotification({
          visible: true,
          message: t("editFood.failedToReadImage"),
          type: "error",
        });
        reject(new Error("FileReader failed"));
      };

      reader.onloadend = async () => {
        const base64Image = reader.result;

        try {
          const uploadRes = await fetch(`${API_URL}/api/foods/upload/food-image`, {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              "X-CSRF-Token": csrfToken,
            },
            body: JSON.stringify({ image: base64Image }),
          });

          const uploadResult = await uploadRes.json();

          if (!uploadRes.ok || !uploadResult.success || !uploadResult.imageUrl) {
            const serverMsg = uploadResult && uploadResult.error ? uploadResult.error : "Upload failed";
            setShowNotification({
              visible: true,
              message: `Image upload failed: ${serverMsg}`,
              type: "error",
            });
            return reject(new Error(serverMsg));
          }

          return resolve(uploadResult.imageUrl);
        } catch (err) {
          console.error("[upload] network or server error:", err);
          setShowNotification({
            visible: true,
            message: t("editFood.serverErrorDuringUpload"),
            type: "error",
          });
          return reject(err);
        }
      };

      reader.readAsDataURL(file);
    });
  };

  // --- Confirm Save (upload then PUT) ---
  const handleConfirmSave = async () => {
    setShowSaveConfirm(false);

    let finalImageUrl = existingImageUrl;

    try {
      if (selectedImage) {
        finalImageUrl = await handleImageUpload(selectedImage);
      }
    } catch (uploadErr) {
      console.warn("[save] upload failed — aborting save:", uploadErr);
      return;
    }

    // Prepare food data
    const dietaryString = selectedDietary.join(", ");
    let ingredientsString = selectedIngredients.join(", ");
    if (showOtherIngredient && otherIngredientText.trim()) {
      if (ingredientsString) ingredientsString += ", ";
      ingredientsString += otherIngredientText.trim();
    }

    const foodDataToSave = {
      name: food.name,
      alternative: food.alternative,
      altDescription: food.altDescription,
      origin: food.origin,
      category: Array.isArray(food.category) ? food.category.join(", ") : food.category,
      description: food.description,
      culturalSignificance: food.culturalSignificance,
      traditionalPreparation: food.traditionalPreparation,
      Energy_kcal: Number(food.Energy_kcal) || 0,
      Protein_g: Number(food.Protein_g) || 0,
      Carbohydrates_g: Number(food.Carbohydrates_g) || 0,
      Fat_g: Number(food.Fat_g) || 0,
      Fiber_g: Number(food.Fiber_g) || 0,
      VitaminC_mg: Number(food.VitaminC_mg) || 0,
      image: finalImageUrl,
      commonIngredients: ingredientsString,
      dietaryTags: dietaryString,
      healthTips: food.healthTips,
      difficulty: food.difficulty,
      prepTime: food.prepTime || "0",
    };

    // Prepare recipe data
    const recipeDataToSave = {
      description: recipe.description,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      cookTime: recipe.cookTime || null,
      servings: recipe.servings || "1",
      DidYouKnow: recipe.DidYouKnow,
      chefTips: recipe.chefTips,
    };

    try {
      // Update food data
      console.log("[save] updating food with:", foodDataToSave);
      const foodRes = await fetch(`${API_URL}/api/foods/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        credentials: "include",
        body: JSON.stringify(foodDataToSave),
      });

      const foodResult = await foodRes.json();

      if (!foodResult.success) {
        console.error("[save] Failed to save food:", foodResult.error);
        setShowNotification({
          visible: true,
          message: `Failed to save food changes: ${foodResult.error || "Unknown error."}`,
          type: "error",
        });
        return;
      }

      // Update or create recipe
      let recipeResult;
      if (hasExistingRecipe && recipe.recipeID) {
        // Update existing recipe
        console.log("[save] updating recipe with:", recipeDataToSave);
        const recipeRes = await fetch(`${API_URL}/api/recipe/recipes/${recipe.recipeID}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken,
          },
          credentials: "include",
          body: JSON.stringify(recipeDataToSave),
        });
        recipeResult = await recipeRes.json();
      }

      if (recipeResult.success) {
        setExistingImageUrl(finalImageUrl);
        setSelectedImage(null);
        setShowNotification({
          visible: true,
          message: t("editFood.savedSuccessfully"),
          type: "success",
        });
      } else {
        console.error("[save] Failed to save recipe:", recipeResult.error);
        setShowNotification({
          visible: true,
          message: `Food saved but recipe update failed: ${recipeResult.error || "Unknown error."}`,
          type: "error",
        });
      }
    } catch (err) {
      console.error("[save] Error saving:", err);
      setShowNotification({
        visible: true,
        message: t("editFood.unknownSaveError"),
        type: "error",
      });
    }
  };

  // --- Loading / Not Found ---
  if (loading) {
    return (
      <>
        <div className="edit-food-page">
          <Header />
          <p style={{ textAlign: "center", marginTop: "2rem" }}>{t("editFood.loadingFood")}</p>
        </div>
        <Footer />
      </>
    );
  }

  if (!food) {
    return (
      <>
        <div className="edit-food-page">
          <Header />
          <p style={{ textAlign: "center", marginTop: "2rem" }}>{t("editFood.foodNotFound")}</p>
        </div>
        <Footer />
      </>
    );
  }

  // Helper to display image whether cloud URL or server path
  const getDisplayImage = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `${API_URL}/${url.replace(/^\/+/, "")}`;
  };

  const toggleDietary = (tag) => {
    setSelectedDietary((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };

  const toggleIngredient = (ing) => {
    setSelectedIngredients((prev) => prev.includes(ing) ? prev.filter((i) => i !== ing) : [...prev, ing]);
  };

  const chipContainerStyle = { display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "8px", marginBottom: "16px" };
  const getChipStyle = (isSelected) => ({
    padding: "8px 16px", borderRadius: "20px", border: `1px solid ${isSelected ? "#d97706" : "#ddd"}`,
    backgroundColor: isSelected ? "#fff7ed" : "white", color: isSelected ? "#d97706" : "#555",
    cursor: "pointer", fontSize: "0.9rem", fontWeight: isSelected ? "600" : "400",
    transition: "all 0.2s ease", display: "flex", alignItems: "center", gap: "6px"
  });

  // --- Render Page ---
  return (
    <>
      <div className="edit-food-page">
        <Header />

        <div className="edit-food-container">
          <div className="edit-topbar">
            <button className="admin-edit-food-back-btn" onClick={() => navigate("/admin")}>
              <span className="admin-edit-food-back-icon">
                <FaArrowLeftLong />
              </span>
              {t("editFood.backToDashboard")}
            </button>

            <div className="edit-title">
              <h2>{t("editFood.editFoodItem")}</h2>
              <p>{food.name}</p>
            </div>

            <button className="admin-edit-food-save-btn" onClick={handleSaveClick}>
              <span className="admin-edit-food-save-icon">
                <FiSave />
              </span>
              {t("editFood.saveChanges")}
            </button>
          </div>

          <div className="edit-grid">
            {/* Image Section */}
            <div className="edit-food-image-upload-section">
              <h3>{t("editFood.foodImage")}</h3>
              <div className="image-preview">
                {selectedImage ? (
                  <img src={URL.createObjectURL(selectedImage)} alt="New Image Preview" />
                ) : existingImageUrl ? (
                  <img
                    src={`${getDisplayImage(existingImageUrl)}?t=${Date.now()}`}
                    alt={food.name}
                  />
                ) : (
                  <p>{t("editFood.noImage")}</p>
                )}
              </div>
              <input
                ref={fileInputRef}
                className="edit-food-input"
                type="file"
                id="fileInput"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files && e.target.files[0];
                  setSelectedImage(file || null);
                }}
                style={{ display: "none" }}
              />
              <button
                className="admin-edit-food-upload-btn"
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
              >
                <span className="admin-edit-food-upload-icon">
                  <MdOutlineFileUpload />
                </span>
                {t("editFood.uploadNewImage")}
              </button>
            </div>

            {/* Basic Info Section */}
            <div className="edit-food-basic-info-card">
              <h3>{t("editFood.basicInformation")}</h3>
              <div className="edit-food-basic-info-two-col">
                <div>
                  <label className="basic-info-label">{t("editFood.foodName")}</label>
                  <input className="edit-food-input" name="name" value={food.name} onChange={handleFoodChange} />
                </div>
              </div>

              <div className="edit-food-basic-info-two-col efpage-basic-info">
                <div>
                  <label className="basic-info-label">{t("addFood.alternativeName")}</label>
                  <textarea className="edit-food-textarea resizable-field" name="alternative" value={food.alternative} onChange={handleFoodChange} rows={1} />
                </div>
                <div>
                  <label className="basic-info-label">{t("addFood.altDescription")}</label>
                  <textarea className="edit-food-textarea resizable-field" name="altDescription" value={food.altDescription} onChange={handleFoodChange} rows={1} />
                </div>
              </div>

              {/* Origin */}
              <div className="food-origin-field">
                <label className="basic-info-label">{t("editFood.regionOfOrigin")}</label>
                <div className="custom-select-wrapper">
                  <select className="edit-food-select" name="origin" value={food.origin} onChange={handleFoodChange}>
                    <option value="">{t("editFood.selectOrigin")}</option>
                    {ORIGIN_OPTIONS.map((origin) => (
                      <option key={origin} value={origin}>
                        {origin}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Category */}
              <div className="food-category-field">
                <label className="basic-info-label">{t("editFood.category")}</label>
                <div className="dietary-preferences-grid">
                  {FOOD_TYPE_OPTIONS.map((cat) => {
                    const currentCats = Array.isArray(food.category) ? food.category : [];
                    return (
                      <label key={cat} className="dietary-option">
                        <input
                          type="checkbox"
                          checked={currentCats.includes(cat)}
                          onChange={() => toggleCategory(cat)}
                        />
                        <span>
                          {t(`explore.cat_${cat.toLowerCase().replace(" ", "_")}`) || cat}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Recipe Details Section */}
          <div className="edit-cultural-context-card">
            <h3>{t("addFood.recipeDetails")}</h3>
            
            <div className="edit-food-basic-info-two-col">
              <div>
                <label className="basic-info-label">{t("addFood.difficultyLevel")}</label>
                <div className="custom-select-wrapper">
                  <select className="edit-food-select" name="difficulty" value={food.difficulty} onChange={handleFoodChange}>
                    {DIFFICULTY_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="basic-info-label">{t("addFood.servings")}</label>
                <input type="number" className="edit-food-input" name="servings" value={recipe.servings} onChange={handleRecipeChange} placeholder={t("addFood.servingsPlace")} />
              </div>
            </div>

            <div className="edit-food-basic-info-two-col">
              <div>
                <label className="basic-info-label">{t("addFood.prepTime")}</label>
                <input type="number" className="edit-food-input" name="prepTime" value={food.prepTime} onChange={handleFoodChange} placeholder={t("addFood.prepTimePlace")} />
              </div>
              <div>
                <label className="basic-info-label">{t("addFood.cookTime")}</label>
                <input type="number" className="edit-food-input" name="cookTime" value={recipe.cookTime} onChange={handleRecipeChange} placeholder={t("addFood.cookTimePlace")} />
              </div>
            </div>

            <label className="basic-info-label">{t("addFood.ingredientsList")}</label>
            <textarea className="edit-food-textarea" name="ingredients" value={recipe.ingredients} onChange={handleRecipeChange} rows={5} placeholder={t("addFood.ingredientsListPlace")} />

            <label className="basic-info-label">{t("addFood.stepsList")}</label>
            <textarea className="edit-food-textarea" name="steps" value={recipe.steps} onChange={handleRecipeChange} rows={6} placeholder={t("addFood.stepsListPlace")} />

            <label className="basic-info-label">{t("addFood.recipeDescription")}</label>
            <textarea className="edit-food-textarea" name="description" value={recipe.description} onChange={handleRecipeChange} rows={6} placeholder={t("addFood.recipeDescriptionPlace")} />

            <label className="basic-info-label">{t("addFood.didYouKnow")}</label>
            <textarea className="edit-food-textarea" name="DidYouKnow" value={recipe.DidYouKnow} onChange={handleRecipeChange} rows={2} placeholder={t("addFood.didYouKnowPlace")} />
            
            <label className="basic-info-label">{t("addFood.chefTips")}</label>
            <textarea className="edit-food-textarea" name="chefTips" value={recipe.chefTips} onChange={handleRecipeChange} rows={3} placeholder={t("addFood.chefTipsPlace")} />
          </div>

          {/* Cultural Context */}
          <div className="edit-cultural-context-card">
            <h3>{t("editFood.culturalContext")}</h3>
            <label className="basic-info-label">{t("editFood.descriptionLabel")}</label>
            <textarea
              className="edit-food-textarea"
              name="description"
              value={food.description}
              onChange={handleFoodChange}
              placeholder={t("editFood.descriptionPlaceholder")}
              rows={5}
            />
            <label className="basic-info-label">{t("editFood.culturalSignificance")}</label>
            <textarea
              className="edit-food-textarea"
              name="culturalSignificance"
              value={food.culturalSignificance}
              onChange={handleFoodChange}
              placeholder={t("editFood.culturalSignificancePlaceholder")}
              rows={5}
            />
            <label className="basic-info-label">{t("editFood.traditionalPreparation")}</label>
            <textarea
              className="edit-food-textarea"
              name="traditionalPreparation"
              value={food.traditionalPreparation}
              onChange={handleFoodChange}
              placeholder={t("editFood.traditionalPreparationPlaceholder")}
              rows={5}
            />
          </div>

          {/* Nutritional Info */}
          <div className="edit-cultural-context-card">
            <div className="edit-food-nutrition-header">
              <h3 className="edit-food-section-title">
                {t("editFood.nutritionalInformation")}
              </h3>
              <span className="serving-note">{t("editFood.perServing")}</span>
            </div>
            <div className="nutrition-grid">
              {[
                { label: t("editFood.calories"), name: "Energy_kcal" },
                { label: t("editFood.protein"), name: "Protein_g" },
                { label: t("editFood.carbohydrates"), name: "Carbohydrates_g" },
                { label: t("editFood.totalFat"), name: "Fat_g" },
                { label: t("editFood.dietaryFiber"), name: "Fiber_g" },
                { label: t("editFood.vitaminC"), name: "VitaminC_mg" },
              ].map((item) => (
                <div key={item.name}>
                  <label className="basic-info-label">{item.label}</label>
                  <input className="edit-food-input" name={item.name} value={food[item.name]} onChange={handleFoodChange} />
                </div>
              ))}
            </div>
          </div>

          {/* Additional Details */}
          <div className="edit-cultural-context-card">
            <h3>{t("addFood.additionalDetails")}</h3>
            
            <label className="basic-info-label">{t("addFood.commonIngredients")}</label>
            <div style={chipContainerStyle}>
              {COMMON_INGREDIENTS_LIST.map((ing) => {
                const isSelected = selectedIngredients.includes(ing);
                return (
                  <button key={ing} type="button" style={getChipStyle(isSelected)} onClick={() => toggleIngredient(ing)}>
                    {ing}
                    {isSelected && <FiPlus style={{transform: 'rotate(45deg)'}} />}
                  </button>
                );
              })}
              <button type="button" style={getChipStyle(showOtherIngredient)} onClick={() => setShowOtherIngredient(!showOtherIngredient)}>
                {t("addFood.other")}
                {showOtherIngredient && <FiCheck />}
              </button>
            </div>

            {showOtherIngredient && (
              <div className="efpage-show-ing">
                <label className="basic-info-label efpage-show-ing-label">{t("addFood.otherIngredientsLabel")}</label>
                <textarea className="edit-food-textarea" value={otherIngredientText} onChange={(e) => setOtherIngredientText(e.target.value)} rows={2} />
              </div>
            )}

            <label className="basic-info-label">{t("addFood.dietaryPreferences")}</label>
            <div style={chipContainerStyle}>
              {DIETARY_TAG_OPTIONS.map((tag) => {
                const isSelected = selectedDietary.includes(tag);
                return (
                  <button key={tag} type="button" style={getChipStyle(isSelected)} onClick={() => toggleDietary(tag)}>
                    {tag}
                    {isSelected && <FiCheck />}
                  </button>
                );
              })}
            </div>

            <label className="basic-info-label efpage-cultural-label">{t("addFood.healthTips")}</label>
            <textarea className="edit-food-textarea" name="healthTips" value={food.healthTips} onChange={handleFoodChange} rows={2} />
          </div>
        </div>

        {/* Confirmation Modal */}
        {showSaveConfirm && (
          <div className="modal-overlay">
            <div className="delete-modal">
              <h3>{t("editFood.confirmationTitle")}</h3>
              <p>{t("editFood.confirmSaveMessage")}</p>
              <div className="modal-actions">
                <button className="save-cancel-btn" onClick={handleCancelSave}>
                  {t("editFood.cancel")}
                </button>
                <button className="confirm-save-btn" onClick={handleConfirmSave}>
                  {t("editFood.save")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notification Modal */}
        {showNotification.visible && (
          <div className="modal-overlay">
            <div className={`notification-modal ${showNotification.type}`}>
              <h3 style={{ color: showNotification.type === "error" ? "#a33b3b" : "#387346" }}>
                {showNotification.type === "success" ? t("editFood.successTitle") : t("editFood.errorTitle")}
              </h3>
              <p>{showNotification.message}</p>
              <div className="modal-actions" style={{ justifyContent: "center" }}>
                <button
                  className="confirm-save-btn"
                  onClick={handleCloseNotification}
                  style={{ backgroundColor: showNotification.type === "error" ? "#a33b3b" : "#7b4b26" }}
                >
                  {t("editFood.ok")}
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

export default EditFoodPage;