import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { getTierById } from "../utils/gamificationTiers";
import "./ContributorBadgeModal.css";

export default function ContributorBadgeModal({
  badge = null,
  onDismiss
}) {
  const { t } = useTranslation();

  useEffect(() => {
    if (badge) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => { document.body.style.overflow = "auto"; };
  }, [badge]);

  const handleDismiss = () => {
    document.body.style.overflow = "auto";
    if (onDismiss) onDismiss(badge);
  };

  if (!badge) return null;

  const tier = getTierById(badge.badge_type);

  return (
    <div className="contributor-backdrop" onClick={handleDismiss}>
      <div className="contributor-modal" onClick={(e) => e.stopPropagation()}>

        <div className="contributor-badge-container">
          <div className="contributor-badge" style={{ boxShadow: `0 0 30px ${tier.color}60` }}>
            {tier.icon}
          </div>
        </div>

        <h2 className="contributor-title">{t("gamification.contributorModalTitle")}</h2>

        <p className="contributor-message">
          {t("gamification.contributorModalMessage", {
            title: tier.title,
            month: badge.awarded_month
          })}
        </p>

        <button className="lrp-btn lrp-btn-primary contributor-btn" onClick={handleDismiss}>
          {t("gamification.contributorModalBtn")}
        </button>
      </div>
    </div>
  );
}