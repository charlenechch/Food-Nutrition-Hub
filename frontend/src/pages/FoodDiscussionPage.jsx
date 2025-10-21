// ✅ FoodDiscussionPage.jsx (Design untouched — Function upgraded only)
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../css/FoodDiscussionPage.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

import { useAuth } from "../context/AuthContext"; // ✅ Added
import LoginPromptModal from "../components/LoginPromptModal"; // ✅ Added

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

// ✅ COMMENT COMPONENT (Design same, added guest check)
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
  onGuestBlock
}) {
  const getAvatar = (username) => (username ? username.substring(0, 2).toUpperCase() : "UU");
  const itemId = isReply
    ? item.replyID || `reply-${Date.now()}-${Math.random()}`
    : item.id || item.discussionID || `comment-${Date.now()}-${Math.random()}`;
  const content = item.content || item.reply || item.text || "No content";
  const timestamp = item.timestamp || item.createdAt || new Date().toISOString();
  const likes = isReply ? 0 : item.likes || item.upVotes || 0;
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
              onClick={() => onToggleLike(itemId)}
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

        {replyToId === itemId && !isReply && (
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
              <button
                className="lrp-btn lrp-btn-primary"
                type="button"
                disabled={!replyTexts[itemId]?.trim()}
                onClick={handlePostReply}
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

  const [food, setFood] = useState(location.state?.food || null);
  const [comments, setComments] = useState([]);
  const [likedIds, setLikedIds] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [replyToId, setReplyToId] = useState(null);
  const [replyTexts, setReplyTexts] = useState({});
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const onGuestBlock = () => setShowLoginPrompt(true);
  const getUserProfileID = () => 1; // For now

  // ✅ Fetch food & comments (UNCHANGED)
  // ... (Keep your existing fetching logic — unchanged here)

  const postComment = async () => {
    if (!user) return onGuestBlock();
    if (!newComment.trim()) return;
    // ✅ Continue with your existing postComment logic…
  };

  const postReply = async (discussionId) => {
    if (!user) return onGuestBlock();
    if (!(replyTexts[discussionId] || "").trim()) return;
    // ✅ Continue with your existing postReply logic…
  };

  return (
    <div className="food-discussion-page">
      <Header />

      {/* Other layout stays the same */}

      {/* ✅ Add Comment Section */}
      <textarea
        className="fd-input"
        placeholder="Share your thoughts about this food…"
        value={newComment}
        onClick={() => !user && onGuestBlock()}
        onChange={(e) => {
          if (!user) return onGuestBlock();
          setNewComment(e.target.value);
        }}
        rows="4"
      />

      {/* ✅ Post Button */}
      <button
        className="lrp-btn lrp-btn-primary"
        type="button"
        onClick={postComment}
      >
        <i className="fas fa-paper-plane" style={{ marginRight: "8px" }} /> Post Comment
      </button>

      {/* ✅ Comments Section */}
      {comments.map((c, idx) => (
        <Comment
          key={c.id || idx}
          item={c}
          likedIds={likedIds}
          replyToId={replyToId}
          setReplyToId={setReplyToId}
          replyTexts={replyTexts}
          setReplyTexts={setReplyTexts}
          onToggleLike={() => {}}
          onPostReply={postReply}
          user={user}
          onGuestBlock={onGuestBlock}
        />
      ))}

      {/* ✅ Login Modal for Guest */}
      <LoginPromptModal show={showLoginPrompt} onClose={() => setShowLoginPrompt(false)} />

      <Footer />
    </div>
  );
}
