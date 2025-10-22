// ✅ Fully Fixed FoodDiscussionPage.jsx

import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../css/FoodDiscussionPage.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { useAuth } from "../context/AuthContext";
import LoginPromptModal from "../components/LoginPromptModal";

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
  onGuestBlock,
  user,
}) {
  const itemId = isReply ? item.replyID : item.id || item.discussionID;
  const content = item.content || item.reply || "";
  const likes = item.upVotes || 0;
  const username = item.username || "User";
  const timestamp = item.createdAt || item.timestamp;

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
          <span className="fd-disc-time">• {getTimeAgo(timestamp)}</span>
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

        {!isReply && replyToId === itemId && (
          <div className="fd-reply-box">
            <textarea
              className="fd-input"
              placeholder="Write your reply..."
              value={replyTexts[itemId] || ""}
              onChange={handleReplyChange}
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
            {item.replies.map((rep, idx) => (
              <Comment
                key={rep.replyID || idx}
                item={rep}
                isReply={true}
                likedIds={likedIds}
                onToggleLike={onToggleLike}
                replyToId={replyToId}
                setReplyToId={setReplyToId}
                replyTexts={replyTexts}
                setReplyTexts={setReplyTexts}
                onPostReply={onPostReply}
                onGuestBlock={onGuestBlock}
                user={user}
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

  const [food] = useState(location.state?.food || null);
  const [comments, setComments] = useState([]);
  const [likedIds, setLikedIds] = useState(new Set());
  const [newComment, setNewComment] = useState("");
  const [replyToId, setReplyToId] = useState(null);
  const [replyTexts, setReplyTexts] = useState({});
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const onGuestBlock = () => setShowLoginPrompt(true);
  const getUserProfileID = () => user?.profileID || null;

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/foodDiscussion/food/${foodId}`);
        const result = await res.json();
        if (result.success) setComments(result.data);
      } catch (err) {
        console.error("Error loading comments:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchComments();
  }, [foodId]);

  const toggleLike = async (id) => {
    if (!user) return onGuestBlock();
    try {
      const res = await fetch(`${API_BASE_URL}/api/foodDiscussion/${id}/vote`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "up", userProfileID: getUserProfileID() }),
      });
      if (res.ok) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === id
              ? { ...c, upVotes: likedIds.has(id) ? c.upVotes - 1 : c.upVotes + 1 }
              : c
          )
        );
        setLikedIds((prev) => {
          const newSet = new Set(prev);
          newSet.has(id) ? newSet.delete(id) : newSet.add(id);
          return newSet;
        });
      }
    } catch (err) {
      console.error("Like error:", err);
    }
  };

  const postComment = async () => {
    if (!user) return onGuestBlock();
    if (!newComment.trim()) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/foodDiscussion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          foodID: foodId,
          userProfileID: getUserProfileID(),
          content: newComment,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setComments((prev) => [result.data, ...prev]);
        setNewComment("");
      }
    } catch (err) {
      console.error("Comment error:", err);
    }
  };

  const postReply = async (discussionId) => {
    const text = replyTexts[discussionId]?.trim();
    if (!text) return;
    try {
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
          prev.map((c) =>
            c.id === discussionId
              ? { ...c, replies: [...c.replies, result.data] }
              : c
          )
        );
        setReplyToId(null);
        setReplyTexts((prev) => ({ ...prev, [discussionId]: "" }));
      }
    } catch (err) {
      console.error("Reply error:", err);
    }
  };

  if (loading) {
    return (
      <div className="food-discussion-page">
        <Header />
        <div className="fdp-disc-container">Loading comments...</div>
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
          placeholder="Share your thoughts..."
          value={user ? newComment : ""}
          onClick={() => !user && onGuestBlock()}
          onChange={(e) => setNewComment(e.target.value)}
          rows="4"
        />
        <div className="fd-right">
          <button className="lrp-btn lrp-btn-primary" onClick={postComment}>
            <i className="fas fa-paper-plane" /> Post Comment
          </button>
        </div>
      </div>

      {/* ✅ Comments Section */}
      <div className="fd-card">
        <h3 className="fd-section-title">
          <i className="fas fa-comment-dots" /> Community Comments ({comments.length})
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
              onGuestBlock={onGuestBlock}
              user={user}
            />
          ))
        ) : (
          <p>No comments yet.</p>
        )}
      </div>

      <LoginPromptModal show={showLoginPrompt} onClose={() => setShowLoginPrompt(false)} />

      <Footer />
    </div>
  );
}
