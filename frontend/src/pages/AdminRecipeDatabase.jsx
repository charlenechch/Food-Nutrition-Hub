import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaRegFlag } from "react-icons/fa6";
import { CiSearch, CiFilter } from "react-icons/ci";
import { HiOutlinePencilAlt } from "react-icons/hi";
import { RiDeleteBin5Line } from "react-icons/ri";
import Modal from "../components/Modal";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const RecipeDatabaseSection = ({ recipes: recipesProp = [], categories = [], sectionType = "approved" }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

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

  const sectionTitle = sectionType === "approved"
    ? t("adminRcpDB.titleApproved")
    : t("adminRcpDB.titlePending");

  const handleDeleteClick = (recipeId) => {
    setModal({
      open: true,
      title: t("adminRcpDB.confirmDeletion"),
      message: t("adminRcpDB.confirmDeletionMsg"),
      icon: <RiDeleteBin5Line size={30} color="#dc3545" />,
      primaryText: t("adminRcpDB.yesDelete"),
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
          title: t("adminRcpDB.deletedTitle"),
          message: t("adminRcpDB.deletedMsg"),
          icon: <FaRegFlag size={30} color="green" />,
          primaryText: t("adminRcpDB.ok"),
          onPrimary: closeModal,
        });
      } else {
        setModal({
          open: true,
          title: t("adminRcpDB.errorTitle"),
          message: result.message || t("adminRcpDB.deleteFailed"),
          primaryText: t("adminRcpDB.close"),
          onPrimary: closeModal,
        });
      }
    } catch (error) {
      console.error("Error deleting recipe:", error);
    }
  };

  const renderPageNumbers = () => {
    let pages = [];

    if (totalPages <= 4) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      let start = Math.max(1, currentPage - 1);
      let end = Math.min(totalPages, currentPage + 1);

      if (currentPage === 1) end = 3;
      if (currentPage === totalPages) start = totalPages - 2;

      if (start > 1) pages.push('...');
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages) pages.push('...');
    }

    return pages.map((p, index) => (
      <button
        key={index}
        onClick={() => p !== '...' && handlePageChange(p)}
        className={`${currentPage === p ? "active" : ""} ${p === '...' ? "umg-dots" : ""}`}
        disabled={p === '...'}
      >
        {p}
      </button>
    ));
  };

  if (!localRecipes || localRecipes.length === 0) {
    return (
      <div className="recipe-database-section" style={{ backgroundColor: "white", minHeight: showFilters ? "850px" : "600px", transition: "min-height 0.3s ease" }}>
        <h2><FaRegFlag style={{ marginRight: 8 }} /> {sectionTitle}</h2>
        <p style={{ textAlign: "center", marginTop: 20, color: "#999" }}>
          {t("adminRcpDB.noRecipes")}
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
              placeholder={t("adminRcpDB.searchPlaceholder")}
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
            <CiFilter className="filter-icon" /> {t("explore.filters")}
          </button>
        </div>

        {showFilters && (
          <div className="advanced-filters">
            <h4><CiFilter /> {t("adminFoodDB.advancedFilters")}</h4>
            <div className="filter-grid">
              <div className="filter-item">
                <label>{t("explore.difficulty")}</label>
                <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                  <option value="All">{t("adminFoodDB.all")}</option>
                  <option value="Easy">{t("explore.easy")}</option>
                  <option value="Medium">{t("explore.medium")}</option>
                  <option value="Hard">{t("explore.hard")}</option>
                </select>
              </div>
              <div className="filter-item">
                <label>{t("adminFoodDB.colCategory")}</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option>{t("explore.allCategories")}</option>
                  {categories.filter(c => c !== "All Categories").map((cat) => (
                    <option key={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              {sectionType !== "approved" && (
                <div className="filter-item">
                  <label>{t("adminRcpDB.colStatus")}</label>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="All">{t("adminFoodDB.all")}</option>
                    <option value="Pending">{t("adminRcpDB.statusPending")}</option>
                    <option value="Rejected">{t("adminRcpDB.statusRejected")}</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        <table className="content-table">
          <thead>
            <tr>
              <th>{t("adminRcpDB.colName")}</th>
              <th className="hide-at-tablet">{t("adminRcpDB.colFoodItem")}</th>
              <th>{t("adminRcpDB.colAuthor")}</th>
              <th>{sectionType === "approved" ? t("adminRcpDB.colDateApproved") : t("adminRcpDB.colDateCreated")}</th>
              <th>{t("adminRcpDB.colStatus")}</th>
              <th>{t("adminRcpDB.colActions")}</th>
            </tr>
          </thead>
          <tbody>
            {currentRecipes.map((r, i) => (
              <tr key={r.id || i}>
                <td data-label={t("adminRcpDB.colName")}>
                  {r.name || t("adminRcpDB.unnamedRecipe")}
                  <br />
                  <span className="recipe-servings">
                    <small>{r.servings ? t("adminRcpDB.servings", { count: r.servings }) : ""}</small>
                  </span>
                </td>
                <td data-label={t("adminRcpDB.colFoodItem")} className="hide-at-tablet">
                  <span className="category-tag">{r.foodType || r.category || "N/A"}</span>
                </td>
                <td data-label={t("adminRcpDB.colAuthor")}>{r.author || t("adminRcpDB.unknown")}</td>
                <td data-label={sectionType === "approved" ? t("adminRcpDB.colDateApproved") : t("adminRcpDB.colDateCreated")}>
                  {formatDate(
                    sectionType === "approved" 
                      ? (r.updatedAt || r.date) 
                      : (r.date || r.createdAt)
                  )}
                </td>
                <td data-label={t("adminRcpDB.colStatus")}>
                  <span className={`recipe-status-tag ${r.status === "Pending" ? "pending" : r.status === "Rejected" ? "rejected" : "approved"}`}>
                    {r.status}
                  </span>
                </td>
                <td data-label={t("adminRcpDB.colActions")} className="admin-recipe-action-buttons">
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
                      {t("adminRcpDB.review")}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="admin-pagination" style={{ marginBottom: "20px" }}>
          <button
            className="umg-prev-next"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            ‹ {t("explore.prev")}
          </button>

          {renderPageNumbers()}

          <button
            className="umg-prev-next"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            {t("explore.next")} ›
          </button>
        </div>
      )}

      <Modal open={modal.open} title={modal.title} icon={modal.icon} primaryText={modal.primaryText} onClose={closeModal} onPrimary={modal.onPrimary}>
        {modal.message}
      </Modal>
    </div>
  );
};

export default RecipeDatabaseSection;