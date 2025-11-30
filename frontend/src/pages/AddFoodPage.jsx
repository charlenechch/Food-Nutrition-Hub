import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../css/EditFoodPage.css"; // Reuse CSS for consistency
import Header from "../components/Header";
import Footer from "../components/Footer";
import { MdOutlineFileUpload } from "react-icons/md";
import { FaArrowLeftLong } from "react-icons/fa6";
import { FiPlus } from "react-icons/fi"; 

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// --- 1. DEFINE ORIGIN OPTIONS (Matches EditFoodPage) ---
const ORIGIN_OPTIONS = [
  "Malay",
  "Chinese",
  "Iban",
  "Melanau",
  "Kadazan",
  "Bidayuh",
  "Dayak",
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

  const [food, setFood] = useState({
    name: "",
    category: "",
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
  });

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

  // --- Handlers ---
  const handleChange = (e) => {
    setFood({ ...food, [e.target.name]: e.target.value });
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

  const handleConfirmAdd = async () => {
    setShowSaveConfirm(false);

    // Validation: Ensure Origin is selected
    if (!food.origin) {
        setShowNotification({
            visible: true,
            message: "Please select a Region of Origin.",
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
                message: "Image upload failed.", 
                type: "error"
            });
            return;
        }
      }

      const newFoodData = {
        name: food.name,
        category: food.category,
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

            {/* Category Dropdown */}
            <div className="food-category-field">
              <label className="basic-info-label">Category</label>
              <div className="custom-select-wrapper">
                <select className="edit-food-select" name="category" value={food.category} onChange={handleChange}>
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
            </div>

            {/* --- ORIGIN DROPDOWN --- */}
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
                        <option key={origin} value={origin}>
                            {origin}
                        </option>
                    ))}
                </select>
              </div>
            </div>

          </div>
        </div>

        {/* === Cultural Context (With Placeholders) === */}
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

        {/* === Nutritional Info (With Placeholders) === */}
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

      <Footer />
    </div>
  );
};

export default AddFoodPage;