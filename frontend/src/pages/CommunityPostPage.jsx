import { useParams, useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import "../css/Community.css";
import Header from "../components/Header";
import Footer from "../components/Footer";

// ✅ Comment Section Component
const CommentSection = ({ postId, user, comments, onCommentAdded }) => {
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    if (!user) {
      alert("Please log in to comment.");
      return;
    }

    try {
      setLoading(true);
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

      const response = await fetch(`${API_BASE_URL}/api/communityPost/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          content: comment,
          postId,
          userProfileID: user?.userProfileID, // ✅ Only send userProfileID (correct)
        }),
      });

      const result = await response.json();
      if (response.ok && result.success) {
        onCommentAdded(result.comment);
        setComment("");
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("Error posting comment:", error);
      alert("Failed to post comment: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="comment-section">
      <form className="comment-form" onSubmit={handleSubmit} noValidate>
        <textarea
          placeholder={user ? "Add a comment..." : "Please log in to comment"}
          rows="3"
          className="comment-input"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          disabled={!user || loading}
        />
        <button className="comment-btn" type="submit" disabled={!user || !comment.trim() || loading}>
          {loading ? "Posting..." : "Post Comment"}
        </button>
      </form>

      <div className="comments-list">
        {comments.length === 0 ? (
          <p style={{ textAlign: "center", color: "#666", padding: "20px" }}>
            No comments yet.
          </p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="comment-item">
              <div className="comment-header">
                <span className="comment-author">{c.author}</span>
                <span className="comment-date">{c.daysAgo}</span>
              </div>
              <div className="comment-content">{c.text}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ✅ Main Post Page Component
export default function CommunityPost() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [currentImg, setCurrentImg] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const response = await fetch(`${API_BASE_URL}/api/communityPost/${id}`);
      const result = await response.json();

      if (response.ok && result.success) {
        setPost(result.data);
        setComments(result.data.comments || []);
      } else {
        throw new Error(result.message || "Failed to load post");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNewComment = (newComment) => {
    setComments((prev) => {
      if (prev.some((c) => c.id === newComment.id)) return prev;
      return [...prev, newComment];
    });
  };

  if (loading) {
    return (
      <div className="community-page">
        <Header />
        <div className="loading">Loading...</div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="community-page">
        <Header />
        <div className="error">
          <h2>Error loading post</h2>
          <p>{error}</p>
          <button onClick={fetchPost}>Try Again</button>
        </div>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="community-page">
        <Header />
        <div className="not-found">
          <h2>Post not found</h2>
          <button onClick={() => navigate("/community")}>Back to Community</button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="community-page">
      <Header />
      <div className="post-layout">
        <div className="post-left">
          <div className="image-carousel">
            <img
              src={
                post.images?.length
                  ? post.images[currentImg]
                  : "https://images.unsplash.com/photo-1551218808-94e220e084d2"
              }
              alt={post.foodName}
              className="post-img-small"
            />
            {post.images?.length > 1 && (
              <>
                <button className="arrow left" onClick={() => setCurrentImg((prev) => (prev === 0 ? post.images.length - 1 : prev - 1))}>
                  ◀
                </button>
                <button className="arrow right" onClick={() => setCurrentImg((prev) => (prev === post.images.length - 1 ? 0 : prev + 1))}>
                  ▶
                </button>
              </>
            )}
          </div>

          <div className="post-info">
            <h1>{post.foodName}</h1>
            <p className="meta">
              by <b>{post.author}</b> • {post.daysAgo} • <span>{post.culturalOrigin}</span>
            </p>
            <div className="story-section">
              <h3>Cultural Story</h3>
              <p>{post.culturalStory}</p>
            </div>
            {post.recipe && (
              <div className="recipe-box">
                <h3>Recipe</h3>
                {post.recipe.split("\n").map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            )}
            <button className="back-btn" onClick={() => navigate("/community")}>
              ← Back
            </button>
          </div>
        </div>

        <div className="post-right">
          <div className="likes-bar">❤️ {post.likeCount || 0} likes</div>
          <h3>Comments ({comments.length})</h3>
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
