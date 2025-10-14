import React, { useEffect, useState } from "react";
import "../css/Community.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { FaCamera } from "react-icons/fa"; 
import { useNavigate } from "react-router-dom";

export default function Community() {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const [preview, setPreview] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // useEffect(() => {
  //   fetchPosts();
  // }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000"; 
      const response = await fetch(`${API_BASE_URL}/api/communityPost/counts`); 
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setPosts(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch posts');
      }
    } catch (err) {
      setError(err.message || 'Error connecting to server');
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageURL = URL.createObjectURL(file);
      setPreview(imageURL);
    }
  };

  if (error) {
    return (
      <div className="community-page">
        <Header />
        <div className="error">Error: {error}</div>
        <button onClick={fetchPosts} className="retry-btn">
          Try Again
        </button>
        <Footer />
      </div>
    );
  }

  return (
    <div className="community-page">
      <Header />
      <h1 className="page-title">Community Contributions</h1>
      <p className="page-subtitle">
        Celebrate Sarawak's rich heritage by sharing your recipes and stories
      </p>

      {/* Expandable Share Card */}
      <section className={`share-card ${expanded ? "expanded" : ""}`}>
        <h3>Share Your Heritage</h3>
        <p>Upload recipes, photos, and stories to preserve our culture</p>

        {!expanded && (
          <button className="share-btn" onClick={() => setExpanded(true)}>
            Add Your Story
          </button>
        )}

        {expanded && (
          <form className="heritage-form">
            <div className="form-row">
              <div className="form-group">
                <label>Food Name</label>
                <input
                  type="text"
                  placeholder="e.g., Ayam Pansuh, Terubok Masin..."
                />
              </div>
              <div className="form-group">
                <label>Cultural Origin</label>
                <input
                  type="text"
                  placeholder="e.g., Iban, Bidayuh, Melanau..."
                />
              </div>
            </div>

            <div className="form-group">
              <label>Cultural Story</label>
              <textarea placeholder="Share the cultural significance, preparation methods, or family traditions..." />
            </div>

            <div className="form-group">
              <label>Recipe (Optional)</label>
              <textarea placeholder="Share ingredients and cooking steps..." />
            </div>

            <div className="form-group">
              <label>Upload Photo</label>
              <div className="upload-box" onClick={() => document.getElementById("file-input").click()}>
                {preview ? (
                  <img src={preview} alt="Preview" className="preview-img" />
                ) : (
                  <>
                    <FaCamera className="camera-icon" />
                    <p>Upload Photo</p>
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
              <button type="submit" className="submit-btn">
                Submit Contribution
              </button>
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setExpanded(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Recent Contributions Section */}
      <section className="recent-section">
        <h2>Recent Contributions ({posts.length})</h2>

        {posts.length === 0 ? (
          <div className="no-posts">
            <p>No contributions yet. Be the first to share!</p>
            <button className="share-btn" onClick={() => setExpanded(true)}>
              Share Your First Story
            </button>
          </div>
        ) : (
          <div className="cards-grid">
            {posts.map((post) => (
              <div className="contribution-card" key={post.id}>
                <div className="card-image">
                  <img 
                    src={post.images && post.images.length > 0 ? post.images[0] : "https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=800&q=80"} 
                    alt={post.title} 
                  />
                  <div className="badge-group">
                    <span className="category">{post.category || "Uncategorized"}</span>
                  </div>
                </div>

                <div className="card-content">
                  <h3>{post.title}</h3>
                  <p className="meta">
                    by <b>{post.author}</b> • {post.daysAgo}
                  </p>
                  <p className="desc">{post.desc}</p>
                  <div className="card-footer">
                    <span>❤️ {post.likeCount} likes</span>
                    <span>💬 {post.commentCount} comments</span>
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