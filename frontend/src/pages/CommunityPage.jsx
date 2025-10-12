import React, { useState } from "react";
import "../css/Community.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { FaCamera } from "react-icons/fa"; 
import { useNavigate } from "react-router-dom";


export default function Community() {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
   const [preview, setPreview] = useState(null); // to show uploaded image

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageURL = URL.createObjectURL(file);
      setPreview(imageURL);
    }
  };

  const contributions = [
    {
      id: 1,
      title: "Midin Goreng Kampung",
      author: "Sarah Lintang",
      daysAgo: "2 days ago",
      status: "Approved",
      category: "Bidayuh",
      img: "https://images.unsplash.com/photo-1638569099509-2f46eb4bb94e?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1074",
      desc: "My grandmother taught me this recipe when I was seven. We would go to the jungle to pick fresh midin ferns at dawn...",
      likes: 24,
      comments: 8,
    },
    {
      id: 2,
      title: "Terubok Masin Tradisi",
      author: "Ahmad Selamat",
      daysAgo: "5 days ago",
      status: "Approved",
      category: "Melanau",
      img: "https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=800&q=80",
      desc: "This preserved fish has been our family's specialty for generations. The salt-curing process takes exactly 21 days...",
      likes: 31,
      comments: 12,
    },
    {
      id: 3,
      title: "Bubur Pulut Hitam Nenek",
      author: "Lily Wong",
      daysAgo: "1 day ago",
      status: "Pending Review",
      category: "Chinese-Sarawakian",
      img: "https://images.unsplash.com/photo-1616866885582-ea3be3cf3aaa?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=735",
      desc: "A fusion dessert my grandmother created combining Chinese black glutinous rice with coconut milk and gula melaka...",
      likes: 18,
      comments: 5,
    },
  ];

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

        {/* Collapsed: Just button */}
        {!expanded && (
          <button className="share-btn" onClick={() => setExpanded(true)}>
            Add Your Story
          </button>
        )}

        {/* Expanded: Full form */}
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

        {/* ========== Recent Contributions Section ========== */}
      <section className="recent-section">
        <h2>Recent Contributions</h2>

        <div className="cards-grid">
          {contributions.map((c) => (
            <div className="contribution-card" key={c.id}>
              <div className="card-image">
                <img src={c.img} alt={c.title} />
                <div className="badge-group">
                  
                  <span className="category">{c.category}</span>
                </div>
              </div>

              <div className="card-content">
                <h3>{c.title}</h3>
                <p className="meta">
                  by <b>{c.author}</b> • {c.daysAgo}
                </p>
                <p className="desc">{c.desc}</p>
                <div className="card-footer">
                  <span>❤️ {c.likes} likes</span>
                  <span>💬 {c.comments} comments</span>
                </div>
                <button
                  className="view-btn"
                 onClick={() => navigate(`/community/${c.id}`)}
                >
                  View More
                </button>

              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
