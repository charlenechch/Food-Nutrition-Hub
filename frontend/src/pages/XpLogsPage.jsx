import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../css/UserProfilePage.css"; 
import { useTranslation } from "react-i18next";

// 1. DELETED MOCK_RECIPES, MOCK_POSTS, and MOCK_XP_LOGS! 
// We don't need them anymore. The database handles this.

const formatActionType = (actionType, t) => {
  return t(`profile.action_${actionType}`); 
};

// 2. UPDATED getReferenceTitle
// Your backend's COALESCE SQL command now sends the title directly inside 'log.reference_title'.
// So this function is much simpler now.
const getReferenceTitle = (actionType, referenceId, referenceTitle, t) => {
  if (referenceTitle) return referenceTitle; // The backend found the title
  
  // Fallbacks if the recipe/post was deleted from the database
  if (actionType.includes("RECIPE")) {
    return t("profile.deletedRecipe", { id: referenceId });
  }
  if (actionType.includes("POST")) {
    return t("profile.deletedPost", { id: referenceId });
  }
  return t("profile.deletedItem", { id: referenceId });
};

const getPaginationGroup = (currentPage, totalPages, isMobile) => {
  // ... (Keep this function exactly the same, it works perfectly) ...
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

  if (startPage > 1) pages.push("...");
  for (let i = startPage; i <= endPage; i++) pages.push(i);
  if (endPage < totalPages) pages.push("...");

  return pages;
};

export default function XpLogsPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 500);
  
  // 3. NEW STATE VARIABLES
  const [currentPage, setCurrentPage] = useState(1);
  const [logs, setLogs] = useState([]); // Replaces currentLogs
  const [totalPages, setTotalPages] = useState(1); 
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 500);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 4. THE API FETCH CALL
  // This runs every time the component loads or the user clicks a new page number
  useEffect(() => {
    const fetchXpLogs = async () => {
      setIsLoading(true);
      try {
        // We use credentials: "include" because your server.js uses session cookies for auth
        const response = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/xp/logs?page=${currentPage}`, {
          method: "GET",
          credentials: "include", 
          headers: {
            "Content-Type": "application/json"
          }
        });
        
        const data = await response.json();
        
        if (data.success) {
          setLogs(data.logs);
          setTotalPages(data.totalPages);
        } else {
          console.error("Failed to load logs:", data.message);
        }
      } catch (error) {
        console.error("Error fetching live XP logs:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchXpLogs();
  }, [currentPage]);

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

            {/* 5. ADDED A LOADING STATE */}
            {isLoading ? (
               <div className="loading-spinner" style={{ textAlign: "center", padding: "2rem" }}>
                 {t("profile.loadingLogs", "Loading your XP history...")}
               </div>
            ) : logs.length === 0 ? (
               <div className="no-logs" style={{ textAlign: "center", padding: "2rem", color: "#666" }}>
                 {t("profile.noLogsYet", "You haven't earned any XP yet. Start participating!")}
               </div>
            ) : (
              <div className="xp-log-list">
                {/* 6. MAPPED OVER THE LIVE 'logs' INSTEAD OF 'currentLogs' */}
                {logs.map((log) => (
                  <div key={log.id} className="xp-log-item">
                    <div className="xp-log-info">
                      <div className="xp-log-action">{formatActionType(log.action_type, t)}</div>
                      
                      <div className="xp-log-details">
                        {/* 7. UPDATED TO USE THE NEW reference_title FROM THE DATABASE */}
                        {getReferenceTitle(log.action_type, log.reference_id, log.reference_title, t)}
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
            )}

            {/* Pagination remains the same, but now uses the dynamic totalPages from the API */}
            {totalPages > 1 && !isLoading && (
              <div className="efp-pagination upp-pagination xlp-pagination">
                {/* ... (Keep your pagination buttons exactly as they were) ... */}
                <button
                  className="efp-btn nav-btn"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  {isMobile ? "‹" : t("profile.prev")}
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
                  {isMobile ? "›" : t("profile.next")}
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