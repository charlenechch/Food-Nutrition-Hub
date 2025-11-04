import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaRegFlag, FaPlus } from "react-icons/fa6";
import { CiSearch, CiFilter } from "react-icons/ci";
import { MdOutlineFileUpload } from "react-icons/md";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const RecipeDatabaseSection = ({ categories, sectionType = "approved" }) => {
  const navigate = useNavigate();

  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [category, setCategory] = useState("All Categories");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef();

  const [showFilters, setShowFilters] = useState(false);
  const [calorieMin, setCalorieMin] = useState(0);
  const [calorieMax, setCalorieMax] = useState(2000);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const recipesPerPage = 5;

  const indexOfLastRecipe = currentPage * recipesPerPage;
  const indexOfFirstRecipe = indexOfLastRecipe - recipesPerPage;
  const currentRecipes = recipes.slice(indexOfFirstRecipe, indexOfLastRecipe);
  const totalPages = Math.ceil(recipes.length / recipesPerPage);

  const handlePageChange = (pageNum) => {
    if (pageNum >= 1 && pageNum <= totalPages) setCurrentPage(pageNum);
  };

  // ✅ FETCH RECIPES FROM BACKEND
  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const res = await fetch(`${API_URL}/api/recipe/all/recipes`);
        const data = await res.json();

        if (Array.isArray(data)) {
          setRecipes(data);
        } else if (data.success && Array.isArray(data.data)) {
          setRecipes(data.data);
        } else {
          console.warn("Unexpected response:", data);
        }
      } catch (error) {
        console.error("❌ Failed to fetch recipes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, []);

  useEffect(() => {
    const closeDropdown = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("click", closeDropdown);
    return () => document.removeEventListener("click", closeDropdown);
  }, []);

  // Dynamic heading based on sectionType
  const sectionTitle =
    sectionType === "approved"
      ? "Recipe Database"
      : sectionType === "pending"
      ? "Pending Recipe Approval"
      : "Recipe Management";

  // === Defensive check for empty list ===
  if (loading) {
    return (
      <div className="recipe-database-section">
        <h2><FaRegFlag style={{ marginRight: 8 }} /> {sectionTitle}</h2>
        <p style={{ textAlign: "center", marginTop: "20px" }}>Loading recipes...</p>
      </div>
    );
  }

  if (!recipes || recipes.length === 0) {
    return (
      <div className="recipe-database-section">
        <h2><FaRegFlag style={{ marginRight: 8 }} /> {sectionTitle}</h2>
        <p style={{ textAlign: "center", marginTop: "20px" }}>No recipes available.</p>
      </div>
    );
  }

  return (
    <div className="recipe-database-section">
      {/* === Header Section === */}
      <div className="recipe-header">
        <h2>
          <span className="recipe-icon"><FaRegFlag /></span> {sectionTitle}
        </h2>

        {/* Only show Add/Import buttons for Approved view */}
        {sectionType === "approved" && (
          <div className="recipe-actions">
            <button
              className="admin-recipe-btn-add"
              onClick={() => navigate("/admin/addrecipe")}
            >
              <FaPlus /> Add New Recipe
            </button>
            <button className="admin-recipe-btn-import">
              <MdOutlineFileUpload /> Bulk Import
            </button>
          </div>
        )}
      </div>

      {/* === Filters === */}
      <div className="food-filters">
        <div className="search-box">
          <CiSearch className="search-icon" />
          <input type="text" placeholder="Search recipes..." />
        </div>

        <div
          className={`admin-beige-dropdown ${dropdownOpen ? "open" : ""}`}
          ref={dropdownRef}
        >
          <button
            className="admin-beige-trigger"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            {category}
          </button>
          {dropdownOpen && (
            <ul className="admin-beige-list">
              {categories.map((opt) => (
                <li
                  key={opt}
                  className={opt === category ? "selected" : ""}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCategory(opt);
                    setDropdownOpen(false);
                  }}
                >
                  {opt}
                  {opt === category && <span className="tick">✓</span>}
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          className="admin-recipe-btn-filter"
          onClick={() => setShowFilters(!showFilters)}
        >
          <CiFilter className="filter-icon" /> Filters
        </button>
      </div>

      {/* === Recipe Table === */}
      <table className="content-table" style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Recipe Name</th>
            <th>Food Item</th>
            <th>Author</th>
            <th>Last Updated</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentRecipes.map((recipe, index) => (
            <tr key={index}>
              <td>
                {recipe.name || "Unnamed Recipe"}
                <br />
                <small className="serving-info">
                  {recipe.servings ? `${recipe.servings} servings` : ""}
                </small>
              </td>
              <td>
                <span className="category-tag">
                  {recipe.foodType || recipe.category || "N/A"}
                </span>
              </td>
              <td>{recipe.origin || "Unknown"}</td>
              <td>{recipe.updated || "—"}</td>
              <td>
                <span className={`recipe-status-tag approved`}>
                  Approved
                </span>
              </td>
              <td className="admin-recipe-action-buttons">
                <button
                  className="review-btn"
                  onClick={() => navigate(`/admin/edit/recipe/${recipe.id || index}`)}
                >
                  Review
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ✅ Pagination Controls */}
      {totalPages > 1 && (
        <div className="admin-pagination">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            ‹ Prev
          </button>

          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => handlePageChange(i + 1)}
              className={currentPage === i + 1 ? "active" : ""}
            >
              {i + 1}
            </button>
          ))}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next ›
          </button>
        </div>
      )}
    </div>
  );
};

export default RecipeDatabaseSection;
