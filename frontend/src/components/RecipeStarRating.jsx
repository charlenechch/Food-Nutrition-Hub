import React, { useState } from "react";
import { FaStar } from "react-icons/fa";
import { useTranslation } from "react-i18next"; // ✅ Import translation hook
import { useAuth } from "../context/AuthContext";
import LoginPromptModal from "./LoginPromptModal"; 

const RecipeStarRating = ({ 
  recipeId, 
  initialAvg = 0, 
  initialCount = 0, 
  initialUserRating = 0, 
  csrfToken,
  onRateSuccess 
}) => {
  const { t } = useTranslation(); // ✅ Initialize translation
  const { user } = useAuth();
  const isGuest = !user || user.role === "guest";
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const [rating, setRating] = useState(initialUserRating); 
  const [hover, setHover] = useState(0);                   
  const [avg, setAvg] = useState(initialAvg);             
  const [count, setCount] = useState(initialCount);       
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    setRating(initialUserRating);
  }, [initialUserRating]);

  React.useEffect(() => {
    setAvg(initialAvg);
    setCount(initialCount);
  }, [initialAvg, initialCount]);

  const handleRate = async (selectedRating) => {
    if (isGuest) {
      setShowLoginPrompt(true);
      return;
    }

    setIsSubmitting(true);
    setRating(selectedRating); 

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const response = await fetch(`${API_BASE_URL}/api/recipe/${recipeId}/rate`, {
        method: "POST",
        credentials: "include", 
        headers: { 
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken 
        },
        body: JSON.stringify({ rating: selectedRating })
      });

      let data;
      try {
        data = await response.json();
      } catch (err) {
        throw new Error("Server returned non-JSON response");
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || t("recipeDetail.rateError")); // ✅ Translated error
      }

      if (data.avgRating !== undefined) {
        setAvg(data.avgRating);
        setCount(data.totalRatings);
        
        if (onRateSuccess) {
            onRateSuccess(data.avgRating, data.totalRatings);
        }
      }

    } catch (error) {
      console.error("Error submitting rating:", error);
      alert(t("recipeDetail.rateAlertError")); // ✅ Translated alert
      setRating(initialUserRating); 
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="recipe-rating-container" style={{ margin: "20px 0", display: "flex", flexDirection: "column", gap: "5px" }}>
      
      <div style={{ display: "flex", gap: "5px", justifyContent: "flex-end" }}>
        {[1, 2, 3, 4, 5].map((starValue) => (
          <FaStar
            key={starValue}
            size={28}
            style={{ 
              cursor: isSubmitting ? "wait" : "pointer",
              transition: "color 0.2s"
            }}
            color={starValue <= (hover || rating) ? "#FFD700" : "#E4E5E9"}
            onMouseEnter={() => setHover(starValue)}
            onMouseLeave={() => setHover(0)}
            onClick={() => !isSubmitting && handleRate(starValue)}
          />
        ))}
      </div>

      <div style={{ fontSize: "0.95rem", color: "#666", marginTop: "4px", textAlign: "right" }}>
        {rating === 0 ? (
          <span>{t("recipeDetail.ratePrompt")}</span> // ✅ Translated prompt
        ) : (
          <span>
            {t("recipeDetail.userRating", { rating })} {/* ✅ Translated with variable */}
          </span>
        )}
      </div>

      {showLoginPrompt && (
        <LoginPromptModal
          message={t("recipeDetail.rateLoginRequired")} // ✅ Translated modal message
          onClose={() => setShowLoginPrompt(false)}
        />
      )}
    </div>
  );
};

export default RecipeStarRating;