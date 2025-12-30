import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaRegFlag } from "react-icons/fa6";
import { CiSearch, CiFilter } from "react-icons/ci";
import { HiOutlinePencilAlt } from "react-icons/hi";
import { RiDeleteBin5Line } from "react-icons/ri";
import Modal from "../components/Modal";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const RecipeDatabaseSection = ({ recipes: recipesProp = [], categories = [], sectionType = "approved" }) => {
  const navigate = useNavigate();

  // --- States ---
  const [localRecipes, setLocalRecipes] = useState(recipesProp);
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [difficulty, setDifficulty] = useState("All"); 
  const [statusFilter, setStatusFilter] = useState("All");

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef();
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 5;

  // --- Sync Props ---
  useEffect(() => {
    setLocalRecipes(recipesProp);
  }, [recipesProp]);

  // Reset page
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, category, difficulty, statusFilter]);

  // --- Helper: Format Date ---
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    // Formats as DD/MM/YYYY (e.g. 11/06/2025)
    return date.toLocaleDateString("en-GB"); 
  };

  // --- Filtering Logic ---
  const filteredRecipes = localRecipes.filter((r) => {
    const term = searchTerm.toLowerCase();
    const name = (r.name || "").toLowerCase();
    const author = (r.author || "").toLowerCase();
    const matchesSearch = name.includes(term) || author.includes(term);
    const matchesCategory = category === "All Categories" || (r.foodType === category || r.category === category);
    const matchesDifficulty = difficulty === "All" || (r.difficulty || "Medium") === difficulty;
    
    // Status Filter: Only apply if sectionType is NOT 'approved' OR if filter is set to something specific
    const statusToCheck = sectionType === "approved" ? "Approved" : statusFilter;
    const matchesStatus = statusToCheck === "All" || r.status === statusToCheck;

    return matchesSearch && matchesCategory && matchesDifficulty && matchesStatus;
  });

  // --- Pagination ---
  const currentRecipes = filteredRecipes.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );
  const totalPages = Math.ceil(filteredRecipes.length / perPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  // --- Modal & CSRF ---
  const [modal, setModal] = useState({
    open: false,
    title: "",
    message: "",
    icon: null,
    primaryText: "OK",
    onPrimary: null,
  });
  const closeModal = () => setModal((m) => ({ ...m, open: false, onPrimary: null }));

  const [csrfToken, setCsrfToken] = useState("");       
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

  useEffect(() => {
    const closeDropdown = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpen(false);
    };
    document.addEventListener("click", closeDropdown);
    return () => document.removeEventListener("click", closeDropdown);
  }, []);

  const sectionTitle = sectionType === "approved" ? "Approved Recipe Database" : "Pending / Rejected Recipes";

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

  const performDelete = async (recipeId) => {
    try {
      const response = await fetch(`${API_URL}/api/recipe/admin/delete/${recipeId}`, {
        method: "DELETE",
        headers: { "X-CSRF-Token": csrfToken },
        credentials: "include",
      });
      const result = await response.json();

      if (response.ok && result.success) {
        setLocalRecipes((prev) => prev.filter((r) => r.id !== recipeId));
        setModal({
          open: true,
          title: "Deleted!",
          message: "The recipe has been successfully removed.",
          icon: <FaRegFlag size={30} color="green" />,
          primaryText: "OK",
          onPrimary: closeModal,
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
    }
  };

  if (!localRecipes || localRecipes.length === 0) {
    return (
     <div className="recipe-database-section" style={{ backgroundColor: "white", minHeight: showFilters ? "850px" : "600px", transition: "min-height 0.3s ease" }}>
      <h2><FaRegFlag style={{ marginRight: 8 }} /> {sectionTitle}</h2>
        <p style={{ textAlign: "center", marginTop: 20, color: "#999" }}>
          No recipes found.
        </p>
      </div>
    );
  }

  return (
    <div 
      className="recipe-database-section" 
      style={{ 
        backgroundColor: "white", 
        minHeight: showFilters ? "850px" : "600px", 
        display: "flex", 
        flexDirection: "column", 
        justifyContent: "space-between",
        transition: "min-height 0.3s ease"
      }}
    >
      
      <div>
        <div className="recipe-header">
          <h2><FaRegFlag style={{ marginRight: 8 }} /> {sectionTitle}</h2>
        </div>

        <div className="food-filters">
          <div className="search-box">
            <CiSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Search recipes..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className={`admin-beige-dropdown ${dropdownOpen ? "open" : ""}`} ref={dropdownRef}>
            <button className="admin-beige-trigger" onClick={() => setDropdownOpen(!dropdownOpen)}>
              {category}
            </button>
            {dropdownOpen && (
              <ul className="admin-beige-list">
                {["All Categories", ...categories.filter(c => c !== "All Categories")].map((opt, i) => (
                  <li key={i} onClick={() => { setCategory(opt); setDropdownOpen(false); }}>
                    {opt}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button className="admin-recipe-btn-filter" onClick={() => setShowFilters(!showFilters)}>
            <CiFilter className="filter-icon" /> Filters
          </button>
        </div>

        {showFilters && (
          <div className="advanced-filters">
            <h4><CiFilter /> Advanced Filters</h4>
            <div className="filter-grid">
              <div className="filter-item">
                <label>Difficulty</label>
                <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                  <option value="All">All</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
              <div className="filter-item">
                <label>Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option>All Categories</option>
                  {categories.filter(c => c !== "All Categories").map((cat) => (
                    <option key={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              {sectionType !== "approved" && (
                <div className="filter-item">
                  <label>Status</label>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="All">All</option>
                    <option value="Pending">Pending</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        <table className="content-table">
          <thead>
            <tr>
              <th>Recipe Name</th>
              <th>Food Item</th>
              <th>Author</th>
              
              {/* ✅ CHANGED 1: Dynamic Header */}
              <th>{sectionType === "approved" ? "Date Approved" : "Date Created"}</th> 
              
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentRecipes.map((r, i) => (
              <tr key={r.id || i}>
                <td data-label="Recipe Name">
                  <span className="recipe-name">{r.name || "Unnamed Recipe"}</span>
                  <br/>
                  {r.servings && (
                    <span className="recipe-servings">
                      {r.servings} servings
                    </span>
                  )}
                </td>
                <td data-label="Food Item"><span className="category-tag">{r.foodType || r.category || "N/A"}</span></td>
                <td data-label="Author">{r.author || "Unknown"}</td>
                
                {/* ✅ CHANGED 2: Dynamic Date Logic */}
                {/* Shows 'updatedAt' if Approved, otherwise shows 'date/createdAt' */}
                <td data-label={sectionType === "approved" ? "Date Approved" : "Date Created"}>
                  {formatDate(
                    sectionType === "approved" 
                      ? (r.updatedAt || r.date) 
                      : (r.date || r.createdAt)
                  )}
                </td>
                
                <td data-label="Status">
                  <span className={`recipe-status-tag ${r.status === "Pending" ? "pending" : r.status === "Rejected" ? "rejected" : "approved"}`}>
                    {r.status}
                  </span>
                </td>
                <td data-label="Actions" className="admin-recipe-action-buttons">
                  {r.status === "Approved" ? (
                    <>
                      <button className="food-database-btn-edit" onClick={() => navigate(`/admin/edit/recipe/${r.id || i}`)}>
                        <HiOutlinePencilAlt />
                      </button>
                      <button className="food-database-btn-delete" onClick={() => handleDeleteClick(r.id)}>
                        <RiDeleteBin5Line />
                      </button>
                    </>
                  ) : (
                    <button className="review-btn" onClick={() => navigate(`/admin/edit/recipe/${r.id || i}`)}>
                      Review
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="admin-pagination" style={{ marginBottom: "20px" }}>
          <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>‹ Prev</button>
          {[...Array(totalPages)].map((_, i) => (
            <button key={i} onClick={() => handlePageChange(i + 1)} className={currentPage === i + 1 ? "active" : ""}>{i + 1}</button>
          ))}
          <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>Next ›</button>
      </div>

      <Modal open={modal.open} title={modal.title} icon={modal.icon} primaryText={modal.primaryText} onClose={closeModal} onPrimary={modal.onPrimary}>
        {modal.message}
      </Modal>
    </div>
  );
};

export default RecipeDatabaseSection;