import React, { useState } from "react";
import "../css/SystemAlertPage.css";
import { IoEyeOutline } from "react-icons/io5";
import { AiOutlineExclamationCircle } from "react-icons/ai";
import { TriangleAlert } from "lucide-react";
import { SiTicktick } from "react-icons/si";
import { useNavigate } from "react-router-dom";


export default function SystemAlertsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("All Severities");
  const [statusFilter, setStatusFilter] = useState("All Statuses");

  const alerts = [
    {
      severity: "Critical",
      type: "System Overload Detected",
      category: "System Monitor",
      message:
        "CPU usage has exceeded 95% for the past 15 minutes. Immediate attention required.",
      tags: ["Web Server", "API Gateway"],
      timestamp: "2024-01-16 14:30:25",
      status: "Active",
    },
    {
      severity: "Warning",
      type: "Database Connection Issues",
      category: "Database Monitor",
      message:
        "Connection pool showing signs of stress. Consider scaling database connections.",
      tags: ["User Service", "Food Database"],
      timestamp: "2024-01-16 13:15:42",
      status: "Acknowledged",
    },
    {
      severity: "Critical",
      type: "User Authentication Failures",
      category: "Security Monitor",
      message:
        "Multiple failed login attempts detected. Possible brute force attack.",
      tags: ["Authentication Service"],
      timestamp: "2024-01-16 12:45:18",
      status: "Active",
    },
    {
      severity: "Warning",
      type: "Low Disk Space Warning",
      category: "Storage Monitor",
      message:
        "Server disk usage at 87%. Consider cleaning up old logs or expanding storage.",
      tags: ["File System", "Log Storage"],
      timestamp: "2024-01-16 11:22:33",
      status: "Active",
    }
  ];

  const filteredAlerts = alerts.filter((a) =>
    a.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-alerts-container">
      {/* ----- Header Section ----- */}
      <div className="admin-alerts-header">
        <button
            className="admin-system-alert-back-btn-minimal"
            onClick={() => navigate("/admin")}
            >
            ← Back to Dashboard
        </button>

        <div className="admin-system-alerts-title-block">
            <h1 className="admin-system-alerts-title">System Alerts & Notifications</h1>
            <p className="admin-system-alerts-subtitle">Monitor system health and critical events</p>
        </div>

        <div className="admin-alerts-actions">
            <button className="admin-alerts-refresh-action-btn">
                ↻ Refresh Alerts
            </button>
            <button className="admin-alerts-export-action-btn">
                ⬇ Export Alerts
            </button>
        </div>
      </div>

      {/* ----- Summary Cards ----- */}
      <div className="admin-system-alerts-summary-grid">

        {/* Total Alerts */}
        <div className="admin-system-alerts-summary-card">
            <div className="summary-left">
            <h3>Total Alerts</h3>
            <p className="number">12</p>
            </div>
            <AiOutlineExclamationCircle className="summary-icon right alert" />
        </div>

        {/* Critical Alerts */}
        <div className="admin-system-alerts-summary-card critical">
            <div className="summary-left">
            <h3>Critical Alerts</h3>
            <p className="number">3</p>
            </div>
            <TriangleAlert className="admin-system-alerts-summary-icon right critical" />
        </div>

        {/* Warning Alerts */}
        <div className="admin-system-alerts-summary-card warning">
            <div className="summary-left">
            <h3>Warning Alerts</h3>
            <p className="number">5</p>
            </div>
            <AiOutlineExclamationCircle className="summary-icon right warning" />
        </div>

        {/* Resolved Today */}
        <div className="admin-system-alerts-summary-card success">
            <div className="summary-left">
            <h3>Resolved Today</h3>
            <p className="number">1</p>
            </div>
            <SiTicktick className="summary-icon right success" />
        </div>
      </div>


      {/* ----- Filters Row ----- */}
      <div className="admin-system-alerts-filter-wrapper">
        <div className="admin-system-alerts-filter-row">
            
            <div className="admin-system-alerts-search-box">
                <input
                    type="text"
                    placeholder="Search alerts..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <select
                className="admin-system-alerts-select"
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
            >
            <option>All Severities</option>
            <option>Critical</option>
            <option>Warning</option>
            <option>Resolved</option>
            </select>

            <select
                className="admin-system-alerts-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
            >
            <option>All Statuses</option>
            <option>Active</option>
            <option>Acknowledged</option>
            <option>Resolved</option>
            </select>

            </div>
        </div>


      {/* ----- Alerts Table ----- */}
      <div className="admin-system-alerts-table-box">
        <h3 className="admin-system-alerts-table-title">System Alerts ({filteredAlerts.length})</h3>

        <table className="admin-system-alerts-table">
          <thead>
            <tr>
              <th>Severity</th>
              <th>Alert Type</th>
              <th>Message</th>
              <th>Timestamp</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredAlerts.map((alert, index) => (
              <tr key={index}>
                <td>
                  <span className={`admin-system-alerts-sev-badge ${alert.severity.toLowerCase()}`}>
                    {alert.severity}
                  </span>
                </td>

                <td>
                  <div className="admin-system-alert-title">{alert.type}</div>
                  <div className="admin-system-alert-category">{alert.category}</div>
                </td>

                <td>
                  {alert.message}
                  <div className="admin-system-alerts-tag-list">
                    {alert.tags.map((tag, i) => (
                      <span key={i} className="admin-system-alerts-tag-chip">{tag}</span>
                    ))}
                  </div>
                </td>

                <td className="admin-system-alerts-timestamp">{alert.timestamp}</td>

                <td>
                  <span className={`admin-system-alerts-status-badge ${alert.status.toLowerCase()}`}>
                    {alert.status}
                  </span>
                </td>

                <td className="admin-system-alerts-action-icons">
                    <div className="action-wrapper">
                        <button className="admin-system-alerts-preview-btn"><IoEyeOutline /></button>
                        <button>↻</button>
                        <button className="admin-system-alerts-delete-btn">✖</button>
                    </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
