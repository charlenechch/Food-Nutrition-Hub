import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../css/EditFoodPage.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useTranslation } from "react-i18next";
import { MdOutlineFileUpload } from "react-icons/md";
import { FaArrowLeftLong } from "react-icons/fa6";
import { FiSave } from "react-icons/fi";

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
  const [food, setFood] = useState(null);

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

  // --- Fetch Food Data on Load ---
  useEffect(() => {
    const fetchFood = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/foods/${id}`, {
          credentials: "include",
        });
        const data = await res.json();

        if (data.success) {
          setFood({
            name: data.data.name || "",
            alternative: data.data.alternative || "",
            altDescription: data.data.altDescription || "",
            origin: data.data.origin || "",
            calories: data.data.Energy_kcal || "",
            protein: data.data.Protein_g || "",
            carbs: data.data.Carbohydrates_g || "",
            fat: data.data.Fat_g || "",
            fiber: data.data.Fiber_g || "",
            vitaminc: data.data.VitaminC_mg || "",
            category: data.data.category ? data.data.category.split(',').map(s => s.trim()).filter(Boolean) : [],
            description: data.data.description || "",
            culturalSignificance: data.data.culturalSignificance || "",
            traditionalPreparation: data.data.traditionalPreparation || "",
            didYouKnow: data.data.didYouKnow || "",
            healthTips: data.data.healthTips || "",
            image: data.data.image || "",
          });

          if (data.data.dietaryTags) {
            setSelectedDietary(data.data.dietaryTags.split(',').map(s => s.trim()).filter(Boolean));
          }
          if (data.data.commonIngredients) {
            setSelectedIngredients(data.data.commonIngredients.split(',').map(s => s.trim()).filter(Boolean));
          }

          setExistingImageUrl(data.data.image || "");
        } else {
          console.error("Failed to fetch food:", data.error);
        }
      } catch (err) {
        console.error("Error fetching food:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFood();
  }, [id]);

  // --- Handle Input Changes ---
  const handleChange = (e) => {
    setFood({ ...food, [e.target.name]: e.target.value });
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
      console.log("[upload] no file provided, returning existingImageUrl");
      return existingImageUrl;
    }

    console.log("[upload] selected file:", {
      name: file.name,
      size: file.size,
      type: file.type,
    });

    const maxBytes = 10 * 1024 * 1024; // 10MB
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
        console.log("[upload] base64 length:", base64Image ? base64Image.length : 0);

        if (!base64Image || typeof base64Image !== "string" || !base64Image.startsWith("data:image")) {
          console.error("[upload] invalid base64 produced:", base64Image && base64Image.slice(0, 50));
          setShowNotification({
            visible: true,
            message: t("editFood.couldNotConvertBase64"),
            type: "error",
          });
          return reject(new Error("Invalid base64"));
        }

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

          let uploadResult;
          try {
            uploadResult = await uploadRes.json();
          } catch (jsonErr) {
            console.error("[upload] failed to parse JSON response:", jsonErr);
            setShowNotification({
              visible: true,
              message: t("editFood.serverResponseInvalid"),
              type: "error",
            });
            return reject(new Error("Invalid server response"));
          }

          console.log("[upload] server response:", uploadResult);

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
        console.log("[save] finalImageUrl after upload:", finalImageUrl);
      } else {
        console.log("[save] no new image selected — using existingImageUrl:", existingImageUrl);
      }
    } catch (uploadErr) {
      console.warn("[save] upload failed — aborting save:", uploadErr);
      return;
    }

    const dietaryString = selectedDietary.join(", ");
    let ingredientsString = selectedIngredients.join(", ");
    if (showOtherIngredient && otherIngredientText.trim()) {
      if (ingredientsString) ingredientsString += ", ";
      ingredientsString += otherIngredientText.trim();
    }

    const dataToSave = {
      name: food.name,
      alternative: food.alternative,
      altDescription: food.altDescription,
      origin: food.origin,
      category: Array.isArray(food.category) ? food.category.join(", ") : food.category,
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

    try {
      console.log("[save] updating food with:", dataToSave);
      const res = await fetch(`${API_URL}/api/foods/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        credentials: "include",
        body: JSON.stringify(dataToSave),
      });

      const result = await res.json();
      console.log("[save] update response:", result);

      if (result.success) {
        setExistingImageUrl(finalImageUrl);
        setSelectedImage(null);
        setShowNotification({
          visible: true,
          message: t("editFood.savedSuccessfully"),
          type: "success",
        });
      } else {
        console.error("[save] Failed to save:", result.error);
        setShowNotification({
          visible: true,
          message: `Failed to save changes: ${result.error || "Unknown error."}`,
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
                  console.log("[input] onChange, files:", e.target.files);
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
                  <input className="edit-food-input" name="name" value={food.name} onChange={handleChange} />
                </div>
              </div>

              <div className="edit-food-basic-info-two-col" style={{ marginTop: 0, marginBottom: "15px" }}>
                <div>
                  <label className="basic-info-label">{t("addFood.alternativeName")}</label>
                  <input className="edit-food-input" name="alternative" value={food.alternative} onChange={handleChange} />
                </div>
                <div>
                  <label className="basic-info-label">{t("addFood.altDescription")}</label>
                  <input className="edit-food-input" name="altDescription" value={food.altDescription} onChange={handleChange} />
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

              {/* Origin */}
              <div className="food-origin-field">
                <label className="basic-info-label">{t("editFood.regionOfOrigin")}</label>
                <div className="custom-select-wrapper">
                  <select className="edit-food-select" name="origin" value={food.origin} onChange={handleChange}>
                    <option value="">{t("editFood.selectOrigin")}</option>
                    {ORIGIN_OPTIONS.map((origin) => (
                      <option key={origin} value={origin}>
                        {origin}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Cultural Context */}
          <div className="edit-cultural-context-card">
            <h3>{t("editFood.culturalContext")}</h3>
            <label className="basic-info-label">{t("editFood.descriptionLabel")}</label>
            <textarea
              className="edit-food-textarea"
              name="culturalContext"
              value={food.description}
              onChange={handleChange}
              placeholder={t("editFood.descriptionPlaceholder")}
              rows={5}
            />
            <label className="basic-info-label">{t("editFood.culturalSignificance")}</label>
            <textarea
              className="edit-food-textarea"
              name="culturalSignificance"
              value={food.culturalSignificance}
              onChange={handleChange}
              placeholder={t("editFood.culturalSignificancePlaceholder")}
              rows={5}
            />
            <label className="basic-info-label">{t("editFood.traditionalPreparation")}</label>
            <textarea
              className="edit-food-textarea"
              name="traditionalPreparation"
              value={food.traditionalPreparation}
              onChange={handleChange}
              placeholder={t("editFood.traditionalPreparationPlaceholder")}
              rows={5}
            />

            <label className="basic-info-label">{t("addFood.didYouKnow")}</label>
            <textarea className="edit-food-textarea" name="didYouKnow" value={food.didYouKnow} onChange={handleChange} rows={2} />
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
                { label: t("editFood.calories"), name: "calories" },
                { label: t("editFood.protein"), name: "protein" },
                { label: t("editFood.carbohydrates"), name: "carbs" },
                { label: t("editFood.totalFat"), name: "fat" },
                { label: t("editFood.dietaryFiber"), name: "fiber" },
                { label: t("editFood.vitaminC"), name: "vitaminc" },
              ].map((item) => (
                <div key={item.name}>
                  <label className="basic-info-label">{item.label}</label>
                  <input className="edit-food-input" name={item.name} value={food[item.name]} onChange={handleChange} />
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
                  <button key={ing} type="button" style={getChipStyle(isSelected)} onClick={() => toggleIngredient(ing)}>
                    {ing}
                  </button>
                );
              })}
              <button type="button" style={getChipStyle(showOtherIngredient)} onClick={() => setShowOtherIngredient(!showOtherIngredient)}>
                {t("addFood.other")}
              </button>
            </div>

            {showOtherIngredient && (
              <div style={{ marginBottom: "16px" }}>
                <label className="basic-info-label" style={{fontSize: "0.9rem", color: "#666"}}>{t("addFood.otherIngredientsLabel")}</label>
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
                  </button>
                );
              })}
            </div>

            <label className="basic-info-label" style={{marginTop: "10px"}}>{t("addFood.healthTips")}</label>
            <textarea className="edit-food-textarea" name="healthTips" value={food.healthTips} onChange={handleChange} rows={2} />
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