import React, { useEffect, useState, useMemo  } from "react";
import "../css/Community.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { FaCamera, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Modal from "../components/Modal";
import { GrDocumentMissing } from "react-icons/gr";
import { PiChefHat } from "react-icons/pi";
import LoginPromptModal from "../components/LoginPromptModal"; 

export default function Community() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAuthenticated = user && user.role !== "guest";

  const [expanded, setExpanded] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false); 
  const [preview, setPreview] = useState(null);
  const [posts, setPosts] = useState([]);
  const [formData, setFormData] = useState({
    foodName: "",
    culturalOrigin: "",
    culturalStory: "",
    recipe: "",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrigin, setSelectedOrigin] = useState("all");
  const [sortOption, setSortOption] = useState("newest");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 9;
  const [modal, setModal] = useState({
    open: false,
    title: "",
    message: "",
    icon: null,
    primaryText: "OK",
    onPrimary: null,
  });

  const closeModal = () =>
    setModal((m) => ({ ...m, open: false, onPrimary: null }));
  
  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const res = await fetch(`${API_BASE_URL}/api/communityPost/counts`);
      const result = await res.json();

      if (res.ok && result.success) {
        setPosts(result.data);
      } else {
        throw new Error(result.message || "Failed to load posts");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter + Sort logic
  const communityFilteredPosts = useMemo(() => {
    let filtered = posts;

    if (searchQuery.trim() !== "") {
      filtered = filtered.filter(
        (p) =>
          p.foodName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.culturalStory?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.author?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedOrigin !== "all") {
      filtered = filtered.filter(
        (p) => p.culturalOrigin?.toLowerCase() === selectedOrigin.toLowerCase()
      );
    }

    // Sorting logic
    if (sortOption === "newest") {
      filtered = [...filtered].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortOption === "mostLiked") {
      filtered = [...filtered].sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
    } else if (sortOption === "mostCommented") {
      filtered = [...filtered].sort((a, b) => (b.commentCount || 0) - (a.commentCount || 0));
    }

    return filtered;
  }, [posts, searchQuery, selectedOrigin, sortOption]);

  // Pagination (based on filtered posts)
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = communityFilteredPosts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(communityFilteredPosts.length / postsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedOrigin, sortOption]);


    const paginate = (pageNumber) => {
      if (pageNumber < 1 || pageNumber > totalPages) return;
      setCurrentPage(pageNumber);
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

  // Replace confirm() with LoginPromptModal
  const handleExpand = () => {
    if (!isAuthenticated) {
      setShowLoginModal(true); // ✅ Show modal
      return;
    }
    setExpanded(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated || !user) {
      setShowLoginModal(true);
      return;
    }

    if (!formData.foodName || !formData.culturalOrigin || !formData.culturalStory) {
      setModal({
        open: true,
        title: "Missing Required Fields",
        message: "Food Name, Cultural Origin, Cultural Story, and a Photo are required.",
        icon: <GrDocumentMissing />,
        primaryText: "OK",
        onPrimary: closeModal,
      });
      return;
    }

    try {
      setSubmitting(true);
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const submitData = new FormData();

      submitData.append("foodName", formData.foodName);
      submitData.append("culturalOrigin", formData.culturalOrigin);
      submitData.append("culturalStory", formData.culturalStory);
      submitData.append("recipe", formData.recipe || "");
      console.log("User object:", user);
      submitData.append("userProfileID", user.id);

      submitData.append("author", user?.firstname || user?.email);

      if (selectedFile) {
        submitData.append("images", selectedFile);
      }

      const response = await fetch(`${API_BASE_URL}/api/communityPost/create`, {
        method: "POST",
        body: submitData,
        credentials: 'include'
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to submit post");
      }

      setModal({
        open: true,
        title: "Story Submitted Successfully!",
        message:
          "Your story has been submitted for review. Please wait for admin approval before it appears publicly.",
        icon: <PiChefHat />,
        primaryText: "OK",
        onPrimary: () => {
          closeModal();
      setFormData({
        foodName: "",
        culturalOrigin: "",
        culturalStory: "",
        recipe: "",
      });
      setPreview(null);
      setSelectedFile(null);
      setExpanded(false);
      fetchPosts();
      },
    });
    } catch (err) {
      setModal({
        open: true,
        title: "Submission Failed.",
        message: err.message || "Something went wrong. Please try again.",
        icon: <FaTimes />,
        primaryText: "OK",
        onPrimary: closeModal,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      foodName: "",
      culturalOrigin: "",
      culturalStory: "",
      recipe: "",
    });
    setPreview(null);
    setSelectedFile(null);
    setExpanded(false);
  };

  return (
    <div>
    <Header />
    {showLoginModal && (
      <LoginPromptModal
        message="You must be logged in to share your cultural story."
        onClose={() => setShowLoginModal(false)}
        onConfirm={() => navigate("/loginregister")}
      />
    )}
    <div className="community-page">

      <h1 className="page-title">Community Contributions</h1>
      <p className="page-subtitle">
        Celebrate Sarawak's rich heritage by sharing your recipes and stories
      </p>

      {/* POST CREATION SECTION */}
      <section className={`share-card ${expanded ? "expanded" : ""}`}>
        <h3>Share Your Heritage</h3>
        <p>Upload recipes, photos, and stories to preserve our culture.</p>

        {!expanded && (
          <button className="share-btn" onClick={handleExpand}>
            {isAuthenticated ? "Add Your Story" : "Log In to Share Your Story"}
          </button>
        )}

        {expanded && (
          <form className="heritage-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Food Name *</label>
              <input
                type="text"
                name="foodName"
                value={formData.foodName}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Cultural Origin *</label>
              <select
                name="culturalOrigin"
                value={formData.culturalOrigin}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Origin</option>
                <option value="Malay">Malay</option>
                <option value="Chinese">Chinese</option>
                <option value="Iban">Iban</option>
                <option value="Melanau">Melanau</option>
                <option value="Bidayuh">Bidayuh</option>
                <option value="Dayak">Dayak</option>
              </select>
            </div>

            <div className="form-group">
              <label>Cultural Story *</label>
              <textarea
                name="culturalStory"
                value={formData.culturalStory}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Recipe (Optional)</label>
              <textarea
                name="recipe"
                value={formData.recipe}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label>Upload Photo *</label>
              <div
                className="upload-box"
                onClick={() => document.getElementById("file-input").click()}
              >
                {preview ? (
                  <img src={preview} alt="Preview" className="preview-img" />
                ) : (
                  <>
                    <FaCamera className="camera-icon" />
                    <p>Click to upload</p>
                  </>
                )}
              </div>
              <input
                id="file-input"
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleImageUpload}
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="submit-btn" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Contribution"}
              </button>
              <button type="button" className="cancel-btn" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>

       {/* Filter Bar */}
        <div className="community-filter-bar">
          <div className="community-search-container">
            <input
              type="text"
              placeholder="Search by name, author, or story..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="community-filter-select"
            value={selectedOrigin}
            onChange={(e) => setSelectedOrigin(e.target.value)}
          >
            <option value="all">All Origins</option>
            <option value="Malay">Malay</option>
            <option value="Chinese">Chinese</option>
            <option value="Iban">Iban</option>
            <option value="Melanau">Melanau</option>
            <option value="Bidayuh">Bidayuh</option>
            <option value="Dayak">Dayak</option>
          </select>

          <select
            className="community-filter-select"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
          >
            <option value="newest">Newest</option>
            <option value="mostLiked">Most Liked</option>
            <option value="mostCommented">Most Commented</option>
          </select>
        </div>

      {/* RECENT POSTS SECTION */}
      <section className="recent-section">
        <h2>Recent Contributions ({communityFilteredPosts.length})</h2>
        {loading ? (
          <div className="loading">Loading posts...</div>
        ) : communityFilteredPosts.length === 0 ? (
          <div className="no-posts">
            <p>No contributions yet. Be the first!</p>
          </div>
        ) : (
          <div className="cards-grid">
            {currentPosts.map((post) => (
              <div className="contribution-card" key={post.id}>
                <div className="card-image">
                  <img
                    src={
                      post.images?.[0] ||
                      "https://images.googleapis.com/photo-1551218808-94e220e084d2"
                    }
                    alt={post.foodName}
                  />
                </div>
                <div className="card-content">
                  <h3>{post.foodName}</h3>
                  <p className="meta">
                    by <b>{post.author}</b> • {post.daysAgo}
                  </p>
                  <p className="desc">
                    {post.culturalStory}
                  </p>
                  <div className="card-footer">
                    <span>❤️ {post.likeCount} likes</span>
                    <span onClick={() => navigate(`/community/${post.id}`)}>
                      💬 {post.commentCount} comments
                    </span>
                  </div>
                  <button
                    className="view-btn"
                    onClick={() => navigate(`/community/${post.id}`)}
                  >
                    View More
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

         {totalPages > 1 && (
              <div className="community-pagination">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="community-page-btn"
                >
                  ← Prev
                </button>

                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => paginate(i + 1)}
                    className={`community-page-btn ${currentPage === i + 1 ? "active" : ""}`}
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="community-page-btn"
                >
                  Next →
                </button>
              </div>
            )}
      </section>
    </div>
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
    <Footer />
    </div>
  );
}
