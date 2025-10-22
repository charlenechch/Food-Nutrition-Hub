// ✅ FoodDiscussionPage.jsx – Part 1/2 (Guest Restriction + ProfileID from session)

import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../css/FoodDiscussionPage.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { useAuth } from "../context/AuthContext"; // ✅ Detect user session
import LoginPromptModal from "../components/LoginPromptModal"; // ✅ Same popup used before

// ✅ Helper function for time formatting
function getTimeAgo(timestamp) {
  const now = new Date();
  const commentTime = new Date(timestamp);
  const diffInSeconds = Math.floor((now - commentTime) / 1000);

  if (diffInSeconds < 60) return "now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000)
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
}

// ✅ COMMENT COMPONENT (unchanged functions + guest restriction wrapper added)
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
  // Generate avatar from username
  const getAvatar = (username) => {
    if (!username) return "UU";
    return username.substring(0, 2).toUpperCase();
  };

  const itemId = isReply
    ? item.replyID || item.id
    : item.id || item.discussionID;

  const content = item.content || item.reply || item.text || "No content";
  const timestamp = item.timestamp || item.createdAt || new Date().toISOString();
  const likes = isReply ? 0 : item.likes || item.upVotes || 0;
  const username = item.username || "Loading...";

  // ✅ Reply input toggle
  const handleToggleReply = () => {
    if (isGuest) return setShowLoginPrompt(true);
    setReplyToId(replyToId === itemId ? null : itemId);
  };

  // ✅ Send reply logic
  const handlePostReply = () => {
    if (isGuest) return setShowLoginPrompt(true);
    onPostReply(itemId);
  };

  // ✅ Cancel reply
  const handleCancelReply = () => {
    setReplyToId(null);
    setReplyTexts((prev) => ({ ...prev, [itemId]: "" }));
  };

  // ✅ Reply input update
  const handleReplyTextChange = (e) => {
    if (isGuest) return setShowLoginPrompt(true);
    setReplyTexts((prev) => ({ ...prev, [itemId]: e.target.value }));
  };

  return (
    <div className={`fd-disc-comment ${isReply ? "fd-disc-reply" : ""}`}>
      <div className="fd-disc-avatar">{getAvatar(username)}</div>
      <div className="fd-disc-body">
        {/* User & Time */}
        <div className="fd-disc-meta">
          <span className="fd-disc-user">{username}</span>
          <span className="fd-disc-time">• {getTimeAgo(timestamp)}</span>
        </div>

        {/* Main Comment Text */}
        <p className="fd-disc-text">{content}</p>

        {/* Comment Buttons (Like + Reply) */}
        <div className="fd-disc-actions">
          {!isReply && (
            <button
              className="fd-link-btn"
              type="button"
              onClick={() =>
                isGuest ? setShowLoginPrompt(true) : onToggleLike(itemId)
              }
            >
              {likedIds.has(itemId) ? "♥" : "♡"} {likes || 0} likes
            </button>
          )}

          {!isReply && (
            <button
              className="fd-link-btn"
              type="button"
              onClick={handleToggleReply}
            >
              ↩ Reply
            </button>
          )}
        </div>

        {/* Reply Input Box */}
        {!isReply && replyToId === itemId && (
          <div className="fd-reply-box">
            <textarea
              className="fd-input"
              placeholder="Write your reply…"
              value={replyTexts[itemId] ?? ""}
              onChange={handleReplyTextChange}
              rows="3"
              onClick={() => isGuest && setShowLoginPrompt(true)}
            />
            <div className="fd-reply-actions">
              <button
                className="lrp-btn lrp-btn-primary"
                type="button"
                onClick={handlePostReply}
                disabled={!replyTexts[itemId]?.trim()}
              >
                Send Reply
              </button>
              <button
                className="lrp-btn lrp-btn-outline"
                type="button"
                onClick={handleCancelReply}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ✅ Render Replies */}
        {!!item.replies?.length && (
          <div className="fd-disc-replies">
            {item.replies.map((reply, idx) => (
              <Comment
                key={reply.replyID || `reply-${idx}`}
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
// ✅ MAIN PAGE COMPONENT – continues from Part 1

export default function FoodDiscussionPage() {
  const { foodId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // ✅ Detect guest or logged-in
  const isGuest = !user || user.role === "guest";
  const userProfileID = user?.profileID || null;

  // ✅ Original states remain intact
  const [food, setFood] = useState(location.state?.food || null);
  const [comments, setComments] = useState([]);
  const [likedIds, setLikedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [replyToId, setReplyToId] = useState(null);
  const [replyTexts, setReplyTexts] = useState({});
  const [showLoginPrompt, setShowLoginPrompt] = useState(false); // ✅ For modal

  // ✅ Fetch food details if not passed from previous page
  useEffect(() => {
    const fetchFoodDetails = async () => {
      if (!food && foodId) {
        try {
          const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
          const res = await fetch(`${API}/api/foodDetail/${foodId}`);
          if (res.ok) {
            const result = await res.json();
            if (result.success) {
              setFood(result.data);
            }
          }
        } catch (error) {
          console.error("Error fetching food details:", error);
        }
      }
    };
    fetchFoodDetails();
  }, [food, foodId]);

  // ✅ Fetch comments
  useEffect(() => {
    if (foodId) {
      fetchComments();
    }
  }, [foodId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const res = await fetch(`${API}/api/foodDiscussion/food/${foodId}`);
      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          setComments(result.data);
        } else {
          setComments([]);
        }
      }
    } catch (err) {
      console.error("Error fetching comments:", err);
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Like function with guest check
  const toggleLike = async (targetId) => {
    if (isGuest) return setShowLoginPrompt(true);

    try {
      const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const res = await fetch(`${API}/api/foodDiscussion/${targetId}/vote`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "up",
          userProfileID: userProfileID,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          setComments((prev) =>
            prev.map((comment) => {
              if (comment.id === targetId) {
                const wasLiked = likedIds.has(targetId);
                const likeChange = wasLiked ? -1 : 1;
                return {
                  ...comment,
                  upVotes: Math.max(0, (comment.likes || 0) + likeChange),
                };
              }
              return comment;
            })
          );

          setLikedIds((prev) => {
            const newLiked = new Set(prev);
            newLiked.has(targetId)
              ? newLiked.delete(targetId)
              : newLiked.add(targetId);
            return newLiked;
          });
        }
      }
    } catch (err) {
      console.error("Error updating like:", err);
    }
  };

  // ✅ Post Comment with guest restriction
  const postComment = async () => {
    const text = newComment.trim();
    if (!text) return;
    if (isGuest) return setShowLoginPrompt(true);

    try {
      const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const res = await fetch(`${API}/api/foodDiscussion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          foodID: foodId,
          userProfileID: userProfileID,
          content: text,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          setComments((prev) => [result.data, ...prev]);
          setNewComment("");
        }
      }
    } catch (err) {
      console.error("Error posting comment:", err);
    }
  };

  // ✅ Post Reply with guest restriction
  const postReply = async (discussionId) => {
    const text = (replyTexts[discussionId] ?? "").trim();
    if (!text) return;
    if (isGuest) return setShowLoginPrompt(true);

    try {
      const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const res = await fetch(`${API}/api/foodDiscussion/${discussionId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userProfileID: userProfileID,
          reply: text,
        }),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setComments((prevComments) =>
          prevComments.map((comment) => {
            if (comment.id === discussionId) {
              return {
                ...comment,
                replies: [
                  ...(comment.replies || []),
                  {
                    replyID: result.data.replyID,
                    username: result.data.username,
                    content: result.data.content,
                    timestamp: result.data.timestamp,
                  },
                ],
              };
            }
            return comment;
          })
        );
        setReplyTexts((prev) => ({ ...prev, [discussionId]: "" }));
        setReplyToId(null);
      }
    } catch (err) {
      console.error("Error posting reply:", err);
    }
  };

  // ✅ Navigation back
  const handleBack = () => navigate(-1);

  // ✅ Summary Stats
  const totalComments =
    comments.length +
    comments.reduce((acc, c) => acc + (c.replies?.length || 0), 0);

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

      {/* ✅ Modal for Guest */}
      <LoginPromptModal
        show={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
      />

      <div className="fdp-disc-container">
        {/* Top bar */}
        <div className="fdp-disc-topbar">
          <button
            type="button"
            className="lrp-btn lrp-btn-outline fdp-back"
            onClick={handleBack}
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
                <span>💬 {totalComments} comments</span>
                <span>♡ {totalLikes} likes</span>
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
            onChange={(e) => !isGuest && setNewComment(e.target.value)}
            onClick={() => isGuest && setShowLoginPrompt(true)}
            rows="4"
          />
          <div className="fd-right">
            <button
              className="lrp-btn lrp-btn-primary"
              type="button"
              onClick={postComment}
              disabled={!newComment.trim()}
            >
              <i className="fas fa-paper-plane" style={{ marginRight: "8px" }}></i>{" "}
              Post Comment
            </button>
          </div>
        </div>

        {/* ✅ Render Comments */}
        <div className="fd-card">
          <h3 className="fd-section-title">
            <i className="fas fa-comment-dots"></i> Community Comments (
            {comments.length})
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
