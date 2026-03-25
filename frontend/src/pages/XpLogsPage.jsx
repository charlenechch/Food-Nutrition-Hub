import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../css/UserProfilePage.css"; 
import { useTranslation } from "react-i18next";

const MOCK_RECIPES = [
  { id: 42, title: "Manok Pansoh" },
  { id: 43, title: "Sarawak Laksa" },
  { id: 44, title: "Authentic Kolo Mee" }
];

const MOCK_POSTS = [
  { id: 88, title: "Best places to eat in Kuching" },
  { id: 89, title: "Where to find fresh Midin?" },
  { id: 90, title: "My first time making Kek Lapis!" }
];

const MOCK_XP_LOGS = [
  { id: 101, action_type: "RECIPE_APPROVED", reference_id: 42, xp_awarded: 100, created_at: "2026-03-25T10:30:00Z" },
  { id: 102, action_type: "RECIPE_UNLIKED", reference_id: 42, xp_awarded: -2, created_at: "2026-03-24T18:20:00Z" },
  { id: 103, action_type: "POST_LIKED", reference_id: 88, xp_awarded: 2, created_at: "2026-03-24T14:15:00Z" },
  { id: 104, action_type: "POST_UNLIKED", reference_id: 88, xp_awarded: -2, created_at: "2026-03-23T11:05:00Z" },
  { id: 105, action_type: "POST_APPROVED", reference_id: 90, xp_awarded: 25, created_at: "2026-03-21T09:00:00Z" },
  { id: 106, action_type: "RECIPE_LIKED", reference_id: 44, xp_awarded: 2, created_at: "2026-03-20T16:45:00Z" },
  { id: 107, action_type: "RECIPE_LIKED", reference_id: 43, xp_awarded: 2, created_at: "2026-03-19T08:00:00Z" },
  { id: 108, action_type: "POST_LIKED", reference_id: 89, xp_awarded: 2, created_at: "2026-03-18T10:00:00Z" },
  { id: 109, action_type: "RECIPE_APPROVED", reference_id: 43, xp_awarded: 100, created_at: "2026-03-17T11:00:00Z" },
  { id: 101, action_type: "RECIPE_APPROVED", reference_id: 42, xp_awarded: 100, created_at: "2026-03-25T10:30:00Z" },
  { id: 102, action_type: "RECIPE_UNLIKED", reference_id: 42, xp_awarded: -2, created_at: "2026-03-24T18:20:00Z" },
  { id: 103, action_type: "POST_LIKED", reference_id: 88, xp_awarded: 2, created_at: "2026-03-24T14:15:00Z" },
  { id: 104, action_type: "POST_UNLIKED", reference_id: 88, xp_awarded: -2, created_at: "2026-03-23T11:05:00Z" },
  { id: 105, action_type: "POST_APPROVED", reference_id: 90, xp_awarded: 25, created_at: "2026-03-21T09:00:00Z" },
  { id: 106, action_type: "RECIPE_LIKED", reference_id: 44, xp_awarded: 2, created_at: "2026-03-20T16:45:00Z" },
  { id: 107, action_type: "RECIPE_LIKED", reference_id: 43, xp_awarded: 2, created_at: "2026-03-19T08:00:00Z" },
  { id: 108, action_type: "POST_LIKED", reference_id: 89, xp_awarded: 2, created_at: "2026-03-18T10:00:00Z" },
  { id: 109, action_type: "RECIPE_APPROVED", reference_id: 43, xp_awarded: 100, created_at: "2026-03-17T11:00:00Z" },
];

const formatActionType = (actionType) => {
  return actionType.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};

const getReferenceTitle = (actionType, referenceId, t) => {
  if (actionType.includes("RECIPE")) {
    const recipe = MOCK_RECIPES.find(r => r.id === referenceId);
    return recipe ? recipe.title : t("profile.deletedRecipe", { id: referenceId });
  }

  if (actionType.includes("POST")) {
    const post = MOCK_POSTS.find(p => p.id === referenceId);
    return post ? post.title : t("profile.deletedPost", { id: referenceId });
  }

  return t("profile.deletedItem", { id: referenceId });
};

const getPaginationGroup = (currentPage, totalPages, isMobile) => {
  const siblings = isMobile ? 1 : 2; 
  const maxPagesWithoutTruncation = isMobile ? 5 : 7;

  if (totalPages <= maxPagesWithoutTruncation) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  let start = Math.max(2, currentPage - siblings);
  let end = Math.min(totalPages - 1, currentPage + siblings);

  if (currentPage - siblings < 2) {
    end = Math.min(totalPages - 1, start + (siblings * 2));
  }
  if (currentPage + siblings > totalPages - 1) {
    start = Math.max(2, end - (siblings * 2));
  }

  const pages = [1]; 

  if (start > 2) pages.push("..."); 

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (end < totalPages - 1) pages.push("...");

  pages.push(totalPages); 
  return pages;
};

export default function XpLogsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5; 

  const totalPages = Math.ceil(MOCK_XP_LOGS.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentLogs = MOCK_XP_LOGS.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="user-profile-page">
      <Header />
      
      <div className="upp-page">
        <div className="upp-stack xlp-stack">
          
          <button 
            className="lrp-btn lrp-btn-outline xlp-btn" 
            onClick={() => navigate(-1)}
          >
            {t("profile.backToProfile")}
          </button>

          <div className="upp-card">
            <h2 className="upp-card-title xlp-card-title">{t("profile.xpLogsTitle")}</h2>
            <p className="upp-muted2 xlp-muted2">
                {t("profile.xpLogsDesc")}
            </p>

            <div className="xp-log-list">
              {currentLogs.map((log) => (
                <div key={log.id} className="xp-log-item">
                  <div className="xp-log-info">
                    <div className="xp-log-action">{formatActionType(log.action_type)}</div>
                    
                    <div className="xp-log-details">
                      {getReferenceTitle(log.action_type, log.reference_id, t)}
                    </div>
                    
                    <div className="upp-muted2">
                      {new Date(log.created_at).toLocaleDateString("en-US", {
                        year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                      })}
                    </div>
                  </div>
                  <div className={`xp-log-amount ${log.xp_awarded > 0 ? "xp-positive" : "xp-negative"}`}>
                    {log.xp_awarded > 0 ? "+" : ""}{log.xp_awarded} XP
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="efp-pagination upp-pagination xlp-pagination">
                <button
                  className="efp-btn nav-btn"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  {t("profile.prev")}
                </button>
                
                <div className="efp-page-numbers desktop-only">
                  {getPaginationGroup(currentPage, totalPages).map((item, index) => (
                    item === "..." ? (
                      <span key={`ellipsis-${index}`} className="efp-ellipsis">...</span>
                    ) : (
                      <button
                        key={item}
                        className={`efp-btn ${currentPage === item ? "is-active" : ""}`}
                        onClick={() => setCurrentPage(item)}
                      >
                        {item}
                      </button>
                    )
                  ))}
                </div>

                <div className="mobile-page-indicator">
                  Page {currentPage} of {totalPages}
                </div>

                <button
                  className="efp-btn nav-btn"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  {t("profile.next")}
                </button>
              </div>
            )}
            
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}