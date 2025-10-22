// ✅ FoodDiscussionPage.jsx (Fully Working with Guest Block Popup)

import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../css/FoodDiscussionPage.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

// ✅ Import Auth & Popup Modal
import { useAuth } from "../context/AuthContext";
import LoginPromptModal from "../components/LoginPromptModal";

// ✅ Time Ago Helper
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

// ✅ COMMENT COMPONENT (kept original)
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
  const itemId = isReply
    ? item.replyID || item.id
    : item.id || item.discussionID;

  const username = item.username || "User";
  const content = item.content || item.reply || "";
  const time = item.timestamp || item.createdAt;
  const likes = isReply ? 0 : item.upVotes || 0;

  const handleReplyToggle = () => {
    if (!user) return onGuestBlock();
    setReplyToId(replyToId === itemId ? null : itemId);
  };

  const handleReplyChange = (e) => {
    if (!user) return onGuestBlock();
    setReplyTexts((prev) => ({ ...prev, [itemId]: e.target.value }));
  };

  const handleReplySend = () => {
    if (!user) return onGuestBlock();
    onPostReply(itemId);
  };

  return (
    <div className={`fd-disc-comment ${isReply ? "fd-disc-reply" : ""}`}>
      <div className="fd-disc-avatar">{username.substring(0, 2).toUpperCase()}</div>

      <div className="fd-disc-body">
        <div className="fd-disc-meta">
          <span className="fd-disc-user">{username}</span>
          <span className="fd-disc-time">• {getTimeAgo(time)}</span>
        </div>

        <p className="fd-disc-text">{content}</p>

        {!isReply && (
          <div className="fd-disc-actions">
            <button
              className="fd-link-btn"
              onClick={() => (user ? onToggleLike(itemId) : onGuestBlock())}
            >
              {likedIds.has(itemId) ? "♥" : "♡"} {likes} likes
            </button>
            <button className="fd-link-btn" onClick={handleReplyToggle}>
              ↩ Reply
            </button>
          </div>
        )}

        {replyToId === itemId && (
          <div className="fd-reply-box">
            <textarea
              className="fd-input"
              placeholder="Write your reply…"
              value={replyTexts[itemId] || ""}
              onClick={() => !user && onGuestBlock()}
              onChange={handleReplyChange}
              rows="3"
            />
            <div className="fd-reply-actions">
              <button
                className="lrp-btn lrp-btn-primary"
                disabled={!replyTexts[itemId]?.trim()}
                onClick={handleReplySend}
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

// ✅ MAIN PAGE
export default function FoodDiscussionPage() {
  const { user } = useAuth();
  const { foodId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const [food, setFood] = useState(location.state?.food || null);
  const [comments, setComments] = useState([]);
  const [likedIds, setLikedIds] = useState(new Set());
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [replyToId, setReplyToId] = useState(null);
  const [replyTexts, setReplyTexts] = useState({});
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const onGuestBlock = () => setShowLoginPrompt(true);
  // ✅ Fetch Comments & Food Details
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

    const fetchComments = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/api/foodDiscussion/food/${foodId}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setComments(
            data.data.map((c) => ({
              ...c,
              replies: Array.isArray(c.replies) ? c.replies : [],
            }))
          );
        }
      } catch (err) {
        console.error("Error fetching comments:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFood();
    fetchComments();
  }, [foodId]);

  // ✅ Post Comment (Guest Block)
  const postComment = async () => {
    if (!user) return onGuestBlock();
    const text = newComment.trim();
    if (!text) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/foodDiscussion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          foodID: foodId,
          userProfileID: user?.profileID,
          content: text,
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

  // ✅ Post Reply (Guest Block)
  const postReply = async (discussionId) => {
    if (!user) return onGuestBlock();
    const text = replyTexts[discussionId]?.trim();
    if (!text) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/foodDiscussion/${discussionId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userProfileID: user?.profileID,
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

  // ✅ Toggle Like (Guest Block)
  const toggleLike = async (id) => {
    if (!user) return onGuestBlock();

    try {
      const res = await fetch(`${API_BASE_URL}/api/foodDiscussion/${id}/vote`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "up",
          userProfileID: user?.profileID,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === id
              ? { ...c, upVotes: likedIds.has(id) ? c.upVotes - 1 : c.upVotes + 1 }
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

  const handleBack = () => navigate(-1);

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

  return (
    <div className="food-discussion-page">
      <Header />

      <div className="fdp-disc-container">
        {/* Add Comment Section */}
        <div className="fd-card">
          <h3 className="fd-section-title">Add Your Comment</h3>
          <textarea
            className="fd-input"
            placeholder="Share your thoughts..."
            value={newComment}
            onClick={() => !user && onGuestBlock()}
            onChange={(e) => {
              if (!user) return onGuestBlock();
              setNewComment(e.target.value);
            }}
            rows="3"
          />
          <div className="fd-right">
            <button className="lrp-btn lrp-btn-primary" onClick={postComment}>
              <i className="fas fa-paper-plane" style={{ marginRight: "8px" }} /> Post Comment
            </button>
          </div>
        </div>

        {/* Comments */}
        <div className="fd-card">
          <h3 className="fd-section-title">
            <i className="fas fa-comment-dots"></i> Community Comments ({comments.length})
          </h3>
          {comments.map((comment) => (
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
          ))}
        </div>
      </div>

      {/* ✅ Popup Here */}
      <LoginPromptModal show={showLoginPrompt} onClose={() => setShowLoginPrompt(false)} />

      <Footer />
    </div>
  );
}
