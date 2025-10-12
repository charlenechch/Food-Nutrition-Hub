import { useParams, useNavigate } from "react-router-dom";
import React, { useState } from "react";
import "../css/Community.css";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function CommunityPost() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentImg, setCurrentImg] = useState(0);

  const posts = [
    {
      id: 1,
      title: "Midin Goreng Kampung",
      author: "Sarah Lintang",
      daysAgo: "2 days ago",
      category: "Bidayuh",
      images: [
        "https://images.unsplash.com/photo-1638569099509-2f46eb4bb94e?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1074",
        "https://plus.unsplash.com/premium_photo-1666662655178-14d8c6a099b0?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=687",
        "https://images.unsplash.com/photo-1647998270792-69ac80570183?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=735",
      ],
      desc: `My grandmother taught me this recipe when I was seven.
      We would go to the jungle to pick fresh midin ferns at dawn.
      The secret is frying with belacan (shrimp paste) for that smoky aroma.`,
      recipe: `Ingredients:
- Midin (jungle fern)
- Garlic, chili, belacan
- Oil, salt, and pepper

Steps:
1. Heat oil, fry garlic and chili.
2. Add belacan and stir until fragrant.
3. Toss in midin and stir-fry for 2–3 minutes.`,
      likes: 24,
      comments: [
        { user: "Joey", text: "This brings back childhood memories!" },
        { user: "Brian", text: "Love how you describe the aroma 🔥" },
      ],
    },
  ];

  const post = posts.find((p) => p.id === parseInt(id));

  const nextImg = () => {
    setCurrentImg((prev) =>
      prev === post.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImg = () => {
    setCurrentImg((prev) =>
      prev === 0 ? post.images.length - 1 : prev - 1
    );
  };

  if (!post)
    return (
      <div className="community-page">
        <Header />
        <div className="not-found">
          <h2>Post not found 😢</h2>
          <button onClick={() => navigate("/community")} className="back-btn">
            Back to Community
          </button>
        </div>
        <Footer />
      </div>
    );

  return (
    <div className="community-page">
      <Header />

      <div className="post-layout">
        {/* LEFT COLUMN */}
        <div className="post-left">
          {/* IMAGE CAROUSEL */}
          <div className="image-carousel">
            <img
              src={post.images[currentImg]}
              alt={post.title}
              className="post-img-small"
            />

            {/* Arrows (only show if >1 image) */}
            {post.images.length > 1 && (
              <>
                <button className="arrow left" onClick={prevImg} aria-label="Previous photo">
                <svg viewBox="0 0 24 24" className="chev">
                    <path d="M15 6L9 12l6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                </button>

                <button className="arrow right" onClick={nextImg} aria-label="Next photo">
                <svg viewBox="0 0 24 24" className="chev">
                    <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                </button>

                {/* Dots */}
                <div className="dots">
                  {post.images.map((_, idx) => (
                    <span
                      key={idx}
                      className={`dot ${idx === currentImg ? "active" : ""}`}
                      onClick={() => setCurrentImg(idx)}
                    ></span>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* TEXT INFO */}
          <div className="post-info">
            <h1>{post.title}</h1>
            <p className="meta">
              by <b>{post.author}</b> • {post.daysAgo} •{" "}
              <span>{post.category}</span>
            </p>
            <p className="desc">{post.desc}</p>

            <div className="recipe-box">
              <h3>Recipe</h3>
              <pre>{post.recipe}</pre>
            </div>
          </div>

          <button onClick={() => navigate("/community")} className="back-btn">
            ← Back to Community
          </button>
        </div>

        {/* RIGHT COLUMN (COMMENTS + LIKES) */}
        <div className="post-right">
            {/* Likes count at top */}
            <div className="likes-bar">
                ❤️ <span>{post.likes}</span> likes
            </div>

            <h3>Comments</h3>

            <div className="comments-section">
                {post.comments.map((c, index) => (
                <div key={index} className="comment">
                    <b>{c.user}</b>
                    <p>{c.text}</p>
                </div>
                ))}
            </div>

            <form className="comment-form">
                <textarea
                placeholder="Add a comment..."
                rows="3"
                className="comment-input"
                />
                <button type="submit" className="comment-btn">
                Post
                </button>
            </form>
        </div>
        </div>

      <Footer />
    </div>
  );
}
