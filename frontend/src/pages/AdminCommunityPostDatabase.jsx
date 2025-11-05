import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaRegFlag } from "react-icons/fa6";
import { CiSearch, CiFilter } from "react-icons/ci";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const CommunityPostDatabaseSection = ({ categories }) => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [category, setCategory] = useState("All Categories");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef();

  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 5;
  const totalPages = Math.ceil(posts.length / perPage);
  const currentPosts = posts.slice((currentPage - 1) * perPage, currentPage * perPage);

  const handlePageChange = (p) => {
    if (p >= 1 && p <= totalPages) setCurrentPage(p);
  };

  useEffect(() => {
    const controller = new AbortController();
    const fetchPendingPosts = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/communityPost/admin/pending`, {
          credentials: "include",
          signal: controller.signal,
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) setPosts(data.data);
        else setPosts([]);
      } catch (err) {
        if (err.name !== "AbortError") console.error("❌ Error:", err);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPendingPosts();
    return () => controller.abort();
  }, []);

  const sectionTitle = "Pending / Rejected Community Posts";

  if (loading) return (
    <div className="recipe-database-section">
      <h2><FaRegFlag style={{ marginRight: 8 }} /> {sectionTitle}</h2>
      <p style={{ textAlign: "center", marginTop: 20 }}>Loading...</p>
    </div>
  );

  if (posts.length === 0)
    return (
      <div className="recipe-database-section">
        <h2><FaRegFlag style={{ marginRight: 8 }} /> {sectionTitle}</h2>
        <p style={{ textAlign: "center", marginTop: 20, color: "#999" }}>
          No pending community posts found.
        </p>
      </div>
    );

  return (
    <div className="recipe-database-section">
      <div className="recipe-header">
        <h2><FaRegFlag style={{ marginRight: 8 }} /> {sectionTitle}</h2>
      </div>

      <div className="food-filters">
        <div className="search-box">
          <CiSearch className="search-icon" />
          <input type="text" placeholder="Search community posts..." />
        </div>
        <button
          className="admin-recipe-btn-filter"
          onClick={() => {}}
        >
          <CiFilter className="filter-icon" /> Filters
        </button>
      </div>

      <table className="content-table" style={{ width: "100%" }}>
        <thead>
          <tr>
            <th>Post Title</th>
            <th>Author</th>
            <th>Date Submitted</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentPosts.map((p, i) => (
            <tr key={p.id || i}>
              <td>{p.title || "Untitled Post"}</td>
              <td>{p.author || "Unknown"}</td>
              <td>{new Date(p.createdAt).toLocaleDateString("en-MY")}</td>
              <td>
                <span className="recipe-status-tag pending">
                  {p.status || "Pending"}
                </span>
              </td>
              <td className="admin-recipe-action-buttons">
                <button
                  className="review-btn"
                  onClick={() => navigate(`/admin/review/community/${p.id}`)}
                >
                  Review
                </button>
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

export default CommunityPostDatabaseSection;
