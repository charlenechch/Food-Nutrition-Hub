import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BsFileEarmarkCheck } from "react-icons/bs";

const ContentModerationSection = ({ pendingContent = [], onlyApproved = false }) => {
  const navigate = useNavigate();
  
   // === Pagination ===
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentItems = pendingContent.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(pendingContent.length / itemsPerPage);

  const handlePageChange = (pageNum) => {
    if (pageNum >= 1 && pageNum <= totalPages) setCurrentPage(pageNum);
  };

  // === Dynamic Heading ===
  const title = onlyApproved
    ? "Approved Content Database"
    : "Pending / Rejected Content Review";

// === Defensive check ===
  if (!pendingContent || pendingContent.length === 0) {
    return (
      <div className="content-moderation-section">
        <h2>
          <BsFileEarmarkCheck style={{ marginRight: 8 }} />
          {title}
        </h2>
        <p style={{ textAlign: "center", marginTop: "20px" }}>No content available.</p>
      </div>
    );
  }

  return (
    <div className="content-moderation-section">
      <div className="content-header">
        <h2>
          <BsFileEarmarkCheck /> {title}
        </h2>
      </div>

       <table className="content-table" style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Content</th>
            <th>Submitter</th>
            <th>Date</th>
            <th>Status</th>
            {!onlyApproved && <th>Actions</th>}
          </tr>
        </thead>

        <tbody>
          {currentItems.map((item) => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>{item.submitter}</td>
              <td>{item.date}</td>
              <td>
                <span className={`recipe-status-tag ${item.status.toLowerCase().replace(" ", "-")}`}>
                  {item.status}
                </span>
              </td>
              {!onlyApproved && (
                <td className="admin-recipe-action-buttons">
                  <button className="review-btn" onClick={() => navigate(`/admin/reviewcontent/${item.id}`)}>
                    Review
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="admin-pagination">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            ‹ Prev
          </button>

          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => handlePageChange(i + 1)}
              className={currentPage === i + 1 ? "active" : ""}
            >
              {i + 1}
            </button>
          ))}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next ›
          </button>
        </div>
      )}
    </div>
  );
};


export default ContentModerationSection;
