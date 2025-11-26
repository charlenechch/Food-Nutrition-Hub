// src/pages/AdminRecipeDatabase.jsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaRegFlag, FaPlus } from "react-icons/fa6";
import { CiSearch, CiFilter } from "react-icons/ci";
import { MdOutlineFileUpload } from "react-icons/md";
import { HiOutlinePencilAlt } from "react-icons/hi";
import { RiDeleteBin5Line } from "react-icons/ri";
import Modal from "../components/Modal"; // ✅ Import Modal

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

  // 1️⃣ Modal State
  const [modal, setModal] = useState({
    open: false,
    title: "",
    message: "",
    icon: null,
    primaryText: "OK",
    onPrimary: null,
  });

  const closeModal = () => setModal((m) => ({ ...m, open: false, onPrimary: null }));

  const currentRecipes = recipesProp.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );
  const totalPages = Math.ceil(recipesProp.length / perPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  //================
  //CSRF
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

  // 2️⃣ Trigger the Pop-up
  const handleDeleteClick = (recipeId) => {
    setModal({
      open: true,
      title: "Confirm Deletion",
      message: "Are you sure you want to delete this recipe? This action cannot be undone.",
      icon: <RiDeleteBin5Line size={30} color="#dc3545" />,
      primaryText: "Yes, Delete",
      onPrimary: () => performDelete(recipeId),
    });
  };

  // 3️⃣ Actual Delete Logic (API Call)
  const performDelete = async (recipeId) => {
    try {
      const response = await fetch(`${API_URL}/api/recipe/admin/delete/${recipeId}`, {
        method: "DELETE",
        headers: {
        "X-CSRF-Token": csrfToken
    },
        credentials: "include",
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setModal({
          open: true,
          title: "Deleted!",
          message: "The recipe has been successfully removed.",
          icon: <FaRegFlag size={30} color="green" />,
          primaryText: "OK",
          onPrimary: () => {
             closeModal();
             window.location.reload(); 
          },
        });
      } else {
        setModal({
          open: true,
          title: "Error",
          message: result.message || "Failed to delete recipe.",
          primaryText: "Close",
          onPrimary: closeModal,
        });
      }
    } catch (error) {
      console.error("Error deleting recipe:", error);
      setModal({
        open: true,
        title: "Error",
        message: "An error occurred. Please try again.",
        primaryText: "Close",
        onPrimary: closeModal,
      });
    }
  };

  if (!recipesProp || recipesProp.length === 0) {
    return (
     <div className="recipe-database-section" style={{ backgroundColor: "white" }}>
      <h2><FaRegFlag style={{ marginRight: 8 }} /> {sectionTitle}</h2>
        <p style={{ textAlign: "center", marginTop: 20, color: "#999" }}>
          No recipes found.
        </p>
      </div>
    );
  }

  return (
    <div className="recipe-database-section" style={{ backgroundColor: "white" }}>
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
                      onClick={() => handleDeleteClick(r.id)} // ✅ Call handle delete here
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

      {/* 4️⃣ Render Modal */}
      <Modal
        open={modal.open}
        title={modal.title}
        icon={modal.icon}
        primaryText={modal.primaryText}
        onClose={closeModal}
        onPrimary={modal.onPrimary}
      >
        {modal.message}
      </Modal>

    </div>
  );
};

export default RecipeDatabaseSection;