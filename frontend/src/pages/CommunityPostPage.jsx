import { useParams, useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import "../css/Community.css";
import Header from "../components/Header";
import Footer from "../components/Footer";

// Move CommentSection outside the main component
const CommentSection = ({ postId, user, comments, onCommentAdded }) => { // ✅ Add props
  const [comment, setComment] = useState(''); // ✅ Uncomment this line
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);

  useEffect(() => {
    if (postId) {
      fetchComments();
    }
  }, [postId]);

  const fetchComments = async () => {
    try {
      setFetchLoading(true);
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      
      console.log('Fetching comments for post:', postId);
      const response = await fetch(`${API_BASE_URL}/api/communityPost/comments/${postId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Parsed API response:', result);
      
      if (result.success) {
        console.log('Fetched comments:', result.comments);
      } else {
        throw new Error(result.message || 'Failed to fetch comments');
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      alert('Failed to load comments: ' + error.message);
    } finally {
      setFetchLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!comment.trim()) return;
    if (!user) {
      alert('Please log in to comment');
      return;
    }

    setLoading(true);
    
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      
      const response = await fetch(`${API_BASE_URL}/api/communityPost/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: comment,
          postId: postId,
          userProfileID: user.userProfileID 
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Post comment response:', result);

      if (result.success) {
        // ✅ Use the parent's callback to add the new comment
        if (onCommentAdded) {
          onCommentAdded(result.comment);
        }
        setComment('');
      } else {
        throw new Error(result.message || 'Failed to post comment');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      alert('Failed to post comment: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="comment-section">
      <form className="comment-form" onSubmit={handleSubmit}>
        <textarea
          placeholder="Add a comment..."
          rows="3"
          className="comment-input"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          disabled={loading || !user}
        />
        <button 
          type="submit" 
          className="comment-btn"
          disabled={loading || !comment.trim() || !user}
        >
          {loading ? 'Posting...' : 'Post Comment'}
        </button>
        {!user && (
          <p style={{ color: '#666', fontSize: '14px', marginTop: '10px' }}>
            Please log in to comment
          </p>
        )}
      </form>

      <div className="comments-list">
        {fetchLoading ? (
          <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
            Loading comments...
          </p>
        ) : (
          <>
            {/* ✅ Use the comments passed from parent */}
            {comments.map((comment) => (
              <div key={`comment-${comment.id}-${comment.userProfileID}-${comment.created_at}`} className="comment-item">
                <div className="comment-header">
                  <span className="comment-author">{comment.author}</span>
                  <span className="comment-date">
                    {comment.daysAgo}
                  </span>
                </div>
                <div className="comment-content">
                  {comment.text}
                </div>
              </div>
            ))}
            {comments.length === 0 && (
              <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                No comments yet. Be the first to comment!
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default function CommunityPost() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentImg, setCurrentImg] = useState(0);
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth(null); 

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      console.log('📡 Fetching post from:', `${API_BASE_URL}/api/communityPost/${id}`);
      
      const response = await fetch(`${API_BASE_URL}/api/communityPost/${id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('📨 Post API Response:', result);
      
      if (result.success) {
        setPost(result.data);
        setComments(result.data.comments || []);
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

  // And make sure onCommentAdded works correctly:
  const handleNewComment = (newComment) => {
    setComments(prev => {
      // ✅ Prevent duplicates by checking if comment already exists
      const exists = prev.some(comment => comment.id === newComment.id);
      if (exists) {
        console.log('⚠️ Comment already exists, skipping duplicate');
        return prev;
      }
      return [...prev, newComment];
    });
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
              alt={post.foodName || post.title}
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

          {/* POST CONTENT */}
          <div className="post-info">
            <h1>{post.foodName || post.title}</h1>
            <p className="meta">
              by <b>{post.author}</b> • {post.daysAgo} •{" "}
              <span className="category-badge">{post.culturalOrigin || post.category}</span>
            </p>
            
            <div className="story-section">
              <h3>Cultural Story</h3>
              <p className="desc">{post.culturalStory || post.desc}</p>
            </div>

            {/* RECIPE SECTION - Only show if recipe exists */}
            {post.recipe && post.recipe.trim() !== "" && (
              <div className="recipe-box">
                <h3>Recipe</h3>
                <div className="recipe-content">
                  {post.recipe.split('\n').map((line, index) => (
                    <p key={index} className="recipe-line">
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <button onClick={() => navigate("/community")} className="back-btn">
              ← Back to Community
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN (COMMENTS + LIKES) */}
        <div className="post-right">
          {/* Likes count at top */}
          <div className="likes-bar">
            ❤️ <span>{post.likeCount || post.likes || 0}</span> likes
          </div>

          <h3>Comments ({post.commentCount || post.comments?.length || 0})</h3>

         {/* Use the CommentSection component */}
          <CommentSection 
            postId={post.id} 
            user={user}
            comments={comments}
            onCommentAdded={handleNewComment} 
          />
        </div>
      </div>

      <Footer />
    </div>
  );
}