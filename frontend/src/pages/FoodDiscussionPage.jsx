// ✅ FULL UPDATED FILE BELOW
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../css/FoodDiscussionPage.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { useAuth } from "../context/AuthContext";
import LoginPromptModal from "../components/LoginPromptModal"; // ✅ use your existing modal

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
// COMMENT COMPONENT
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
  onGuestBlock, // ✅ trigger popup for guests
  user, // ✅ check user
}) {
  const itemId = isReply
    ? item.replyID || `reply-${Date.now()}-${Math.random()}`
    : item.id || item.discussionID || `comment-${Date.now()}-${Math.random()}`;

  const content = item.content || item.reply || "No content";
  const timestamp = item.timestamp || item.createdAt || new Date().toISOString();
  const likes = isReply ? 0 : item.upVotes || 0;
  const username = item.username || "Loading...";

  const handleToggleReply = () => {
    if (!user) {
      onGuestBlock();
      return;
    }
    setReplyToId(replyToId === itemId ? null : itemId);
  };

  const handleReplyTextChange = (e) => {
    if (!user) {
      onGuestBlock();
      return;
    }
    setReplyTexts((prev) => ({ ...prev, [itemId]: e.target.value }));
  };

  const handlePostReply = () => {
    if (!user) {
      onGuestBlock();
      return;
    }
    onPostReply(itemId);
  };

  return (
    <div className={`fd-disc-comment ${isReply ? "fd-disc-reply" : ""}`}>
      <div className="fd-disc-avatar">{username?.substring(0, 2)?.toUpperCase()}</div>
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
              onClick={() => (user ? onToggleLike(itemId) : onGuestBlock())}
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

        {/* Reply Box */}
        {!isReply && replyToId === itemId && (
          <div className="fd-reply-box">
            <textarea
              className="fd-input"
              placeholder="Write your reply…"
              value={replyTexts[itemId] ?? ""}
              onClick={() => !user && onGuestBlock()}
              onChange={handleReplyTextChange}
              rows="3"
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
                onClick={() => setReplyToId(null)}
              >
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
// MAIN PAGE
// =======================
export default function FoodDiscussionPage() {
  const { user } = useAuth(); // ✅ check login status
  const { foodId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [food, setFood] = useState(location.state?.food || null);
  const [comments, setComments] = useState([]);
  const [likedIds, setLikedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [replyToId, setReplyToId] = useState(null);
  const [replyTexts, setReplyTexts] = useState({});
  const [showLoginPrompt, setShowLoginPrompt] = useState(false); // ✅

  const onGuestBlock = () => {
    setShowLoginPrompt(true);
  };

  const getUserProfileID = () => user?.profileID || null;

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const res = await fetch(`${API_BASE_URL}/api/foodDiscussion/food/${foodId}`);
        if (res.ok) {
          const result = await res.json();
          if (result.success) {
            setComments(
              result.data.map((comment) => ({
                ...comment,
                replies: comment.replies || [],
              }))
            );
          }
        }
      } catch (error) {
        console.error("Error fetching comments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [foodId]);

  const postComment = async () => {
    if (!user) {
      onGuestBlock();
      return;
    }
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

  const postReply = async (discussionId) => {
    if (!user) {
      onGuestBlock();
      return;
    }
    const text = (replyTexts[discussionId] ?? "").trim();
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
              ? { ...comment, replies: [...comment.replies, result.data] }
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

  if (loading) {
    return (
      <div className="food-discussion-page">
        <Header />
        <div className="fd-empty">Loading comments…</div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="food-discussion-page">
      <Header />

      {/* ✅ Add Comment Section */}
      <div className="fd-card">
        <h3 className="fd-section-title">Add Your Comment</h3>
        <textarea
          className="fd-input"
          placeholder="Share your thoughts about this food…"
          value={user ? newComment : ""}
          onClick={() => !user && onGuestBlock()}
          onChange={(e) => {
            if (!user) {
              onGuestBlock();
              return;
            }
            setNewComment(e.target.value);
          }}
          rows="4"
        />
        <div className="fd-right">
          <button
            className="lrp-btn lrp-btn-primary"
            type="button"
            onClick={postComment}
          >
            <i className="fas fa-paper-plane" style={{ marginRight: "8px" }}></i> Post Comment
          </button>
        </div>
      </div>

      {/* ✅ Comments List */}
      <div className="fd-card">
        <h3 className="fd-section-title">
          <i className="fas fa-comment-dots"></i> Community Comments ({comments.length})
        </h3>
        {comments.length > 0 ? (
          comments.map((comment) => (
            <Comment
              key={comment.id}
              item={comment}
              likedIds={likedIds}
              onToggleLike={() => {}}
              replyToId={replyToId}
              setReplyToId={setReplyToId}
              replyTexts={replyTexts}
              setReplyTexts={setReplyTexts}
              onPostReply={postReply}
              onGuestBlock={onGuestBlock}
              user={user}
            />
          ))
        ) : (
          <p>No comments yet. Be the first!</p>
        )}
      </div>

      {/* ✅ Guest Login Modal */}
      <LoginPromptModal show={showLoginPrompt} onClose={() => setShowLoginPrompt(false)} />

      <Footer />
    </div>
  );
}
