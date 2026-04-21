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
        .rdp-star-row {
          display: flex;
          flex-direction: row-reverse;
          justify-content: flex-start;
          gap: 2px;
        }
        .rdp-star-row input {
          position: absolute;
          appearance: none;
          pointer-events: none;
        }
        .rdp-star-row label {
          font-size: 30px;
          color: #ccc;
          cursor: pointer;
          transition: color 0.15s;
          line-height: 1;
          user-select: none;
        }
        .rdp-star-row label::before {
          content: '★';
        }
        /* Hover: light this star and all higher ones (siblings to the right) */
        .rdp-star-row label:hover,
        .rdp-star-row label:hover ~ label {
          color: #ff9e0b;
        }
        /* Checked: colour all stars up to the selected one */
        .rdp-star-row input:checked ~ label {
          color: #ffa723;
        }
        /* Checked + hover blended colour */
        .rdp-star-row input:checked + label:hover,
        .rdp-star-row input:checked + label:hover ~ label,
        .rdp-star-row input:checked ~ label:hover,
        .rdp-star-row input:checked ~ label:hover ~ label,
        .rdp-star-row label:hover ~ input:checked ~ label {
          color: #e58e09;
        }
        /* Read-only state (guest or submitting): freeze hover colours */
        .rdp-star-row--readonly label {
          cursor: default;
        }
        .rdp-star-row--readonly label:hover,
        .rdp-star-row--readonly label:hover ~ label {
          color: #ccc;
        }
        .rdp-star-row--readonly input:checked ~ label {
          color: #ffa723;
        }
      `}</style>

      <div
        className="recipe-rating-container"
        style={{ margin: "20px 0", display: "flex", flexDirection: "column", gap: "5px" }}
      >
        {/* Star row */}
        <div
          className={`rdp-star-row${isGuest || isSubmitting ? " rdp-star-row--readonly" : ""}`}
          onMouseLeave={() => !isGuest && setHover(0)}
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
                onMouseEnter={() => !isGuest && !isSubmitting && setHover(star)}
                onClick={() => !isGuest && !isSubmitting && handleRate(star)}
              />
            </React.Fragment>
          ))}
        </div>

        {/* Prompt / confirmation text */}
        <div style={{ fontSize: "0.95rem", color: "#666", marginTop: "4px", textAlign: "right" }}>
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