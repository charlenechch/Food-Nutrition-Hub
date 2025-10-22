// ✅ FoodDiscussionPage.jsx (Final Fixed Version)

import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../css/FoodDiscussionPage.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { useAuth } from "../context/AuthContext";
import LoginPromptModal from "../components/LoginPromptModal";

// ✅ Helper: Format time
function getTimeAgo(timestamp) {
  const now = new Date();
  const time = new Date(timestamp);
  const diff = Math.floor((now - time) / 1000);
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return `${Math.floor(diff / 2592000)}mo ago`;
}

// ✅ Comment Component
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
  user,
  onGuestBlock,
}) {
  const itemId = isReply ? item.replyID || item.id : item.id;
  const username = item.username || "User";
  const content = item.content || item.reply || "";
  const timestamp = item.timestamp || item.createdAt;
  const likes = isReply ? 0 : item.upVotes || 0;

  const handleReplyToggle = () => {
    if (!user || user.role === "guest") return onGuestBlock();
    setReplyToId(replyToId === itemId ? null : itemId);
  };

  const handleReplyChange = (e) => {
    if (!user || user.role === "guest") return onGuestBlock();
    setReplyTexts((prev) => ({ ...prev, [itemId]: e.target.value }));
  };

  const handleSendReply = () => {
    if (!user || user.role === "guest") return onGuestBlock();
    onPostReply(itemId);
  };

  return (
    <div className={`fd-disc-comment ${isReply ? "fd-disc-reply" : ""}`}>
      <div className="fd-disc-avatar">
        {username.substring(0, 2).toUpperCase()}
      </div>
      <div className="fd-disc-body">
        <div className="fd-disc-meta">
          <span className="fd-disc-user">{username}</span>
          <span className="fd-disc-time">• {getTimeAgo(timestamp)}</span>
        </div>
        <p className="fd-disc-text">{content}</p>

        {!isReply && (
          <div className="fd-disc-actions">
            <button
              className="fd-link-btn"
              onClick={() =>
                !user || user.role === "guest"
                  ? onGuestBlock()
                  : onToggleLike(itemId)
              }
            >
              {likedIds.has(itemId) ? "♥" : "♡"} {likes} likes
            </button>
            <button className="fd-link-btn" onClick={handleReplyToggle}>
              ↩ Reply
            </button>
          </div>
        )}

        {!isReply && replyToId === itemId && (
          <div className="fd-reply-box">
            <textarea
              className="fd-input"
              placeholder="Write your reply…"
              value={replyTexts[itemId] || ""}
              onClick={() => !user && onGuestBlock()}
              onChange={handleReplyChange}
            />
            <div className="fd-reply-actions">
              <button
                className="lrp-btn lrp-btn-primary"
                onClick={handleSendReply}
                disabled={!replyTexts[itemId]?.trim()}
              >
                Send Reply
              </button>
              <button
                className="lrp-btn lrp-btn-outline"
                onClick={() => setReplyToId(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {item.replies?.length > 0 && (
          <div className="fd-disc-replies">
            {item.replies.map((r, i) => (
              <Comment
                key={r.replyID || i}
                item={r}
                isReply={true}
                likedIds={likedIds}
                onToggleLike={onToggleLike}
                replyToId={replyToId}
                setReplyToId={setReplyToId}
                replyTexts={replyTexts}
                setReplyTexts={setReplyTexts}
                onPostReply={onPostReply}
                user={user}
                onGuestBlock={onGuestBlock}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

export default function FoodDiscussionPage() {
  const { user } = useAuth();
  const { foodId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Guest modal
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const onGuestBlock = () => setShowLoginPrompt(true);

  // ✅ Core states
  const [food, setFood] = useState(location.state?.food || null);
  const [comments, setComments] = useState([]);
  const [likedIds, setLikedIds] = useState(new Set());
  const [newComment, setNewComment] = useState("");
  const [replyToId, setReplyToId] = useState(null);
  const [replyTexts, setReplyTexts] = useState({});
  const [loading, setLoading] = useState(true);

  // ✅ Safely get valid userProfileID
  const userProfileID = user?.profileID || user?.id || null;
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // ✅ Fetch food details
  useEffect(() => {
    const fetchFood = async () => {
      if (!food && foodId) {
        try {
          const res = await fetch(`${API_BASE_URL}/api/foodDetail/${foodId}`);
          const data = await res.json();
          if (data.success) setFood(data.data);
        } catch (err) {
          console.error("Error fetching food:", err);
        }
      }
    };
    fetchFood();
  }, [foodId, food]);

  // ✅ Fetch comments
  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/api/foodDiscussion/food/${foodId}`);
        const data = await res.json();
        if (data.success) {
          setComments(
            data.data.map((c) => ({
              ...c,
              replies: c.replies || [],
            }))
          );
        }
      } catch (err) {
        console.error("Error fetching comments:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchComments();
  }, [foodId]);

  // ✅ Post new comment
  const postComment = async () => {
    if (!user || user.role === "guest") return onGuestBlock();
    if (!newComment.trim()) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/foodDiscussion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          foodID: foodId,
          userProfileID,
          content: newComment,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setComments((prev) => [data.data, ...prev]);
        setNewComment("");
      }
    } catch (err) {
      console.error("Error posting comment:", err);
    }
  };

  // ✅ Post reply
  const postReply = async (discussionId) => {
    if (!user || user.role === "guest") return onGuestBlock();
    const text = replyTexts[discussionId]?.trim();
    if (!text) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/foodDiscussion/${discussionId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userProfileID,
          reply: text,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === discussionId
              ? { ...c, replies: [...c.replies, data.data] }
              : c
          )
        );
        setReplyToId(null);
        setReplyTexts((prev) => ({ ...prev, [discussionId]: "" }));
      }
    } catch (err) {
      console.error("Error posting reply:", err);
    }
  };

  // ✅ Like toggle
  const toggleLike = async (id) => {
    if (!user || user.role === "guest") return onGuestBlock();

    try {
      const res = await fetch(`${API_BASE_URL}/api/foodDiscussion/${id}/vote`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "up",
          userProfileID,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === id
              ? {
                  ...c,
                  upVotes: likedIds.has(id) ? c.upVotes - 1 : c.upVotes + 1,
                }
              : c
          )
        );
        setLikedIds((prev) => {
          const next = new Set(prev);
          next.has(id) ? next.delete(id) : next.add(id);
          return next;
        });
      }
    } catch (err) {
      console.error("Error liking comment:", err);
    }
  };

  // ✅ Navigate back
  const handleBack = () => navigate(-1);

  if (loading) {
    return (
      <div className="food-discussion-page">
        <Header />
        <div className="fdp-disc-container">
          <p className="fd-muted">Loading comments...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="food-discussion-page">
      <Header />

      <div className="fdp-disc-container">
        {/* Back Button */}
        <div className="fdp-disc-topbar">
          <button className="lrp-btn lrp-btn-outline" onClick={handleBack}>
            ← Back
          </button>
        </div>

        {/* Add Comment Section */}
        <div className="fd-card">
          <h3 className="fd-section-title">Add Your Comment</h3>
          <textarea
            className="fd-input"
            placeholder="Say something about this food…"
            rows="4"
            value={newComment}
            onClick={() => !user && onGuestBlock()}
            onChange={(e) =>
              user ? setNewComment(e.target.value) : onGuestBlock()
            }
          />
          <div className="fd-right">
            <button
              className="lrp-btn lrp-btn-primary"
              onClick={postComment}
            >
              <i className="fas fa-paper-plane"></i> Post Comment
            </button>
          </div>
        </div>

        {/* Comments */}
        <div className="fd-card">
          <h3 className="fd-section-title">
            <i className="fas fa-comment-dots"></i> Community Comments (
            {comments.length})
          </h3>
          {comments.length > 0 ? (
            comments.map((comment) => (
              <Comment
                key={comment.id}
                item={comment}
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
            ))
          ) : (
            <p className="fd-muted">No comments yet. Be the first!</p>
          )}
        </div>
      </div>

      {/* ✅ Guest Login Popup */}
      <LoginPromptModal
        show={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
      />

      <Footer />
    </div>
  );
}
