// ✅ src/pages/FoodDiscussionPage.jsx (Fixed logic; UI preserved)
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../css/FoodDiscussionPage.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

import { useAuth } from "../context/AuthContext";
import LoginPromptModal from "../components/LoginPromptModal";

// Helper: time ago
function getTimeAgo(timestamp) {
  const now = new Date();
  const commentTime = new Date(timestamp);
  const diffInSeconds = Math.floor((now - commentTime) / 1000);
  if (diffInSeconds < 60) return "now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
}

// Single Comment
const Comment = React.memo(function Comment({
  item,
  isReply = false,
  likedIds,
  onToggleLike,
  replyToId,
  setReplyToId,
  replyTexts,
  setReplyTexts,
  onPostReply,
  isGuest,
  setShowLoginPrompt,
}) {
  const itemId = isReply ? (item.replyID || item.id) : (item.id || item.discussionID);
  const username = item.username || "Loading...";
  const content = item.content || item.reply || "No content";
  const timestamp = item.timestamp || item.createdAt;
  const likes = isReply ? 0 : item.likes || item.upVotes || 0;

  const getAvatar = (name) => (name ? name.substring(0, 2).toUpperCase() : "UU");

  const handleLike = () => {
    if (isGuest) return setShowLoginPrompt(true);
    onToggleLike(itemId);
  };

  const toggleReplyBox = () => {
    if (isGuest) return setShowLoginPrompt(true);
    setReplyToId(replyToId === itemId ? null : itemId);
  };

  const handleReplyChange = (e) => {
    if (isGuest) return setShowLoginPrompt(true);
    setReplyTexts((prev) => ({ ...prev, [itemId]: e.target.value }));
  };

  const handleReplyPost = () => {
    if (isGuest) return setShowLoginPrompt(true);
    onPostReply(itemId);
  };

  const handleCancel = () => {
    setReplyToId(null);
    setReplyTexts((prev) => ({ ...prev, [itemId]: "" }));
  };

  return (
    <div className={`fd-disc-comment ${isReply ? "fd-disc-reply" : ""}`}>
      <div className="fd-disc-avatar">{getAvatar(username)}</div>
      <div className="fd-disc-body">
        <div className="fd-disc-meta">
          <span className="fd-disc-user">{username}</span>
          <span className="fd-disc-time">• {getTimeAgo(timestamp)}</span>
        </div>
        <p className="fd-disc-text">{content}</p>

        {!isReply && (
          <div className="fd-disc-actions">
            <button className="fd-link-btn" onClick={handleLike}>
              {likedIds.has(itemId) ? "♥" : "♡"} {likes}
            </button>
            <button className="fd-link-btn" onClick={toggleReplyBox}>
              ↩ Reply
            </button>
          </div>
        )}

        {!isReply && replyToId === itemId && (
          <div className="fd-reply-box">
            <textarea
              className="fd-input"
              placeholder="Write your reply..."
              value={replyTexts[itemId] ?? ""}
              onChange={handleReplyChange}
              rows="2"
              onClick={() => isGuest && setShowLoginPrompt(true)}
            />
            <div className="fd-reply-actions">
              <button
                className="lrp-btn lrp-btn-primary"
                onClick={handleReplyPost}
                disabled={!replyTexts[itemId]?.trim()}
              >
                Send Reply
              </button>
              <button className="lrp-btn lrp-btn-outline" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {!!item.replies?.length && (
          <div className="fd-disc-replies">
            {item.replies.map((r, index) => (
              <Comment
                key={r.replyID || index}
                item={r}
                isReply={true}
                likedIds={likedIds}
                onToggleLike={onToggleLike}
                replyToId={replyToId}
                setReplyToId={setReplyToId}
                replyTexts={replyTexts}
                setReplyTexts={setReplyTexts}
                onPostReply={onPostReply}
                isGuest={isGuest}
                setShowLoginPrompt={setShowLoginPrompt}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

export default function FoodDiscussionPage() {
  const { foodId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const isGuest = !user || user.role === "guest";
  const userProfileID = user?.profileID || null;

  const [food, setFood] = useState(location.state?.food || null);
  const [comments, setComments] = useState([]);
  const [likedIds, setLikedIds] = useState(new Set());
  const [newComment, setNewComment] = useState("");
  const [replyToId, setReplyToId] = useState(null);
  const [replyTexts, setReplyTexts] = useState({});
  const [loading, setLoading] = useState(true);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // Fetch food details if not provided by router state
  useEffect(() => {
    if (!food && foodId) fetchFoodDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [food, foodId]);

  const fetchFoodDetails = async () => {
    try {
      const res = await fetch(`${API}/api/foodDetail/${foodId}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) setFood(data.data);
    } catch (err) {
      console.error("Error fetching food details:", err);
    }
  };

  // Fetch comments for this food
  useEffect(() => {
    fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [foodId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/foodDiscussion/food/${foodId}`, {
        credentials: "include",
      });
      const result = await res.json();
      if (result.success && Array.isArray(result.data)) {
        setComments(result.data);
      } else {
        setComments([]);
      }
    } catch (err) {
      console.error("Error fetching comments:", err);
    } finally {
      setLoading(false);
    }
  };

  // Post a new comment
  const postComment = async () => {
    if (isGuest) return setShowLoginPrompt(true);
    if (!newComment.trim()) return;
    if (!userProfileID) {
      alert("Your profile is missing. Please re-login.");
      return;
    }

    try {
      const res = await fetch(`${API}/api/foodDiscussion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          foodID: foodId,
          userProfileID,
          content: newComment.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        console.error("Post comment failed:", data);
        alert(data?.message || "Failed to post comment");
        return;
      }
      // Prepend new comment
      setComments((prev) => [data.data, ...prev]);
      setNewComment("");
    } catch (err) {
      console.error("Error posting comment:", err);
      alert("Server error while posting comment.");
    }
  };

  // Post a reply
  const postReply = async (discussionId) => {
    if (isGuest) return setShowLoginPrompt(true);
    const text = replyTexts[discussionId]?.trim();
    if (!text) return;
    if (!userProfileID) {
      alert("Your profile is missing. Please re-login.");
      return;
    }

    try {
      const res = await fetch(`${API}/api/foodDiscussion/${discussionId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userProfileID,
          reply: text,
        }),
      });
      const result = await res.json();
      if (!res.ok || !result?.success) {
        console.error("Post reply failed:", result);
        alert(result?.message || "Failed to post reply");
        return;
      }

      setComments((prev) =>
        prev.map((comment) =>
          (comment.id === discussionId || comment.discussionID === discussionId)
            ? { ...comment, replies: [...(comment.replies || []), result.data] }
            : comment
        )
      );
      setReplyTexts((prev) => ({ ...prev, [discussionId]: "" }));
      setReplyToId(null);
    } catch (err) {
      console.error("Error posting reply:", err);
      alert("Server error while posting reply.");
    }
  };

  // Toggle like on a comment
  const toggleLike = async (targetId) => {
    if (isGuest) return setShowLoginPrompt(true);
    try {
      const res = await fetch(`${API}/api/foodDiscussion/${targetId}/vote`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ type: "up", userProfileID }),
      });
      const data = await res.json();
      if (res.ok && data?.success) {
        setComments((prev) =>
          prev.map((c) =>
            (c.id === targetId || c.discussionID === targetId)
              ? { ...c, likes: data.data?.likes ?? ((c.likes || 0) + 1) }
              : c
          )
        );
        setLikedIds((prev) => new Set(prev).add(targetId));
      }
    } catch (err) {
      console.error("Error updating like:", err);
    }
  };

  if (loading) {
    return (
      <div className="food-discussion-page">
        <Header />
        <div className="fdp-disc-container">
          <p>Loading comments...</p>
        </div>
        <Footer />
      </div>
    );
  }

  const handleBack = () => navigate(-1);

  const totalComments = comments.length + comments.reduce((acc, c) => acc + (c.replies?.length || 0), 0);
  const totalLikes = comments.reduce((acc, c) => acc + (c.likes || 0), 0);

  return (
    <div className="food-discussion-page">
      <Header />

      <LoginPromptModal show={showLoginPrompt} onClose={() => setShowLoginPrompt(false)} />

      <div className="fdp-disc-container">
        <div className="fdp-disc-topbar">
          <button className="lrp-btn lrp-btn-outline fdp-back" onClick={handleBack}>
            ← Back to Food Details
          </button>
        </div>

        <div className="fd-card fd-summary">
          <div className="fd-sum-left">
            <div className="fd-sum-thumb">{food?.icon || "🍽️"}</div>
            <div>
              <h2 className="fd-title">{food?.name || "Food Discussion"}</h2>
              <p className="fd-muted">{food?.description}</p>
              <div className="fd-sum-stats">
                <span>💬 {totalComments} comments</span>
                <span>♡ {totalLikes} likes</span>
              </div>
            </div>
          </div>
        </div>

        <div className="fd-card">
          <h3 className="fd-section-title">Add Your Comment</h3>
          <textarea
            className="fd-input"
            placeholder="Share your thoughts about this food…"
            value={newComment}
            onChange={(e) => !isGuest && setNewComment(e.target.value)}
            onClick={() => isGuest && setShowLoginPrompt(true)}
            rows="3"
          />
          <div className="fd-right">
            <button
              className="lrp-btn lrp-btn-primary"
              disabled={!newComment.trim()}
              onClick={postComment}
            >
              <i className="fas fa-paper-plane" style={{ marginRight: "8px" }}></i> Post Comment
            </button>
          </div>
        </div>

        <div className="fd-card">
          <h3 className="fd-section-title">
            <i className="fas fa-comment-dots" /> Community Comments ({comments.length})
          </h3>

          {comments.length > 0 ? (
            <div className="fd-disc-list">
              {comments.map((c, idx) => (
                <React.Fragment key={c.id || c.discussionID || idx}>
                  <Comment
                    item={c}
                    likedIds={likedIds}
                    onToggleLike={toggleLike}
                    replyToId={replyToId}
                    setReplyToId={setReplyToId}
                    replyTexts={replyTexts}
                    setReplyTexts={setReplyTexts}
                    onPostReply={postReply}
                    isGuest={isGuest}
                    setShowLoginPrompt={setShowLoginPrompt}
                  />
                  {idx < comments.length - 1 && <hr className="fd-divider" />}
                </React.Fragment>
              ))}
            </div>
          ) : (
            <p style={{ textAlign: "center", color: "#888" }}>
              No comments yet. Be the first to share your thoughts!
            </p>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
