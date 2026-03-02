import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../css/SystemAlertPage.css";
import { IoEyeOutline } from "react-icons/io5";
import { TriangleAlert, OctagonAlert, CircleCheckBig, CircleAlert } from "lucide-react";
import { FaLongArrowAltLeft } from "react-icons/fa";
import { LuRefreshCw } from "react-icons/lu";
import { TbPackageExport } from "react-icons/tb";


export default function SystemErrorLogsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [logsSeverityFilter, setLogsSeverityFilter] = useState("All Severities");
  const [logsSourceFilter, setLogsSourceFilter] = useState("All Sources");

  const logs = [
    {
      severity: "Critical",
      source: "Backend",
      type: "Database Connection Issues",
      message:
        "Connection to primary database failed after 3 retry attempts.",
      timestamp: "2024-01-16 14:30:25",
    },
    {
      severity: "Warning",
      source: "Database",
      type: "Database Corruption Detected",
      message:
        "Table 'nutrition_data' shows signs of corruption.",
      timestamp: "2024-01-16 13:15:42",
    },
    {
      severity: "Critical",
      source: "Frontend",
      type: "JavaScript Runtime Error",
      message:
        "Cannot read property 'nutritionData' of undefined",
      timestamp: "2024-01-16 12:45:18",
    },
    {
      severity: "Warning",
      source: "API",
      type: "API Rate Limit Warning",
      message:
        "User approaching API rate limit threshold (90% of 1000 requests/hour)",
      timestamp: "2024-01-16 11:22:33",
    }
  ];

  const filteredLogs = logs.filter((a) => {
  const logsMatchesSearch =
    a.type.toLowerCase().includes(search.toLowerCase()) ||
    a.message.toLowerCase().includes(search.toLowerCase()) ||
    a.source.toLowerCase().includes(search.toLowerCase()) ||
    a.severity.toLowerCase().includes(search.toLowerCase());

  const logsMatchesSeverity =
    logsSeverityFilter === "All Severities" ||
    a.severity === logsSeverityFilter;

  const logsMatchesSource =
    logsSourceFilter === "All Sources" ||
    a.source === logsSourceFilter;

  return logsMatchesSearch && logsMatchesSeverity && logsMatchesSource;
  });


  return (
    <>
      <Header />
      <div className="admin-error-container">
        {/* ----- Header Section ----- */}
        <div className="admin-error-header">
          <button
              className="admin-system-error-back-btn-minimal"
            onClick={() => navigate("/admin")}
            >
            <strong><FaLongArrowAltLeft className="admin-system-settings-btn-icon"/> Back to Dashboard</strong>
        </button>

        <div className="admin-system-error-title-block">
            <h1 className="admin-system-error-title">System Error Logs</h1>
            <p className="admin-system-error-subtitle">Monitor and Troubleshoot System Errors</p>
        </div>

        <div className="admin-error-actions">
            <button className="admin-error-refresh-action-btn">
                <strong><LuRefreshCw className="admin-system-settings-btn-refresh-icon"/> Refresh Logs</strong>
            </button>
            <button className="admin-error-export-action-btn">
                <strong><TbPackageExport className="admin-system-settings-btn-icon"/> Export Logs</strong>
            </button>
        </div>
      </div>

      {/* ----- Summary Cards ----- */}
      <div className="admin-system-alerts-summary-grid">

        {/* Total Alerts */}
        <div className="admin-system-alerts-summary-card">
            <div className="summary-left">
            <h3>Total Errors</h3>
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
            <CircleCheckBig  className="admin-system-alerts-summary-icon success" />
        </div>
      </div>


      {/* ----- Filters Row ----- */}
      <div className="admin-system-error-filter-wrapper">
        <div className="admin-system-error-filter-row">
            
            <div className="admin-system-error-search-box">
                <input
                    type="text"
                    placeholder="Search errors..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <select
                className="admin-system-error-select"
                value={logsSeverityFilter}
                onChange={(e) => setLogsSeverityFilter(e.target.value)}
            >
            <option>All Severities</option>
            <option>Critical</option>
            <option>Warning</option>
            <option>Resolved</option>
            </select>

            <select
                className="admin-system-error-select"
                value={logsSourceFilter}
                onChange={(e) => setLogsSourceFilter(e.target.value)}
            >
            <option>All Sources</option>
            <option>Frontend</option>
            <option>Backend</option>
            <option>Database</option>
            <option>API</option>
            </select>

            </div>
        </div>


      {/* ----- Alerts Table ----- */}
      <div className="admin-system-error-table-box">
        <h3 className="admin-system-error-table-title">Error Logs ({filteredLogs.length})</h3>

        <table className="admin-system-error-table">
          <thead>
            <tr>
              <th>Severity</th>
              <th>Source</th> 
              <th>Error Type</th>
              <th>Message</th>
              <th>Timestamp</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredLogs.map((logs, index) => (
              <tr key={index}>
                <td data-label="Severity">
                  <span className={`admin-system-error-sev-badge ${logs.severity.toLowerCase()}`}>
                    {logs.severity}
                  </span>
                </td>

                <td data-label="Source">
                  <div className="admin-system-error-source">{logs.source}</div>
                </td>

                <td data-label="Type">
                  <div className="admin-system-error-title">{logs.type}</div>
                </td>

                <td data-label="Message">
                  <div className="admin-system-error-message">{logs.message}</div>
                </td>

                <td data-label="Timestamp" className="admin-system-error-timestamp">{logs.timestamp}</td>

              
                <td className="admin-system-error-action-icons" data-label="Actions">
                    <div className="admin-system-error-action-wrapper">
                        <button className="admin-system-error-preview-btn"><IoEyeOutline /></button>
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
