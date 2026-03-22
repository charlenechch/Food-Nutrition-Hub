import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BsFileEarmarkCheck } from "react-icons/bs";

const ContentModerationSection = ({ pendingContent = [], onlyApproved = false }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Normalize incoming data
  const formattedContent = pendingContent.map((item) => ({
    id: item.id || item.recipeID || item.ID || Math.random(),
    name: item.name || item.recipe_name || t("adminContentMode.untitledRecipe"),
    submitter: item.submitter || item.author || t("adminContentMode.unknownAuthor"),
    date: item.date || item.updated || item.updatedAt || "—",
    status: item.status || "Pending",
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
          {currentItems.map((item) => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>{item.submitter}</td>
              <td>{item.date}</td>
              <td>
                <span
                  className={`recipe-status-tag ${item.status
                    .toLowerCase()
                    .replace(" ", "-")}`}
                >
                  {item.status}
                </span>
              </td>

              {!onlyApproved && (
                <td className="admin-recipe-action-buttons">
                  <button
                    className="review-btn"
                    onClick={() => navigate(`/admin/reviewcontent/${item.id}`)}
                  >
                    {t("adminRcpDB.review")}
                  </button>
                </td>
              )}
            </tr>
          ))}
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