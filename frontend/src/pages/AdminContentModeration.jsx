import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BsFileEarmarkCheck } from "react-icons/bs";

const ContentModerationSection = () => {
  const navigate = useNavigate();

  // 🔹 Dummy data for pending submissions
  const [pendingContent] = useState([
    {
      id: 1,
      name: "Manok Pansoh",
      submitter: "Joanna Lee",
      date: "2025-10-20",
      status: "Pending",
    },
    {
      id: 2,
      name: "Laksa Sarawak",
      submitter: "Brian Tan",
      date: "2025-10-22",
      status: "Pending",
    },
    {
      id: 3,
      name: "Kuih Lapis Sarawak",
      submitter: "Lucy Goh",
      date: "2025-10-23",
      status: "Pending",
    },
    {
      id: 4,
      name: "Midin Belacan",
      submitter: "Alyssa Young",
      date: "2025-10-25",
      status: "Rejected",
    },
  ]);

  return (
    <div className="content-moderation-section">
      <div className="content-header">
        <h2>
          <span className="content-icon">
            <BsFileEarmarkCheck />
          </span>{" "}
          Pending Submission Approval
        </h2>
      </div>

      <table className="content-table">
        <thead>
          <tr>
            <th>Content</th>
            <th>Submitter</th>
            <th>Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {pendingContent.map((item) => (
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
              <td className="admin-recipe-action-buttons">
                <button
                  className="review-btn"
                  onClick={() => navigate(`/admin/reviewcontent/${item.id}`)}
                >
                  Review
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ContentModerationSection;
