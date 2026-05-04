import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../css/UserProfilePage.css"; 
import { useTranslation } from "react-i18next";
// Added 'Image' icon specifically for Community Posts
import { CheckCircle2, MessageSquare, BookOpen, Star, Award, Trophy, Image } from "lucide-react";

const formatActionType = (actionType, t) => {
  return t(`profile.action_${actionType}`); 
};

const getActionIcon = (actionType) => {
  if (!actionType) return <Trophy size={22} color="#916848" />;
  
  // 1. Check Categories first - Each gets its own unique icon & color!
  if (actionType.includes("QUIZ")) return <Star size={22} color="#f59e0b" />;
  if (actionType.includes("RECIPE") || actionType.includes("FOOD")) return <BookOpen size={22} color="#8b5cf6" />;
  if (actionType.includes("POST")) return <Image size={22} color="#ec4899" />; // Pink Image icon for Posts
  if (actionType.includes("DISCUSSION") || actionType.includes("COMMENT")) return <MessageSquare size={22} color="#3b82f6" />;
  
  // 2. Fallbacks for generic statuses
  if (actionType.includes("APPROVE") || actionType.includes("COMPLETED")) return <CheckCircle2 size={22} color="#10b981" />;

  return <Award size={22} color="#916848" />;
};

const getReferenceTitle = (actionType, referenceId, referenceTitle, t) => {
  // If the backend successfully found the name, use it!
  if (referenceTitle) return referenceTitle; 
  
  if (actionType === "QUIZ_COMPLETED") {
    return t("profile.quizSubtitle"); 
  }
  
  // FIXED: Separated POST and DISCUSSION so they don't share the same fallback text
  if (actionType.includes("RECIPE")) return `Recipe #${referenceId}`;
  if (actionType.includes("POST")) return `Community Post #${referenceId}`;
  if (actionType.includes("DISCUSSION") || actionType.includes("COMMENT")) return `Discussion #${referenceId}`;
  
  return `Item #${referenceId}`;
};

const getPaginationGroup = (currentPage, totalPages, isMobile) => {
  const visibleCount = isMobile ? 3 : 5;
  if (totalPages <= visibleCount) return Array.from({ length: totalPages }, (_, i) => i + 1);

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
  const [currentPage, setCurrentPage] = useState(1);
  const [logs, setLogs] = useState([]); 
  const [totalPages, setTotalPages] = useState(1); 
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 500);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchXpLogs = async () => {
      setIsLoading(true);
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const response = await fetch(`${API_BASE_URL}/api/xp/logs?page=${currentPage}`, {
          method: "GET",
          credentials: "include", 
          headers: { "Content-Type": "application/json" }
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
          
          <button className="lrp-btn lrp-btn-outline xlp-btn" onClick={() => navigate(-1)}>
            {t("profile.backToProfile")}
          </button>

          <div className="upp-card">
            <h2 className="upp-card-title xlp-card-title">{t("profile.xpLogsTitle")}</h2>
            <p className="upp-muted2 xlp-muted2" style={{ marginBottom: "24px" }}>
                {t("profile.xpLogsDesc")}
            </p>

            {isLoading ? (
               <div className="loading-spinner" style={{ textAlign: "center", padding: "3rem", color: "#916848" }}>
                 <Trophy size={40} className="spinner-bounce" style={{ marginBottom: "10px", opacity: 0.5 }} />
                 <p>{t("profile.loadingLogs", "Loading your achievements...")}</p>
               </div>
            ) : logs.length === 0 ? (
               <div className="no-logs" style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
                 <Award size={48} style={{ marginBottom: "15px", opacity: 0.3 }} />
                 <h3>{t("profile.noLogsTitle", "No XP Earned Yet")}</h3>
                 <p>{t("profile.noLogsDesc", "Start participating in the community to earn XP and level up!")}</p>
               </div>
            ) : (
              <div className="xp-log-list" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {logs.map((log) => (
                  <div 
                    key={log.id} 
                    className="xp-log-item"
                    style={{ 
                      display: "flex", alignItems: "center", padding: "16px", 
                      backgroundColor: "#fafaf9", border: "1px solid #e7e5e4",
                      borderRadius: "12px", gap: "16px",
                      transition: "transform 0.2s ease, box-shadow 0.2s ease"
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.05)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
                  >
                    
                    <div style={{ 
                      display: "flex", alignItems: "center", justifyContent: "center", 
                      width: "48px", height: "48px", backgroundColor: "#fff", 
                      borderRadius: "50%", border: "1px solid #e7e5e4",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.02)", flexShrink: 0
                    }}>
                      {getActionIcon(log.action_type)}
                    </div>

                    <div className="xp-log-info" style={{ flex: 1 }}>
                      <div className="xp-log-action" style={{ fontWeight: "700", color: "#292524", fontSize: "1.05rem" }}>
                        {formatActionType(log.action_type, t)}
                      </div>
                      
                      <div className="xp-log-details" style={{ color: "#57534e", fontSize: "0.9rem", marginTop: "2px", fontWeight: "500" }}>
                        {getReferenceTitle(log.action_type, log.reference_id, log.reference_title, t)}
                      </div>
                      
                      <div className="upp-muted2" style={{ color: "#a8a29e", fontSize: "0.8rem", marginTop: "4px" }}>
                        {new Date(log.created_at).toLocaleDateString(
                          i18n.language === 'ms' ? 'ms-MY' : 'en-US',
                          { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
                        )}
                      </div>
                    </div>

                    <div 
                      className={`xp-log-amount ${log.xp_awarded > 0 ? "xp-positive" : "xp-negative"}`}
                      style={{ 
                        fontWeight: "800", fontSize: "1.1rem", 
                        color: log.xp_awarded > 0 ? "#059669" : "#dc2626", 
                        backgroundColor: log.xp_awarded > 0 ? "#d1fae5" : "#fee2e2", 
                        padding: "8px 16px", borderRadius: "20px", whiteSpace: "nowrap"
                      }}
                    >
                      {log.xp_awarded > 0 ? "+" : ""}{log.xp_awarded} XP
                    </div>

                  </div>
                ))}
              </div>
            )}

            {totalPages > 1 && !isLoading && (
              <div className="efp-pagination upp-pagination xlp-pagination" style={{ marginTop: "30px" }}>
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