/* src/pages/CommunityPage.jsx */
import React, { useEffect, useState, useMemo } from "react";
import "../css/Community.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { FaCamera, FaTimes, FaHeart, FaComment, FaSearch, FaFilter } from "react-icons/fa";
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

  // CSRF
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
    secondaryText: null,
    onSecondary: null
  });

  const closeModal = () =>
    setModal((m) => ({ ...m, open: false, onPrimary: null, onSecondary: null }));
  
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
    const anchor = document.getElementById("posts-anchor");
    if(anchor) anchor.scrollIntoView({ behavior: "smooth" });
  };

  const handleExpand = () => {
    if (!isAuthenticated) {
      setShowLoginModal(true); 
      return;
    }
    setExpanded(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
      submitData.append("userProfileID", user.id);
      submitData.append("author", user?.firstname || user?.email);

      if (selectedFile) submitData.append("images", selectedFile);

      const response = await fetch(`${API_BASE_URL}/api/communityPost/create`, {
        method: "POST",
        headers: { 'X-CSRF-Token': csrfToken },
        body: submitData,
        credentials: 'include'
      });

      const result = await response.json();

      if (!response.ok || !result.success) throw new Error(result.message || "Failed to submit post");

      setModal({
        open: true,
        title: "Post Submitted Successfully!",
        message: "Your post has been sent to the Admins for approval. Track it in your Profile.",
        icon: <PiChefHat />,
        primaryText: "Track My Post",
        onPrimary: () => {
          closeModal();
          resetForm();
          const uid = user.id || user.userID;
          navigate(uid ? `/profile/${uid}?tab=status` : "/profile?tab=status");
        },
        secondaryText: "Close",
        onSecondary: () => {
          closeModal();
          resetForm();
          fetchPosts(); 
        }
      });

    } catch (err) {
      setModal({
        open: true,
        title: "Submission Failed.",
        message: err.message || "Something went wrong.",
        icon: <FaTimes />,
        primaryText: "OK",
        onPrimary: closeModal,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({ foodName: "", culturalOrigin: "", culturalStory: "", recipe: "" });
    setPreview(null);
    setSelectedFile(null);
    setExpanded(false);
  };

  const getInitials = (name) => name ? name.charAt(0).toUpperCase() : "U";

  return (
    <div className="community-wrapper">
      <Header />
      
      {showLoginModal && (
        <LoginPromptModal
          message="You must be logged in to share your cultural story."
          onClose={() => setShowLoginModal(false)}
          onConfirm={() => navigate("/loginregister")}
        />
      )}

      {/* HERO SECTION */}
      <header className="community-hero">
        <div className="community-hero-content">
          <h1>Community Table</h1>
          <p>A collection of memories, recipes, and heritage stories from across Sarawak.</p>
        </div>
      </header>

      <div className="community-page">
        
        {/* SHARE BANNER */}
        <section className={`share-banner ${expanded ? "expanded" : ""}`}>
          <div className="share-header-flex">
            <div>
              <h3>Share Your Heritage</h3>
              <p>Upload recipes, photos, and stories to preserve our culture.</p>
            </div>
            {!expanded && (
              <button className="share-cta-btn" onClick={handleExpand}>
                {isAuthenticated ? "Add Your Story +" : "Log In to Share"}
              </button>
            )}
          </div>

          {expanded && (
            <div className="share-form-container">
              <form className="heritage-form" onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Food Name *</label>
                    <input type="text" name="foodName" value={formData.foodName} onChange={handleInputChange} required placeholder="e.g. Grandma's Umai"/>
                  </div>
                  <div className="form-group">
                    <label>Origin *</label>
                    <select name="culturalOrigin" value={formData.culturalOrigin} onChange={handleInputChange} required>
                      <option value="">Select Origin</option>
                      <option value="Malay">Malay</option>
                      <option value="Chinese">Chinese</option>
                      <option value="Iban">Iban</option>
                      <option value="Melanau">Melanau</option>
                      <option value="Bidayuh">Bidayuh</option>
                      <option value="Dayak">Dayak</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Cultural Story *</label>
                  <textarea name="culturalStory" value={formData.culturalStory} onChange={handleInputChange} required rows="3" placeholder="What makes this dish special?" />
                </div>
                <div className="form-group">
                  <label>Recipe (Optional)</label>
                  <textarea name="recipe" value={formData.recipe} onChange={handleInputChange} rows="3" placeholder="Ingredients and steps..." />
                </div>
                <div className="form-group upload-group">
                  <label>Upload Photo *</label>
                  <div className="upload-box" onClick={() => document.getElementById("file-input").click()}>
                    {preview ? <img src={preview} alt="Preview" className="preview-img" /> : <div className="upload-placeholder"><FaCamera className="camera-icon"/><p>Click to upload</p></div>}
                  </div>
                  <input id="file-input" type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageUpload} />
                </div>
                <div className="form-actions">
                  <button type="submit" className="submit-btn" disabled={submitting}>{submitting ? "Submitting..." : "Submit Contribution"}</button>
                  <button type="button" className="cancel-btn" onClick={resetForm}>Cancel</button>
                </div>
              </form>
            </div>
          )}
        </section>

        {/* STICKY FILTER BAR */}
        <div className="sticky-filter-bar" id="posts-anchor">
          <div className="search-pill">
            <FaSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Search dishes, stories, authors..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
          </div>

          <div className="filter-group">
            <div className="select-wrapper">
                <FaFilter className="filter-icon" />
                <select className="community-filter-select" value={selectedOrigin} onChange={(e) => setSelectedOrigin(e.target.value)}>
                    <option value="all">All Origins</option>
                    <option value="Malay">Malay</option>
                    <option value="Chinese">Chinese</option>
                    <option value="Iban">Iban</option>
                    <option value="Melanau">Melanau</option>
                    <option value="Bidayuh">Bidayuh</option>
                    <option value="Dayak">Dayak</option>
                </select>
            </div>

            <div className="select-wrapper">
                <select className="community-filter-select" value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
                    <option value="newest">Newest First</option>
                    <option value="mostLiked">Most Liked</option>
                    <option value="mostCommented">Most Discussed</option>
                </select>
            </div>
          </div>
        </div>

        {/* RECENT POSTS SECTION */}
        <section className="recent-section">
          {loading ? (
            <div className="loading-state"><div className="spinner"></div><p>Loading stories...</p></div>
          ) : communityFilteredPosts.length === 0 ? (
            <div className="empty-state">
                <div className="empty-icon">🍃</div>
                <h3>No stories found</h3>
                <p>Be the first to share a recipe for this category!</p>
            </div>
          ) : (
            <div className="premium-grid">
              {currentPosts.map((post) => (
                <div className="premium-card" key={post.id} onClick={() => navigate(`/community/${post.id}`)}>
                  <div className="card-image-wrap">
                    <img src={post.images?.[0] || "https://images.googleapis.com/photo-1551218808-94e220e084d2"} alt={post.foodName} />
                    <span className="origin-badge">{post.culturalOrigin}</span>
                  </div>
                  <div className="card-body">
                    <h3>{post.foodName}</h3>
                    <div className="card-meta">
                        <div className="user-avatar">{getInitials(post.author)}</div>
                        <div className="meta-text">
                            <span className="author-name">{post.author}</span>
                            <span className="post-date">{post.daysAgo}</span>
                        </div>
                    </div>
                    <p className="card-excerpt">{post.culturalStory}</p>
                    <div className="card-stats">
                      <span className="stat"><FaHeart /> {post.likeCount}</span>
                      <span className="stat"><FaComment /> {post.commentCount}</span>
                    </div>
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
                  className="community-page-btn nav-btn"
                >
                  ← Prev
                </button>
                
                <div className="page-numbers">
                  {[...Array(totalPages)].map((_, i) => (
                      <button 
                        key={i + 1} 
                        onClick={() => paginate(i + 1)} 
                        className={`community-page-btn page-num ${currentPage === i + 1 ? "active" : ""}`}
                      >
                        {i + 1}
                      </button>
                  ))}
                </div>
                
                <button 
                  onClick={() => paginate(currentPage + 1)} 
                  disabled={currentPage === totalPages} 
                  className="community-page-btn nav-btn"
                >
                  Next →
                </button>
            </div>
          )}
        </section>
      </div>
      
      <Modal open={modal.open} title={modal.title} icon={modal.icon} primaryText={modal.primaryText} secondaryText={modal.secondaryText} onClose={closeModal} onPrimary={modal.onPrimary} onSecondary={modal.onSecondary}>{modal.message}</Modal>
      <Footer />
    </div>
  );
}