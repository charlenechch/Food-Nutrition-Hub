import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../css/EditFoodPage.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { MdOutlineFileUpload } from "react-icons/md";
import { FaArrowLeftLong } from "react-icons/fa6";
import { FiSave } from "react-icons/fi";

// API URL
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Origin options
const ORIGIN_OPTIONS = [
  "Malay",
  "Iban",
  "Bidayuh",
  "Orang Ulu",
  "Melanau",
  "Chinese",
  "Indian",
  "Others",
];

const EditFoodPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [food, setFood] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [existingImageUrl, setExistingImageUrl] = useState("");
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showNotification, setShowNotification] = useState({
    visible: false,
    message: "",
    type: "",
  });

  // --- Fetch food data ---
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
            origin: data.data.origin || "",
            calories: data.data.Energy_kcal || "",
            protein: data.data.Protein_g || "",
            carbs: data.data.Carbohydrates_g || "",
            fat: data.data.Fat_g || "",
            fiber: data.data.Fiber_g || "",
            name_ms: data.data.name_ms || "",
            category: data.data.category || "",
            description: data.data.description || "",
            cultural_significance: data.data.cultural_significance || "",
            traditional_preparation: data.data.traditional_preparation || "",
            image: data.data.image || "",
          });
          setExistingImageUrl(data.data.image || "");
        } else {
          setShowNotification({
            visible: true,
            message: data.error || "Failed to fetch food data",
            type: "error",
          });
        }
      } catch (err) {
        console.error("Error fetching food:", err);
        setShowNotification({
          visible: true,
          message: "Error fetching food data",
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFood();
  }, [id]);

  // --- Input change handler ---
  const handleChange = (e) => {
    setFood({ ...food, [e.target.name]: e.target.value });
  };

  // --- Save confirmation ---
  const handleSaveClick = () => {
    setShowSaveConfirm(true);
    setShowNotification({ visible: false, message: "", type: "" });
  };
  const handleCancelSave = () => setShowSaveConfirm(false);

  // --- Close notification ---
  const handleCloseNotification = () => {
    setShowNotification({ visible: false, message: "", type: "" });
  };

  // --- Image upload ---
  const handleImageUpload = async (file) => {
    if (!file) return { success: true, url: existingImageUrl };

    const formData = new FormData();
    formData.append("image", file);

    try {
      const uploadRes = await fetch(`${API_URL}/api/foods/upload/food-image`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const uploadResult = await uploadRes.json();

      if (uploadResult.success && uploadResult.imageUrl) {
        return { success: true, url: uploadResult.imageUrl };
      } else {
        setShowNotification({
          visible: true,
          message: "Image upload failed. Food data was not saved.",
          type: "error",
        });
        return { success: false, url: existingImageUrl };
      }
    } catch (err) {
      console.error("Error during image upload:", err);
      setShowNotification({
        visible: true,
        message:
          "Error communicating with upload server. Food data was not saved.",
        type: "error",
      });
      return { success: false, url: existingImageUrl };
    }
  };

  // --- Confirm save ---
  const handleConfirmSave = async () => {
    setShowSaveConfirm(false);

    const { success: uploadSuccess, url: finalImageUrl } =
      await handleImageUpload(selectedImage);
    if (!uploadSuccess) return;

    const dataToSave = {
      name: food.name,
      origin: food.origin,
      category: food.category,
      Energy_kcal: food.calories,
      Protein_g: food.protein,
      Carbohydrates_g: food.carbs,
      Fat_g: food.fat,
      Fiber_g: food.fiber,
      image: finalImageUrl,
      VitaminC_mg: 0,
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
        setExistingImageUrl(finalImageUrl);
        setSelectedImage(null);
        document.getElementById("fileInput").value = "";
        setShowNotification({
          visible: true,
          message: "Changes saved successfully! All data updated.",
          type: "success",
        });
      } else {
        setShowNotification({
          visible: true,
          message: result.error || "Failed to save changes",
          type: "error",
        });
      }
    } catch (err) {
      console.error("Error saving:", err);
      setShowNotification({
        visible: true,
        message: "An unknown error occurred while updating the food item.",
        type: "error",
      });
    }
  };

  // --- Revoke object URL to avoid memory leak ---
  useEffect(() => {
    return () => {
      if (selectedImage) URL.revokeObjectURL(selectedImage);
    };
  }, [selectedImage]);

  // --- Render ---
  if (loading) {
    return (
      <div className="edit-food-page">
        <Header />
        <p style={{ textAlign: "center", marginTop: "2rem" }}>
          Loading food data...
        </p>
        <Footer />
      </div>
    );
  }

  if (!food) {
    return (
      <div className="edit-food-page">
        <Header />
        <p style={{ textAlign: "center", marginTop: "2rem" }}>
          Food not found.
        </p>
        <Footer />
      </div>
    );
  }

  return (
    <div className="edit-food-page">
      <Header />

      <div className="edit-food-container">
        {/* Topbar */}
        <div className="edit-topbar">
          <button
            className="admin-edit-food-back-btn"
            onClick={() => navigate("/admin")}
          >
            <FaArrowLeftLong />
            Back to Dashboard
          </button>

          <div className="edit-title">
            <h2>Edit Food Item</h2>
            <p>{food.name}</p>
          </div>

          <button
            className="admin-edit-food-save-btn"
            onClick={handleSaveClick}
          >
            <FiSave />
            Save Changes
          </button>
        </div>

        {/* Edit Grid */}
        <div className="edit-grid">
          {/* Food Image */}
          <div className="edit-food-image-upload-section">
            <h3>Food Image</h3>
            <div className="image-preview">
              {selectedImage ? (
                <img
                  src={URL.createObjectURL(selectedImage)}
                  alt="New Image Preview"
                />
              ) : existingImageUrl ? (
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
              <MdOutlineFileUpload />
              Upload New Image
            </button>
          </div>

          {/* Basic Info */}
          <div className="edit-food-basic-info-card">
            <h3>Basic Information</h3>
            <div className="edit-food-basic-info-two-col">
              <div>
                <label className="basic-info-label">Food Name</label>
                <input
                  className="edit-food-input"
                  name="name"
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
              <div className="custom-select-wrapper">
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
            </div>

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

        {/* Cultural Context */}
        <div className="edit-cultural-context-card">
          <h3>Cultural Context (Not Saved)</h3>
          <label className="basic-info-label">Description</label>
          <textarea
            className="edit-food-textarea"
            name="description"
            value={food.description}
            onChange={handleChange}
            rows={5}
          />
          <label className="basic-info-label">Cultural Significance</label>
          <textarea
            className="edit-food-textarea"
            name="cultural_significance"
            value={food.cultural_significance}
            onChange={handleChange}
            placeholder="Describe the cultural background behind this dish"
            rows={5}
          />
          <label className="basic-info-label">Traditional Preparation</label>
          <textarea
            className="edit-food-textarea"
            name="traditional_preparation"
            value={food.traditional_preparation}
            onChange={handleChange}
            placeholder="Describe how this dish is traditionally prepared"
            rows={5}
          />
        </div>

        {/* Nutritional Info */}
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
          </div>
        </div>
      </div>

      {/* Save Confirmation Modal */}
      {showSaveConfirm && (
        <div className="modal-overlay">
          <div className="delete-modal">
            <h3>Confirmation</h3>
            <p>
              Are you sure you want to <strong>save these changes</strong>?
              <br />
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

      {/* Notification Modal */}
      {showNotification.visible && (
        <div className="modal-overlay">
          <div className={`notification-modal ${showNotification.type}`}>
            <h3
              style={{
                color: showNotification.type === "error" ? "#a33b3b" : "#387346",
              }}
            >
              {showNotification.type === "success" ? "Success!" : "Error!"}
            </h3>
            <p>{showNotification.message}</p>
            <div className="modal-actions" style={{ justifyContent: "center" }}>
              <button
                className="confirm-save-btn"
                onClick={handleCloseNotification}
                style={{
                  backgroundColor:
                    showNotification.type === "error" ? "#a33b3b" : "#7b4b26",
                }}
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

export default EditFoodPage;
