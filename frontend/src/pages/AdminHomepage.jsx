import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
/* === Icons === */
import { FiSearch, FiEdit2, FiTrash2, FiPlus, FiDownload, FiUpload } from "react-icons/fi";

/**
 * AdminFoodDatabase Component
 * Handles the display, searching, and filtering of the food database items.
 * Optimized for Swinburne Sarawak FYP - Food-Nutrition-Hub
 */
const AdminFoodDatabase = ({ foodData, categories }) => {
  const { t } = useTranslation();

  // --- State for Filters ---
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedOrigin, setSelectedOrigin] = useState("All Origins");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");
  const [calorieLimit, setCalorieLimit] = useState(2000);

  // --- Derived Filter Logic ---
  // This ensures the table updates in real-time as the admin interacts with the UI
  const filteredFoods = foodData.filter((food) => {
    const matchesSearch = food.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All Categories" || food.category === selectedCategory;
    const matchesOrigin = selectedOrigin === "All Origins" || food.origin === selectedOrigin;
    const matchesDifficulty = selectedDifficulty === "All" || food.difficulty === selectedDifficulty;
    const matchesCalories = (food.calories || 0) <= calorieLimit;

    return matchesSearch && matchesCategory && matchesOrigin && matchesDifficulty && matchesCalories;
  });

  return (
    <section className="food-database-section">
      {/* ========================================================
          Header Actions
          ======================================================== */}
      <div className="food-header">
        <h2>
          <span className="food-icon"><FiSearch /></span>
          {t("adminFood.databaseTitle")}
        </h2>
        <div className="food-actions">
          <button className="admin-food-btn-import">
            <FiUpload /> {t("adminFood.bulkImport")}
          </button>
          <button className="admin-food-btn-import">
            <FiDownload /> {t("adminFood.downloadTemplate")}
          </button>
          <button className="admin-food-btn-add">
            <FiPlus /> {t("adminFood.addNewFood")}
          </button>
        </div>
      </div>

      {/* ========================================================
          Refined Filtering & Search UX 
          (Matches updated AdminDashboard.css)
          ======================================================== */}
      <div className="food-filters-container">
        <div className="food-filters-main-row">
          
          {/* Enhanced Search Box */}
          <div className="search-box">
            <span className="search-icon"><FiSearch /></span>
            <input 
              type="text" 
              placeholder={t("adminFood.searchPlaceholder") || "Search foods by name..."} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filter Group for Dropdowns */}
          <div className="filter-controls-group">
            {/* Category Dropdown - Dynamic from categories prop */}
            <select 
              className="admin-filter-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Cultural Origin Dropdown */}
            <select 
              className="admin-filter-select"
              value={selectedOrigin}
              onChange={(e) => setSelectedOrigin(e.target.value)}
            >
              <option value="All Origins">All Origins</option>
              <option value="Bidayuh">Bidayuh</option>
              <option value="Dayak">Dayak</option>
              <option value="Chinese">Chinese</option>
              <option value="Malay">Malay</option>
            </select>

            {/* Difficulty Dropdown */}
            <select 
              className="admin-filter-select"
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
            >
              <option value="All">All Difficulty</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
        </div>

        {/* Calorie Range Slider Row */}
        <div className="calorie-filter-pill">
          <label>{t("adminFood.calorieLimit") || "Calorie Limit"}:</label>
          <input 
            type="range" 
            className="admin-slider"
            min="0" 
            max="2000" 
            step="50"
            value={calorieLimit}
            onChange={(e) => setCalorieLimit(e.target.value)}
          />
          <span className="calorie-range-display">
            0 — {calorieLimit} kcal
          </span>
        </div>
      </div>

      {/* ========================================================
          Food Data Table
          ======================================================== */}
      <table className="food-table">
        <thead>
          <tr>
            <th>{t("adminFood.columnName")}</th>
            <th>{t("adminFood.columnCategory")}</th>
            <th>{t("adminFood.columnOrigin")}</th>
            <th>{t("adminFood.columnUpdated")}</th>
            <th>{t("adminFood.columnActions")}</th>
          </tr>
        </thead>
        <tbody>
          {filteredFoods.length > 0 ? (
            filteredFoods.map((food) => (
              <tr key={food._id || food.id}>
                {/* data-label used for mobile responsive card view in AdminDashboard.css */}
                <td data-label={t("adminFood.columnName")}>{food.name}</td>
                <td data-label={t("adminFood.columnCategory")}>
                  <span className="category-tag">{food.category}</span>
                </td>
                <td data-label={t("adminFood.columnOrigin")}>{food.origin}</td>
                <td data-label={t("adminFood.columnUpdated")}>
                  {new Date(food.updatedAt || food.lastUpdated).toLocaleString()}
                </td>
                <td data-label={t("adminFood.columnActions")}>
                  <button className="food-database-btn-edit" title="Edit">
                    <FiEdit2 />
                  </button>
                  <button className="food-database-btn-delete" title="Delete">
                    <FiTrash2 />
                  </button>
                </td>
              </tr>
            ))
          ) : (
            /* Empty state when no filters match */
            <tr>
              <td colSpan="5" style={{ textAlign: "center", padding: "40px", color: "#8d6a46" }}>
                {t("adminFood.noResults") || "No foods found matching your criteria."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
};

export default AdminFoodDatabase;