import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaRegFlag } from "react-icons/fa6";
import { CiSearch, CiFilter } from "react-icons/ci";
import { HiOutlinePencilAlt } from "react-icons/hi";
import { RiDeleteBin5Line } from "react-icons/ri";
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

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef();
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 5;

  const originOptions = ["All Origins", "Malay", "Chinese", "Iban", "Melanau", "Bidayuh", "Dayak"];

  // --- Sync Props ---
  useEffect(() => {
    setLocalPosts(postsProp);
  }, [postsProp]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, category, statusFilter, originFilter]);

  // --- Filtering Logic ---
  const filteredPosts = localPosts.filter((post) => {
    const term = searchTerm.toLowerCase();
    const title = (post.foodName || post.title || "").toLowerCase();
    const author = (post.author || "").toLowerCase();
    const matchesSearch = title.includes(term) || author.includes(term);
    const matchesCategory = category === "All Categories" || post.category === category;
    const postOrigin = post.origin || post.culturalOrigin || "";
    const matchesOrigin = originFilter === "All Origins" || postOrigin === originFilter;
    const requiredStatus = sectionType === "approved" ? "Approved" : statusFilter;
    const matchesStatus = requiredStatus === "All" || post.status === requiredStatus;
    return matchesSearch && matchesCategory && matchesStatus && matchesOrigin;
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
    ? t("adminPostDB.titleApproved")
    : t("adminPostDB.titlePending");

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
      title: t("adminPostDB.confirmDeletion"),
      message: t("adminPostDB.confirmDeletionMsg"),
      icon: <RiDeleteBin5Line size={30} color="#dc3545" />, 
      primaryText: t("adminPostDB.yesDelete"),
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
          title: t("adminPostDB.deletedTitle"),
          message: t("adminPostDB.deletedMsg"),
          icon: <FaRegFlag size={30} color="green" />,
          primaryText: t("adminPostDB.ok"),
          onPrimary: closeModal,
        });
      } else {
        setModal({
          open: true,
          title: t("adminPostDB.errorTitle"),
          message: result.message || t("adminPostDB.deleteFailed"),
          primaryText: t("adminPostDB.close"),
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
          {t("adminPostDB.noPosts")}
        </p>
      </div>
    );
  }

  const postCategories = ["Food", "Culture", "Events"];

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
              placeholder={t("adminPostDB.searchPlaceholder")}
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
                {["All Categories", ...postCategories].map((opt, i) => (
                  <li key={i} onClick={() => { setCategory(opt); setDropdownOpen(false); }}>
                    {opt}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button className="admin-recipe-btn-filter" onClick={() => setShowFilters(!showFilters)}>
            <CiFilter className="filter-icon" /> 
            <span>{t("explore.filters")}</span>
          </button>
        </div>

        {showFilters && (
          <div className="advanced-filters">
            <h4><CiFilter /> {t("adminFoodDB.advancedFilters")}</h4>
            <div className="filter-grid">
              
              <div className="filter-item">
                <label>{t("explore.culturalOrigin")}</label>
                <select 
                  value={originFilter} 
                  onChange={(e) => setOriginFilter(e.target.value)}
                >
                  {originOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
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

        <table className="content-table" style={{ width: "100%" }}>
          <thead>
            <tr>
              <th>{t("adminPostDB.colTitle")}</th>
              <th>{t("adminPostDB.colAuthor")}</th>
              <th>{sectionType === "approved" ? t("adminPostDB.colDateApproved") : t("adminPostDB.colDatePosted")}</th>
              <th>{t("adminRcpDB.colStatus")}</th>
              <th>{t("adminRcpDB.colActions")}</th>
            </tr>
          </thead>
          <tbody>
            {currentPosts.map((p, i) => (
              <tr key={p.id || i}>
                <td data-label={t("adminPostDB.colTitle")}>{p.foodName || p.title || t("adminPostDB.untitled")}</td>
                <td data-label={t("adminPostDB.colAuthor")}>{p.author || t("adminPostDB.anonymous")}</td>
                
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

export default AdminCommunityPostDatabase;