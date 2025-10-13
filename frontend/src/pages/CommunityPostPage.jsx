import { useParams, useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import "../css/Community.css";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function CommunityPost() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentImg, setCurrentImg] = useState(0);
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const response = await fetch(`${API_BASE_URL}/api/communityPost/${id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setPost(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch post');
      }
    } catch (err) {
      setError(err.message || 'Error connecting to server');
      console.error('Error fetching post:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to safely render recipe content
  const renderRecipeContent = (content, type = 'ingredients') => {
    if (!content) return '';
    
    console.log(`Rendering ${type}:`, content); // Debug log
    
    if (typeof content === 'string') {
      // Common prefixes to remove
      const prefixes = ['Ingredients:', 'Instructions:'];
      
      let processedContent = content;
      
      // Remove any known prefixes
      prefixes.forEach(prefix => {
        const regex = new RegExp(`^${prefix}\\s*`, 'i');
        if (regex.test(processedContent)) {
          processedContent = processedContent.replace(regex, '').trim();
        }
      });
      
      // Split by newlines and clean up
      const lines = processedContent
        .split('\n')
        .map(line => line.trim())
        .filter(line => line !== '');
      
      console.log(`Processed lines for ${type}:`, lines); // Debug log
      
      // Display as list if multiple lines
      if (lines.length > 1) {
        // For INGREDIENTS: use ul/li with bullets
        if (type === 'ingredients') {
          return (
            <ul className="ingredients-list">
              {lines.map((line, index) => (
                <li key={index}>{line}</li>
              ))}
            </ul>
          );
        }
        
        // For INSTRUCTIONS/STEPS: use div without bullets
        if (type === 'instructions' || type === 'steps') {
          return (
            <div className="instructions-list">
              {lines.map((line, index) => (
                <div key={index} className="instruction-item">
                  {line}
                </div>
              ))}
            </div>
          );
        }
      }
      
      // Single line content
      return (
        <div className="single-line-content">
          {processedContent}
        </div>
      );
    }
    
    // Handle objects and arrays
    if (typeof content === 'object') {
      try {
        if (Array.isArray(content)) {
          // For INGREDIENTS arrays: use ul/li with bullets
          if (type === 'ingredients') {
            return (
              <ul className="ingredients-list">
                {content.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            );
          }
          
          // For INSTRUCTIONS/STEPS arrays: use div without bullets
          if (type === 'instructions' || type === 'steps') {
            return (
              <div className="instructions-list">
                {content.map((item, index) => (
                  <div key={index} className="instruction-item">
                    {item}
                  </div>
                ))}
              </div>
            );
          }
        }
        // If it's a recipe object with nested properties
        if (content.ingredients || content.steps) {
          return (
            <div className="nested-recipe">
              {content.ingredients && (
                <div className="nested-ingredients">
                  <h5>Ingredients:</h5>
                  {renderRecipeContent(content.ingredients, 'ingredients')}
                </div>
              )}
              {content.steps && (
                <div className="nested-instructions">
                  <h5>Instructions:</h5>
                  {renderRecipeContent(content.steps, 'steps')}
                </div>
              )}
            </div>
          );
        }
        return JSON.stringify(content, null, 2);
      } catch (e) {
        return String(content);
      }
    }
    
    return String(content);
  };

  const nextImg = () => {
    if (post && post.images) {
      setCurrentImg((prev) =>
        prev === post.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImg = () => {
    if (post && post.images) {
      setCurrentImg((prev) =>
        prev === 0 ? post.images.length - 1 : prev - 1
      );
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="community-page">
        <Header />
        <div className="loading">Loading post...</div>
        <Footer />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="community-page">
        <Header />
        <div className="error">
          <h2>Error loading post</h2>
          <p>{error}</p>
          <div className="button-group">
            <button onClick={fetchPost} className="retry-btn">
              Try Again
            </button>
            <button onClick={() => navigate("/community")} className="back-btn">
              Back to Community
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Post not found state
  if (!post) {
    return (
      <div className="community-page">
        <Header />
        <div className="not-found">
          <h2>Post not found 😢</h2>
          <button onClick={() => navigate("/community")} className="back-btn">
            Back to Community
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="community-page">
      <Header />

      <div className="post-layout">
        {/* LEFT COLUMN */}
        <div className="post-left">
          {/* IMAGE CAROUSEL */}
          <div className="image-carousel">
            <img
              src={post.images && post.images.length > 0 ? post.images[currentImg] : "https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=800&q=80"}
              alt={post.title}
              className="post-img-small"
            />

            {/* Arrows (only show if >1 image) */}
            {post.images && post.images.length > 1 && (
              <>
                <button className="arrow left" onClick={prevImg} aria-label="Previous photo">
                  <svg viewBox="0 0 24 24" className="chev">
                    <path d="M15 6L9 12l6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>

                <button className="arrow right" onClick={nextImg} aria-label="Next photo">
                  <svg viewBox="0 0 24 24" className="chev">
                    <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>

                {/* Dots */}
                <div className="dots">
                  {post.images.map((_, idx) => (
                    <span
                      key={idx}
                      className={`dot ${idx === currentImg ? "active" : ""}`}
                      onClick={() => setCurrentImg(idx)}
                    ></span>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* TEXT INFO */}
          <div className="post-info">
            <h1>{post.title}</h1>
            <p className="meta">
              by <b>{post.author}</b> • {post.daysAgo} •{" "}
              <span className="category-badge">{post.category}</span>
            </p>
            <p className="desc">{post.desc}</p>

            {/* Recipe Section - Only show if recipe exists */}
            {(post.recipe || (post.ingredients && post.steps)) && (
              <div className="recipe-box">
                <h3>Recipe</h3>
                <div className="recipe-content">
                  {/* Handle post.recipe object */}
                  {post.recipe && post.recipe.ingredients && (
                    <div className="ingredients">
                      <h4>Ingredients:</h4>
                      <div className="ingredients-content">
                        {renderRecipeContent(post.recipe.ingredients, 'ingredients')}
                      </div>
                    </div>
                  )}
                  {post.recipe && post.recipe.steps && (
                    <div className="instructions">
                      <h4>Instructions:</h4>
                      <div className="instruction-content">
                        {renderRecipeContent(post.recipe.steps, 'steps')}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <button onClick={() => navigate("/community")} className="back-btn">
            ← Back to Community
          </button>
        </div>

        {/* RIGHT COLUMN (COMMENTS + LIKES) */}
        <div className="post-right">
          {/* Likes count at top */}
          <div className="likes-bar">
            ❤️ <span>{post.likeCount || post.likes || 0}</span> likes
          </div>

          <h3>Comments ({post.commentCount || post.comments?.length || 0})</h3>

          <div className="comments-section">
            {post.comments && post.comments.length > 0 ? (
              post.comments.map((comment, index) => (
                <div key={comment.id || index} className="comment">
                  <b>{comment.author || comment.user}</b>
                  <p>{comment.text || comment.commentText}</p>
                  {comment.daysAgo && (
                    <small className="comment-time">{comment.daysAgo}</small>
                  )}
                </div>
              ))
            ) : (
              <p className="no-comments">No comments yet. Be the first to comment!</p>
            )}
          </div>

          <form className="comment-form">
            <textarea
              placeholder="Add a comment..."
              rows="3"
              className="comment-input"
            />
            <button type="submit" className="comment-btn">
              Post Comment
            </button>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
}