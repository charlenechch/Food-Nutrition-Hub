// AdminSystemSettings.jsx
import React, { useMemo, useState, useEffect } from "react";
import {
    FiSettings as Settings,
    FiBell as Bell,
    FiAlertTriangle as AlertTriangle,
    FiArchive as Archive,
    FiDownload as Download,
    FiMail as Mail,
    FiFileText as FileText,
    FiX as X,
    FiCheckCircle as CheckIcon,
    FiCalendar as Calendar
} from "react-icons/fi";
import Modal from "../components/Modal";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function AdminSystemSettings({
    onPageChange = () => { },
    language = "en",
    users = [],
}) {
    const navigate = useNavigate();
    const [emailEnabled, setEmailEnabled] = useState(true);
    const platformName = "SarawakEats";
    const platformemail = "info@sarawakeats.com";

    const [availableYears, setAvailableYears] = useState([]);
    const [loadingYears, setLoadingYears] = useState(false);
    const [availableMonths, setAvailableMonths] = useState([]);
    const [loadingMonths, setLoadingMonths] = useState(false);

    const t = {
        platform: "SarawakEats",
        backupRestore: "Backup/Restore",
        dataExport: "Data Export",
        backup: "Backup",
        restore: "Restore",
    };
    
    useEffect(() => {
        fetchAvailableYears();
    }, []);

    const fetchAvailableYears = async () => {
        try {
            setLoadingYears(true);
            const response = await fetch(`${API_URL}/api/export/available-years`);
            
            if (!response.ok) {
                console.error('Failed to fetch available years:', response.status);
                // Fallback to current year if API fails
                setAvailableYears([new Date().getFullYear()]);
                return;
            }
            
            const data = await response.json();
            
            if (data.success && data.years && data.years.length > 0) {
                setAvailableYears(data.years);
                // Set default year to the most recent year
                const mostRecentYear = Math.max(...data.years);
                setExportOptions(prev => ({ 
                    ...prev, 
                    year: mostRecentYear 
                }));
            } else {
                // Fallback to current year if no years found
                const currentYear = new Date().getFullYear();
                setAvailableYears([currentYear]);
                setExportOptions(prev => ({ 
                    ...prev, 
                    year: currentYear 
                }));
            }
        } catch (error) {
            console.error('Error fetching available years:', error);
            // Fallback to current year
            const currentYear = new Date().getFullYear();
            setAvailableYears([currentYear]);
        } finally {
            setLoadingYears(false);
        }
    };

    // Fetch available months when year changes
    useEffect(() => {
        if (exportOptions.rangeType === 'month') {
            fetchAvailableMonths(exportOptions.year);
        }
    }, [exportOptions.year, exportOptions.rangeType]);

    const fetchAvailableMonths = async (year) => {
        try {
            setLoadingMonths(true);
            const response = await fetch(`${API_URL}/api/export/available-months?year=${year}`);
            
            if (!response.ok) {
                console.error('Failed to fetch available months:', response.status);
                // Fallback to all months if API fails
                setAvailableMonths([1,2,3,4,5,6,7,8,9,10,11,12]);
                return;
            }
            
            const data = await response.json();
            
            if (data.success && data.months && data.months.length > 0) {
                setAvailableMonths(data.months.sort((a, b) => a - b));
                
                // If current month is not available, select the first available month
                if (!data.months.includes(exportOptions.month)) {
                    setExportOptions(prev => ({ 
                        ...prev, 
                        month: data.months[0] 
                    }));
                }
            } else {
                // Fallback to all months if no months found
                setAvailableMonths([1,2,3,4,5,6,7,8,9,10,11,12]);
            }
        } catch (error) {
            console.error('Error fetching available months:', error);
            // Fallback to all months
            setAvailableMonths([1,2,3,4,5,6,7,8,9,10,11,12]);
        } finally {
            setLoadingMonths(false);
        }
    };

    function formatNowKuching() {
        return new Intl.DateTimeFormat("en-MY", {
            timeZone: "Asia/Kuching",
            dateStyle: "long",   // e.g., 3 November 2025
            timeStyle: "short",  // e.g., 10:35 PM
        }).format(new Date());
    }

    function fillTokens(str) {
        if (!str) return "";
        const now = formatNowKuching();
        return str.replaceAll("{DATE}", now);
    }

    
    const SYSTEM_EMAIL_TEMPLATES = {
        "Custom message": { subject: "", message: "" },
        "Maintenance Notice": {
            subject: "Scheduled Maintenance Notice",
            message:
                `Hello,\n\nWe will perform scheduled maintenance from <Date>, <Time> to <Date>, <Time>. ${platformName} may be unavailable during this time.\n\nThanks,\nSystem Admin`,
        },
        "Policy Update": {
            subject: "Platform Policy Update - {DATE}",
            message:
                `Hello,\n\nWe've updated our community guidelines and privacy policyon {DATE}. Please review the changes in the Terms of Service and Privacy Policy at the website footer section.\n\nThanks,\nSystem Admin`,
        },
        "System Update": {
            subject: `${platformName} Platform Update - {DATE}`,
            message:
                `Hello,\n\nWeve made updates to ${platformName} including <brief summary of changes>. These improvements were deployed on {DATE}.\n\nIf you notice any issues, please report them to our ${platformemail}.\n\nThanks,\nSystem Admin`,
        },
        "Outage Resolved": {
            subject: `${platformName} Service Restored - {DATE}`,
            message:
                `Hello,\n\nService has been restored on ${platformName}. A fix has been applied and service was fully restored on {DATE}.\n\nWe apologize for the disruption. If you still experience issues, please contact ${platformemail}.\n\nThanks,\nSystem Admin`,
        },
    };

    const allUsers = useMemo(
        () => (users && users.length ? users : [
            { id: 1, name: "Admin A", email: "admin.a@example.com", role: "Admin" },
            { id: 2, name: "User A", email: "user.a@example.com", role: "User" },
        ]),
        [users]
    );

    const adminIds = allUsers.filter(u => u.role === "Admin").map(u => u.id);

    const parseCustomEmails = (text) => {
        if (!text?.trim()) return [];
        const seen = new Set();
        return text.split(",")
            .map(s => s.trim())
            .filter(s => s && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s))
            .filter(s => (seen.has(s) ? false : (seen.add(s), true)));
    };

    // --- modal state (System Settings copy) ---
    const [showSysEmailModal, setShowSysEmailModal] = useState(false);
    const [sysSpecificSearch, setSysSpecificSearch] = useState("");
    const [sysEmailForm, setSysEmailForm] = useState({
        recipientsOption: "All users",     // same options as UM
        selectedUserIds: [],
        customEmails: "",
        template: "Custom message",
        subject: SYSTEM_EMAIL_TEMPLATES["Custom message"].subject,
        message: SYSTEM_EMAIL_TEMPLATES["Custom message"].message,
        markAnnouncement: true,
    });

    const [sysDialog, setSysDialog] = useState({
        open: false,
        title: "",
        message: "",
        icon: null,
        primaryText: "OK",
        onPrimary: null,
    });

    const closeSysDialog = () => setSysDialog((m) => ({ ...m, open: false, onPrimary: null }));

    const [showExportModal, setShowExportModal] = useState(false);
    const [exportOptions, setExportOptions] = useState({
        format: 'excel',
        rangeType: 'year',
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Jan 1 of current year
        endDate: new Date().toISOString().split('T')[0], // Today
    });

    useEffect(() => {
        if (!showExportModal) return;
        const onKey = (e) => e.key === "Escape" && setShowExportModal(false);
        document.addEventListener("keydown", onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = prev;
        };
    }, [showExportModal]);

    const [exportLoading, setExportLoading] = useState({ 
        csv: false, 
        reportExcel: false,
        reportPdf: false 
    });

    const handleExport = async (type) => {
        if (type === 'analytics-report') {
            setShowExportModal(true);
            return;
        }
        
        // Original food CSV export logic
        if (type === 'food-csv') {
            try {
                setExportLoading(prev => ({ ...prev, csv: true }));
                const endpoint = `${API_URL}/api/export/food-csv`;
                const filename = `food-database-${new Date().toISOString().split('T')[0]}.csv`;
                
                const response = await fetch(endpoint, {
                    method: 'GET',
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Export failed: ${response.status} ${response.statusText}`);
                }

                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                
                link.href = url;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);

            } catch (error) {
                console.error('Export error:', error);
                toast.error(`Failed to export: ${error.message}`);
            } finally {
                setExportLoading(prev => ({ ...prev, csv: false }));
            }
        }
    };

    const handleAnalyticsExport = async () => {
        // Date validation for future months
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1; // JavaScript months are 0-11
        
        // Check if selected year is in the future
        if (exportOptions.year > currentYear) {
            setSysDialog({
                open: true,
                title: "Invalid Year",
                message: `Year ${exportOptions.year} is in the future. Please select ${currentYear} or earlier.`,
                icon: <AlertTriangle />,
                primaryText: "OK",
                onPrimary: closeSysDialog,
            });
            return;
        }
        
        // Check if selected month is in the future
        if (exportOptions.year === currentYear && exportOptions.month > currentMonth) {
            const monthName = new Date(exportOptions.year, exportOptions.month - 1).toLocaleString('default', { month: 'long' });
            setSysDialog({
                open: true,
                title: "Invalid Month",
                message: `${monthName} ${exportOptions.year} hasn't occurred yet. Please select a month up to ${getMonthName(currentMonth)} ${currentYear}.`,
                icon: <AlertTriangle />,
                primaryText: "OK",
                onPrimary: closeSysDialog,
            });
            return;
        }

        if (exportOptions.rangeType === 'custom' && (!exportOptions.startDate || !exportOptions.endDate)) {
            setSysDialog({
                open: true,
                title: "Missing Dates",
                message: "Please select both start and end dates for custom range.",
                icon: <AlertTriangle />,
                primaryText: "OK",
                onPrimary: closeSysDialog,
            });
            return;
        }

        // Validate custom date range
        if (exportOptions.rangeType === 'custom') {
            const start = new Date(exportOptions.startDate);
            const end = new Date(exportOptions.endDate);
            const today = new Date();
            
            // Check if start date is after end date
            if (start > end) {
                setSysDialog({
                    open: true,
                    title: "Invalid Date Range",
                    message: "Start date cannot be after end date.",
                    icon: <AlertTriangle />,
                    primaryText: "OK",
                    onPrimary: closeSysDialog,
                });
                return;
            }
            
            // Check if dates are in the future
            if (start > today || end > today) {
                setSysDialog({
                    open: true,
                    title: "Future Dates",
                    message: "Cannot export data from future dates. Please select dates up to today.",
                    icon: <AlertTriangle />,
                    primaryText: "OK",
                    onPrimary: closeSysDialog,
                });
                return;
            }
        }

        try {
            // Set loading based on format
            const loadingKey = exportOptions.format === 'pdf' ? 'reportPdf' : 'reportExcel';
            setExportLoading(prev => ({ ...prev, [loadingKey]: true }));
            
            // Build query parameters based on selected options
            let queryParams = new URLSearchParams();
            queryParams.append('format', exportOptions.format);
            
            if (exportOptions.rangeType === 'year') {
                queryParams.append('year', exportOptions.year);
            } else if (exportOptions.rangeType === 'month') {
                // For month, we'll use year and month parameters
                queryParams.append('year', exportOptions.year);
                queryParams.append('month', exportOptions.month);
            } else if (exportOptions.rangeType === 'custom') {
                // For custom range, we'll need to update backend to handle date ranges
                if (exportOptions.startDate) {
                    queryParams.append('startDate', exportOptions.startDate);
                }
                if (exportOptions.endDate) {
                    queryParams.append('endDate', exportOptions.endDate);
                }
            }
            
            const endpoint = `${API_URL}/api/export/analytics-report?${queryParams.toString()}`;
            const extension = exportOptions.format === 'pdf' ? 'pdf' : 'xlsx';
            
            // Generate filename based on options
            let filename = `sarawakeats-analytics-report`;
            if (exportOptions.rangeType === 'year') {
                filename += `-${exportOptions.year}`;
            } else if (exportOptions.rangeType === 'month') {
                const monthName = new Date(exportOptions.year, exportOptions.month - 1).toLocaleString('default', { month: 'long' });
                filename += `-${monthName}-${exportOptions.year}`;
            } else if (exportOptions.rangeType === 'custom') {
                filename += `-${exportOptions.startDate || 'start'}-to-${exportOptions.endDate || 'end'}`;
            }
            filename += `.${extension}`;

            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Accept': exportOptions.format === 'excel' 
                        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                        : 'application/pdf' 
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Export failed: ${response.status} ${response.statusText}`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            setShowExportModal(false);
            
            // Show success message
            setSysDialog({
                open: true,
                title: "Export Successful",
                message: `Analytics report exported successfully as ${exportOptions.format.toUpperCase()}`,
                icon: <CheckIcon />,
                primaryText: "OK",
                onPrimary: closeSysDialog,
            });

        } catch (error) {
            console.error('Export error:', error);
            toast.error(`Failed to export: ${error.message}`);
        } finally {
            const loadingKey = exportOptions.format === 'pdf' ? 'reportPdf' : 'reportExcel';
            setExportLoading(prev => ({ ...prev, [loadingKey]: false }));
        }
    };

    function getMonthName(monthNumber) {
        const months = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'
        ];
        return months[monthNumber - 1] || 'Unknown';
    }

    // lock scroll like UM
    useEffect(() => {
        if (!showSysEmailModal) return;
        const onKey = (e) => e.key === "Escape" && setShowSysEmailModal(false);
        document.addEventListener("keydown", onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = prev;
        };
    }, [showSysEmailModal]);

    const filteredSysUsers = allUsers.filter(u => {
        if (!sysSpecificSearch.trim()) return true;
        const q = sysSpecificSearch.toLowerCase();
        return (
            u.name.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            (u.city || "").toLowerCase().includes(q)
        );
    });

    const sysTotalRecipients = (() => {
        switch (sysEmailForm.recipientsOption) {
            case "All users": return allUsers.length;
            case "Administrators only": return adminIds.length;
            case "Specific users": return sysEmailForm.selectedUserIds.length;
            case "Custom Email Addresses": return parseCustomEmails(sysEmailForm.customEmails).length;
            default: return 0;
        }
    })();

    return (
        <div className="admset-wrap">
            <div className="admset-grid">
                {/* ===== Left Card: Settings / Communication / Monitoring ===== */}
                <div className="admset-card">
                    <div className="admset-card-header">
                        <h3 className="admset-card-title">
                            <Settings className="admset-ic" />
                            {t.platform} Settings Configuration
                        </h3>
                    </div>

                    <div className="admset-card-content">
                        {/* Email notifications switch */}
                        <div className="admset-block">
                            <div className="admset-row between">
                                <label htmlFor="admset-notif" className="admset-label">
                                    Email Notifications
                                </label>
                                <button
                                    id="admset-notif"
                                    type="button"
                                    className={`admset-switch ${emailEnabled ? "is-on" : ""}`}
                                    aria-pressed={emailEnabled}
                                    onClick={() => setEmailEnabled((v) => !v)}
                                >
                                    <span className="knob" />
                                </button>
                            </div>
                        </div>

                        <hr className="admset-sep" />

                        {/* Communication */}
                        <div className="admset-block">
                            <div className="admset-label mb-6">Communication</div>
                            <div className="admset-grid-1">
                                <button
                                    className="admset-btn admset-btn-outline justify-start"
                                    onClick={() => setShowSysEmailModal(true)}
                                >
                                    <Mail className="admset-ic-sm" />
                                    Send Announcement
                                </button>
                            </div>
                        </div>

                        <hr className="admset-sep" />

                        {/* Monitoring */}
                        <div className="admset-block">
                            <div className="admset-label mb-6">System Monitoring</div>
                            <div className="admset-grid-2">
                                <button
                                    className="admset-btn admset-btn-outline justify-start relative"
                                    onClick={() => navigate("/admin/systemalerts")}
                                >
                                    <Bell className="admset-ic-sm" />
                                    View Alerts
                                    <span className="admset-badge danger">12</span>
                                </button>

                                <button
                                    className="admset-btn admset-btn-outline justify-start relative"
                                    onClick={() => navigate("/admin/systemerrorlogs")}
                                >
                                    <AlertTriangle className="admset-ic-sm" />
                                    Error Logs
                                    <span className="admset-badge warn">8</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ===== Right Card: Backup/Restore & Export ===== */}
                <div className="admset-card">
                    <div className="admset-card-header">
                        <h3 className="admset-card-title">
                            <Archive className="admset-ic" />
                            {t.backupRestore} &nbsp;& {t.dataExport}
                        </h3>
                    </div>

                    <div className="admset-card-content">
                        {/* Last backup */}
                        <div className="admset-block">
                            <div className="admset-callout">
                                <div>
                                    <p>Last Backup</p>
                                    <p className="muted">January 15, 2024</p>
                                </div>
                                <span className="admset-badge good">Success</span>
                            </div>

                            <div className="admset-grid-2 mt-12">
                                <button className="admset-btn admset-btn-primary">
                                    <Archive className="admset-ic-sm" />
                                    {t.backup}
                                </button>
                                <button className="admset-btn admset-btn-outline primary-outline">
                                    <Download className="admset-ic-sm" />
                                    {t.restore}
                                </button>
                            </div>
                        </div>

                        <hr className="admset-sep" />

                        {/* Export with format selection */}
                        <div className="admset-block">
                            <div className="admset-label mb-6">Data Export Options</div>
                            <div className="space-y-4"> {/* Vertical spacing */}
                                {/* Food Database */}
                                <button 
                                    className="admset-btn admset-btn-outline w-full justify-start"
                                    onClick={() => handleExport('food-csv')}
                                    disabled={exportLoading.csv}
                                >
                                    <Download className="admset-ic-sm" />
                                    {exportLoading.csv ? 'Exporting...' : 'Export Food Database (CSV)'}
                                </button>

                                {/* Analytics Report - Single button that opens modal */}
                                <button 
                                    className="admset-btn admset-btn-outline w-full justify-start"
                                    onClick={() => handleExport('analytics-report')}
                                    disabled={exportLoading.reportExcel || exportLoading.reportPdf}
                                >
                                    <Download className="admset-ic-sm" />
                                    {exportLoading.reportExcel || exportLoading.reportPdf 
                                        ? 'Exporting...' 
                                        : 'Export Analytics Report'}
                                </button>               
                            </div>        
                        </div>
                    </div>
                </div>
            </div>
            {showSysEmailModal && (
                <div
                    className="umg-modal-backdrop"
                    role="dialog"
                    aria-modal="true"
                    onClick={() => setShowSysEmailModal(false)}
                >
                    <div className="umg-modal" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="umg-modal-header">
                            <h3><Mail size={18} /> Send System Announcement</h3>
                            <button className="umg-modal-close" onClick={() => setShowSysEmailModal(false)} aria-label="Close">×</button>
                        </div>

                        {/* Body */}
                        <div className="umg-modal-body">
                            {/* Recipients */}
                            <div className="umg-field">
                                <label className="umg-label">Recipients</label>
                                <select
                                    className="umg-input"
                                    value={sysEmailForm.recipientsOption}
                                    onChange={(e) => setSysEmailForm({ ...sysEmailForm, recipientsOption: e.target.value })}
                                >
                                    <option>All users</option>
                                    <option>Administrators only</option>
                                    {/* If you want to allow picking specific users from Settings, keep this next option */}
                                    <option>Specific users</option>
                                    <option>Custom Email Addresses</option>
                                </select>

                                {/* Specific users */}
                                {sysEmailForm.recipientsOption === "Specific users" && (
                                    <div className="umg-specific-list">
                                        <input
                                            className="umg-input"
                                            placeholder="Search users to select…"
                                            value={sysSpecificSearch}
                                            onChange={(e) => setSysSpecificSearch(e.target.value)}
                                        />
                                        <div className="umg-specific-scroll">
                                            {filteredSysUsers.length === 0 ? (
                                                <div className="umg-empty">No matches.</div>
                                            ) : (
                                                filteredSysUsers.map(u => (
                                                    <label key={u.id} className="umg-specific-row">
                                                        <input
                                                            type="checkbox"
                                                            className="umg-row-checkbox"
                                                            checked={sysEmailForm.selectedUserIds.includes(u.id)}
                                                            onChange={(e) => {
                                                                const checked = e.target.checked;
                                                                setSysEmailForm(prev => ({
                                                                    ...prev,
                                                                    selectedUserIds: checked
                                                                        ? [...prev.selectedUserIds, u.id]
                                                                        : prev.selectedUserIds.filter(id => id !== u.id),
                                                                }));
                                                            }}
                                                        />
                                                        <div>
                                                            <div className="umg-name">{u.name}</div>
                                                            <div className="umg-subline">{u.email}</div>
                                                            {u.city && <div className="umg-subline">{u.city}</div>}
                                                        </div>
                                                    </label>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Custom emails */}
                                {sysEmailForm.recipientsOption === "Custom Email Addresses" && (
                                    <div className="umg-field">
                                        <label className="umg-label">Enter email addresses</label>
                                        <textarea
                                            className="umg-input umg-textarea"
                                            placeholder="alice@mail.com, bob@mail.com"
                                            value={sysEmailForm.customEmails}
                                            onChange={(e) => setSysEmailForm({ ...sysEmailForm, customEmails: e.target.value })}
                                        />
                                    </div>
                                )}

                                <div className="umg-hint">Total Recipients: {sysTotalRecipients}</div>
                            </div>

                            {/* Template */}
                            <div className="umg-field">
                                <label className="umg-label">Email Template</label>
                                <select
                                    className="umg-input"
                                    value={sysEmailForm.template}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        const tpl = SYSTEM_EMAIL_TEMPLATES[value] || { subject: "", message: "" };
                                        setSysEmailForm(prev => ({
                                            ...prev,
                                            template: value,
                                            subject: fillTokens(tpl.subject),
                                            message: fillTokens(tpl.message),
                                        }));
                                    }}
                                >
                                    {Object.keys(SYSTEM_EMAIL_TEMPLATES).map(k => (
                                        <option key={k} value={k}>{k}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Subject */}
                            <div className="umg-field">
                                <label className="umg-label">Subject</label>
                                <input
                                    className="umg-input"
                                    placeholder="Enter email subject"
                                    value={sysEmailForm.subject}
                                    onChange={(e) => setSysEmailForm(prev => ({ ...prev, subject: e.target.value }))}
                                />
                            </div>

                            {/* Message */}
                            <div className="umg-field">
                                <label className="umg-label">Message</label>
                                <textarea
                                    className="umg-input umg-textarea"
                                    placeholder="Enter your message"
                                    value={sysEmailForm.message}
                                    onChange={(e) => setSysEmailForm(prev => ({ ...prev, message: e.target.value }))}
                                />
                            </div>

                            {/* Announcement */}
                            <label className="umg-check">
                                <input
                                    type="checkbox"
                                    checked={sysEmailForm.markAnnouncement}
                                    onChange={(e) => setSysEmailForm({ ...sysEmailForm, markAnnouncement: e.target.checked })}
                                />
                                <div>
                                    <div><Bell size={16} /> Mark as Announcement</div>
                                    <div className="umg-check-hint">Announcements appear in user notifications</div>
                                </div>
                            </label>
                        </div>

                        {/* Footer */}
                        <div className="umg-modal-footer">
                            <button className="umg-btn-secondary" onClick={() => setShowSysEmailModal(false)}>Cancel</button>
                            <button
                                className="umg-btn-primary"
                                onClick={() => {
                                        if (!sysEmailForm.subject.trim() || !sysEmailForm.message.trim()) {
                                        setSysDialog({
                                            open: true,
                                            title: "Missing Required Fields",
                                            message: "Please provide a subject and message.",
                                            icon: <AlertTriangle />,
                                            primaryText: "OK",
                                            onPrimary: closeSysDialog,
                                        });
                                        return;
                                    }
                                    let recipients = [];
                                    if (sysEmailForm.recipientsOption === "All users") {
                                        recipients = allUsers.map(u => u.email);
                                    } else if (sysEmailForm.recipientsOption === "Administrators only") {
                                        recipients = allUsers.filter(u => u.role === "Admin").map(u => u.email);
                                    } else if (sysEmailForm.recipientsOption === "Specific users") {
                                        const chosen = new Set(sysEmailForm.selectedUserIds);
                                        recipients = allUsers.filter(u => chosen.has(u.id)).map(u => u.email);
                                    } else if (sysEmailForm.recipientsOption === "Custom Email Addresses") {
                                        recipients = parseCustomEmails(sysEmailForm.customEmails);
                                    }

                                    console.log("SYSTEM SETTINGS SEND ▶", {
                                        ...sysEmailForm,
                                        recipients,
                                        total: recipients.length,
                                    });

                                    setShowSysEmailModal(false);
                                    setSysDialog({
                                        open: true,
                                        title: "Announcement Sent",
                                        message: `Your message will be sent to ${recipients.length} recipient(s).`,
                                        icon: <CheckIcon />,
                                        primaryText: "Done",
                                        onPrimary: closeSysDialog,
                                    });
                                }}
                            >
                                Send Email
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showExportModal && (
                <div
                    className="umg-modal-backdrop"
                    role="dialog"
                    aria-modal="true"
                    onClick={() => setShowExportModal(false)}
                >
                    <div className="umg-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        {/* Header */}
                        <div className="umg-modal-header">
                            <h3><FileText size={18} /> Export Analytics Report</h3>
                            <button className="umg-modal-close" onClick={() => setShowExportModal(false)} aria-label="Close">×</button>
                        </div>

                        {/* Body */}
                        <div className="umg-modal-body">
                            {/* Format Selection */}
                            <div className="umg-field">
                                <label className="umg-label">Export Format</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="exportFormat"
                                            value="excel"
                                            checked={exportOptions.format === 'excel'}
                                            onChange={(e) => setExportOptions(prev => ({ ...prev, format: e.target.value }))}
                                            className="w-4 h-4"
                                        />
                                        <FileText className="admset-ic-sm" />
                                        <span>Excel (.xlsx)</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="exportFormat"
                                            value="pdf"
                                            checked={exportOptions.format === 'pdf'}
                                            onChange={(e) => setExportOptions(prev => ({ ...prev, format: e.target.value }))}
                                            className="w-4 h-4"
                                        />
                                        <FileText className="admset-ic-sm" />
                                        <span>PDF (.pdf)</span>
                                    </label>
                                </div>
                            </div>

                            {/* Date Range Selection */}
                            <div className="umg-field">
                                <label className="umg-label">Date Range</label>
                                <select
                                    className="umg-input"
                                    value={exportOptions.rangeType}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setExportOptions(prev => ({ 
                                            ...prev, 
                                            rangeType: value,
                                            // Reset custom dates when changing range type
                                            ...(value !== 'custom' && { startDate: '', endDate: '' })
                                        }));
                                    }}
                                >
                                    <option value="year">Full Year</option>
                                    <option value="month">Specific Month</option>
                                    <option value="custom">Custom Range</option>
                                </select>
                            </div>

                            {/* Year Selection */}
                            {(exportOptions.rangeType === 'year' || exportOptions.rangeType === 'month') && (
                                <div className="umg-field">
                                    <label className="umg-label">Select Year</label>
                                    <select
                                        className="umg-input"
                                        value={exportOptions.year}
                                        onChange={(e) => setExportOptions(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                                        disabled={loadingYears}
                                    >
                                        {loadingYears ? (
                                            <option value="">Loading years...</option>
                                        ) : availableYears.length === 0 ? (
                                            <option value="">No years available</option>
                                        ) : (
                                            availableYears.map(year => (
                                                <option key={year} value={year}>
                                                    {year}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                    {loadingYears && (
                                        <div className="text-xs text-gray-500 mt-1">Fetching years from database...</div>
                                    )}
                                    {!loadingYears && availableYears.length > 0 && (
                                        <div className="text-xs text-gray-500 mt-1">
                                            Showing {availableYears.length} year{availableYears.length !== 1 ? 's' : ''} with data
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Month Selection */}
                            {exportOptions.rangeType === 'month' && (
                                <div className="umg-field">
                                    <label className="umg-label">Select Month</label>
                                    <select
                                        className="umg-input"
                                        value={exportOptions.month}
                                        onChange={(e) => setExportOptions(prev => ({ ...prev, month: parseInt(e.target.value) }))}
                                        disabled={loadingMonths}
                                    >
                                        {loadingMonths ? (
                                            <option value="">Loading months...</option>
                                        ) : availableMonths.length === 0 ? (
                                            <option value="">No months available for {exportOptions.year}</option>
                                        ) : (
                                            availableMonths.map(monthNum => {
                                                const date = new Date(exportOptions.year, monthNum - 1);
                                                const currentYear = new Date().getFullYear();
                                                const currentMonth = new Date().getMonth() + 1;
                                                
                                                // Disable future months
                                                const isFuture = exportOptions.year > currentYear || 
                                                                (exportOptions.year === currentYear && monthNum > currentMonth);
                                                
                                                return (
                                                    <option 
                                                        key={monthNum} 
                                                        value={monthNum}
                                                        disabled={isFuture}
                                                        className={isFuture ? 'text-gray-400' : ''}
                                                    >
                                                        {date.toLocaleString('default', { month: 'long' })}
                                                        {isFuture && ' (Future)'}
                                                    </option>
                                                );
                                            })
                                        )}
                                    </select>
                                    {loadingMonths && (
                                        <div className="text-xs text-gray-500 mt-1">Fetching months from database...</div>
                                    )}
                                    {!loadingMonths && availableMonths.length > 0 && (
                                        <div className="text-xs text-gray-500 mt-1">
                                            Showing {availableMonths.length} month{availableMonths.length !== 1 ? 's' : ''} with data in {exportOptions.year}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Custom Date Range */}
                            {exportOptions.rangeType === 'custom' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="umg-field">
                                        <label className="umg-label">Start Date</label>
                                        <input
                                            type="date"
                                            className="umg-input"
                                            value={exportOptions.startDate}
                                            onChange={(e) => setExportOptions(prev => ({ ...prev, startDate: e.target.value }))}
                                            max={exportOptions.endDate || new Date().toISOString().split('T')[0]}
                                        />
                                    </div>
                                    <div className="umg-field">
                                        <label className="umg-label">End Date</label>
                                        <input
                                            type="date"
                                            className="umg-input"
                                            value={exportOptions.endDate}
                                            onChange={(e) => setExportOptions(prev => ({ ...prev, endDate: e.target.value }))}
                                            min={exportOptions.startDate}
                                            max={new Date().toISOString().split('T')[0]}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Preview Info */}
                            <div className="umg-field p-3 bg-gray-50 rounded">
                                <div className="text-sm text-gray-600">
                                    <div className="font-medium mb-1">Export Summary:</div>
                                    <div>Format: {exportOptions.format.toUpperCase()}</div>
                                    {exportOptions.rangeType === 'year' && (
                                        <div>Period: Full Year {exportOptions.year}</div>
                                    )}
                                    {exportOptions.rangeType === 'month' && (
                                        <div>Period: {new Date(exportOptions.year, exportOptions.month - 1).toLocaleString('default', { month: 'long' })} {exportOptions.year}</div>
                                    )}
                                    {exportOptions.rangeType === 'custom' && (
                                        <div>Period: {exportOptions.startDate || 'Start'} to {exportOptions.endDate || 'End'}</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="umg-modal-footer">
                            <button className="umg-btn-secondary" onClick={() => setShowExportModal(false)}>
                                Cancel
                            </button>
                            <button
                                className="umg-btn-primary"
                                onClick={handleAnalyticsExport}
                                disabled={exportLoading.reportExcel || exportLoading.reportPdf}
                            >
                                {exportLoading.reportExcel || exportLoading.reportPdf ? (
                                    <>
                                        <span className="animate-spin mr-2">⏳</span>
                                        Exporting...
                                    </>
                                ) : (
                                    <>
                                        <Download className="admset-ic-sm mr-2" />
                                        Export Report
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            <Modal
                open={sysDialog.open}
                title={sysDialog.title}
                icon={sysDialog.icon}
                primaryText={sysDialog.primaryText}
                onClose={closeSysDialog}
                onPrimary={sysDialog.onPrimary}
            >
                {sysDialog.message}
            </Modal>
        </div>
    );
}
