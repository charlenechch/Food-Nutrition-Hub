import React, { useState } from "react";
import "../css/SystemAlertPage.css";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { IoEyeOutline } from "react-icons/io5";
import { AiOutlineExclamationCircle } from "react-icons/ai";
import { TriangleAlert, OctagonAlert, CircleCheckBig, CircleAlert } from "lucide-react";
import { FaLongArrowAltLeft } from "react-icons/fa";
import { LuRefreshCw } from "react-icons/lu";
import { TbPackageExport } from "react-icons/tb";


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

  const filteredAlerts = alerts.filter((a) => {
  const searchText = search.toLowerCase();

  const matchesSearch =
    a.type.toLowerCase().includes(searchText) ||
    a.message.toLowerCase().includes(searchText) ||
    a.category.toLowerCase().includes(searchText) ||
    a.severity.toLowerCase().includes(searchText) ||
    a.status.toLowerCase().includes(searchText) ||
    a.tags.some(tag => tag.toLowerCase().includes(searchText));

  const matchesSeverity =
    severityFilter === "All Severities" ||
    a.severity === severityFilter;

  const matchesStatus =
    statusFilter === "All Statuses" ||
    a.status === statusFilter;

  return matchesSearch && matchesSeverity && matchesStatus;
});


  return (
    <>
      <Header />
      <div className="admin-alerts-container">
        {/* ----- Header Section ----- */}
        <div className="admin-alerts-header">
          <button
              className="admin-system-alert-back-btn-minimal"
            onClick={() => navigate("/admin")}
            >
            <strong><FaLongArrowAltLeft className="admin-system-settings-btn-icon"/> Back to Dashboard</strong>
        </button>

        <div className="admin-system-alerts-title-block">
            <h1 className="admin-system-alerts-title">System Alerts & Notifications</h1>
            <p className="admin-system-alerts-subtitle">Monitor System Health and Critical Events</p>
        </div>

        <div className="admin-alerts-actions">
            <button className="admin-alerts-refresh-action-btn">
                <strong><LuRefreshCw className="admin-system-settings-btn-refresh-icon"/> Refresh Alerts</strong>
            </button>
            <button className="admin-alerts-export-action-btn">
                <strong><TbPackageExport className="admin-system-settings-btn-icon"/> Export Alerts</strong>
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
            <OctagonAlert className="admin-system-alerts-summary-icon alert" />
        </div>

        {/* Critical Alerts */}
        <div className="admin-system-alerts-summary-card critical">
            <div className="summary-left">
            <h3>Critical Alerts</h3>
            <p className="number">3</p>
            </div>
            <TriangleAlert className="admin-system-alerts-summary-icon critical" />
        </div>

        {/* Warning Alerts */}
        <div className="admin-system-alerts-summary-card warning">
            <div className="summary-left">
            <h3>Warning Alerts</h3>
            <p className="number">5</p>
            </div>
            <CircleAlert className="admin-system-alerts-summary-icon warning" />
        </div>

        {/* Resolved Today */}
        <div className="admin-system-alerts-summary-card success">
            <div className="summary-left">
            <h3>Resolved Today</h3>
            <p className="number">1</p>
            </div>
            <CircleCheckBig className="admin-system-alerts-summary-icon success" />
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
                <td data-label="Severity">
                  <span className={`admin-system-alerts-sev-badge ${alert.severity.toLowerCase()}`}>
                    {alert.severity}
                  </span>
                </td>

                <td data-label="Type">
                  <div className="admin-system-alert-title">{alert.type}</div>
                  <div className="admin-system-alert-category">{alert.category}</div>
                </td>

                <td data-label="Message">
                  {alert.message}
                  <div className="admin-system-alerts-tag-list">
                    {alert.tags.map((tag, i) => (
                      <span key={i} className="admin-system-alerts-tag-chip">{tag}</span>
                    ))}
                  </div>
                </td>

                <td className="admin-system-alerts-timestamp" data-label="Timestamp">{alert.timestamp}</td>

                <td data-label="Status">
                  <span className={`admin-system-alerts-status-badge ${alert.status.toLowerCase()}`}>
                    {alert.status}
                  </span>
                </td>

                <td className="admin-system-alerts-action-icons" data-label="Actions">
                    <div className="admin-system-alerts-action-wrapper">
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
    <Footer />
    </>
  );
}
