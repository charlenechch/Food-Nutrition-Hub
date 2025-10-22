import { useParams, useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import "../css/Community.css";
import Header from "../components/Header";
import Footer from "../components/Footer";

// ✅ CommentSection Component
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
        headers: { "Content-Type": "application/json" },
        credentials: "include", // ✅ To ensure session cookies are sent
        body: JSON.stringify({
          content: comment,
          postId: postId,
          userProfileID: user.userProfileID, // ✅ Must exist from backend session
        }),
      });

      const result = await response.json();
      if (result.success) {
        onCommentAdded(result.comment); // ✅ Add new comment to parent
        setComment("");
      } else {
        alert(result.message || "Failed to add comment");
      }
    } catch (err) {
      console.error("Post comment failed:", err);
      alert("Error posting comment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="comment-section">
      <form className="comment-form" onSubmit={handleSubmit}>
        <textarea
          className="comment-input"
          placeholder={user ? "Add a comment..." : "Login to comment"}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          disabled={!user || loading}
        />
        <button
          type="submit"
          className="comment-btn"
          disabled={!user || !comment.trim() || loading}
        >
          {loading ? "Posting..." : "Post Comment"}
        </button>

        {!user && (
          <p style={{ color: "#666", fontSize: "14px", marginTop: "10px" }}>
            Please log in to comment.
          </p>
        )}
      </form>

      <div className="comments-list">
        {comments.length === 0 ? (
          <p style={{ textAlign: "center", color: "#666", padding: "10px" }}>
            No comments yet. Be the first!
          </p>
        ) : (
          comments.map((cmt) => (
            <div key={cmt.id} className="comment-item">
              <div className="comment-header">
                <span className="comment-author">{cmt.author}</span>
                <span className="comment-date">{cmt.daysAgo}</span>
              </div>
              <div className="comment-content">{cmt.text}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ✅ Main CommunityPost Component
export default function CommunityPost() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth(); // ✅ Correct usage (no null inside)
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [currentImg, setCurrentImg] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    setLoading(true);
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const res = await fetch(`${API_BASE_URL}/api/communityPost/${id}`);
      const result = await res.json();

      if (res.ok && result.success) {
        setPost(result.data);
        setComments(result.data.comments || []);
      } else {
        throw new Error(result.message || "Failed to fetch post");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNewComment = (newComment) => {
    setComments((prev) => {
      const exists = prev.some((c) => c.id === newComment.id);
      if (exists) return prev;
      return [...prev, newComment];
    });
  };

  if (loading) {
    return (
      <div className="community-page">
        <Header />
        <div className="loading">Loading post...</div>
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
        <div className="not-found">Post not found 😢</div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="community-page">
      <Header />
      <div className="post-layout">
        {/* LEFT SIDE - Images & Post Content */}
        <div className="post-left">
          <div className="image-carousel">
            <img
              src={
                post.images?.length
                  ? post.images[currentImg]
                  : "https://images.unsplash.com/photo-1551218808-94e220e084d2"
              }
              alt={post.title}
              className="post-img-small"
            />
          </div>

          <div className="post-info">
            <h1>{post.foodName || post.title}</h1>
            <p className="meta">
              by <b>{post.author}</b> • {post.daysAgo} •{" "}
              <span className="category-badge">{post.culturalOrigin}</span>
            </p>

            <div className="story-section">
              <h3>Cultural Story</h3>
              <p>{post.culturalStory || post.desc}</p>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE - Likes and Comments */}
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
