import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaRegFlag, FaPlus } from "react-icons/fa6";
import { CiSearch, CiFilter } from "react-icons/ci";
import { MdOutlineFileUpload } from "react-icons/md";
import { HiOutlinePencilAlt } from "react-icons/hi";
import { RiDeleteBin5Line } from "react-icons/ri";
import Modal from "../components/Modal"; // ✅ Ensure this path is correct

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const AdminCommunityPostDatabase = ({ posts: postsProp, sectionType = "approved" }) => {
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

  const currentPosts = postsProp.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );
  const totalPages = Math.ceil(postsProp.length / perPage);

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
      ? "Approved Community Posts"
      : "Pending / Rejected Community Posts";

  // 2️⃣ Trigger the Pop-up (Replaces window.confirm)
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

  // 3️⃣ Actual Delete Logic (API Call)
  const performDelete = async (postId) => {
    try {
      const response = await fetch(`${API_URL}/api/communityPost/admin/delete/${postId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Show Success Modal
        setModal({
          open: true,
          title: "Deleted!",
          message: "The post has been successfully removed.",
          icon: <FaRegFlag size={30} color="green" />,
          primaryText: "OK",
          onPrimary: () => {
             closeModal();
             window.location.reload(); 
          },
        });
      } else {
        // Show Error Modal
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
      setModal({
        open: true,
        title: "Error",
        message: "An error occurred. Please try again.",
        primaryText: "Close",
        onPrimary: closeModal,
      });
    }
  };

  if (!postsProp || postsProp.length === 0) {
    return (
      <div className="recipe-database-section" style={{ backgroundColor: "white" }}>
      <h2><FaRegFlag style={{ marginRight: 8 }} /> {sectionTitle}</h2>
        <p style={{ textAlign: "center", marginTop: 20, color: "#999" }}>
          No community posts found.
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
              onClick={() => navigate("/admin/addcommunitypost")}
            >
              <FaPlus /> Add New Post
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
          <input type="text" placeholder="Search community posts..." />
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
              {["All Categories", "Food", "Culture", "Events"].map((opt, i) => (
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

      {/* Posts Table */}
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
                <span
                  className={`recipe-status-tag ${
                    p.status === "Pending"
                      ? "pending"
                      : p.status === "Rejected"
                      ? "rejected"
                      : "approved"
                  }`}
                >
                  {p.status}
                </span>
              </td>

              <td className="admin-recipe-action-buttons">
                {p.status === "Approved" ? (
                  <>
                    <button
                      className="food-database-btn-edit"
                      onClick={() => navigate(`/admin/edit/community/${p.id}`)}
                    >
                      <HiOutlinePencilAlt />
                    </button>

                    <button
                      className="food-database-btn-delete"
                      onClick={() => handleDeleteClick(p.id)} 
                    >
                      <RiDeleteBin5Line />
                    </button>
                  </>
                ) : (
                  <button
                    className="review-btn"
                    onClick={() => navigate(`/admin/edit/community/${p.id}`)}
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

export default AdminCommunityPostDatabase;