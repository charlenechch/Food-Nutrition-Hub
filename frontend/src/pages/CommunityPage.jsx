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
  const [formData, setFormData] = useState({
    foodName: '',
    culturalOrigin: '',
    culturalStory: '',
    recipe: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000"; 
      console.log('📡 Fetching posts from:', `${API_BASE_URL}/api/communityPost/counts`);
      
      const response = await fetch(`${API_BASE_URL}/api/communityPost/counts`); 
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('📨 API Response:', result);
      
      if (result.success) {
        console.log('✅ Posts fetched successfully:', result.data.length, 'posts');
        setPosts(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch posts');
      }
    } catch (err) {
      console.error('❌ Error fetching posts:', err);
      setError(err.message || 'Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log(`📝 Form field changed: ${name} = ${value}`);
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    console.log('🖼️ File selected:', file);
    
    if (file) {
      const imageURL = URL.createObjectURL(file);
      setPreview(imageURL);
      setSelectedFile(file);
      console.log('✅ Preview created for file:', file.name);
    }
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  
  console.log('🚀 Starting form submission...');
  console.log('📋 Form data:', formData);
  console.log('📁 Selected file:', selectedFile);
  
  // Validation - recipe is optional, so only check required fields
  if (!formData.foodName || !formData.culturalOrigin || !formData.culturalStory) {
    console.warn('⚠️ Form validation failed: Missing required fields');
    alert('Please fill in Food Name, Cultural Origin, and Cultural Story');
    return;
  }

  try {
    setSubmitting(true);
    
    const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
    console.log('📡 Submitting to:', `${API_BASE_URL}/api/communityPost/create`);
    
    const submitData = new FormData();
    
    // Append form data
    submitData.append('foodName', formData.foodName);
    submitData.append('culturalOrigin', formData.culturalOrigin);
    submitData.append('culturalStory', formData.culturalStory);
    submitData.append('recipe', formData.recipe || ''); // Ensure recipe is always sent, even if empty
    
    // Append image file if selected
    if (selectedFile) {
      submitData.append('images', selectedFile);
      console.log('📸 Image attached:', selectedFile.name, selectedFile.size, 'bytes');
    } else {
      console.log('📸 No image attached');
    }

    const response = await fetch(`${API_BASE_URL}/api/communityPost/create`, {
      method: 'POST',
      body: submitData,
    });

    console.log('📨 Response status:', response.status);
    
    // Try to parse the response, even if it's an error
    let result;
    try {
      result = await response.json();
      console.log('📨 API Response:', result);
    } catch (parseError) {
      console.error('❌ Failed to parse response:', parseError);
      throw new Error(`Server returned invalid JSON. Status: ${response.status}`);
    }

    if (response.ok && result.success) {
      console.log('✅ Post submitted successfully!');
      console.log('📝 Server message:', result.message);
      
      // Reset form
      setFormData({
        foodName: '',
        culturalOrigin: '',
        culturalStory: '',
        recipe: ''
      });
      setPreview(null);
      setSelectedFile(null);
      setExpanded(false);
      
      // Show success message
      alert('✅ ' + (result.message || 'Your story has been submitted successfully!'));
      
      // Refresh posts list
      console.log('🔄 Refreshing posts list...');
      fetchPosts();
    } else {
      // Handle server errors with more details
      const errorMessage = result.message || result.error || `Server error: ${response.status}`;
      console.error('❌ API returned error:', errorMessage);
      console.error('❌ Full error details:', result);
      throw new Error(errorMessage);
    }
  } catch (err) {
    console.error('❌ Error submitting post:', err);
    
    // More specific error messages
    if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
      alert('❌ Network error: Cannot connect to server. Please check if the server is running.');
    } else if (err.message.includes('500')) {
      alert('❌ Server error (500): The server encountered an internal error. Check backend logs for details.');
    } else {
      alert(`❌ Submission failed: ${err.message}`);
    }
  } finally {
    setSubmitting(false);
    console.log('Form submission process completed');
  }
};

  const resetForm = () => {
    console.log('🔄 Resetting form...');
    setFormData({
      foodName: '',
      culturalOrigin: '',
      culturalStory: '',
      recipe: ''
    });
    setPreview(null);
    setSelectedFile(null);
    setExpanded(false);
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
          <form className="heritage-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Food Name *</label>
                <input
                  type="text"
                  name="foodName"
                  value={formData.foodName}
                  onChange={handleInputChange}
                  placeholder="e.g., Ayam Pansuh, Terubok Masin..."
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
                  <option value="">Select Cultural Origin</option>
                  <option value="Malay">Malay</option>
                  <option value="Chinese">Chinese</option>
                  <option value="Iban">Iban</option>
                  <option value="Melanau">Melanau</option>
                  <option value="Kadazan">Kadazan</option>
                  <option value="Bidayuh">Bidayuh</option>
                  <option value="Dayak">Dayak</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Cultural Story *</label>
              <textarea 
                name="culturalStory"
                value={formData.culturalStory}
                onChange={handleInputChange}
                placeholder="Share the cultural significance, preparation methods, or family traditions..."
                required
              />
            </div>

            <div className="form-group">
              <label>Recipe (Optional)</label>
              <textarea 
                name="recipe"
                value={formData.recipe}
                onChange={handleInputChange}
                placeholder="Share ingredients and cooking steps..."
              />
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
              <button 
                type="submit" 
                className="submit-btn"
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Contribution'}
              </button>
              <button
                type="button"
                className="cancel-btn"
                onClick={resetForm}
                disabled={submitting}
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

        {loading ? (
          <div className="loading">Loading posts...</div>
        ) : posts.length === 0 ? (
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