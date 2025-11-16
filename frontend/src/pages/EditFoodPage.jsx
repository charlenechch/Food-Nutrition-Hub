import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../css/EditFoodPage.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
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

const EditFoodPage = () => {
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
            origin: data.data.origin || "",
            calories: data.data.Energy_kcal || "",
            protein: data.data.Protein_g || "",
            carbs: data.data.Carbohydrates_g || "",
            fat: data.data.Fat_g || "",
            fiber: data.data.Fiber_g || "",
            vitaminc: data.data.VitaminC_mg || "",
            name_ms: data.data.name_ms || "",
            category: data.data.category || "",
            description: data.data.description || "",
            culturalSignificance: data.data.culturalSignificance || "",
            traditionalPreparation: data.data.traditionalPreparation || "",
            image: data.data.image || "",
          });
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
        message: "Selected image is too large (max 10MB).",
        type: "error",
      });
      throw new Error("File too large");
    }
    if (!file.type.startsWith("image/")) {
      setShowNotification({
        visible: true,
        message: "Please select a valid image file.",
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
          message: "Failed to read the selected image.",
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
            message: "Could not convert image to base64.",
            type: "error",
          });
          return reject(new Error("Invalid base64"));
        }

        try {
          const uploadRes = await fetch(`${API_URL}/api/foods/upload/food-image`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: base64Image }),
          });

          let uploadResult;
          try {
            uploadResult = await uploadRes.json();
          } catch (jsonErr) {
            console.error("[upload] failed to parse JSON response:", jsonErr);
            setShowNotification({
              visible: true,
              message: "Server response was not valid JSON.",
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
            message: "Server error during image upload.",
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

    const dataToSave = {
      name: food.name,
      origin: food.origin,
      Energy_kcal: Number(food.calories) || 0,
      Protein_g: Number(food.protein) || 0,
      Carbohydrates_g: Number(food.carbs) || 0,
      Fat_g: Number(food.fat) || 0,
      Fiber_g: Number(food.fiber) || 0,
      VitaminC_mg: Number(food.vitaminc) || 0,
      image: finalImageUrl,
    };

    try {
      console.log("[save] updating food with:", dataToSave);
      const res = await fetch(`${API_URL}/api/foods/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
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
          message: "Changes saved successfully! All data updated.",
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
        message: "An unknown error occurred while updating the food item.",
        type: "error",
      });
    }
  };

  // --- Loading / Not Found ---
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

  // Helper to display image whether cloud URL or server path
  const getDisplayImage = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `${API_URL}/${url.replace(/^\/+/, "")}`;
  };

  // --- Render Page ---
  return (
    <div className="edit-food-page">
      <Header />

      <div className="edit-food-container">
        <div className="edit-topbar">
          <button className="admin-edit-food-back-btn" onClick={() => navigate("/admin")}>
            <span className="admin-edit-food-back-icon">
              <FaArrowLeftLong />
            </span>
            Back to Dashboard
          </button>

          <div className="edit-title">
            <h2>Edit Food Item</h2>
            <p>{food.name}</p>
          </div>

          <button className="admin-edit-food-save-btn" onClick={handleSaveClick}>
            <span className="admin-edit-food-save-icon">
              <FiSave />
            </span>
            Save Changes
          </button>
        </div>

        <div className="edit-grid">
          {/* Image Section */}
          <div className="edit-food-image-upload-section">
            <h3>Food Image</h3>
            <div className="image-preview">
              {selectedImage ? (
                <img src={URL.createObjectURL(selectedImage)} alt="New Image Preview" />
              ) : existingImageUrl ? (
                <img src={getDisplayImage(existingImageUrl)} alt={food.name} />
              ) : (
                <p>No Image</p>
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
              Upload New Image
            </button>
          </div>

          {/* Basic Info Section */}
          <div className="edit-food-basic-info-card">
            <h3>Basic Information</h3>
            <div className="edit-food-basic-info-two-col">
              <div>
                <label className="basic-info-label">Food Name</label>
                <input className="edit-food-input" name="name" value={food.name} onChange={handleChange} />
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

            {/* Category */}
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

            {/* Origin */}
            <div className="food-origin-field">
              <label className="basic-info-label">Region of Origin</label>
              <div className="custom-select-wrapper">
                <select className="edit-food-select" name="origin" value={food.origin} onChange={handleChange}>
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
          <textarea className="edit-food-textarea" name="description" value={food.description} onChange={handleChange} rows={5} />
          <label className="basic-info-label">Cultural Significance</label>
          <textarea
            className="edit-food-textarea"
            name="culturalSignificance"
            value={food.culturalSignificance}
            onChange={handleChange}
            placeholder="Describe the cultural background behind this dish"
            rows={5}
          />
          <label className="basic-info-label">Traditional Preparation</label>
          <textarea
            className="edit-food-textarea"
            name="traditionalPreparation"
            value={food.traditionalPreparation}
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
            {[
              { label: "Calories", name: "calories" },
              { label: "Protein (g)", name: "protein" },
              { label: "Carbohydrates (g)", name: "carbs" },
              { label: "Total Fat (g)", name: "fat" },
              { label: "Dietary Fiber (g)", name: "fiber" },
              { label: "Vitamin C (g)", name: "vitaminc" },
            ].map((item) => (
              <div key={item.name}>
                <label className="basic-info-label">{item.label}</label>
                <input className="edit-food-input" name={item.name} value={food[item.name]} onChange={handleChange} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
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

export default EditFoodPage;
