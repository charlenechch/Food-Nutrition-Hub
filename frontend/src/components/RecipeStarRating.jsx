import React, { useState } from "react";
import { FaStar } from "react-icons/fa";

const RecipeStarRating = ({ 
  recipeId, 
  initialAvg = 0, 
  initialCount = 0, 
  initialUserRating = 0, 
  csrfToken 
}) => {
  const [rating, setRating] = useState(initialUserRating); 
  const [hover, setHover] = useState(0);                   
  const [avg, setAvg] = useState(initialAvg);             
  const [count, setCount] = useState(initialCount);       
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRate = async (selectedRating) => {
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
        throw new Error("Server rejected the request. It might be a session or CSRF token issue.");
      }
      
      if (data.success) {
        // Backend confirms the save, update the average score and count on the screen
        setAvg(data.avgRating);
        setCount(data.totalRatings);
      } else {
        alert(data.message || "Something went wrong."); 
        setRating(initialUserRating); // Revert the visual star if it failed
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
        {count > 0 ? (
          <span><strong>{avg}</strong> out of 5 ({count} ratings)</span>
        ) : (
          <span>Be the first to rate this recipe!</span>
        )}
      </div>

    </div>
  );
};

export default RecipeStarRating;