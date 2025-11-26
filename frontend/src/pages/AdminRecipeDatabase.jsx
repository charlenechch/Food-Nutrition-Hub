// src/pages/AdminRecipeDatabase.jsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaRegFlag, FaPlus } from "react-icons/fa6";
import { CiSearch, CiFilter } from "react-icons/ci";
import { MdOutlineFileUpload } from "react-icons/md";
import { HiOutlinePencilAlt } from "react-icons/hi";
import { RiDeleteBin5Line } from "react-icons/ri";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const RecipeDatabaseSection = ({ recipes: recipesProp, categories, sectionType = "approved" }) => {
  const navigate = useNavigate();

  const [category, setCategory] = useState("All Categories");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef();

  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 5;

  const currentRecipes = recipesProp.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );
  const totalPages = Math.ceil(recipesProp.length / perPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  useEffect(() => {
    const closeDropdown = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpen(false);
    };
    document.addEventListener("click", closeDropdown);
    return () => document.removeEventListener("click", closeDropdown);
  }, []);

  const sectionTitle =
    sectionType === "approved"
      ? "Approved Recipe Database"
      : "Pending / Rejected Recipes";

  if (!recipesProp || recipesProp.length === 0) {
    return (
      <div className="recipe-database-section">
        <h2><FaRegFlag style={{ marginRight: 8 }} /> {sectionTitle}</h2>
        <p style={{ textAlign: "center", marginTop: 20, color: "#999" }}>
          No recipes found.
        </p>
      </div>
    );
  }

  return (
    <div className="recipe-database-section">
      <div className="recipe-header">
        <h2><FaRegFlag style={{ marginRight: 8 }} /> {sectionTitle}</h2>

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

      {/* Filters */}
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
              {categories.map((opt, i) => (
                <li
                  key={i}
                  onClick={() => {
                    setCategory(opt);
                    setDropdownOpen(false);
                  }}
                >
                  {opt}
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

      {/* Recipe Table */}
      <table className="content-table" style={{ width: "100%" }}>
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
          {currentRecipes.map((r, i) => (
            <tr key={r.id || i}>
              <td>
                {r.name || "Unnamed Recipe"}
                <br />
                <small>{r.servings ? `${r.servings} servings` : ""}</small>
              </td>
              <td>
                <span className="category-tag">
                  {r.foodType || r.category || "N/A"}
                </span>
              </td>
              <td>{r.author || "Unknown"}</td>
              <td>{r.date || "—"}</td>
              <td>
                <span
                  className={`recipe-status-tag ${
                    r.status === "Pending"
                      ? "pending"
                      : r.status === "Rejected"
                      ? "rejected"
                      : "approved"
                  }`}
                >
                  {r.status}
                </span>
              </td>

              {/* ✅ Updated Actions: Pencil + Trash like Food Database */}
              <td className="admin-recipe-action-buttons">
                {r.status === "Approved" ? (
                  <>
                    <button
                      className="food-database-btn-edit"
                      onClick={() => navigate(`/admin/edit/recipe/${r.id || i}`)}
                    >
                      <HiOutlinePencilAlt />
                    </button>

                    <button
                      className="food-database-btn-delete"
                      onClick={() => console.log("Delete recipe ID:", r.id)}
                    >
                      <RiDeleteBin5Line />
                    </button>
                  </>
                ) : (
                  <button
                    className="review-btn"
                    onClick={() => navigate(`/admin/edit/recipe/${r.id || i}`)}
                  >
                    Review
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="admin-pagination">
          <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
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
