import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import "./LevelUpModal.css";

export default function LevelUpModal({ 
  highestLevelAchieved = 1, 
  hasUnseenLevelUp = false,
  onDismiss 
}) {
  const { t } = useTranslation();

  // Lock scrolling when the modal is visible
  useEffect(() => {
    if (hasUnseenLevelUp) {
      document.body.style.overflow = "hidden"; 
    } else {
      document.body.style.overflow = "auto";
    }
    // Cleanup function in case component unmounts
    return () => { document.body.style.overflow = "auto"; };
  }, [hasUnseenLevelUp]);

  const handleDismiss = () => {
    document.body.style.overflow = "auto"; 
    if (onDismiss) {
      onDismiss(highestLevelAchieved);
    }
  };

  // If App.jsx says we shouldn't show the modal, render nothing
  if (!hasUnseenLevelUp) return null;

  return (
    <div className="levelup-backdrop" onClick={handleDismiss}>
      <div className="levelup-modal" onClick={(e) => e.stopPropagation()}>
        
        <div className="levelup-badge-container">
          <div className="levelup-badge">
            <span className="levelup-level-text">{highestLevelAchieved}</span>
          </div>
        </div>

        <h2 className="levelup-title">{t("gamification.levelUpTitle")}</h2>
        
        {/* MAGIC INJECTION: This passes the live level number to your en.json {{level}} placeholder */}
        <p className="levelup-message">
          {t("gamification.levelUpMessage", { level: highestLevelAchieved })}
        </p>
        
        <button className="lrp-btn lrp-btn-primary levelup-btn" onClick={handleDismiss}>
          {t("gamification.levelUpBtn")}
        </button>
      </div>
    </div>
  );
}