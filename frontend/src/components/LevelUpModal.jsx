import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import "./LevelUpModal.css";

const calculateNaturalLevel = (totalXp) => {
  const safeXpForMath = Math.max(0, totalXp || 0);
  return Math.floor(1 + Math.pow(safeXpForMath / 100, 2 / 3));
};

export default function LevelUpModal({ 
  totalXp = 0, 
  highestLevelAchieved = 1, 
  hasUnseenLevelUp = false,
  onDismiss 
}) {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [calculatedLevel, setCalculatedLevel] = useState(1);

  useEffect(() => {
    if (hasUnseenLevelUp) {
      const newLevel = calculateNaturalLevel(totalXp);
      
      if (newLevel > highestLevelAchieved) {
        setCalculatedLevel(newLevel);
        setIsVisible(true);
        document.body.style.overflow = "hidden"; 
      }
    }
  }, [hasUnseenLevelUp, totalXp, highestLevelAchieved]);

  const handleDismiss = () => {
    setIsVisible(false);
    document.body.style.overflow = "auto"; 

    if (onDismiss) {
      onDismiss(calculatedLevel);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="levelup-backdrop" onClick={handleDismiss}>
      <div className="levelup-modal" onClick={(e) => e.stopPropagation()}>
        
        <div className="levelup-badge-container">
          <div className="levelup-badge">
            <span className="levelup-level-text">{calculatedLevel}</span>
          </div>
        </div>

        <h2 className="levelup-title">{t("gamification.levelUpTitle")}</h2>
        
        <p className="levelup-message">
          {t("gamification.levelUpMessage", { level: calculatedLevel })}
        </p>

        <button className="levelup-btn" onClick={handleDismiss}>
          {t("gamification.levelUpBtn")}
        </button>

      </div>
    </div>
  );
}