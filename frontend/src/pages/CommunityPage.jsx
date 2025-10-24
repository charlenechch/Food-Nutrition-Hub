import React, { useEffect, useState } from "react";
import "../css/Community.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { FaCamera } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoginPromptModal from "../components/LoginPromptModal"; // ✅ Import Modal

export default function Community() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAuthenticated = user && user.role !== "guest";

  const [expanded, setExpanded] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false); // ✅ Modal State
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

  // ✅ Replace confirm() with LoginPromptModal
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
      alert("Food Name, Cultural Origin and Cultural Story are required.");
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

      // ✅ TEMP FIX FOR DEMO — Replace with userProfileID later
      submitData.append("userProfileID", 1);

      submitData.append("author", user?.firstname || user?.email);

      if (selectedFile) {
        submitData.append("images", selectedFile);
      }

      const response = await fetch(`${API_BASE_URL}/api/communityPost/create`, {
        method: "POST",
        body: submitData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to submit post");
      }

      alert("✅ Your story has been submitted!");

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
    } catch (err) {
      alert("❌ " + err.message);
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

  const getFirstSentence = (story, maxWords = 20) => {
    if (!story) return '';
    const words = story.split(' ');
    if (words.length <= maxWords) return story;
    return words.slice(0, maxWords).join(' ') + '...';
  };

  return (
    <div className="community-page">
      <Header />

      {/* ✅ Login Modal Trigger for Guests */}
      {showLoginModal && (
        <LoginPromptModal
          message="You must be logged in to share your cultural story."
          onClose={() => setShowLoginModal(false)}
          onConfirm={() => navigate("/loginregister")}
        />
      )}

      <h1 className="page-title">Community Contributions</h1>
      <p className="page-subtitle">
        Celebrate Sarawak's rich heritage by sharing your recipes and stories
      </p>

      {/* ✅ POST CREATION SECTION */}
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
              <label>Upload Photo</label>
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

      {/* ✅ RECENT POSTS SECTION */}
      <section className="recent-section">
        <h2>Recent Contributions ({posts.length})</h2>
        {loading ? (
          <div className="loading">Loading posts...</div>
        ) : posts.length === 0 ? (
          <div className="no-posts">
            <p>No contributions yet. Be the first!</p>
          </div>
        ) : (
          <div className="cards-grid">
            {posts.map((post) => (
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
                    {getFirstSentence(post.culturalStory)}
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
      </section>

      <Footer />
    </div>
  );
}
