import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../css/FoodDiscussionPage.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

// ✅ Add authentication & modal
import { useAuth } from "../context/AuthContext";
import LoginPromptModal from "../components/LoginPromptModal";

// Helper function for time formatting
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

// =======================
// ✅ COMMENT COMPONENT
// =======================
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

  // ✅ Added:
  user,
  onGuestBlock,
}) {
  const getAvatar = (username) => (username ? username.substring(0, 2).toUpperCase() : "UU");

  const itemId = isReply
    ? item.replyID || item.id || `reply-${Date.now()}-${Math.random()}`
    : item.id || item.discussionID || `comment-${Date.now()}-${Math.random()}`;

  const content = item.content || item.reply || "No content";
  const timestamp = item.timestamp || item.createdAt || new Date().toISOString();
  const likes = isReply ? 0 : item.upVotes || 0;
  const username = item.username || "Loading...";

  const handleToggleReply = () => {
    if (!user) return onGuestBlock();
    setReplyToId(replyToId === itemId ? null : itemId);
  };

  const handleReplyTextChange = (e) => {
    if (!user) return onGuestBlock();
    setReplyTexts((prev) => ({ ...prev, [itemId]: e.target.value }));
  };

  const handlePostReply = () => {
    if (!user) return onGuestBlock();
    onPostReply(itemId);
  };

  const handleCancelReply = () => {
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

        <div className="fd-disc-actions">
          {!isReply && (
            <button
              className="fd-link-btn"
              type="button"
              onClick={() => onToggleLike(itemId)} // ✅ likes still allowed
            >
              {likedIds.has(itemId) ? "♥" : "♡"} {likes} likes
            </button>
          )}

          {!isReply && (
            <button className="fd-link-btn" type="button" onClick={handleToggleReply}>
              ↩ Reply
            </button>
          )}
        </div>

        {/* ✅ Reply box shows but disabled for guest */}
        {!isReply && replyToId === itemId && (
          <div className="fd-reply-box">
            <textarea
              className="fd-input"
              placeholder="Write your reply…"
              value={replyTexts[itemId] ?? ""}
              rows="3"
              onClick={() => !user && onGuestBlock()}
              onChange={handleReplyTextChange}
            />
            <div className="fd-reply-actions">
              <button className="lrp-btn lrp-btn-primary" type="button" onClick={handlePostReply} disabled={!replyTexts[itemId]?.trim()}>
                Send Reply
              </button>
              <button className="lrp-btn lrp-btn-outline" type="button" onClick={handleCancelReply}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

// =======================
// ✅ MAIN PAGE
// =======================
export default function FoodDiscussionPage() {
  const { user } = useAuth();
  const { foodId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Modal logic
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const onGuestBlock = () => setShowLoginPrompt(true);

  // ✅ Close popup automatically after login (no refresh!)
  useEffect(() => {
    if (user) {
      setShowLoginPrompt(false);
    }
  }, [user]);

  // ========== Original states ==========
  const [food, setFood] = useState(location.state?.food || null);
  const [comments, setComments] = useState([]);
  const [likedIds, setLikedIds] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [replyToId, setReplyToId] = useState(null);
  const [replyTexts, setReplyTexts] = useState({});

  const getUserProfileID = () => user?.profileID || null;

  // ✅ Fetch food details
  useEffect(() => {
    const fetchFoodDetails = async () => {
      if (!food && foodId) {
        try {
          const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
          const res = await fetch(`${API_BASE_URL}/api/foodDetail/${foodId}`);
          const result = await res.json();
          if (result.success) setFood(result.data);
        } catch (error) {
          console.error("Error fetching food details:", error);
        }
      }
    };
    fetchFoodDetails();
  }, [food, foodId]);

  // ✅ Fetch comments
  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoading(true);
        const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const res = await fetch(`${API_BASE_URL}/api/foodDiscussion/food/${foodId}`);
        const result = await res.json();

        if (result.success && result.data) {
          let commentsData = result.data.map((comment) => ({
            ...comment,
            timeAgo: getTimeAgo(comment.timestamp || comment.createdAt),
            replies: (comment.replies || []).map((reply) => ({
              ...reply,
              timeAgo: getTimeAgo(reply.timestamp || reply.createdAt),
            })),
          }));
          setComments(commentsData);
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

  // ✅ Like (allowed for guests)
  const toggleLike = async (targetId) => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const res = await fetch(`${API_BASE_URL}/api/foodDiscussion/${targetId}/vote`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "up",
          userProfileID: getUserProfileID(),
        }),
      });
      const result = await res.json();

      if (result.success) {
        setComments((prev) =>
          prev.map((comment) =>
            comment.id === targetId
              ? {
                  ...comment,
                  upVotes: likedIds.has(targetId)
                    ? (comment.upVotes || 1) - 1
                    : (comment.upVotes || 0) + 1,
                }
              : comment
          )
        );
        setLikedIds((prev) => {
          const next = new Set(prev);
          next.has(targetId) ? next.delete(targetId) : next.add(targetId);
          return next;
        });
      }
    } catch (err) {
      console.error("Error updating like:", err);
    }
  };

  // ✅ Post Comment (Guest blocked)
  const postComment = async () => {
    if (!user) return onGuestBlock();

    const text = newComment.trim();
    if (!text) return;

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const res = await fetch(`${API_BASE_URL}/api/foodDiscussion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          foodID: foodId,
          userProfileID: getUserProfileID(),
          content: text,
        }),
      });

      const result = await res.json();
      if (result.success) {
        setComments((prev) => [result.data, ...prev]);
        setNewComment("");
      }
    } catch (err) {
      console.error("Error posting comment:", err);
    }
  };

  // ✅ Post Reply (Guest blocked)
  const postReply = async (discussionId) => {
    if (!user) return onGuestBlock();

    const text = replyTexts[discussionId]?.trim();
    if (!text) return;

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const res = await fetch(`${API_BASE_URL}/api/foodDiscussion/${discussionId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userProfileID: getUserProfileID(),
          reply: text,
        }),
      });

      const result = await res.json();
      if (result.success) {
        setComments((prev) =>
          prev.map((comment) =>
            comment.id === discussionId
              ? {
                  ...comment,
                  replies: [
                    ...(comment.replies || []),
                    {
                      replyID: result.data.replyID,
                      username: result.data.username,
                      content: result.data.content,
                      timestamp: result.data.timestamp,
                      timeAgo: "now",
                    },
                  ],
                }
              : comment
          )
        );
        setReplyToId(null);
        setReplyTexts((prev) => ({ ...prev, [discussionId]: "" }));
      }
    } catch (err) {
      console.error("Error posting reply:", err);
    }
  };

  const handleBack = () => navigate(-1);

  const totalComments = comments.length + comments.reduce((acc, c) => acc + (c.replies?.length || 0), 0);
  const totalLikes = comments.reduce((acc, c) => acc + (c.likes || 0), 0);

  if (loading) {
    return (
      <div className="food-discussion-page">
        <Header />
        <div className="fdp-disc-container">
          <div className="fd-empty">
            <div className="fd-empty-icon">⏳</div>
            <p className="fd-muted">Loading comments...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="food-discussion-page">
      <Header />

      <div className="fdp-disc-container">
        {/* Top Bar */}
        <div className="fdp-disc-topbar">
          <button type="button" className="lrp-btn lrp-btn-outline fdp-back" onClick={handleBack}>
            ← Back to Food Details
          </button>
        </div>

        {/* Summary Card */}
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

        {/* Add Comment */}
        <div className="fd-card">
          <h3 className="fd-section-title">Add Your Comment</h3>
          <textarea
            className="fd-input"
            placeholder="Share your thoughts about this food…"
            value={newComment}
            rows="4"
            onClick={() => !user && onGuestBlock()}
            onChange={(e) => {
              if (!user) return onGuestBlock();
              setNewComment(e.target.value);
            }}
          />
          <div className="fd-right">
            <button
              className="lrp-btn lrp-btn-primary"
              type="button"
              onClick={postComment}
              style={{ cursor: user ? "pointer" : "not-allowed" }}
            >
              <i className="fas fa-paper-plane" style={{ marginRight: "8px" }}></i>
              Post Comment
            </button>
          </div>
        </div>

        {/* Comments List */}
        <div className="fd-card">
          <h3 className="fd-section-title">
            <i className="fas fa-comment-dots"></i> Community Comments ({comments.length})
          </h3>
          {comments.length ? (
            <div className="fd-disc-list">
              {comments.map((c, idx) => (
                <React.Fragment key={c.id || idx}>
                  <Comment
                    item={c}
                    likedIds={likedIds}
                    onToggleLike={toggleLike}
                    replyToId={replyToId}
                    setReplyToId={setReplyToId}
                    replyTexts={replyTexts}
                    setReplyTexts={setReplyTexts}
                    onPostReply={postReply}
                    user={user}
                    onGuestBlock={onGuestBlock}
                  />
                  {idx < comments.length - 1 && <hr className="fd-divider" />}
                </React.Fragment>
              ))}
            </div>
          ) : (
            <div className="fd-empty">
              <div className="fd-empty-icon">💬</div>
              <p className="fd-muted">No comments yet. Be the first to share your thoughts!</p>
            </div>
          )}
        </div>
      </div>

      {/* ✅ Login Popup Modal */}
      <LoginPromptModal show={showLoginPrompt} onClose={() => setShowLoginPrompt(false)} />

      <Footer />
    </div>
  );
}
