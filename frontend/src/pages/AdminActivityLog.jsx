import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FiActivity, FiSearch, FiArrowLeft, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import "../css/AdminDashboard.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const ACTION_TYPES = [
    { value: "all", label: "All Actions" },
    { value: "user_created", label: "User Created" },
    { value: "user_updated", label: "User Updated" },
    { value: "user_suspended", label: "User Suspended" },
    { value: "user_unsuspended", label: "User Unsuspended" },
    { value: "user_deleted", label: "User Deleted" },
    { value: "food_created", label: "Food Created" },
    { value: "food_updated", label: "Food Updated" },
    { value: "food_deleted", label: "Food Deleted" },
    { value: "post_approved", label: "Post Approved" },
    { value: "post_rejected", label: "Post Rejected" },
    { value: "recipe_approved", label: "Recipe Approved" },
    { value: "recipe_rejected", label: "Recipe Rejected" },
    { value: "announcement_sent", label: "Announcement Sent" },
];

const ACTION_BADGE = {
    user_created:       { label: "User Created",       color: "#2e7d32", bg: "#e8f5e9" },
    user_updated:       { label: "User Updated",       color: "#1565c0", bg: "#e3f2fd" },
    user_suspended:     { label: "User Suspended",     color: "#b71c1c", bg: "#ffebee" },
    user_unsuspended:   { label: "User Unsuspended",   color: "#2e7d32", bg: "#e8f5e9" },
    user_deleted:       { label: "User Deleted",       color: "#b71c1c", bg: "#ffebee" },
    food_created:       { label: "Food Created",       color: "#e65100", bg: "#fff3e0" },
    food_updated:       { label: "Food Updated",       color: "#e65100", bg: "#fff3e0" },
    food_deleted:       { label: "Food Deleted",       color: "#b71c1c", bg: "#ffebee" },
    post_approved:      { label: "Post Approved",      color: "#2e7d32", bg: "#e8f5e9" },
    post_rejected:      { label: "Post Rejected",      color: "#b71c1c", bg: "#ffebee" },
    recipe_approved:    { label: "Recipe Approved",    color: "#2e7d32", bg: "#e8f5e9" },
    recipe_rejected:    { label: "Recipe Rejected",    color: "#b71c1c", bg: "#ffebee" },
    announcement_sent:  { label: "Announcement Sent", color: "#6a1b9a", bg: "#f3e5f5" },
};

function formatDate(dateStr) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString("en-GB", {
        timeZone: "Asia/Kuala_Lumpur",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    }).replace(",", "");
}

export default function AdminActivityLog() {
    const navigate = useNavigate();
    const [logs, setLogs] = useState([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [filters, setFilters] = useState({
        actionType: "all",
        startDate: "",
        endDate: "",
        search: "",
        page: 1,
    });

    const [searchInput, setSearchInput] = useState("");

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (filters.actionType !== "all") params.append("actionType", filters.actionType);
            if (filters.startDate) params.append("startDate", filters.startDate);
            if (filters.endDate) params.append("endDate", filters.endDate);
            if (filters.search) params.append("search", filters.search);
            params.append("page", filters.page);

            const res = await fetch(`${API_URL}/api/admin/activityLog?${params.toString()}`, {
                credentials: "include",
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.message || "Failed to fetch logs");
            setLogs(data.logs);
            setTotal(data.total);
            setTotalPages(data.totalPages);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        handleFilterChange("search", searchInput);
    };

    const handleReset = () => {
        setSearchInput("");
        setFilters({ actionType: "all", startDate: "", endDate: "", search: "", page: 1 });
    };

    return (
        <div className="admin-dashboard">
            {/* Header */}
            <div className="dashboard-header">
                <button
                    onClick={() => navigate("/admin")}
                    style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", color: "#916848", fontWeight: 600, fontSize: "15px", marginBottom: "12px", padding: 0 }}
                >
                    <FiArrowLeft size={18} /> Back to Dashboard
                </button>
                <h1 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <FiActivity /> Admin Activity Log
                </h1>
                <p>A record of all admin actions performed on the platform.</p>
            </div>

            {/* Filters */}
            <div className="food-database-section">
                <div className="food-filters" style={{ flexWrap: "wrap", gap: "12px" }}>

                    {/* Search */}
                    <form onSubmit={handleSearchSubmit} className="search-box" style={{ minWidth: "220px", flex: 2 }}>
                        <span className="search-icon"><FiSearch /></span>
                        <input
                            type="text"
                            placeholder="Search by admin or description..."
                            value={searchInput}
                            onChange={e => setSearchInput(e.target.value)}
                        />
                    </form>

                    {/* Action Type */}
                    <div className="filter-item" style={{ minWidth: "180px", flex: 1 }}>
                        <select
                            className="admin-beige-trigger"
                            style={{ width: "100%" }}
                            value={filters.actionType}
                            onChange={e => handleFilterChange("actionType", e.target.value)}
                        >
                            {ACTION_TYPES.map(a => (
                                <option key={a.value} value={a.value}>{a.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Start Date */}
                    <div className="filter-item" style={{ minWidth: "150px", flex: 1 }}>
                        <input
                            type="date"
                            className="admin-beige-trigger"
                            style={{ width: "100%", cursor: "pointer" }}
                            value={filters.startDate}
                            max={filters.endDate || undefined}
                            onChange={e => handleFilterChange("startDate", e.target.value)}
                        />
                    </div>

                    {/* End Date */}
                    <div className="filter-item" style={{ minWidth: "150px", flex: 1 }}>
                        <input
                            type="date"
                            className="admin-beige-trigger"
                            style={{ width: "100%", cursor: "pointer" }}
                            value={filters.endDate}
                            min={filters.startDate || undefined}
                            onChange={e => handleFilterChange("endDate", e.target.value)}
                        />
                    </div>

                    {/* Reset */}
                    <button
                        className="admset-btn admset-btn-outline"
                        onClick={handleReset}
                        style={{ height: "42px", whiteSpace: "nowrap" }}
                    >
                        Reset Filters
                    </button>
                </div>

                {/* Total count */}
                <p style={{ fontSize: "13px", color: "#7a6b5a", marginBottom: "16px" }}>
                    {total} {total === 1 ? "entry" : "entries"} found
                </p>

                {/* Table */}
                {loading ? (
                    <div className="skeleton-table" />
                ) : error ? (
                    <div className="umg-loading-container">
                        <div className="umg-error-icon">⚠️</div>
                        <div className="umg-error-title">Failed to load logs</div>
                        <div className="umg-error-message">{error}</div>
                        <button className="umg-error-retry-btn" onClick={fetchLogs}>Retry</button>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="umg-loading-container">
                        <div style={{ fontSize: "48px", marginBottom: "16px" }}>📋</div>
                        <div className="umg-loading-text">No activity logs found.</div>
                    </div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table className="food-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Admin</th>
                                    <th>Action</th>
                                    <th>Description</th>
                                    <th>Date & Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log, index) => {
                                    const badge = ACTION_BADGE[log.actionType] || { label: log.actionType, color: "#5f5040", bg: "#f1e6d8" };
                                    return (
                                        <tr key={log.logID}>
                                            <td style={{ color: "#a4886e", fontSize: "13px" }}>
                                                {(filters.page - 1) * 20 + index + 1}
                                            </td>
                                            <td style={{ fontWeight: 500 }}>{log.adminName}</td>
                                            <td>
                                                <span style={{
                                                    background: badge.bg,
                                                    color: badge.color,
                                                    padding: "3px 10px",
                                                    borderRadius: "10px",
                                                    fontSize: "12px",
                                                    fontWeight: 600,
                                                    whiteSpace: "nowrap",
                                                }}>
                                                    {badge.label}
                                                </span>
                                            </td>
                                            <td style={{ color: "#5f5040", fontSize: "14px" }}>{log.description}</td>
                                            <td style={{ color: "#7a6b5a", fontSize: "13px", whiteSpace: "nowrap" }}>
                                                {formatDate(log.createdAt)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "12px", marginTop: "24px" }}>
                        <button
                            className="food-database-btn-edit"
                            onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                            disabled={filters.page === 1}
                            style={{ borderRadius: "8px" }}
                        >
                            <FiChevronLeft />
                        </button>
                        <span style={{ fontSize: "14px", color: "#5f5040" }}>
                            Page {filters.page} of {totalPages}
                        </span>
                        <button
                            className="food-database-btn-edit"
                            onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                            disabled={filters.page === totalPages}
                            style={{ borderRadius: "8px" }}
                        >
                            <FiChevronRight />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}