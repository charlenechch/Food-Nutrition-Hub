// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { useTranslation } from "react-i18next";
// import "../css/EditFoodPage.css";
// import Header from "../components/Header";
// import Footer from "../components/Footer";
// import { MdOutlineFileUpload } from "react-icons/md";
// import { FaArrowLeftLong } from "react-icons/fa6";
// import { FiSave } from "react-icons/fi";

// const AddRecipePage = () => {
//   const navigate = useNavigate();
//   const { t } = useTranslation();
//   const [selectedImage, setSelectedImage] = useState(null);
//   const [showSaveConfirm, setShowSaveConfirm] = useState(false);

//   const [food, setFood] = useState({
//     name_en: "Ayam Pansuh",
//     name_ms: "",
//     category: "",
//     origin: "",
//     description_en: "",
//     ingredients: "",
//     instructions: "",
//     calories: "285",
//     protein: "25",
//     carbs: "",
//     fat: "",
//     fiber: "",
//     sodium: "",
//     serving: "",
//     time: "",
//     difficulty: "",
//     benefits: "",
//     tags: "",
//   });

//   const handleChange = (e) => {
//     setFood({ ...food, [e.target.name]: e.target.value });
//   };

//   const handleSaveClick = () => {
//     setShowSaveConfirm(true);
//   };

//   const handleCancelSave = () => {
//     setShowSaveConfirm(false);
//   };

//   const handleConfirmSave = () => {
//     console.log("✅ Changes saved:", food);
//     // TODO: Add actual save logic here (API call, database update, etc.)
//     setShowSaveConfirm(false);
//     navigate("/admin");
//   };

//   return (
//     <div className="edit-food-page">
//       <Header />

//       <div className="edit-food-container">
//         <div className="edit-topbar">
//           <button className="admin-edit-food-back-btn" onClick={() => navigate("/admin")}>
//             <span className="admin-edit-food-back-icon"><FaArrowLeftLong /></span>
//             {t("addFood.backToDashboard")}
//           </button>

//           <div className="edit-title">
//             <h2>{t("addRecipe.pageTitle")}</h2>
//           </div>

//           <button className="admin-edit-food-save-btn" onClick={handleSaveClick}>
//             <span className="admin-edit-food-save-icon"><FiSave /></span>
//             {t("addRecipe.saveChanges")}
//           </button>
//         </div>

//         <div className="edit-grid">
//           {/* === Food Image Section === */}
//           <div className="edit-food-image-upload-section">
//             <h3>{t("addFood.foodImage")}</h3>
//             <div className="image-preview">
//               {selectedImage ? (
//                 <img src={URL.createObjectURL(selectedImage)} alt="Preview" />
//               ) : (
//                 <p>{t("addRecipe.noImage")}</p>
//               )}
//             </div>

//             <input 
//               className="edit-food-input"
//               type="file"
//               id="fileInput"
//               accept="image/*"
//               onChange={(e) => setSelectedImage(e.target.files[0])}
//               style={{ display: "none" }}
//             />
            
//             <button
//               className="admin-edit-food-upload-btn"
//               onClick={() => document.getElementById("fileInput").click()}
//             >
//               <span className="admin-edit-food-upload-icon"><MdOutlineFileUpload /></span>
//               {t("addRecipe.uploadNewImage")}
//             </button>
//           </div>

//           {/* === Basic Info Section === */}
//           <div className="edit-food-basic-info-card">
//             <h3>{t("addFood.basicInfo")}</h3>
//             <div className="edit-food-basic-info-two-col">
//               <div>
//                 <label className="basic-info-label">{t("addFood.foodName")}</label>
//                 <input
//                   className="edit-food-input"
//                   name="name_en"
//                   value={food.name_en}
//                   onChange={handleChange}
//                 />
//               </div>
//               <div>
//                 <label className="basic-info-label">{t("addRecipe.nameBM")}</label>
//                 <input
//                   className="edit-food-input"
//                   name="name_ms"
//                   value={food.name_ms}
//                   onChange={handleChange}
//                 />
//               </div>
//             </div>

//             <div className="food-category-field">
//               <label className="basic-info-label">{t("addRecipe.category")}</label>
//               <select
//                 className="edit-food-select"
//                 name="category"
//                 value={food.category}
//                 onChange={handleChange}
//               >
//                 <option value="">{t("addRecipe.selectCategory")}</option>
//                 <option value="Poultry">Poultry</option>
//                 <option value="Seafood">Seafood</option>
//                 <option value="Vegetables">Vegetables</option>
//                 <option value="Rice Dish">Rice Dish</option>
//                 <option value="Dessert">Dessert</option>
//                 <option value="Fermented">Fermented</option>
//                 <option value="Noodles">Noodles</option>
//                 <option value="Soup">Soup</option>
//                 <option value="Meat">Meat</option>
//               </select>
//             </div>

//             <div className="food-origin-field">
//               <label className="basic-info-label">{t("addFood.regionOfOrigin")}</label>
//               <input
//                 className="edit-food-input"
//                 name="origin"
//                 value={food.origin}
//                 onChange={handleChange}
//                 placeholder={t("addRecipe.originPlaceholder")}
//               />
//             </div>
//           </div>
//         </div>

//         {/* === Cultural Context === */}
//         <div className="edit-cultural-context-card">
//           <h3>{t("addFood.culturalContext")}</h3>

//           <label className="basic-info-label">{t("addFood.description")}</label>
//           <textarea
//             className="edit-food-textarea"
//             name="description_en"
//             value={food.description_en}
//             onChange={handleChange}
//           />

//           <label className="basic-info-label">{t("addRecipe.ingredients")}</label>
//           <textarea
//             className="edit-food-textarea"
//             name="ingredients"
//             value={food.ingredients}
//             onChange={handleChange}
//             placeholder={t("addRecipe.ingredientsPlaceholder")}
//             rows="5"
//           />

//           <label className="basic-info-label">{t("addRecipe.instructions")}</label>
//           <textarea
//             className="edit-food-textarea"
//             name="instructions"
//             value={food.instructions}
//             onChange={handleChange}
//             placeholder={t("addRecipe.instructionsPlaceholder")}
//           />
//         </div>

//         <div className="edit-cultural-context-card">
//           <h3 className="edit-food-section-title">{t("addRecipe.cookingInfo")}</h3>
//           <div className="nutrition-grid">
//             {[
//               { labelKey: "addRecipe.serving",     field: "serving" },
//               { labelKey: "addRecipe.prepTime",     field: "time" },
//               { labelKey: "addRecipe.cookTime",     field: null },
//               { labelKey: "addRecipe.difficulty",   field: null },
//             ].map((item, index) => (
//               <div key={index}>
//                 <label className="basic-info-label">{t(item.labelKey)}</label>
//                 {t(item.labelKey) === t("addRecipe.difficulty") ? (
//                   <select className="edit-food-input">
//                     <option value="">{t("addRecipe.selectDifficulty")}</option>
//                     <option value="Easy">{t("explore.easy")}</option>
//                     <option value="Medium">{t("explore.medium")}</option>
//                     <option value="Hard">{t("explore.hard")}</option>
//                   </select>
//                 ) : (
//                   <input className="edit-food-input" />
//                 )}
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* === Additional Info === */}
//         <div className="edit-food-additional-info-card">
//           <h3>{t("addRecipe.additionalInfo")}</h3>

//           <label className="basic-info-label">{t("addRecipe.funFact")}</label>
//           <textarea className="edit-food-textarea" placeholder={t("addRecipe.funFactPlaceholder")} />

//           <label className="basic-info-label">{t("addRecipe.tips")}</label>
//           <textarea className="edit-food-textarea" />

//           <label className="basic-info-label">{t("addFood.dietaryPreferences")}</label>
//           <div className="dietary-preferences-grid">
//             {[
//               "Vegetarian", "Gluten Free", "Dairy Free", "Spicy",
//               "Paleo", "Halal", "Keto", "Nut Free", "Other",
//             ].map((option, index) => (
//               <label key={index} className="dietary-option">
//                 <input type="checkbox" name="dietary" value={option} />
//                 {option}
//               </label>
//             ))}
//           </div>
//         </div>
//       </div>

//       {showSaveConfirm && (
//         <div className="modal-overlay">
//           <div className="delete-modal">
//             <h3>{t("addRecipe.confirmTitle")}</h3>
//             <p>{t("addRecipe.confirmMsg")}</p>
//             <div className="modal-actions">
//               <button className="save-cancel-btn" onClick={handleCancelSave}>
//                 {t("addFood.cancel")}
//               </button>
//               <button className="confirm-save-btn" onClick={handleConfirmSave}>
//                 {t("addRecipe.save")}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       <Footer />
//     </div>
//   );
// };

// export default AddRecipePage;