import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../css/EditFoodPage.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { MdOutlineFileUpload } from "react-icons/md";
import { FaArrowLeftLong } from "react-icons/fa6";
import { FiSave } from "react-icons/fi";

// Get the API URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const EditFoodPage = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Get the food ID from the URL
  const [selectedImage, setSelectedImage] = useState(null);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [existingImageUrl, setExistingImageUrl] = useState('');

  // Initialize state as null, we will fetch the data
  const [food, setFood] = useState(null);

  // --- 1. Fetch Food Data On Load ---
  useEffect(() => {
    const fetchFood = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/foods/${id}`, {
          credentials: "include",
        });
        const data = await res.json();

        if (data.success) {
          // Set the state with data from the API
          // Note: Your form had fields like 'name_en', but your API only has 'name'.
          // We are mapping the API data to the form fields.
          setFood({
            name: data.data.name || "",
            origin: data.data.origin || "",
            // Your API uses 'Energy_kcal', 'Protein_g', etc.
            calories: data.data.Energy_kcal || "",
            protein: data.data.Protein_g || "",
            carbs: data.data.Carbohydrates_g || "",
            fat: data.data.Fat_g || "",
            fiber: data.data.Fiber_g || "",
            sodium: data.data.Sodium_mg || "", // Assuming you add this to your DB
            // These fields were in your form but not your API
            name_ms: data.data.name_ms || "", 
            category: data.data.category || "",
            description: data.data.description || "",
            cultural_significance: data.data.cultural_significance || "",
            traditional_preparation: data.data.traditional_preparation || "",
            image: data.data.image || '',
          });
          setExistingImageUrl(data.data.image || '');
          
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
  }, [id]); // Re-run this effect if the ID in the URL changes

  // --- 2. Handle Form Input Changes ---
  const handleChange = (e) => {
    setFood({ ...food, [e.target.name]: e.target.value });
  };

  // --- 3. Handle Save Button Click ---
  const handleSaveClick = () => {
    setShowSaveConfirm(true);
  };

  const handleCancelSave = () => {
    setShowSaveConfirm(false);
  };

  // --- 4. Handle Confirming the Save ---
  const handleConfirmSave = async () => {
    // Map the form state back to what the API expects
    const dataToSave = {
      name: food.name,
      origin: food.origin,
      Energy_kcal: food.calories,
      Protein_g: food.protein,
      Carbohydrates_g: food.carbs,
      Fat_g: food.fat,
      Fiber_g: food.fiber,
      VitaminC_mg: 0, // API requires this, but it's not in the form
      // Add any other fields if the API needs
    };

    try {
      const res = await fetch(`${API_URL}/api/foods/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(dataToSave),
      });

      const result = await res.json();

      if (result.success) {
        setShowSaveConfirm(false);
        navigate("/admin"); // Redirect to dashboard after saving
      } else {
        console.error("Failed to save:", result.error);
        alert("Error: " + result.error);
      }
    } catch (err) {
      console.error("Error saving:", err);
      alert("An error occurred while saving.");
    }
  };

  // --- 5. Render Loading or Not Found State ---
  if (loading) {
    return (
      <div className="edit-food-page">
        <Header />
        <p style={{ textAlign: "center", marginTop: "2rem" }}>Loading food data...</p>
        <Footer />
      </div>
    );
  }

  if (!food) {
    return (
      <div className="edit-food-page">
        <Header />
        <p style={{ textAlign: "center", marginTop: "2rem" }}>Food not found.</p>
        <Footer />
      </div>
    );
  }

  // --- 6. Render the Full Page with Data ---
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
            <p>{food.name}</p>
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
               <img src={URL.createObjectURL(selectedImage)} alt="New Image Preview" />
             ) : existingImageUrl ? ( // ✅ FIX: If there is an existing URL, use it
               <img src={existingImageUrl} alt={food.name} />
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
                  name="name" // Use 'name' to match state
                  value={food.name}
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
                  placeholder="Not saved to DB yet"
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
                name="origin" // Use 'origin' to match state
                value={food.origin}
                onChange={handleChange}
                placeholder="e.g., Kuching, Sibu, Miri"
              />
            </div>
          </div>
        </div>

        {/* === Cultural Context === */}
        {/* These fields are NOT in your foods.js API and will not be saved */}
        <div className="edit-cultural-context-card">
          <h3>Cultural Context (Not Saved)</h3>

          <label className="basic-info-label">Description</label>
          <textarea
            className="edit-food-textarea"
            name="description"
            value={food.description}
            onChange={handleChange}
          />

          <label className="basic-info-label">Cultural Significance</label>
          <textarea
            className="edit-food-textarea"
            name="cultural_significance"
            value={food.cultural_significance}
            onChange={handleChange}
            placeholder="Describe the cultural background behind this dish"
          />

          <label className="basic-info-label">Traditional Preparation</label>
          <textarea
            className="edit-food-textarea"
            name="traditional_preparation"
            value={food.traditional_preparation}
            onChange={handleChange}
            placeholder="Describe how this dish is traditionally prepared"
          />
        </div>

        {/* === Nutritional Info === */}
        <div className="edit-cultural-context-card">
          <h3 className="edit-food-section-title">
            Nutritional Information <span className="serving-note">(per serving)</span>
          </h3>
          <div className="nutrition-grid">
            <div>
              <label className="basic-info-label">Calories</label>
              <input
                className="edit-food-input"
                name="calories"
                value={food.calories}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="basic-info-label">Protein (g)</label>
              <input
                className="edit-food-input"
                name="protein"
                value={food.protein}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="basic-info-label">Carbohydrates (g)</label>
              <input
                className="edit-food-input"
                name="carbs"
                value={food.carbs}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="basic-info-label">Total Fat (g)</label>
              <input
                className="edit-food-input"
                name="fat"
                value={food.fat}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="basic-info-label">Dietary Fiber (g)</label>
              <input
                className="edit-food-input"
                name="fiber"
                value={food.fiber}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="basic-info-label">Sodium (mg)</label>
              <input
                className="edit-food-input"
                name="sodium"
                value={food.sodium}
                onChange={handleChange}
              />
            </div>
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

export default EditFoodPage;