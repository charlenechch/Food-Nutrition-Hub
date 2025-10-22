// ✅ FoodDiscussionPage.jsx (Fixed + GuestBlock + No Design Changes)

import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../css/FoodDiscussionPage.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

// ✅ Auth & Guest Modal
import { useAuth } from "../context/AuthContext";
import LoginPromptModal from "../components/LoginPromptModal";

// ✅ Format Time
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

// ✅ COMMENT COMPONENT (unchanged UI, just added guest blocking)
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
  const likes = item.upVotes || 0;

  // ✅ Toggle reply box
  const handleOpenReply = () => {
    if (!user) return onGuestBlock();
    setReplyToId(replyToId === itemId ? null : itemId);
  };

  // ✅ Handle reply typing
  const handleReplyChange = (e) => {
    if (!user) return onGuestBlock();
    setReplyTexts((prev) => ({ ...prev, [itemId]: e.target.value }));
  };

  return (
    <div className={`fd-disc-comment ${isReply ? "fd-disc-reply" : ""}`}>
      <div className="fd-disc-avatar">{username.substring(0, 2).toUpperCase()}</div>

      <div className="fd-disc-body">
        <div className="fd-disc-meta">
          <span className="fd-disc-user">{username}</span>
          <span className="fd-disc-time">• {getTimeAgo(timestamp)}</span>
        </div>

        <p className="fd-disc-text">{content}</p>

        {/* ✅ Like + Reply Buttons */}
        {!isReply && (
          <div className="fd-disc-actions">
            <button
              className="fd-link-btn"
              onClick={() => (user ? onToggleLike(itemId) : onGuestBlock())}
            >
              {likedIds.has(itemId) ? "♥" : "♡"} {likes}
            </button>
            <button className="fd-link-btn" onClick={handleOpenReply}>↩ Reply</button>
          </div>
        )}

        {/* ✅ Reply Box */}
        {!isReply && replyToId === itemId && (
          <div className="fd-reply-box">
            <textarea
              className="fd-input"
              placeholder="Write your reply..."
              value={replyTexts[itemId] || ""}
              onClick={() => !user && onGuestBlock()}
              onChange={handleReplyChange}
            />
            <div className="fd-reply-actions">
              <button
                className="lrp-btn lrp-btn-primary"
                disabled={!replyTexts[itemId]?.trim()}
                onClick={() => (user ? onPostReply(itemId) : onGuestBlock())}
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

        {/* ✅ Show nested replies */}
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
// ============================
// ✅ MAIN PAGE COMPONENT
// ============================
export default function FoodDiscussionPage() {
  const { user } = useAuth(); // ✅ detects admin/member or guest
  const { foodId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Modal (for guest popup)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const onGuestBlock = () => {
    console.log("🚫 Guest action blocked");
    setShowLoginPrompt(true);
  };

  // ✅ Page States (keep original logic)
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const [food, setFood] = useState(location.state?.food || null);
  const [comments, setComments] = useState([]);
  const [likedIds, setLikedIds] = useState(() => new Set());
  const [newComment, setNewComment] = useState("");
  const [replyToId, setReplyToId] = useState(null);
  const [replyTexts, setReplyTexts] = useState({});
  const [loading, setLoading] = useState(true);

  // ✅ Safely get userProfileID (works even if profileID is missing)
  const userProfileID = user?.profileID || user?.id || null;

  // ✅ Fetch food details (if not provided via navigation state)
  useEffect(() => {
    const fetchFood = async () => {
      if (!food && foodId) {
        try {
          const res = await fetch(`${API_BASE_URL}/api/foodDetail/${foodId}`);
          const data = await res.json();
          if (data.success) {
            setFood(data.data);
          }
        } catch (err) {
          console.error("❌ Error fetching food details:", err);
        }
      }
    };
    fetchFood();
  }, [foodId, food]);

  // ✅ Fetch comments from API
  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/api/foodDiscussion/food/${foodId}`);
        const data = await res.json();

        if (data.success && Array.isArray(data.data)) {
          setComments(data.data.map((comment) => ({
            ...comment,
            replies: Array.isArray(comment.replies) ? comment.replies : []
          })));
        }
      } catch (error) {
        console.error("❌ Error fetching comments:", error);
      } finally {
        setLoading(false);
      }
    };

    if (foodId) fetchComments();
  }, [foodId]);

  // ✅ Like a comment
  const toggleLike = async (id) => {
    if (!user) return onGuestBlock();
    try {
      const res = await fetch(`${API_BASE_URL}/api/foodDiscussion/${id}/vote`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "up",
          userProfileID: userProfileID,
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
      console.error("❌ Error updating like:", err);
    }
  };
  // ✅ Post a new comment
  const postComment = async () => {
    if (!user) return onGuestBlock(); // block guest
    const text = newComment.trim();
    if (!text) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/foodDiscussion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          foodID: foodId,
          userProfileID: userProfileID,
          content: text,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setComments((prev) => [data.data, ...prev]); // new comment on top
        setNewComment(""); // clear input
      }
    } catch (err) {
      console.error("❌ Error posting comment:", err);
    }
  };

  // ✅ Post a reply
  const postReply = async (discussionId) => {
    if (!user) return onGuestBlock();
    const text = replyTexts[discussionId]?.trim();
    if (!text) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/foodDiscussion/${discussionId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userProfileID: userProfileID,
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
        setReplyToId(null); // close reply box
        setReplyTexts((prev) => ({ ...prev, [discussionId]: "" }));
      }
    } catch (err) {
      console.error("❌ Error posting reply:", err);
    }
  };

  // ✅ Navigation Back
  const handleBack = () => navigate(-1);

  const totalComments = comments.length + comments.reduce((acc, c) => acc + (c.replies?.length || 0), 0);

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
        {/* BACK BUTTON */}
        <div className="fdp-disc-topbar">
          <button type="button" className="lrp-btn lrp-btn-outline fdp-back" onClick={handleBack}>
            ← Back to Food Details
          </button>
        </div>

        {/* FOOD SUMMARY CARD */}
        <div className="fd-card fd-summary">
          <div className="fd-sum-left">
            <div className="fd-sum-thumb">{food?.icon || "🍽️"}</div>
            <div>
              <h2 className="fd-title">{food?.name || "Food Discussion"}</h2>
              <p className="fd-muted">{food?.description}</p>
              <div className="fd-sum-stats">
                <span>💬 {totalComments} comments</span>
              </div>
            </div>
          </div>
        </div>

        {/* ADD COMMENT CARD */}
        <div className="fd-card">
          <h3 className="fd-section-title">Add Your Comment</h3>
          <textarea
            className="fd-input"
            placeholder="Share your thoughts about this food…"
            value={newComment}
            onClick={() => !user && onGuestBlock()} // block guest typing
            onChange={(e) => user && setNewComment(e.target.value)}
            rows="4"
          />
          <div className="fd-right">
            <button
              className="lrp-btn lrp-btn-primary"
              type="button"
              onClick={postComment}
            >
              <i className="fas fa-paper-plane" style={{ marginRight: "8px" }}></i>
              Post Comment
            </button>
          </div>
        </div>

        {/* COMMENTS LIST */}
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

      {/* LOGIN POPUP */}
      <LoginPromptModal show={showLoginPrompt} onClose={() => setShowLoginPrompt(false)} />

      <Footer />
    </div>
  );
}
 // ✅ End of FoodDiscussionPage Component
