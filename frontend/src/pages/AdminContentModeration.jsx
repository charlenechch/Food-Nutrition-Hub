import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BsFileEarmarkCheck, BsPencil, BsCheckCircle } from "react-icons/bs";

const ContentModerationSection = ({ pendingContent = [], onlyApproved = false }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Normalize incoming data with type detection
  const formattedContent = pendingContent.map((item) => ({
    id: item.id || item.recipeID || item.ID || Math.random(),
    name: item.name || item.recipe_name || t("adminContentMode.untitledRecipe"),
    submitter: item.submitter || item.author || t("adminContentMode.unknownAuthor"),
    date: item.date || item.updated || item.updatedAt || "—",
    status: item.status || "Pending",
    type: item.type || (item.recipeID ? "recipe" : "communityPost"),
    recipeID: item.recipeID || item.id,
    postID: item.postID || item.id
  }));

  // === Pagination ===
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentItems = formattedContent.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(formattedContent.length / itemsPerPage);

  const handlePageChange = (pageNum) => {
    if (pageNum >= 1 && pageNum <= totalPages) setCurrentPage(pageNum);
  };

  // === Dynamic Title ===
  const title = onlyApproved
    ? t("adminContentMode.titleApproved")
    : t("adminContentMode.titlePending");

  // Handle review button click based on content type and status
  const handleReviewClick = (item) => {
    if (item.type === "recipe" && item.status === "Draft") {
      // For draft recipes that need admin editing before publishing
      navigate(`/admin/edit-food/${item.recipeID}?mode=finalize`);
    } else if (item.type === "recipe") {
      // For pending recipes
      navigate(`/admin/reviewcontent/${item.id}`);
    } else {
      // For community posts
      navigate(`/admin/reviewcontent/${item.id}`);
    }
  };

  // Handle final publish for recipes only
  const handlePublishClick = async (item) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const response = await fetch(`${API_URL}/api/recipes/publishRecipe/${item.recipeID}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert(t("adminContentMode.publishSuccess") || "Recipe published successfully!");
        window.location.reload();
      } else {
        alert(result.message || t("adminContentMode.publishFailed") || "Failed to publish recipe.");
      }
    } catch (error) {
      console.error("Error publishing recipe:", error);
      alert(t("adminContentMode.publishFailed") || "Failed to publish recipe.");
    }
  };

  const renderPageNumbers = () => {
    let start = currentPage - 1;
    let end = currentPage + 1;

    if (currentPage === 1) {
      end = 3;
    } else if (currentPage === totalPages) {
      start = totalPages - 2;
    }

    start = Math.max(1, start);
    end = Math.min(totalPages, end);

    let pages = [];
    if (start > 1) pages.push('...');
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages) pages.push('...');

    return pages.map((p, index) => (
      <button
        key={index}
        onClick={() => p !== '...' && handlePageChange(p)}
        className={`${currentPage === p ? "active" : ""} ${p === '...' ? "umg-dots" : ""}`}
        disabled={p === '...'}
      >
        {p}
      </button>
    ));
  };

  // Get status badge styling
  const getStatusBadgeStyle = (status) => {
    const statusLower = status.toLowerCase();
    switch(statusLower) {
      case 'approved':
        return {
          backgroundColor: '#D1FAE5',
          color: '#065F46',
          border: '1px solid #A7F3D0'
        };
      case 'pending':
        return {
          backgroundColor: '#E0E7FF',
          color: '#1E40AF',
          border: '1px solid #C7D2FE'
        };
      case 'rejected':
        return {
          backgroundColor: '#FEE2E2',
          color: '#991B1B',
          border: '1px solid #FECACA'
        };
      case 'draft':
        return {
          backgroundColor: '#FEF3C7',
          color: '#92400E',
          border: '1px solid #FDE68A'
        };
      default:
        return {
          backgroundColor: '#F3F4F6',
          color: '#374151',
          border: '1px solid #E5E7EB'
        };
    }
  };

  // Get status display text
  const getStatusDisplay = (status, type) => {
    if (type === "recipe" && status === "Draft") {
      return "Draft - Pending Edit";
    }
    return status;
  };

  // === Defensive check for empty content ===
  if (!formattedContent || formattedContent.length === 0) {
    return (
      <div className="content-moderation-section">
        <h2>
          <BsFileEarmarkCheck style={{ marginRight: 8 }} />
          {title}
        </h2>
        <p style={{ textAlign: "center", marginTop: "20px" }}>
          {t("adminContentMode.noContent")}
        </p>
      </div>
    );
  }

  // === Render Section ===
  return (
    <div className="content-moderation-section">
      <div className="content-header">
        <h2>
          <BsFileEarmarkCheck /> {title}
        </h2>
      </div>

      <table
        className="content-table"
        style={{ width: "100%", borderCollapse: "collapse" }}
      >
        <thead>
          <tr>
            <th>{t("adminContentMode.colContent")}</th>
            <th>{t("adminContentMode.colSubmitter")}</th>
            <th>{t("adminContentMode.colDate")}</th>
            <th>{t("adminRcpDB.colStatus")}</th>
            {!onlyApproved && <th>{t("adminRcpDB.colActions")}</th>}
          </tr>
        </thead>

        <tbody>
          {currentItems.map((item) => {
            const badgeStyle = getStatusBadgeStyle(item.status);
            
            return (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.submitter}</td>
                <td>{item.date}</td>
                <td>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "4px 12px",
                      borderRadius: "20px",
                      fontSize: "0.75rem",
                      fontWeight: "500",
                      ...badgeStyle
                    }}
                  >
                    {getStatusDisplay(item.status, item.type)}
                  </span>
                </td>

                {!onlyApproved && (
                  <td className="admin-recipe-action-buttons">
                    {/* For Recipes with Draft status - show special buttons */}
                    {item.type === "recipe" && item.status === "Draft" ? (
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => handleReviewClick(item)}
                          style={{
                            backgroundColor: "#F59E0B",
                            color: "#fff",
                            padding: "6px 12px",
                            borderRadius: "4px",
                            border: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            fontSize: "0.875rem"
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = "#D97706"}
                          onMouseLeave={(e) => e.target.style.backgroundColor = "#F59E0B"}
                        >
                          <BsPencil size={14} /> Edit & Finalize
                        </button>
                        <button
                          onClick={() => handlePublishClick(item)}
                          style={{
                            backgroundColor: "#10B981",
                            color: "#fff",
                            padding: "6px 12px",
                            borderRadius: "4px",
                            border: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            fontSize: "0.875rem"
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = "#059669"}
                          onMouseLeave={(e) => e.target.style.backgroundColor = "#10B981"}
                        >
                          <BsCheckCircle size={14} /> Publish
                        </button>
                      </div>
                    ) : (
                      // For all other content (pending recipes, community posts)
                      <button
                        onClick={() => handleReviewClick(item)}
                        style={{
                          backgroundColor: "#3B82F6",
                          color: "#fff",
                          padding: "6px 12px",
                          borderRadius: "4px",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "0.875rem"
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = "#2563EB"}
                        onMouseLeave={(e) => e.target.style.backgroundColor = "#3B82F6"}
                      >
                        {t("adminRcpDB.review") || "Review"}
                      </button>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="admin-pagination">
          <button
            className="umg-prev-next"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            ‹ {t("explore.prev")}
          </button>

          {renderPageNumbers()}

          <button
            className="umg-prev-next"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            {t("explore.next")} ›
          </button>
        </div>
      )}
    </div>
  );
};

export default ContentModerationSection;