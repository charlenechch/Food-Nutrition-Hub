import React, { useState } from "react";
// Assumes you have react-icons installed (npm install react-icons)
import { FaStar } from "react-icons/fa";

const RecipeStarRating = ({ recipeId, initialAvg = 0, initialCount = 0, initialUserRating = 0 }) => {
  const [rating, setRating] = useState(initialUserRating); // The rating this specific user previously gave
  const [hover, setHover] = useState(0);                   // The star they are hovering over now
  const [avg, setAvg] = useState(initialAvg);             // The community average
  const [count, setCount] = useState(initialCount);       // How many people rated
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Function called when a star is clicked
  const handleRate = async (selectedRating) => {
    setIsSubmitting(true);
    setRating(selectedRating); // Instantly update visually

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      // Make the call to the backend route we created in Step 2
      const response = await fetch(`${API_BASE_URL}/api/recipe/${recipeId}/rate`, {
        method: "POST",
        credentials: "include", // Required to send their login session cookie
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: selectedRating })
      });

      const data = await response.json();
      
      if (data.success) {
        // Backend confirms the save, update the average score and count on the screen
        setAvg(data.avgRating);
        setCount(data.totalRatings);
      } else {
        alert(data.message); // E.g., "Must be logged in to rate"
      }
    } catch (error) {
      console.error("Error submitting rating:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ margin: "20px 0", display: "flex", flexDirection: "column", gap: "5px" }}>
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
            // Logic to fill stars based on hover OR saved rating
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