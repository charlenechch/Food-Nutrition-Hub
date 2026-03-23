import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FiActivity, FiSearch, FiArrowLeft, FiChevronLeft, FiChevronRight, FiTrash2 } from "react-icons/fi";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../css/AdminDashboard.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const ACTION_TYPE_KEYS = [
    { value: "all", key: "allActions" },
    { value: "user_created", key: "userCreated" },
    { value: "user_updated", key: "userUpdated" },
    { value: "user_suspended", key: "userSuspended" },
    { value: "user_unsuspended", key: "userUnsuspended" },
    { value: "user_deleted", key: "userDeleted" },
    { value: "food_created", key: "foodCreated" },
    { value: "food_updated", key: "foodUpdated" },
    { value: "food_deleted", key: "foodDeleted" },
    { value: "post_approved", key: "postApproved" },
    { value: "post_rejected", key: "postRejected" },
    { value: "recipe_approved", key: "recipeApproved" },
    { value: "recipe_rejected", key: "recipeRejected" },
    { value: "announcement_sent", key: "announcementSent" },
    { value: "logs_cleared", key: "logsCleared" },
];

const ACTION_BADGE = {
    user_created:       { key: "userCreated",       color: "#2e7d32", bg: "#e8f5e9" },
    user_updated:       { key: "userUpdated",       color: "#1565c0", bg: "#e3f2fd" },
    user_suspended:     { key: "userSuspended",     color: "#b71c1c", bg: "#ffebee" },
    user_unsuspended:   { key: "userUnsuspended",   color: "#2e7d32", bg: "#e8f5e9" },
    user_deleted:       { key: "userDeleted",       color: "#b71c1c", bg: "#ffebee" },
    food_created:       { key: "foodCreated",       color: "#e65100", bg: "#fff3e0" },
    food_updated:       { key: "foodUpdated",       color: "#e65100", bg: "#fff3e0" },
    food_deleted:       { key: "foodDeleted",       color: "#b71c1c", bg: "#ffebee" },
    post_approved:      { key: "postApproved",      color: "#2e7d32", bg: "#e8f5e9" },
    post_rejected:      { key: "postRejected",      color: "#b71c1c", bg: "#ffebee" },
    recipe_approved:    { key: "recipeApproved",    color: "#2e7d32", bg: "#e8f5e9" },
    recipe_rejected:    { key: "recipeRejected",    color: "#b71c1c", bg: "#ffebee" },
    announcement_sent:  { key: "announcementSent",  color: "#6a1b9a", bg: "#f3e5f5" },
    logs_cleared:       { key: "logsCleared",       color: "#5f5040", bg: "#f1e6d8" },
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
    const { t } = useTranslation();
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
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [clearing, setClearing] = useState(false);
    const [clearOption, setClearOption] = useState("30");
    const [customCutoff, setCustomCutoff] = useState("");

    const getCutoffDate = () => {
        if (clearOption === "custom") return customCutoff;
        const date = new Date();
        date.setDate(date.getDate() - parseInt(clearOption));
        return date.toISOString().split("T")[0];
    };

    const handleClearLogs = async () => {
        const cutoffDate = getCutoffDate();
        if (!cutoffDate) return alert("Please select a valid cutoff date.");
        setClearing(true);
        try {
            const res = await fetch(`${API_URL}/api/admin/activityLog`, {
                method: "DELETE",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cutoffDate }),
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.message);
            setShowClearConfirm(false);
            setClearOption("30");
            setCustomCutoff("");
            await fetchLogs();
        } catch (err) {
            alert("Failed to clear logs: " + err.message);
        } finally {
            setClearing(false);
        }
    };

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
        <>
        <Header />
        <div className="admin-dashboard">
            {/* Header */}
            <div className="dashboard-header activity-log-header">
                <button
                    onClick={() => navigate("/admin")}
                    className="al-back-btn"
                >
                    <FiArrowLeft size={18} /> {t("adminActivityLog.backToDashboard")}
                </button>
                <div className="activity-log-title-row">
                    <div>
                        <h1><FiActivity /> {t("adminActivityLog.pageTitle")}</h1>
                        <p>{t("adminActivityLog.pageSubtitle")}</p>
                    </div>
                    <button
                        className="admset-btn admset-btn-outline al-clear-btn"
                        onClick={() => setShowClearConfirm(true)}
                    >
                        <FiTrash2 size={15} /> {t("adminActivityLog.clearOldLogs")}
                    </button>
                </div>
            </div>

            {/* Clear Logs Modal */}
            {showClearConfirm && (
                <div className="modal-overlay" onClick={() => setShowClearConfirm(false)}>
                    <div className="modal-box" onClick={e => e.stopPropagation()}>
                        <div className="modal-title">{t("adminActivityLog.clearLogsTitle")}</div>
                        <div className="modal-body">
                            <p className="al-modal-desc">
                                {t("adminActivityLog.clearLogsDesc")}
                            </p>
                            <div className="umg-field">
                                <label className="umg-label">{t("adminActivityLog.deleteOlderThan")}</label>
                                <select
                                    className="umg-input"
                                    value={clearOption}
                                    onChange={e => { setClearOption(e.target.value); setCustomCutoff(""); }}
                                >
                                    <option value="30">{t("adminActivityLog.30days")}</option>
                                    <option value="60">{t("adminActivityLog.60days")}</option>
                                    <option value="90">{t("adminActivityLog.90days")}</option>
                                    <option value="365">{t("adminActivityLog.1year")}</option>
                                    <option value="custom">{t("adminActivityLog.customDate")}</option>
                                </select>
                            </div>
                            {clearOption === "custom" && (
                                <div className="umg-field al-custom-date-field">
                                    <label className="umg-label">{t("adminActivityLog.deleteOlderThanDate")}</label>
                                    <input
                                        type="date"
                                        className="umg-input"
                                        value={customCutoff}
                                        max={new Date().toISOString().split("T")[0]}
                                        onChange={e => setCustomCutoff(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>
                        <div className="modal-actions">
                            <button
                                className="admset-btn admset-btn-outline"
                                onClick={() => { setShowClearConfirm(false); setClearOption("30"); setCustomCutoff(""); }}
                            >
                                {t("adminActivityLog.cancel")}
                            </button>
                            <button
                                className="umg-error-retry-btn al-confirm-delete-btn"
                                onClick={handleClearLogs}
                                disabled={clearing || (clearOption === "custom" && !customCutoff)}
                            >
                                {clearing ? t("adminActivityLog.clearing") : t("adminActivityLog.confirmDelete")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="food-database-section">
                <div className="food-filters al-filters">

                    {/* Search */}
                    <form onSubmit={handleSearchSubmit} className="search-box al-search-box">
                        <span className="search-icon"><FiSearch /></span>
                        <input
                            type="text"
                            placeholder={t("adminActivityLog.searchPlaceholder")}
                            value={searchInput}
                            onChange={e => setSearchInput(e.target.value)}
                        />
                    </form>

                    {/* Action Type */}
                    <div className="filter-item al-filter-select">
                        <select
                            className="admin-beige-trigger"
                            value={filters.actionType}
                            onChange={e => handleFilterChange("actionType", e.target.value)}
                        >
                            {ACTION_TYPE_KEYS.map(a => (
                                <option key={a.value} value={a.value}>{t(`adminActivityLog.${a.key}`)}</option>
                            ))}
                        </select>
                    </div>

                    {/* Start Date */}
                    <div className="filter-item al-filter-date">
                        <input
                            type="date"
                            className="admin-beige-trigger"
                            value={filters.startDate}
                            max={filters.endDate || undefined}
                            onChange={e => handleFilterChange("startDate", e.target.value)}
                        />
                    </div>

                    {/* End Date */}
                    <div className="filter-item al-filter-date">
                        <input
                            type="date"
                            className="admin-beige-trigger"
                            value={filters.endDate}
                            min={filters.startDate || undefined}
                            onChange={e => handleFilterChange("endDate", e.target.value)}
                        />
                    </div>

                    {/* Reset */}
                    <button
                        className="admset-btn admset-btn-outline al-reset-btn"
                        onClick={handleReset}
                    >
                        {t("adminActivityLog.resetFilters")}
                    </button>
                </div>

                {/* Total count */}
                <p className="al-entries-count">
                    {t("adminActivityLog.entriesFound", { count: total })}
                </p>

                {/* Table */}
                {loading ? (
                    <div className="skeleton-table" />
                ) : error ? (
                    <div className="umg-loading-container">
                        <div className="umg-error-icon">⚠️</div>
                        <div className="umg-error-title">{t("adminActivityLog.failedToLoad")}</div>
                        <div className="umg-error-message">{error}</div>
                        <button className="umg-error-retry-btn" onClick={fetchLogs}>{t("adminActivityLog.retry")}</button>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="umg-loading-container">
                        <div className="al-empty-icon">📋</div>
                        <div className="umg-loading-text">{t("adminActivityLog.noLogsFound")}</div>
                    </div>
                ) : (
                    <div className="al-table-wrapper">
                        <table className="food-table">
                            <thead>
                                <tr>
                                    <th>{t("adminActivityLog.col_number")}</th>
                                    <th>{t("adminActivityLog.col_admin")}</th>
                                    <th>{t("adminActivityLog.col_action")}</th>
                                    <th>{t("adminActivityLog.col_description")}</th>
                                    <th>{t("adminActivityLog.col_datetime")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log, index) => {
                                    const badge = ACTION_BADGE[log.actionType] || { key: null, color: "#5f5040", bg: "#f1e6d8" };
                                    return (
                                        <tr key={log.logID}>
                                            <td className="al-td-number">
                                                {(filters.page - 1) * 20 + index + 1}
                                            </td>
                                            <td className="al-td-admin">{log.adminName}</td>
                                            <td>
                                                <span
                                                    className="al-badge"
                                                    style={{ background: badge.bg, color: badge.color }}
                                                >
                                                    {badge.key ? t(`adminActivityLog.${badge.key}`) : log.actionType}
                                                </span>
                                            </td>
                                            <td className="al-td-description">{log.description}</td>
                                            <td className="al-td-datetime">
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
                    <div className="al-pagination">
                        <button
                            className="food-database-btn-edit al-pagination-btn"
                            onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                            disabled={filters.page === 1}
                        >
                            <FiChevronLeft />
                        </button>
                        <span className="al-pagination-text">
                            {t("adminActivityLog.page", { current: filters.page, total: totalPages })}
                        </span>
                        <button
                            className="food-database-btn-edit al-pagination-btn"
                            onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                            disabled={filters.page === totalPages}
                        >
                            <FiChevronRight />
                        </button>
                    </div>
                )}
            </div>
        </div>
        <Footer />
        </>
    );
}