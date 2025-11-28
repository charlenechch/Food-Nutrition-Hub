import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaRegFlag } from "react-icons/fa6";
import { CiSearch, CiFilter } from "react-icons/ci";
import { HiOutlinePencilAlt } from "react-icons/hi";
import { RiDeleteBin5Line } from "react-icons/ri";
import Modal from "../components/Modal"; 

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const AdminCommunityPostDatabase = ({ posts: postsProp = [], sectionType = "approved" }) => {
  const navigate = useNavigate();

  // --- States ---
  const [localPosts, setLocalPosts] = useState(postsProp);
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [statusFilter, setStatusFilter] = useState("All");

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef();
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 5;

  // --- Sync Props ---
  useEffect(() => {
    setLocalPosts(postsProp);
  }, [postsProp]);

  // Reset page
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, category, statusFilter]);

  // --- Filtering Logic ---
  const filteredPosts = localPosts.filter((post) => {
    const term = searchTerm.toLowerCase();
    const title = (post.foodName || post.title || "").toLowerCase();
    const author = (post.author || "").toLowerCase();
    const matchesSearch = title.includes(term) || author.includes(term);
    const matchesCategory = category === "All Categories" || post.category === category;
    const matchesStatus = statusFilter === "All" || post.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
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

  const sectionTitle =
    sectionType === "approved"
      ? "Approved Community Posts"
      : "Pending / Rejected Community Posts";

  const handleDeleteClick = (postId) => {
    setModal({
      open: true,
      title: "Confirm Deletion",
      message: "Are you sure you want to delete this post? This action cannot be undone.",
      icon: <RiDeleteBin5Line size={30} color="#dc3545" />, 
      primaryText: "Yes, Delete",
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
          title: "Deleted!",
          message: "The post has been successfully removed.",
          icon: <FaRegFlag size={30} color="green" />,
          primaryText: "OK",
          onPrimary: closeModal,
        });
      } else {
        setModal({
          open: true,
          title: "Error",
          message: result.message || "Failed to delete post.",
          primaryText: "Close",
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
          No community posts found.
        </p>
      </div>
    );
  }

  const postCategories = ["Food", "Culture", "Events"];

  return (
    // ✅ DYNAMIC HEIGHT APPLIED
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
              placeholder="Search community posts..." 
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
            <CiFilter className="filter-icon" /> Filters
          </button>
        </div>

        {showFilters && (
          <div className="advanced-filters">
            <h4><CiFilter /> Advanced Filters</h4>
            <div className="filter-grid">
              <div className="filter-item">
                <label>Topic</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option>All Categories</option>
                  {postCategories.map((cat) => (
                    <option key={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="filter-item">
                <label>Status</label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="All">All</option>
                  <option value="Approved">Approved</option>
                  <option value="Pending">Pending</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>
        )}

        <table className="content-table" style={{ width: "100%" }}>
          <thead>
            <tr>
              <th>Title</th>
              <th>Author</th>
              <th>Date Posted</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentPosts.map((p, i) => (
              <tr key={p.id || i}>
                <td>{p.foodName || p.title || "Untitled"}</td>
                <td>{p.author || "Anonymous"}</td>
                <td>{p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-GB') : "—"}</td>
                <td>
                  <span className={`recipe-status-tag ${p.status === "Pending" ? "pending" : p.status === "Rejected" ? "rejected" : "approved"}`}>
                    {p.status}
                  </span>
                </td>
                <td className="admin-recipe-action-buttons">
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
          <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
            ‹ Prev
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button key={i} onClick={() => handlePageChange(i + 1)} className={currentPage === i + 1 ? "active" : ""}>
              {i + 1}
            </button>
          ))}
          <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
            Next ›
          </button>
      </div>

      <Modal open={modal.open} title={modal.title} icon={modal.icon} primaryText={modal.primaryText} onClose={closeModal} onPrimary={modal.onPrimary}>
        {modal.message}
      </Modal>
    </div>
  );
};

export default AdminCommunityPostDatabase;