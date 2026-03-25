import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import "./LevelUpModal.css";

export default function LevelUpModal({ isOpen, onClose, newLevel }) {
  const { t } = useTranslation();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="levelup-backdrop" onClick={onClose}>
      <div className="levelup-modal" onClick={(e) => e.stopPropagation()}>
        
        <div className="levelup-badge-container">
          <div className="levelup-badge">
            <span className="levelup-level-text">{newLevel}</span>
          </div>
        </div>

        <h2 className="levelup-title">{t("gamification.levelUpTitle")}</h2>
        
        <p className="levelup-message">
          {t("gamification.levelUpMessage", { level: newLevel })}
        </p>

        <button className="levelup-btn" onClick={onClose}>
          {t("gamification.levelUpBtn")}
        </button>

      </div>
    </div>
  );
}