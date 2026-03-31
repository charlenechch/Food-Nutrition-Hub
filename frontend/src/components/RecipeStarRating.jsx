import React, { useState } from "react";
import { FaStar } from "react-icons/fa";
// ✅ IMPORT AUTH AND MODAL
import { useAuth } from "../context/AuthContext";
import LoginPromptModal from "./LoginPromptModal"; 

const RecipeStarRating = ({ 
  recipeId, 
  initialAvg = 0, 
  initialCount = 0, 
  initialUserRating = 0, 
  csrfToken 
}) => {
  // ✅ GET USER STATUS
  const { user } = useAuth();
  const isGuest = !user || user.role === "guest";
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const [rating, setRating] = useState(initialUserRating); 
  const [hover, setHover] = useState(0);                   
  const [avg, setAvg] = useState(initialAvg);             
  const [count, setCount] = useState(initialCount);       
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRate = async (selectedRating) => {
    // ✅ CHECK FOR GUEST BEFORE DOING ANYTHING
    if (isGuest) {
      setShowLoginPrompt(true);
      return;
    }

    setIsSubmitting(true);
    // Instantly update visually so it feels fast to the user
    setRating(selectedRating); 

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const response = await fetch(`${API_BASE_URL}/api/recipe/${recipeId}/rate`, {
        method: "POST",
        credentials: "include", 
        headers: { 
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken // 👈 The security badge!
        },
        body: JSON.stringify({ rating: selectedRating })
      });

      // Safely try to parse the JSON response
      let data;
      try {
        data = await response.json();
      } catch (err) {
        throw new Error("Server returned non-JSON response");
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to submit rating");
      }

      // If successful, update the average and total count based on the backend math
      if (data.avgRating !== undefined) {
        setAvg(data.avgRating);
        setCount(data.totalRatings);
      }

    } catch (error) {
      console.error("Error submitting rating:", error);
      alert("Failed to submit rating. Please try refreshing the page.");
      setRating(initialUserRating); // Revert the visual star if it failed
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="recipe-rating-container" style={{ margin: "20px 0", display: "flex", flexDirection: "column", gap: "5px" }}>
      
      {/* 1. The 5 Clickable Stars */}
      <div style={{ display: "flex", gap: "5px" }}>
        {[1, 2, 3, 4, 5].map((starValue) => (
          <FaStar
            key={starValue}
            size={28}
            style={{ 
              cursor: isSubmitting ? "wait" : "pointer",
              transition: "color 0.2s"
            }}
            // Fill stars with yellow based on hover OR saved rating
            color={starValue <= (hover || rating) ? "#FFD700" : "#E4E5E9"}
            onMouseEnter={() => setHover(starValue)}
            onMouseLeave={() => setHover(0)}
            onClick={() => !isSubmitting && handleRate(starValue)}
          />
        ))}
      </div>

      {/* 2. The Text Display */}
      <div style={{ fontSize: "0.95rem", color: "#666" }}>
        {count === 0 ? (
          <span>Be the first to rate this recipe!</span>
        ) : (
          <span>
            <strong>{avg.toFixed(1)}</strong> out of 5 ({count} {count === 1 ? "review" : "reviews"})
          </span>
        )}
      </div>

      {/* ✅ RENDER THE LOGIN PROMPT IF NEEDED */}
      {showLoginPrompt && (
        <LoginPromptModal
          message="Please log in to rate this recipe."
          onClose={() => setShowLoginPrompt(false)}
        />
      )}
    </div>
  );
};

export default RecipeStarRating;