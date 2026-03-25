import React, { useState, useEffect } from "react";
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
  { id: 110, action_type: "POST_LIKED", reference_id: 88, xp_awarded: 2, created_at: "2026-03-16T15:30:00Z" },
  { id: 111, action_type: "RECIPE_LIKED", reference_id: 42, xp_awarded: 2, created_at: "2026-03-15T12:00:00Z" },
  { id: 112, action_type: "RECIPE_LIKED", reference_id: 42, xp_awarded: 2, created_at: "2026-03-14T09:15:00Z" },
  { id: 113, action_type: "POST_APPROVED", reference_id: 89, xp_awarded: 25, created_at: "2026-03-13T14:45:00Z" },
  { id: 114, action_type: "RECIPE_UNLIKED", reference_id: 43, xp_awarded: -2, created_at: "2026-03-12T08:30:00Z" },
  { id: 115, action_type: "POST_LIKED", reference_id: 90, xp_awarded: 2, created_at: "2026-03-11T19:20:00Z" },
  { id: 116, action_type: "RECIPE_APPROVED", reference_id: 44, xp_awarded: 100, created_at: "2026-03-10T10:00:00Z" },
  { id: 117, action_type: "POST_LIKED", reference_id: 88, xp_awarded: 2, created_at: "2026-03-09T16:10:00Z" },
  { id: 118, action_type: "RECIPE_LIKED", reference_id: 44, xp_awarded: 2, created_at: "2026-03-08T11:45:00Z" },
  { id: 119, action_type: "POST_UNLIKED", reference_id: 89, xp_awarded: -2, created_at: "2026-03-07T13:25:00Z" },
  { id: 120, action_type: "RECIPE_LIKED", reference_id: 43, xp_awarded: 2, created_at: "2026-03-06T09:50:00Z" },
  { id: 121, action_type: "POST_APPROVED", reference_id: 88, xp_awarded: 25, created_at: "2026-03-05T14:00:00Z" },
  { id: 122, action_type: "RECIPE_LIKED", reference_id: 42, xp_awarded: 2, created_at: "2026-03-04T18:30:00Z" },
  { id: 123, action_type: "RECIPE_LIKED", reference_id: 42, xp_awarded: 2, created_at: "2026-03-03T08:15:00Z" },
  { id: 124, action_type: "POST_LIKED", reference_id: 90, xp_awarded: 2, created_at: "2026-03-02T20:10:00Z" },
  { id: 125, action_type: "RECIPE_UNLIKED", reference_id: 44, xp_awarded: -2, created_at: "2026-03-01T12:45:00Z" },
  { id: 126, action_type: "POST_LIKED", reference_id: 89, xp_awarded: 2, created_at: "2026-02-28T09:30:00Z" },
  { id: 127, action_type: "RECIPE_LIKED", reference_id: 43, xp_awarded: 2, created_at: "2026-02-27T15:20:00Z" },
  { id: 128, action_type: "RECIPE_LIKED", reference_id: 43, xp_awarded: 2, created_at: "2026-02-26T11:05:00Z" },
  { id: 129, action_type: "POST_UNLIKED", reference_id: 88, xp_awarded: -2, created_at: "2026-02-25T14:50:00Z" },
  { id: 130, action_type: "RECIPE_LIKED", reference_id: 42, xp_awarded: 2, created_at: "2026-02-24T08:40:00Z" },
  { id: 131, action_type: "POST_LIKED", reference_id: 90, xp_awarded: 2, created_at: "2026-02-23T19:15:00Z" },
  { id: 132, action_type: "RECIPE_LIKED", reference_id: 44, xp_awarded: 2, created_at: "2026-02-22T10:25:00Z" },
  { id: 133, action_type: "POST_LIKED", reference_id: 89, xp_awarded: 2, created_at: "2026-02-21T13:10:00Z" },
  { id: 134, action_type: "RECIPE_UNLIKED", reference_id: 43, xp_awarded: -2, created_at: "2026-02-20T17:55:00Z" },
  { id: 135, action_type: "RECIPE_LIKED", reference_id: 42, xp_awarded: 2, created_at: "2026-02-19T09:05:00Z" },
  { id: 136, action_type: "POST_LIKED", reference_id: 88, xp_awarded: 2, created_at: "2026-02-18T14:30:00Z" },
  { id: 137, action_type: "RECIPE_LIKED", reference_id: 44, xp_awarded: 2, created_at: "2026-02-17T11:45:00Z" },
  { id: 138, action_type: "POST_LIKED", reference_id: 90, xp_awarded: 2, created_at: "2026-02-16T08:20:00Z" },
  { id: 139, action_type: "RECIPE_LIKED", reference_id: 43, xp_awarded: 2, created_at: "2026-02-15T16:50:00Z" },
  { id: 140, action_type: "POST_UNLIKED", reference_id: 89, xp_awarded: -2, created_at: "2026-02-14T10:15:00Z" },
  { id: 141, action_type: "RECIPE_LIKED", reference_id: 42, xp_awarded: 2, created_at: "2026-02-13T13:40:00Z" },
  { id: 142, action_type: "POST_LIKED", reference_id: 88, xp_awarded: 2, created_at: "2026-02-12T09:05:00Z" },
  { id: 143, action_type: "RECIPE_LIKED", reference_id: 44, xp_awarded: 2, created_at: "2026-02-11T15:25:00Z" },
  { id: 144, action_type: "POST_LIKED", reference_id: 90, xp_awarded: 2, created_at: "2026-02-10T18:50:00Z" },
  { id: 145, action_type: "ACCOUNT_CREATION", reference_id: null, xp_awarded: 0, created_at: "2026-02-09T08:00:00Z" }
];

const formatActionType = (actionType, t) => {
  return t(`profile.action_${actionType}`); 
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
  const visibleCount = isMobile ? 3 : 5;

  if (totalPages <= visibleCount) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = [];
  let startPage, endPage;

  const half = Math.floor(visibleCount / 2);

  if (currentPage <= half + 1) {
    startPage = 1;
    endPage = visibleCount;
  } else if (currentPage >= totalPages - half) {
    startPage = totalPages - visibleCount + 1;
    endPage = totalPages;
  } else {
    startPage = currentPage - half;
    endPage = currentPage + half;
  }

  if (startPage > 1) {
    pages.push("...");
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  if (endPage < totalPages) {
    pages.push("...");
  }

  return pages;
};

export default function XpLogsPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 500);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 500);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
                    <div className="xp-log-action">{formatActionType(log.action_type, t)}</div>
                    
                    <div className="xp-log-details">
                      {getReferenceTitle(log.action_type, log.reference_id, t)}
                    </div>
                    
                    <div className="upp-muted2">
                      {new Date(log.created_at).toLocaleDateString(
                        i18n.language === 'ms' ? 'ms-MY' : 'en-US',
                        { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
                      )}
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
                
                <div className="efp-page-numbers">
                  {getPaginationGroup(currentPage, totalPages, isMobile).map((item, index) => (
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