import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BsFileEarmarkCheck } from "react-icons/bs";

const ContentModerationSection = ({ pendingContent = [], onlyApproved = false }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // === Modal & Feedback State ===
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [feedback, setFeedback] = useState("");

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
    if (start > 1) pages.push("...");
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages) pages.push("...");

    return pages.map((p, index) => (
      <button
        key={index}
        onClick={() => p !== "..." && handlePageChange(p)}
        className={`${currentPage === p ? "active" : ""} ${
          p === "..." ? "umg-dots" : ""
        }`}
        disabled={p === "..."}
      >
        {p}
      </button>
    ));
  };

  // === Rejection Handlers ===
  const handleOpenReject = (item) => {
    setSelectedItem(item);
    setShowRejectModal(true);
  };

  const handleConfirmReject = async () => {
    if (feedback.trim().length === 0) return;

    // TODO: Replace with your actual API call for the Food Heritage Management System
    // Example: await api.rejectContent(selectedItem.id, feedback);

    // Reset state and close modal after successful API call
    setShowRejectModal(false);
    setFeedback("");
    setSelectedItem(null);
  };

  const handleCancelReject = () => {
    setShowRejectModal(false);
    setFeedback("");
    setSelectedItem(null);
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
    <div className="content-moderation-section" style={{ position: "relative" }}>
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
                    {t("adminRcpDB.review", "Review")}
                  </button>
                  <button
                    className="reject-btn"
                    onClick={() => handleOpenReject(item)}
                    style={{ marginLeft: "8px", backgroundColor: "#ff4d4f", color: "white", border: "none", padding: "5px 10px", borderRadius: "4px", cursor: "pointer" }}
                  >
                    {t("adminRcpDB.reject", "Reject")}
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

      {/* === Rejection Modal === */}
      {showRejectModal && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            className="modal-content"
            style={{
              backgroundColor: "#fff",
              padding: "24px",
              borderRadius: "8px",
              width: "400px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            }}
          >
            <h3 style={{ marginTop: 0 }}>
              {t("adminContentMode.rejectReasonTitle", "Reason for Rejection")}
            </h3>
            <p style={{ fontSize: "14px", color: "#666", marginBottom: "16px" }}>
              Please provide a reason for rejecting{" "}
              <strong>{selectedItem?.name}</strong>. This feedback is required.
            </p>

            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="e.g., Image quality too low, recipe missing measurements..."
              required
              style={{
                width: "100%",
                minHeight: "100px",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                marginBottom: "16px",
                fontFamily: "inherit",
              }}
            />

            <div
              className="modal-actions"
              style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}
            >
              <button
                onClick={handleCancelReject}
                style={{
                  padding: "8px 16px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                  backgroundColor: "#f5f5f5",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                className="confirm-reject-btn"
                disabled={feedback.trim().length < 5}
                onClick={handleConfirmReject}
                style={{
                  padding: "8px 16px",
                  borderRadius: "4px",
                  border: "none",
                  backgroundColor: feedback.trim().length < 5 ? "#ccc" : "#ff4d4f",
                  color: "white",
                  cursor: feedback.trim().length < 5 ? "not-allowed" : "pointer",
                }}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentModerationSection;