import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaRegFlag } from "react-icons/fa6";
import { CiSearch, CiFilter } from "react-icons/ci";
import { HiOutlinePencilAlt } from "react-icons/hi";
import { RiDeleteBin5Line } from "react-icons/ri";
import { FiFilter } from "react-icons/fi";
import { FiChevronDown } from "react-icons/fi";
import Modal from "../components/Modal"; 

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const AdminCommunityPostDatabase = ({ posts: postsProp = [], sectionType = "approved" }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // --- States ---
  const [localPosts, setLocalPosts] = useState(postsProp);
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [statusFilter, setStatusFilter] = useState("All");
  const [originFilter, setOriginFilter] = useState("All Origins");
  const [difficulty, setDifficulty] = useState("All"); // Added to match Recipe Database

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef();
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 5;

  const originOptions = ["All Origins", "Malay", "Chinese", "Iban", "Melanau", "Bidayuh", "Dayak"];
  const postCategories = ["Food", "Culture", "Events"];

  // --- Sync Props ---
  useEffect(() => {
    setLocalPosts(postsProp);
  }, [postsProp]);

  // Reset page when any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, category, statusFilter, originFilter, difficulty]);

  // --- Filtering & Sorting Logic ---
  const filteredPosts = localPosts
    .filter((post) => {
      const term = searchTerm.toLowerCase();
      const title = (post.foodName || post.title || "").toLowerCase();
      const author = (post.author || "").toLowerCase();
      
      const matchesSearch = title.includes(term) || author.includes(term);
      const matchesCategory = category === "All Categories" || post.category === category;
      
      const postOrigin = post.origin || post.culturalOrigin || "";
      const matchesOrigin = originFilter === "All Origins" || postOrigin === originFilter;
      
      // Matches difficulty (if applicable to posts, otherwise ignores if post doesn't have it)
      const matchesDifficulty = difficulty === "All" || post.difficulty === difficulty;

      const requiredStatus = sectionType === "approved" ? "Approved" : statusFilter;
      const matchesStatus = requiredStatus === "All" || post.status === requiredStatus;
      
      return matchesSearch && matchesCategory && matchesStatus && matchesOrigin && matchesDifficulty;
    })
    .sort((a, b) => {
      // Always sort by Most Recent by default
      const dateA = new Date(a.createdAt || a.updatedAt || 0);
      const dateB = new Date(b.createdAt || b.updatedAt || 0);
      return dateB - dateA; 
    });

  // --- Pagination ---
  const currentPosts = filteredPosts.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );
  const totalPages = Math.ceil(filteredPosts.length / perPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  // --- Modal State ---
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
    ? t("adminPostDB.titleApproved", "Approved Community Posts")
    : t("adminPostDB.titlePending", "Pending / Rejected Community Posts");

  const renderPageNumbers = () => {
    let pages = [];
    if (totalPages <= 4) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
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

  const handleDeleteClick = (postId) => {
    setModal({
      open: true,
      title: t("adminPostDB.confirmDeletion", "Confirm Deletion"),
      message: t("adminPostDB.confirmDeletionMsg", "Are you sure you want to delete this post?"),
      icon: <RiDeleteBin5Line size={30} color="#dc3545" />, 
      primaryText: t("adminPostDB.yesDelete", "Yes, Delete"),
      onPrimary: () => performDelete(postId), 
    });
  };

  const performDelete = async (postId) => {
    try {
      const response = await fetch(`${API_URL}/api/communityPost/admin/delete/${postId}`, {
        method: "DELETE",
        headers: { "X-CSRF-Token": csrfToken },
        credentials: "include",
      });
      const result = await response.json();

      if (response.ok && result.success) {
        setLocalPosts((prev) => prev.filter((post) => post.id !== postId));
        setModal({
          open: true,
          title: t("adminPostDB.deletedTitle", "Deleted"),
          message: t("adminPostDB.deletedMsg", "Post has been deleted successfully."),
          icon: <FaRegFlag size={30} color="green" />,
          primaryText: t("adminPostDB.ok", "OK"),
          onPrimary: closeModal,
        });
      } else {
        setModal({
          open: true,
          title: t("adminPostDB.errorTitle", "Error"),
          message: result.message || t("adminPostDB.deleteFailed", "Failed to delete post."),
          primaryText: t("adminPostDB.close", "Close"),
          onPrimary: closeModal,
        });
      }
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  if (!localPosts || localPosts.length === 0) {
    return (
      <div className="recipe-database-section" style={{ backgroundColor: "white", minHeight: showFilters ? "850px" : "600px", transition: "min-height 0.3s ease" }}>
        <h2><FaRegFlag style={{ marginRight: 8 }} /> {sectionTitle}</h2>
        <p style={{ textAlign: "center", marginTop: 20, color: "#999" }}>
          {t("adminPostDB.noPosts", "No community posts found.")}
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
              placeholder={t("adminPostDB.searchPlaceholder", "Search community posts...")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Beige Dropdown updated to "Categories" to match Recipe Database */}
          <div className={`admin-beige-dropdown ${dropdownOpen ? "open" : ""}`} ref={dropdownRef}>
            <button className="admin-beige-trigger" onClick={() => setDropdownOpen(!dropdownOpen)}>
              <span>{category}</span>
              <FiChevronDown className={`admin-dropdown-arrow ${dropdownOpen ? "rotate" : ""}`} />
            </button>
            {dropdownOpen && (
              <ul className="admin-beige-list">
                {["All Categories", ...postCategories].map((opt, i) => (
                  <li key={i} onClick={() => { setCategory(opt); setDropdownOpen(false); }}>
                    <span className="option-text">{opt}</span>
                    {opt === category && <span className="tick">✓</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <button className="admin-food-btn-filter" onClick={() => setShowFilters(!showFilters)}>
            <div style={{ display: "grid", gridTemplateColumns: "auto auto", gap: "8px", alignItems: "center" }}>
              <FiFilter size={18} style={{ margin: 0, position: "static" }} />
              <span style={{ margin: 0, position: "static" }}>{t("explore.filters", "Filters")}</span>
            </div>
          </button>
        </div>

        {showFilters && (
          <div className="advanced-filters">
            <div className="advanced-filters-header">
              <CiFilter /> {t("adminFoodDB.advancedFilters", "Advanced Filters")}
            </div>
            
            <div className="advanced-filters-body" style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
              
              <div className="filter-item">
                <label>{t("explore.culturalOrigin", "Cultural Origin")}</label>
                <select 
                  value={originFilter} 
                  onChange={(e) => setOriginFilter(e.target.value)}
                  style={{ width: "100%", padding: "8px", borderRadius: "5px", border: "1px solid #ccc" }}
                >
                  {originOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              {/* Added Difficulty to match Recipe Database */}
              <div className="filter-item">
                <label>{t("explore.difficulty", "Difficulty")}</label>
                <select 
                  value={difficulty} 
                  onChange={(e) => setDifficulty(e.target.value)}
                  style={{ width: "100%", padding: "8px", borderRadius: "5px", border: "1px solid #ccc" }}
                >
                  <option value="All">{t("adminFoodDB.all", "All")}</option>
                  <option value="Easy">{t("explore.easy", "Easy")}</option>
                  <option value="Medium">{t("explore.medium", "Medium")}</option>
                  <option value="Hard">{t("explore.hard", "Hard")}</option>
                </select>
              </div>

              {sectionType !== "approved" && (
                <div className="filter-item">
                  <label>{t("adminRcpDB.colStatus", "Status")}</label>
                  <select 
                    value={statusFilter} 
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{ width: "100%", padding: "8px", borderRadius: "5px", border: "1px solid #ccc" }}
                  >
                    <option value="All">{t("adminFoodDB.all", "All")}</option>
                    <option value="Pending">{t("adminRcpDB.statusPending", "Pending")}</option>
                    <option value="Rejected">{t("adminRcpDB.statusRejected", "Rejected")}</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        <table className="content-table" style={{ width: "100%" }}>
          <thead>
            <tr>
              <th>{t("adminPostDB.colTitle", "Title")}</th>
              <th>{t("adminPostDB.colAuthor", "Author")}</th>
              <th>{sectionType === "approved" ? t("adminPostDB.colDateApproved", "Date Approved") : t("adminPostDB.colDatePosted", "Date Posted")}</th>
              <th>{t("adminRcpDB.colStatus", "Status")}</th>
              <th>{t("adminRcpDB.colActions", "Actions")}</th>
            </tr>
          </thead>
          <tbody>
            {currentPosts.map((p, i) => (
              <tr key={p.id || i}>
                <td data-label={t("adminPostDB.colTitle")}>{p.foodName || p.title || t("adminPostDB.untitled", "Untitled")}</td>
                <td data-label={t("adminPostDB.colAuthor")}>{p.author || t("adminPostDB.anonymous", "Anonymous")}</td>
                
                <td data-label={sectionType === "approved" ? t("adminPostDB.colDateApproved") : t("adminPostDB.colDatePosted")}>
                  {sectionType === "approved" && p.updatedAt
                    ? new Date(p.updatedAt).toLocaleDateString('en-GB')
                    : p.createdAt 
                      ? new Date(p.createdAt).toLocaleDateString('en-GB') 
                      : "—"
                  }
                </td>

                <td data-label={t("adminRcpDB.colStatus")}>
                  <span className={`recipe-status-tag ${p.status === "Pending" ? "pending" : p.status === "Rejected" ? "rejected" : "approved"}`}>
                    {p.status}
                  </span>
                </td>
                <td data-label={t("adminRcpDB.colActions")} className="admin-recipe-action-buttons">
                  {p.status === "Approved" ? (
                    <>
                      <button className="food-database-btn-edit" onClick={() => navigate(`/admin/edit/community/${p.id}`)}>
                        <HiOutlinePencilAlt />
                      </button>
                      <button className="food-database-btn-delete" onClick={() => handleDeleteClick(p.id)}>
                        <RiDeleteBin5Line />
                      </button>
                    </>
                  ) : (
                    <button className="review-btn" onClick={() => navigate(`/admin/edit/community/${p.id}`)}>
                      {t("adminRcpDB.review", "Review")}
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
            ‹ {t("explore.prev", "Prev")}
          </button>

          {renderPageNumbers()}

          <button
            className="umg-prev-next"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            {t("explore.next", "Next")} ›
          </button>
        </div>
      )}

      <Modal open={modal.open} title={modal.title} icon={modal.icon} primaryText={modal.primaryText} onClose={closeModal} onPrimary={modal.onPrimary}>
        {modal.message}
      </Modal>
    </div>
  );
};

export default AdminCommunityPostDatabase;