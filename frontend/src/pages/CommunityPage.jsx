/* src/pages/CommunityPage.jsx */
import React, { useEffect, useState, useMemo } from "react";
import "../css/Community.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { FaCamera, FaTimes, FaHeart, FaComment, FaSearch, FaFilter, FaChevronDown } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Modal from "../components/Modal";
import { GrDocumentMissing } from "react-icons/gr";
import { PiChefHat } from "react-icons/pi";
import LoginPromptModal from "../components/LoginPromptModal";
import { useTranslation } from "react-i18next";
import { getTierById } from "../utils/gamificationTiers";

export default function Community() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const isAuthenticated = user && user.role !== "guest";

  const [expanded, setExpanded] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [preview, setPreview] = useState(null);
  const [posts, setPosts] = useState([]);
  const [formData, setFormData] = useState({ foodName: "", culturalOrigin: "", culturalStory: "", recipe: "" });
  const [selectedFile, setSelectedFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [csrfToken, setCsrfToken] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrigin, setSelectedOrigin] = useState("all");
  const [sortOption, setSortOption] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 9;
  const [originDropdownOpen, setOriginDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [modal, setModal] = useState({ open: false, title: "", message: "", icon: null, primaryText: "OK", onPrimary: null, secondaryText: null, onSecondary: null });

  const closeModal = () => setModal((prev) => ({ ...prev, open: false, onPrimary: null, onSecondary: null }));

  useEffect(() => {
    const initializePage = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const res = await fetch(`${API_BASE_URL}/api/csrf-token`, { credentials: "include" });
        const data = await res.json();
        setCsrfToken(data.csrfToken);
      } catch (err) { console.error("Failed to fetch CSRF token", err); }
      fetchPosts();
    };
    initializePage();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const res = await fetch(`${API_BASE_URL}/api/communityPost/counts`);
      const result = await res.json();
      if (res.ok && result.success) { setPosts(result.data); }
      else { throw new Error(result.message || "Failed to load posts"); }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const communityFilteredPosts = useMemo(() => {
    let filtered = posts;
    if (searchQuery.trim()) {
      filtered = filtered.filter(p =>
        p.foodName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.culturalStory?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.author?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (selectedOrigin !== "all") {
      filtered = filtered.filter(p => p.culturalOrigin?.toLowerCase() === selectedOrigin.toLowerCase());
    }
    const sorted = [...filtered];
    if (sortOption === "newest") sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    else if (sortOption === "mostLiked") sorted.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
    else if (sortOption === "mostCommented") sorted.sort((a, b) => (b.commentCount || 0) - (a.commentCount || 0));
    return sorted;
  }, [posts, searchQuery, selectedOrigin, sortOption]);

  const indexOfLastPost = currentPage * postsPerPage;
  const currentPosts = communityFilteredPosts.slice(indexOfLastPost - postsPerPage, indexOfLastPost);
  const totalPages = Math.ceil(communityFilteredPosts.length / postsPerPage);

  const paginate = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
    document.getElementById("posts-anchor")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleExpand = () => isAuthenticated ? setExpanded(true) : setShowLoginModal(true);
  const handleInputChange = (e) => { const { name, value } = e.target; setFormData((prev) => ({ ...prev, [name]: value })); };
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) { setPreview(URL.createObjectURL(file)); setSelectedFile(file); }
  };
  const resetForm = () => { setFormData({ foodName: "", culturalOrigin: "", culturalStory: "", recipe: "" }); setPreview(null); setSelectedFile(null); setExpanded(false); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated || !user) { setShowLoginModal(true); return; }

    if (!formData.foodName || !formData.culturalOrigin || !formData.culturalStory || !selectedFile) {
      setModal({ open: true, title: t("community.missingInfo"), message: t("community.missingInfoMsg"), icon: <GrDocumentMissing />, primaryText: "OK", onPrimary: closeModal });
      return;
    }

    try {
      setSubmitting(true);
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const submitData = new FormData();
      const currentUID = user.userID || user.id;
      submitData.append("foodName", formData.foodName);
      submitData.append("culturalOrigin", formData.culturalOrigin);
      submitData.append("culturalStory", formData.culturalStory);
      submitData.append("recipe", formData.recipe || "");
      submitData.append("userProfileID", currentUID);
      submitData.append("author", user?.firstname || user?.email);
      if (selectedFile) submitData.append("images", selectedFile);

      const response = await fetch(`${API_BASE_URL}/api/communityPost/create`, {
        method: "POST", headers: { "X-CSRF-Token": csrfToken }, body: submitData, credentials: "include",
      });
      const result = await response.json();
      setSubmitting(false);

      if (response.ok && result.success) {
        setModal({
          open: true,
          title: t("community.submitSuccess"),
          message: t("community.submitSuccessMsg"),
          icon: <PiChefHat />,
          primaryText: t("community.trackPost"),
          onPrimary: () => { closeModal(); resetForm(); navigate("/profile?tab=status"); },
          secondaryText: t("community.close"),
          onSecondary: () => { closeModal(); resetForm(); fetchPosts(); },
        });
      } else { throw new Error(result.message || "Failed to submit post"); }
    } catch (err) {
      setSubmitting(false);
      setModal({ open: true, title: t("community.submitError"), message: err.message || t("community.submitErrorMsg"), icon: <FaTimes />, primaryText: "OK", onPrimary: closeModal });
    }
  };

  const sortLabel = sortOption === "newest" ? t("community.newestFirst")
    : sortOption === "mostLiked" ? t("community.mostLiked")
    : t("community.mostDiscussed");

  return (
    <div className="community-wrapper">
      <Header />

      {showLoginModal && (
        <LoginPromptModal
          message={t("community.loginToShare")}
          onClose={() => setShowLoginModal(false)}
          onConfirm={() => navigate("/loginregister")}
        />
      )}

      <header className="community-hero">
        <div className="community-hero-content">
          <h1>{t("community.heroTitle")}</h1>
          <p>{t("community.heroSubtitle")}</p>
        </div>
      </header>

      <div className="community-page">
        <section className={`share-banner ${expanded ? "expanded" : ""}`}>
          <div className="share-header-flex">
            <div>
              <h3>{t("community.shareTitle")}</h3>
              <p>{t("community.shareSubtitle")}</p>
            </div>
            {!expanded && (
              <button className="share-cta-btn" onClick={handleExpand}>
                {isAuthenticated ? t("community.addStory") : t("community.loginToShare2")}
              </button>
            )}
          </div>

          {expanded && (
            <div className="share-form-container">
              <form className="heritage-form" onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>{t("community.foodName")} *</label>
                    <input type="text" name="foodName" value={formData.foodName} onChange={handleInputChange} required placeholder={t("community.foodNamePlaceholder")} />
                  </div>
                  <div className="form-group">
                    <label>{t("community.origin")} *</label>
                    <select name="culturalOrigin" value={formData.culturalOrigin} onChange={handleInputChange} required>
                      <option value="">{t("community.selectOrigin")}</option>
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
                  <label>{t("community.culturalStory")} *</label>
                  <textarea name="culturalStory" value={formData.culturalStory} onChange={handleInputChange} required rows="3" placeholder={t("community.storyPlaceholder")} />
                </div>
                <div className="form-group">
                  <label>{t("community.recipe")}</label>
                  <textarea name="recipe" value={formData.recipe} onChange={handleInputChange} rows="3" placeholder={t("community.recipePlaceholder")} />
                </div>
                <div className="form-group upload-group">
                  <label>{t("community.uploadPhoto")} *</label>
                  <div className="upload-wrap">
                    <div className="upload-box" onClick={() => document.getElementById("file-input").click()}>
                      {preview ? <img src={preview} alt="Preview" className="preview-img" />
                        : <div className="upload-placeholder"><FaCamera className="camera-icon" /><p>{t("community.clickToUpload")}</p></div>}
                    </div>
                  </div>
                  <input id="file-input" type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageUpload} />
                </div>
                <div className="form-actions">
                  <button type="submit" className="submit-btn" disabled={submitting}>
                    {submitting ? t("community.submitting") : t("community.submitBtn")}
                  </button>
                  <button type="button" className="cancel-btn" onClick={resetForm}>{t("community.cancel")}</button>
                </div>
              </form>
            </div>
          )}
        </section>

        <div className="sticky-filter-bar" id="posts-anchor">
          <div className="search-pill">
            <FaSearch className="search-icon" />
            <input type="text" placeholder={t("community.searchPlaceholder")} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <div className="filter-group">
            <div className="custom-dropdown-wrapper">
              <button className={`dropdown-trigger ${originDropdownOpen ? "active" : ""}`}
                onClick={() => { setOriginDropdownOpen(!originDropdownOpen); setSortDropdownOpen(false); }}>
                <FaFilter className="filter-icon-custom" />
                <span className="dropdown-label">{selectedOrigin === "all" ? t("explore.allOrigins") : selectedOrigin}</span>
                <FaChevronDown className={`chevron ${originDropdownOpen ? "rotate" : ""}`} />
              </button>
              {originDropdownOpen && (
                <div className="dropdown-menu-list">
                  {["All", "Malay", "Chinese", "Iban", "Melanau", "Bidayuh", "Dayak"].map((origin) => (
                    <div key={origin}
                      className={`dropdown-item ${selectedOrigin === (origin === "All" ? "all" : origin) ? "selected" : ""}`}
                      onClick={() => { setSelectedOrigin(origin === "All" ? "all" : origin); setOriginDropdownOpen(false); }}>
                      {origin === "All" ? t("explore.allOrigins") : origin}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="custom-dropdown-wrapper">
              <button className={`dropdown-trigger ${sortDropdownOpen ? "active" : ""}`}
                onClick={() => { setSortDropdownOpen(!sortDropdownOpen); setOriginDropdownOpen(false); }}>
                <span className="dropdown-label">{sortLabel}</span>
                <FaChevronDown className={`chevron ${sortDropdownOpen ? "rotate" : ""}`} />
              </button>
              {sortDropdownOpen && (
                <div className="dropdown-menu-list">
                  <div className={`dropdown-item ${sortOption === "newest" ? "selected" : ""}`} onClick={() => { setSortOption("newest"); setSortDropdownOpen(false); }}>{t("community.newestFirst")}</div>
                  <div className={`dropdown-item ${sortOption === "mostLiked" ? "selected" : ""}`} onClick={() => { setSortOption("mostLiked"); setSortDropdownOpen(false); }}>{t("community.mostLiked")}</div>
                  <div className={`dropdown-item ${sortOption === "mostCommented" ? "selected" : ""}`} onClick={() => { setSortOption("mostCommented"); setSortDropdownOpen(false); }}>{t("community.mostDiscussed")}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        <section className="recent-section">
          {loading ? (
            <div className="loading-state"><div className="spinner"></div><p>{t("community.loadingStories")}</p></div>
          ) : communityFilteredPosts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🍃</div>
              <h3>{t("community.noStories")}</h3>
              <p>{t("community.noStoriesMsg")}</p>
            </div>
          ) : (
            <>
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
                        {/* ✅ UPDATED AVATAR IMPLEMENTATION */}
                        <div className="user-avatar"
                          onClick={(e) => {
                            e.stopPropagation();
                            const currentUID = user?.userProfileID;
                            const postUID = post.userProfile?.id;
                            if (user && String(currentUID) === String(postUID)) navigate("/profile");
                            else if (postUID) navigate(`/profile/${postUID}`);
                          }}
                          style={{ cursor: "pointer" }}
                          title={`View ${post.author}'s profile`}>
                          <img 
                            src={post.authorProfilePic || `https://ui-avatars.com/api/?name=${post.author || "User"}&background=8b5e3c&color=fff&rounded=true`} 
                            alt={post.author || "User"} 
                            loading="lazy"
                            onError={(e) => {
                              e.target.onerror = null; 
                              e.target.src = `https://ui-avatars.com/api/?name=${post.author || "User"}&background=8b5e3c&color=fff&rounded=true`;
                            }}
                            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
                          />
                        </div>
                        <div className="meta-text">
                         <span className="author-name"
                            onClick={(e) => {
                              e.stopPropagation();
                              const currentUID = user?.userProfileID;
                              const postUID = post.userProfile?.id;
                              if (user && String(currentUID) === String(postUID)) navigate("/profile");
                              else if (postUID) navigate(`/profile/${postUID}`);
                            }}
                            style={{ cursor: "pointer" }}>
                            {post.author}
                            {post.equippedBadge && post.equippedBadge !== 'null' && (
                              <span className="user-badge-inline">
                                {getTierById(post.equippedBadge).icon}
                                <span className="badge-tooltip-mini" style={{ color: getTierById(post.equippedBadge).color }}>
                                  {getTierById(post.equippedBadge).title}
                                </span>
                              </span>
                            )}
                          </span>
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

              {totalPages > 1 && (
                <div className="community-pagination">
                  <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} className="community-page-btn nav-btn">← {t("explore.prev")}</button>
                  <div className="page-numbers">
                    {[...Array(totalPages)].map((_, i) => (
                      <button key={i + 1} onClick={() => paginate(i + 1)} className={`community-page-btn page-num ${currentPage === i + 1 ? "active" : ""}`}>{i + 1}</button>
                    ))}
                  </div>
                  <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} className="community-page-btn nav-btn">{t("explore.next")} →</button>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      <Modal open={modal.open} title={modal.title} icon={modal.icon} primaryText={modal.primaryText}
        secondaryText={modal.secondaryText} onClose={closeModal} onPrimary={modal.onPrimary} onSecondary={modal.onSecondary}>
        {modal.message}
      </Modal>
      <Footer />
    </div>
  );
}