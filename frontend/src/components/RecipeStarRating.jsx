import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import LoginPromptModal from "./LoginPromptModal";

const RecipeStarRating = ({
  recipeId,
  initialAvg = 0,
  initialCount = 0,
  initialUserRating = 0,
  csrfToken,
  onRateSuccess,
}) => {
  const { t } = useTranslation();
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
    // The onClick event now successfully reaches this point for guests!
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
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({ rating: selectedRating }),
      });

      let data;
      try {
        data = await response.json();
      } catch (err) {
        throw new Error("Server returned non-JSON response");
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || t("recipeDetail.rateError"));
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
      alert(t("recipeDetail.rateAlertError"));
      setRating(initialUserRating);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Active highlight: hover > user's own rating > rounded avg (read-only display)
  const activeValue = hover || rating || Math.round(avg);

  return (
    <>
      <style>{`
        /* MOBILE FIRST (Below 600px): Centered Layout */
        .recipe-rating-container {
          margin: 12px 0;
          display: flex;
          flex-direction: column;
          align-items: center; /* Perfectly centered */
          gap: 4px;
        }
        .rdp-star-row {
          display: flex;
          flex-direction: row-reverse;
          justify-content: center; /* Perfectly centered */
          gap: 2px;
          width: 100%;
        }
        .rdp-rating-text {
          font-size: 0.85rem; 
          color: #71717a; 
          font-weight: 500;
          margin-top: 2px;
          text-align: center; /* Perfectly centered */
        }

        /* DESKTOP (600px & Up): Right-Aligned Layout */
        @media (min-width: 600px) {
          .recipe-rating-container {
            align-items: flex-end; /* Right aligned */
            margin: 0; 
          }
          .rdp-star-row {
            justify-content: flex-start; /* Pulls to the right when row-reversed */
          }
          .rdp-rating-text {
            text-align: right;
          }
        }

        /* Core Star Logic */
        .rdp-star-row input {
          position: absolute;
          appearance: none;
          pointer-events: none;
        }
        .rdp-star-row label {
          font-size: 26px; /* Scaled down slightly from 30px */
          color: #e4e4e7; /* Slightly softer unselected gray */
          cursor: pointer;
          transition: color 0.2s ease, transform 0.1s ease-in-out; /* Added smooth scale */
          line-height: 1;
          user-select: none;
        }
        .rdp-star-row label::before {
          content: '★';
        }
        
        /* Interaction States */
        .rdp-star-row label:hover {
          transform: scale(1.15); /* Tactile pop on hover */
        }
        .rdp-star-row label:hover,
        .rdp-star-row label:hover ~ label {
          color: #ffb020; 
        }
        .rdp-star-row input:checked ~ label {
          color: #f59e0b;
        }
        .rdp-star-row input:checked + label:hover,
        .rdp-star-row input:checked + label:hover ~ label,
        .rdp-star-row input:checked ~ label:hover,
        .rdp-star-row input:checked ~ label:hover ~ label,
        .rdp-star-row label:hover ~ input:checked ~ label {
          color: #d97706;
        }
        
        /* Read-only state (submitting) */
        .rdp-star-row--readonly label {
          cursor: default;
        }
        .rdp-star-row--readonly label:hover {
          transform: none; /* Disable pop when submitting */
        }
        .rdp-star-row--readonly label:hover,
        .rdp-star-row--readonly label:hover ~ label {
          color: #e4e4e7;
        }
        .rdp-star-row--readonly input:checked ~ label {
          color: #f59e0b;
        }
      `}</style>

      <div className="recipe-rating-container">
        {/* Star row: Removed isGuest from the readonly check so guests can hover */}
        <div
          className={`rdp-star-row${isSubmitting ? " rdp-star-row--readonly" : ""}`}
          onMouseLeave={() => setHover(0)}
        >
          {[5, 4, 3, 2, 1].map((star) => (
            <React.Fragment key={star}>
              <input
                type="radio"
                id={`rdp-star-${recipeId}-${star}`}
                name={`rdp-rating-${recipeId}`}
                value={star}
                checked={activeValue === star}
                onChange={() => {}}
              />
              <label
                htmlFor={`rdp-star-${recipeId}-${star}`}
                title={`${star} star${star > 1 ? "s" : ""}`}
                onMouseEnter={() => !isSubmitting && setHover(star)}
                onClick={() => !isSubmitting && handleRate(star)}
              />
            </React.Fragment>
          ))}
        </div>

        {/* Prompt / confirmation text */}
        <div className="rdp-rating-text">
          {rating === 0 ? (
            <span>{t("recipeDetail.ratePrompt")}</span>
          ) : (
            <span>{t("recipeDetail.userRating", { rating })}</span>
          )}
        </div>

        {showLoginPrompt && (
          <LoginPromptModal
            message={t("recipeDetail.rateLoginRequired")}
            onClose={() => setShowLoginPrompt(false)}
          />
        )}
      </div>
    </>
  );
};

export default RecipeStarRating;