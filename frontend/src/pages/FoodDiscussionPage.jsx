// ✅ FoodDiscussionPage.jsx – Full Working Version (Guest Restriction + Original post/comment logic)

import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../css/FoodDiscussionPage.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { useAuth } from "../context/AuthContext"; // ✅ detect logged-in user / guest
import LoginPromptModal from "../components/LoginPromptModal"; // ✅ popup for guest restriction

// ✅ Time formatting function
function getTimeAgo(timestamp) {
  const now = new Date();
  const commentTime = new Date(timestamp);
  const diff = Math.floor((now - commentTime) / 1000);
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return `${Math.floor(diff / 2592000)}mo ago`;
}

// ✅ Comment Component (memoized)
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
  const getAvatar = (username) => (username ? username.substring(0, 2).toUpperCase() : "UU");

  const itemId = isReply
    ? item.replyID || item.id
    : item.id || item.discussionID;

  const content = item.content || item.reply || "No content";
  const timestamp = item.timestamp || item.createdAt || new Date().toISOString();
  const likes = isReply ? 0 : item.likes || item.upVotes || 0;
  const username = item.username || "Loading...";

  const handleToggleReply = () => {
    if (isGuest) return setShowLoginPrompt(true);
    setReplyToId(replyToId === itemId ? null : itemId);
  };

  const handlePostReply = () => {
    if (isGuest) return setShowLoginPrompt(true);
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
        {/* Meta */}
        <div className="fd-disc-meta">
          <span className="fd-disc-user">{username}</span>
          <span className="fd-disc-time">• {getTimeAgo(timestamp)}</span>
        </div>

        {/* Content */}
        <p className="fd-disc-text">{content}</p>

        {/* Actions */}
        <div className="fd-disc-actions">
          {!isReply && (
            <button
              className="fd-link-btn"
              onClick={() =>
                isGuest ? setShowLoginPrompt(true) : onToggleLike(itemId)
              }
            >
              {likedIds.has(itemId) ? "♥" : "♡"} {likes} likes
            </button>
          )}

          {!isReply && (
            <button className="fd-link-btn" onClick={handleToggleReply}>
              ↩ Reply
            </button>
          )}
        </div>

        {/* Reply box */}
        {!isReply && replyToId === itemId && (
          <div className="fd-reply-box">
            <textarea
              className="fd-input"
              placeholder="Write your reply…"
              value={replyTexts[itemId] ?? ""}
              onClick={() => isGuest && setShowLoginPrompt(true)}
              onChange={(e) =>
                setReplyTexts((prev) => ({ ...prev, [itemId]: e.target.value }))
              }
              rows="3"
            />
            <div className="fd-reply-actions">
              <button
                className="lrp-btn lrp-btn-primary"
                disabled={!replyTexts[itemId]?.trim()}
                onClick={handlePostReply}
              >
                Send Reply
              </button>
              <button
                className="lrp-btn lrp-btn-outline"
                onClick={handleCancelReply}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Show replies */}
        {!!item.replies?.length && (
          <div className="fd-disc-replies">
            {item.replies.map((reply, index) => (
              <Comment
                key={reply.replyID || `reply-${index}`}
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

// ✅ Main Page Component
export default function FoodDiscussionPage() {
  const { foodId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const isGuest = !user || user.role === "guest";

  // ✅ Fallback to original working logic
  const getUserProfileID = () => {
    if (!user || user.role === "guest") return null;
    return user.profileID || user.id || user.userID || 1; // fallback was 1 in old code
  };

  const [food, setFood] = useState(location.state?.food || null);
  const [comments, setComments] = useState([]);
  const [likedIds, setLikedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [replyToId, setReplyToId] = useState(null);
  const [replyTexts, setReplyTexts] = useState({});
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  useEffect(() => {
    const fetchFood = async () => {
      if (!food && foodId) {
        try {
          const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
          const res = await fetch(`${API}/api/foodDetail/${foodId}`);
          if (res.ok) {
            const { data, success } = await res.json();
            if (success) setFood(data);
          }
        } catch (err) {
          console.error(err);
        }
      }
    };
    fetchFood();
  }, [food, foodId]);

  useEffect(() => {
    fetchComments();
  }, [foodId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const res = await fetch(`${API}/api/foodDiscussion/food/${foodId}`);
      if (res.ok) {
        const { data, success } = await res.json();
        if (success) setComments(data || []);
        else setComments([]);
      }
    } catch (err) {
      console.error(err);
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Like
  const toggleLike = async (discussionId) => {
    if (isGuest) return setShowLoginPrompt(true);
    const userProfileID = getUserProfileID();
    if (!userProfileID) return;

    try {
      const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const res = await fetch(`${API}/api/foodDiscussion/${discussionId}/vote`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "up", userProfileID }),
      });

      if (res.ok) {
        setLikedIds((prev) => {
          const newLiked = new Set(prev);
          newLiked.has(discussionId)
            ? newLiked.delete(discussionId)
            : newLiked.add(discussionId);
          return newLiked;
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ✅ Post Comment
  const postComment = async () => {
    const text = newComment.trim();
    if (!text) return;
    if (isGuest) return setShowLoginPrompt(true);

    const userProfileID = getUserProfileID();
    if (!userProfileID) return;

    try {
      const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const res = await fetch(`${API}/api/foodDiscussion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          foodID: foodId,
          userProfileID,
          content: text,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setComments((prev) => [data.data, ...prev]);
          setNewComment("");
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ✅ Post Reply
  const postReply = async (discussionId) => {
    const text = replyTexts[discussionId]?.trim();
    if (!text) return;
    if (isGuest) return setShowLoginPrompt(true);

    const userProfileID = getUserProfileID();
    if (!userProfileID) return;

    try {
      const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const res = await fetch(`${API}/api/foodDiscussion/${discussionId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userProfileID,
          reply: text,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          setComments((prev) =>
            prev.map((c) =>
              c.id === discussionId
                ? { ...c, replies: [...(c.replies || []), result.data] }
                : c
            )
          );
          setReplyTexts((prev) => ({ ...prev, [discussionId]: "" }));
          setReplyToId(null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

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

      {/* ✅ Show modal only if guest tries to interact */}
      <LoginPromptModal
        show={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
      />

      <div className="fdp-disc-container">
        {/* Back Button */}
        <div className="fdp-disc-topbar">
          <button
            className="lrp-btn lrp-btn-outline fdp-back"
            onClick={() => navigate(-1)}
          >
            ← Back to Food Details
          </button>
        </div>

        {/* Summary Section */}
        <div className="fd-card fd-summary">
          <div className="fd-sum-left">
            <div className="fd-sum-thumb">{food?.icon || "🍽️"}</div>
            <div>
              <h2 className="fd-title">{food?.name || "Food Discussion"}</h2>
              <p className="fd-muted">{food?.description}</p>
              <div className="fd-sum-stats">
                <span>💬 {comments.length} comments</span>
                <span>♡ {comments.reduce((acc, c) => acc + (c.likes || 0), 0)} likes</span>
              </div>
            </div>
          </div>
        </div>

        {/* ✅ Add Comment Section */}
        <div className="fd-card">
          <h3 className="fd-section-title">Add Your Comment</h3>
          <textarea
            className="fd-input"
            placeholder="Share your thoughts about this food…"
            value={newComment}
            onClick={() => isGuest && setShowLoginPrompt(true)}
            onChange={(e) => !isGuest && setNewComment(e.target.value)}
            rows="4"
          />
          <div className="fd-right">
            <button
              className="lrp-btn lrp-btn-primary"
              onClick={postComment}
              disabled={!newComment.trim()}
            >
              <i className="fas fa-paper-plane" style={{ marginRight: "8px" }}></i>
              Post Comment
            </button>
          </div>
        </div>

        {/* ✅ Comments List */}
        <div className="fd-card">
          <h3 className="fd-section-title">
            <i className="fas fa-comment-dots"></i> Community Comments ({comments.length})
          </h3>

          {comments.length ? (
            <div className="fd-disc-list">
              {comments.map((c, idx) => (
                <React.Fragment key={c.id || `comment-${idx}`}>
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
            <div className="fd-empty">
              <div className="fd-empty-icon">💬</div>
              <p className="fd-muted">No comments yet. Be the first to share your thoughts!</p>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
