// ✅ src/pages/FoodDiscussionPage.jsx (TEMP FIX with hardcoded profileID fallback for comments/replies)
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../css/FoodDiscussionPage.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

import { useAuth } from "../context/AuthContext";
import LoginPromptModal from "../components/LoginPromptModal";

// ✅ Format "time ago"
function getTimeAgo(timestamp) {
  const now = new Date();
  const past = new Date(timestamp);
  const diff = Math.floor((now - past) / 1000);
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return `${Math.floor(diff / 2592000)}mo ago`;
}

// ✅ Single Comment Component
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
  const username = item.username || "User";
  const content = item.content || item.reply || "No content";
  const timestamp = item.timestamp || item.createdAt;
  const likes = isReply ? 0 : item.likes || item.upVotes || 0;
 
  const handleLike = () => {
    if (isGuest) return setShowLoginPrompt(true);
    onToggleLike(itemId);
  };

  const handleToggleReply = () => {
    if (isGuest) return setShowLoginPrompt(true);
    setReplyToId(replyToId === itemId ? null : itemId);
  };

  const handleReplyChange = (e) => {
    if (isGuest) return setShowLoginPrompt(true);
    setReplyTexts((prev) => ({ ...prev, [itemId]: e.target.value }));
  };

  const handlePostReply = () => {
    if (isGuest) return setShowLoginPrompt(true);
    onPostReply(itemId);
  };

  return (
    <div className={`fd-disc-comment ${isReply ? "fd-disc-reply" : ""}`}>
      // Instead of generating initials, use the actual avatar URL
      <div className="fd-disc-avatar">
          {item.avatar ? (
            <img 
              src={item.avatar} 
              alt={username}
              className="fd-disc-avatar-img"
              onError={(e) => {
                // Fallback to initials if image fails to load
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          
          {/* Fallback to initials if no avatar */}
          <div className="fd-disc-avatar-initials">
            {username.substring(0, 2).toUpperCase()}
          </div>
        </div>
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
            <button className="fd-link-btn" onClick={handleToggleReply}>
              ↩ Reply
            </button>
          </div>
        )}

        {!isReply && replyToId === itemId && (
          <div className="fd-reply-box">
            <textarea
              className="fd-input"
              placeholder="Write your reply..."
              value={replyTexts[itemId] || ""}
              onChange={handleReplyChange}
              rows="2"
            />
            <div className="fd-reply-actions">
              <button className="lrp-btn lrp-btn-primary" disabled={!replyTexts[itemId]?.trim()} onClick={handlePostReply}>
                Send Reply
              </button>
              <button className="lrp-btn lrp-btn-outline" onClick={() => setReplyToId(null)}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {item.replies && item.replies.length > 0 && (
          <div className="fd-disc-replies">
            {item.replies.map((reply, idx) => (
              <Comment
                key={reply.replyID || idx}
                item={reply}
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

// ✅ Main Component
export default function FoodDiscussionPage() {
  const { user } = useAuth();
  const { foodId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const isGuest = !user || user.role === "guest";

  const userProfileID = isGuest ? null : user?.userProfileID;

  const [food, setFood] = useState(location.state?.food || null);
  const [comments, setComments] = useState([]);
  const [likedIds, setLikedIds] = useState(new Set());
  const [newComment, setNewComment] = useState("");
  const [replyToId, setReplyToId] = useState(null);
  const [replyTexts, setReplyTexts] = useState({});
  const [loading, setLoading] = useState(true);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  // ✅ Fetch comments
  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API}/api/foodDiscussion/food/${foodId}`, {
          credentials: "include",
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setComments(data.data);
        } else {
          setComments([]);
        }
      } catch (err) {
        console.error("Error fetching comments:", err);
        setComments([]);
      } finally {
        setLoading(false);
      }
    };

    if (foodId) fetchComments();
  }, [foodId]);

  const postComment = async () => {
    if (isGuest) return setShowLoginPrompt(true);
    if (!newComment.trim()) return;

    const actualUserProfileID = user?.userProfileID || user?.userID || user?.id || user?.profileID;
    const actualFoodID = foodId;

    console.log("🟡 Final values:", {
      actualUserProfileID,
      actualFoodID, 
      content: newComment.trim()
    });

    // ADD VALIDATION
    if (!actualUserProfileID) {
      alert("User profile ID not found. Please log in again.");
      return;
    }

    if (!actualFoodID) {
      alert("Food ID not found. Please go back and try again.");
      return;
    }

    try {
      const res = await fetch(`${API}/api/foodDiscussion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          foodID: actualFoodID,
          userProfileID: actualUserProfileID,
          content: newComment.trim(),
        }),
      });

      console.log("🟡 Response status:", res.status);
      const data = await res.json();
      console.log("🟡 Response data:", data);

      if (res.ok && data.success) {
        setComments((prev) => [data.data, ...prev]);
        setNewComment("");
      } else {
        alert(data?.message || "Unable to post comment");
      }
    } catch (err) {
      console.error("Error posting comment:", err);
      alert("Server error while posting comment.");
    }
  };

 
  const postReply = async (discussionId) => {
    if (isGuest) return setShowLoginPrompt(true);
    const text = replyTexts[discussionId]?.trim();
    if (!text) return;

    const actualUserProfileID = user?.userProfileID || user?.userID || user?.id || user?.profileID;

    try {
      const res = await fetch(`${API}/api/foodDiscussion/${discussionId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userProfileID: actualUserProfileID,
          reply: text,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === discussionId || c.discussionID === discussionId
              ? { ...c, replies: [...(c.replies || []), data.data] }
              : c
          )
        );
        setReplyTexts((prev) => ({ ...prev, [discussionId]: "" }));
        setReplyToId(null);
      } else {
        alert(data?.message || "Unable to post reply");
      }
    } catch (err) {
      console.error("Error posting reply:", err);
      alert("Server error while posting reply.");
    }
  };

  // ✅ Toggle like
  const toggleLike = async (targetId) => {
    if (isGuest) return setShowLoginPrompt(true);

    const finalProfileID = userProfileID;

    try {
      const res = await fetch(`${API}/api/foodDiscussion/${targetId}/vote`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          type: "up",
          userProfileID: finalProfileID,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === targetId || c.discussionID === targetId
              ? { ...c, likes: data.data?.likes ?? (c.likes || 0) + 1 }
              : c
          )
        );
        setLikedIds((prev) => new Set(prev).add(targetId));
      }
    } catch (err) {
      console.error("Error updating like:", err);
    }
  };

  // ✅ Render Loading
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
  const totalComments =
    comments.length + comments.reduce((acc, c) => acc + (c.replies?.length || 0), 0);
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

        {/* Add Comment Box */}
        <div className="fd-card">
          <h3 className="fd-section-title">Add Your Comment</h3>
          <textarea
            className="fd-input"
            placeholder="Share your thoughts…"
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
              <i className="fas fa-paper-plane" style={{ marginRight: "8px" }}></i>
              Post Comment
            </button>
          </div>
        </div>

        {/* List Comments */}
        <div className="fd-card">
          <h3 className="fd-section-title">
            <i className="fas fa-comment-dots" /> Community Comments ({comments.length})
          </h3>
          {comments.length > 0 ? (
            <div className="fd-disc-list">
              {comments.map((c, i) => (
                <React.Fragment key={c.id || c.discussionID || i}>
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
                  {i < comments.length - 1 && <hr className="fd-divider" />}
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
