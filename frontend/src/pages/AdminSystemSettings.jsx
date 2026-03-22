// AdminSystemSettings.jsx
import React, { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
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
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [emailEnabled, setEmailEnabled] = useState(true);
    const [fetchedUsers, setFetchedUsers] = useState([]);
    const platformName = "SarawakEats";
    const platformemail = "info@sarawakeats.com";

    const [availableYears, setAvailableYears] = useState([]);
    const [loadingYears, setLoadingYears] = useState(false);
    const [availableMonths, setAvailableMonths] = useState([]);
    const [loadingMonths, setLoadingMonths] = useState(false);

    function formatNowKuching() {
        return new Intl.DateTimeFormat("en-MY", {
            timeZone: "Asia/Kuching",
            dateStyle: "long",
            timeStyle: "short",
        }).format(new Date());
    }

    // function fillTokens(str) {
    //     if (!str) return "";
    //     const now = formatNowKuching();
    //     return str.replaceAll("{DATE}", now);
    // }

    const SYSTEM_EMAIL_TEMPLATES = {
        "Custom message": { subject: "", message: "" },
        "Maintenance Notice": {
            subject: "Scheduled Maintenance Notice",
            message:
                `Hello,\n\nWe will perform scheduled maintenance from <Date>, <Time> to <Date>, <Time>. ${platformName} may be unavailable during this time.\n\nThanks,\nSarawakEats Admin`,
        },
        "Policy Update": {
            subject: "Platform Policy Update",
            message:
                `Hello,\n\nWe've updated our community guidelines and privacy policy on <Date>. Please review the changes in the Terms of Service and Privacy Policy at the website footer section.\n\nThanks,\nSarawakEats Admin`,
        },
        "System Update": {
            subject: `${platformName} Platform Update`,
            message:
                `Hello,\n\nWe've made updates to ${platformName} including <brief summary of changes>. These improvements were deployed on <Date>.\n\nIf you notice any issues, please report them to our ${platformemail}.\n\nThanks,\nSarawakEats Admin`,
        },
        "Outage Resolved": {
            subject: `${platformName} Service Restored`,
            message:
                `Hello,\n\nService has been restored on ${platformName}. A fix has been applied and service was fully restored on <Date>.\n\nWe apologize for the disruption. If you still experience issues, please contact ${platformemail}.\n\nThanks,\nSarawakEats Admin`,
        },
    };

    useEffect(() => {
        const loadUsers = async () => {
            try {
                const res = await fetch(`${API_URL}/api/admin/users`, {
                    credentials: "include",
                });
                const data = await res.json();
                if (data.success) setFetchedUsers(data.users);
            } catch (err) {
                console.error("Failed to fetch users:", err);
            }
        };
        loadUsers();
    }, []);

    const allUsers = useMemo(
        () => fetchedUsers.length ? fetchedUsers : (users && users.length ? users : []),
        [fetchedUsers, users]
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

    // --- modal state ---
    const [showSysEmailModal, setShowSysEmailModal] = useState(false);
    const [sysSpecificSearch, setSysSpecificSearch] = useState("");
    const [sysEmailForm, setSysEmailForm] = useState({
        recipientsOption: "All users",
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

    const resetAnnouncementForm = () => {
        setSysEmailForm({
            recipientsOption: "All users",
            selectedUserIds: [],
            customEmails: "",
            template: "Custom message",
            subject: "",
            message: "",
            markAnnouncement: false,
        });
        setSysSpecificSearch("");
    };

    const [showExportModal, setShowExportModal] = useState(false);
    const [exportOptions, setExportOptions] = useState({
        format: 'excel',
        rangeType: 'year',
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
    });

    useEffect(() => {
        fetchAvailableYears();
    }, []);

    const fetchAvailableYears = async () => {
        try {
            setLoadingYears(true);
            const response = await fetch(`${API_URL}/api/export/available-years`);

            if (!response.ok) {
                console.error('Failed to fetch available years:', response.status);
                setAvailableYears([new Date().getFullYear()]);
                return;
            }

            const data = await response.json();

            if (data.success && data.years && data.years.length > 0) {
                setAvailableYears(data.years);
                const mostRecentYear = Math.max(...data.years);
                setExportOptions(prev => ({ ...prev, year: mostRecentYear }));
            } else {
                const currentYear = new Date().getFullYear();
                setAvailableYears([currentYear]);
                setExportOptions(prev => ({ ...prev, year: currentYear }));
            }
        } catch (error) {
            console.error('Error fetching available years:', error);
            const currentYear = new Date().getFullYear();
            setAvailableYears([currentYear]);
        } finally {
            setLoadingYears(false);
        }
    };

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
                setAvailableMonths([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
                return;
            }

            const data = await response.json();

            if (data.success && data.months && data.months.length > 0) {
                setAvailableMonths(data.months.sort((a, b) => a - b));
                if (!data.months.includes(exportOptions.month)) {
                    setExportOptions(prev => ({ ...prev, month: data.months[0] }));
                }
            } else {
                setAvailableMonths([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
            }
        } catch (error) {
            console.error('Error fetching available months:', error);
            setAvailableMonths([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
        } finally {
            setLoadingMonths(false);
        }
    };

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

        if (type === 'food-csv') {
            try {
                setExportLoading(prev => ({ ...prev, csv: true }));
                const endpoint = `${API_URL}/api/export/food-csv`;
                const filename = `food-database-${new Date().toISOString().split('T')[0]}.csv`;

                const response = await fetch(endpoint, { method: 'GET' });

                if (!response.ok) {
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
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        if (exportOptions.year > currentYear) {
            setSysDialog({
                open: true,
                title: t("adminSettings.invalidYear"),
                message: t("adminSettings.invalidYearMsg", { year: exportOptions.year, currentYear }),
                icon: <AlertTriangle />,
                primaryText: t("adminSettings.ok"),
                onPrimary: closeSysDialog,
            });
            return;
        }

        if (exportOptions.year === currentYear && exportOptions.month > currentMonth) {
            const monthName = new Date(exportOptions.year, exportOptions.month - 1).toLocaleString('default', { month: 'long' });
            setSysDialog({
                open: true,
                title: t("adminSettings.invalidMonth"),
                message: t("adminSettings.invalidMonthMsg", {
                    month: monthName,
                    year: exportOptions.year,
                    maxMonth: getMonthName(currentMonth),
                    currentYear,
                }),
                icon: <AlertTriangle />,
                primaryText: t("adminSettings.ok"),
                onPrimary: closeSysDialog,
            });
            return;
        }

        if (exportOptions.rangeType === 'custom' && (!exportOptions.startDate || !exportOptions.endDate)) {
            setSysDialog({
                open: true,
                title: t("adminSettings.missingDates"),
                message: t("adminSettings.missingDatesMsg"),
                icon: <AlertTriangle />,
                primaryText: t("adminSettings.ok"),
                onPrimary: closeSysDialog,
            });
            return;
        }

        if (exportOptions.rangeType === 'custom') {
            const start = new Date(exportOptions.startDate);
            const end = new Date(exportOptions.endDate);
            const today = new Date();

            if (start > end) {
                setSysDialog({
                    open: true,
                    title: t("adminSettings.invalidDateRange"),
                    message: t("adminSettings.invalidDateRangeMsg"),
                    icon: <AlertTriangle />,
                    primaryText: t("adminSettings.ok"),
                    onPrimary: closeSysDialog,
                });
                return;
            }

            if (start > today || end > today) {
                setSysDialog({
                    open: true,
                    title: t("adminSettings.futureDates"),
                    message: t("adminSettings.futureDatesMsg"),
                    icon: <AlertTriangle />,
                    primaryText: t("adminSettings.ok"),
                    onPrimary: closeSysDialog,
                });
                return;
            }
        }

        try {
            const loadingKey = exportOptions.format === 'pdf' ? 'reportPdf' : 'reportExcel';
            setExportLoading(prev => ({ ...prev, [loadingKey]: true }));

            let queryParams = new URLSearchParams();
            queryParams.append('format', exportOptions.format);

            if (exportOptions.rangeType === 'year') {
                queryParams.append('year', exportOptions.year);
            } else if (exportOptions.rangeType === 'month') {
                queryParams.append('year', exportOptions.year);
                queryParams.append('month', exportOptions.month);
            } else if (exportOptions.rangeType === 'custom') {
                if (exportOptions.startDate) queryParams.append('startDate', exportOptions.startDate);
                if (exportOptions.endDate) queryParams.append('endDate', exportOptions.endDate);
            }

            const endpoint = `${API_URL}/api/export/analytics-report?${queryParams.toString()}`;
            const extension = exportOptions.format === 'pdf' ? 'pdf' : 'xlsx';

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

            setSysDialog({
                open: true,
                title: t("adminSettings.exportSuccessful"),
                message: t("adminSettings.exportSuccessfulMsg", { format: exportOptions.format.toUpperCase() }),
                icon: CheckIcon ? <CheckIcon /> : null,
                primaryText: t("adminSettings.ok"),
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

    useEffect(() => {
        if (!showSysEmailModal) return;
        const onKey = (e) => { if (e.key === "Escape") { setShowSysEmailModal(false); resetAnnouncementForm(); } };
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
            default: return 0;
        }
    })();

    return (
        <div className="admset-wrap">
            <div className="admset-single-card-container">
                <div className="admset-card">
                    {/* Header */}
                    <div className="admset-card-header">
                        <h3 className="admset-card-title">
                            <Settings className="admset-ic" />
                            {t("adminSettings.pageTitle")}
                        </h3>
                    </div>

                    {/* Content */}
                    <div className="admset-card-content">

                        {/* Section 1: Email notifications switch
                        <div className="admset-block">
                            <div className="admset-row between">
                                <label htmlFor="admset-notif" className="admset-label">
                                    {t("adminSettings.emailNotifications")}
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
                        */}

                        {/* Section 2: Communication */}
                        <div className="admset-block">
                            <div className="admset-label mb-6">{t("adminSettings.communication")}</div>
                            <div className="admset-grid-1">
                                <button
                                    className="admset-btn admset-btn-outline justify-start"
                                    onClick={() => setShowSysEmailModal(true)}
                                >
                                    <Mail className="admset-ic-sm" />
                                    {t("adminSettings.sendAnnouncement")}
                                </button>
                            </div>
                        </div>

                        <hr className="admset-sep" />

                        {/* Section 3: Backup & Maintenance */}
                        <div className="admset-block">
                            <div className="admset-label mb-6">{t("adminSettings.backupMaintenance")}</div>
                            <div className="admset-callout">
                                <div>
                                    <p>{t("adminSettings.lastBackup")}</p>
                                    <p className="muted">{t("adminSettings.lastBackupDate")}</p>
                                </div>
                                <span className="admset-badge good">{t("adminSettings.backupSuccess")}</span>
                            </div>

                            <div className="admset-grid-2 mt-12">
                                <button className="admset-btn admset-btn-primary">
                                    <Archive className="admset-ic-sm" />
                                    {t("adminSettings.backup")}
                                </button>
                                <button className="admset-btn admset-btn-outline primary-outline">
                                    <Download className="admset-ic-sm" />
                                    {t("adminSettings.restore")}
                                </button>
                            </div>
                        </div>

                        <hr className="admset-sep" />

                        {/* Section 4: Data Export Options */}
                        <div className="admset-block">
                            <div className="admset-label mb-6">{t("adminSettings.dataExportOptions")}</div>
                            <div className="space-y-4">
                                <button
                                    className="admset-btn admset-btn-outline w-full justify-start"
                                    onClick={() => handleExport('food-csv')}
                                    disabled={exportLoading.csv}
                                >
                                    <Download className="admset-ic-sm" />
                                    {exportLoading.csv ? t("adminSettings.exporting") : t("adminSettings.exportFoodCSV")}
                                </button>

                                <button
                                    className="admset-btn admset-btn-outline w-full justify-start admset-btn-2"
                                    onClick={() => handleExport('analytics-report')}
                                    disabled={exportLoading.reportExcel || exportLoading.reportPdf}
                                >
                                    <Download className="admset-ic-sm" />
                                    {exportLoading.reportExcel || exportLoading.reportPdf
                                        ? t("adminSettings.exporting")
                                        : t("adminSettings.exportAnalyticsReport")}
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Send Announcement Modal */}
            {showSysEmailModal && (
                <div
                    className="umg-modal-backdrop"
                    role="dialog"
                    aria-modal="true"
                    onClick={() => { setShowSysEmailModal(false); resetAnnouncementForm(); }}
                >
                    <div className="umg-modal" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="umg-modal-header">
                            <h3><Mail size={18} /> {t("adminSettings.sendSystemAnnouncementTitle")}</h3>
                            <button className="umg-modal-close" onClick={() => { setShowSysEmailModal(false); resetAnnouncementForm(); }} aria-label="Close">×</button>
                        </div>

                        {/* Body */}
                        <div className="umg-modal-body">
                            {/* Recipients */}
                            <div className="umg-field">
                                <label className="umg-label">{t("adminSettings.recipients")}</label>
                                <select
                                    className="umg-input"
                                    value={sysEmailForm.recipientsOption}
                                    onChange={(e) => setSysEmailForm({ ...sysEmailForm, recipientsOption: e.target.value })}
                                >
                                    <option value="All users">{t("adminSettings.allUsers")}</option>
                                    <option value="Administrators only">{t("adminSettings.administratorsOnly")}</option>
                                    <option value="Specific users">{t("adminSettings.specificUsers")}</option>
                                </select>

                                {/* Specific users */}
                                {sysEmailForm.recipientsOption === "Specific users" && (
                                    <div className="umg-specific-list">
                                        <input
                                            className="umg-input"
                                            placeholder={t("adminSettings.searchUsersPlaceholder")}
                                            value={sysSpecificSearch}
                                            onChange={(e) => setSysSpecificSearch(e.target.value)}
                                        />
                                        <div className="umg-specific-scroll">
                                            {!sysSpecificSearch.trim() ? (
                                                <div className="umg-empty">{t("adminSettings.typeToSearchUsers")}</div>
                                            ) : filteredSysUsers.length === 0 ? (
                                                <div className="umg-empty">{t("adminSettings.noMatches")}</div>
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

                                <div className="umg-hint">{t("adminSettings.totalRecipients", { count: sysTotalRecipients })}</div>
                            </div>

                            {/* Template */}
                            <div className="umg-field">
                                <label className="umg-label">{t("adminSettings.emailTemplate")}</label>
                                <select
                                    className="umg-input"
                                    value={sysEmailForm.template}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        const tpl = SYSTEM_EMAIL_TEMPLATES[value] || { subject: "", message: "" };
                                        setSysEmailForm(prev => ({
                                            ...prev,
                                            template: value,
                                            subject: tpl.subject,
                                            message: tpl.message,
                                        }));
                                    }}
                                >
                                    {Object.keys(SYSTEM_EMAIL_TEMPLATES).map(k => (
                                        <option key={k} value={k}>{k}</option>
                                    ))}
                                </select>
                                <div className="umg-hint">{t("adminSettings.templateHint")}</div>
                            </div>

                            {/* Subject */}
                            <div className="umg-field">
                                <label className="umg-label">{t("adminSettings.subject")}</label>
                                <input
                                    className="umg-input"
                                    placeholder={t("adminSettings.subjectPlaceholder")}
                                    value={sysEmailForm.subject}
                                    onChange={(e) => setSysEmailForm(prev => ({ ...prev, subject: e.target.value }))}
                                />
                            </div>

                            {/* Message */}
                            <div className="umg-field">
                                <label className="umg-label">{t("adminSettings.message")}</label>
                                <textarea
                                    className="umg-input umg-textarea"
                                    placeholder={t("adminSettings.messagePlaceholder")}
                                    value={sysEmailForm.message}
                                    onChange={(e) => setSysEmailForm(prev => ({ ...prev, message: e.target.value }))}
                                />
                            </div>

                            {/* Mark as Announcement */}
                            <label className="umg-check">
                                <input
                                    type="checkbox"
                                    checked={sysEmailForm.markAnnouncement}
                                    onChange={(e) => setSysEmailForm({ ...sysEmailForm, markAnnouncement: e.target.checked })}
                                />
                                <div>
                                    <div><Bell size={16} /> {t("adminSettings.markAsAnnouncement")}</div>
                                    <div className="umg-check-hint">{t("adminSettings.announcementHint")}</div>
                                </div>
                            </label>
                        </div>

                        {/* Footer */}
                        <div className="umg-modal-footer">
                            <button className="umg-btn-secondary" onClick={() => { setShowSysEmailModal(false); resetAnnouncementForm(); }}>
                                {t("adminSettings.cancel")}
                            </button>
                            <button
                                className="umg-btn-primary"
                                onClick={async () => {
                                    if (!sysEmailForm.subject.trim() || !sysEmailForm.message.trim()) {
                                        setSysDialog({
                                            open: true,
                                            title: t("adminSettings.missingRequiredFields"),
                                            message: t("adminSettings.provideRecipient"),
                                            icon: <AlertTriangle />,
                                            primaryText: t("adminSettings.ok"),
                                            onPrimary: closeSysDialog,
                                        });
                                        return;
                                    }

                                    const combinedText = sysEmailForm.subject + " " + sysEmailForm.message;
                                    if (combinedText.includes("<Date>") || combinedText.includes("<Time>")) {
                                        setSysDialog({
                                            open: true,
                                            title: t("adminSettings.unfilledPlaceholdersTitle"),
                                            message: t("adminSettings.unfilledPlaceholders"),
                                            icon: <AlertTriangle />,
                                            primaryText: t("adminSettings.ok"),
                                            onPrimary: closeSysDialog,
                                        });
                                        return;
                                    }

                                    // Build recipient user IDs and emails based on selection
                                    let selectedUsers = [];
                                    if (sysEmailForm.recipientsOption === "All users") {
                                        selectedUsers = allUsers;
                                    } else if (sysEmailForm.recipientsOption === "Administrators only") {
                                        selectedUsers = allUsers.filter(u => u.role === "Admin");
                                    } else if (sysEmailForm.recipientsOption === "Specific users") {
                                        const chosen = new Set(sysEmailForm.selectedUserIds);
                                        selectedUsers = allUsers.filter(u => chosen.has(u.id));
                                    }

                                    const userIds = selectedUsers.map(u => u.id);
                                    const emails = selectedUsers.map(u => u.email);

                                    if (userIds.length === 0 && emails.length === 0) {
                                        setSysDialog({
                                            open: true,
                                            title: t("adminSettings.missingRequiredFields"),
                                            message: t("adminSettings.provideRecipient"),
                                            icon: <AlertTriangle />,
                                            primaryText: t("adminSettings.ok"),
                                            onPrimary: closeSysDialog,
                                        });
                                        return;
                                    }

                                    try {
                                        const csrfRes = await fetch(`${API_URL}/api/csrf-token`, { credentials: "include" });
                                        const { csrfToken } = await csrfRes.json();

                                        const res = await fetch(`${API_URL}/api/admin/announcement`, {
                                            method: "POST",
                                            headers: {
                                                "Content-Type": "application/json",
                                                "X-CSRF-Token": csrfToken,
                                            },
                                            credentials: "include",
                                            body: JSON.stringify({
                                                userIds,
                                                emails,
                                                subject: sysEmailForm.subject,
                                                message: sysEmailForm.message,
                                                sendEmail: sysEmailForm.markAnnouncement,
                                            }),
                                        });

                                        const data = await res.json();

                                        setShowSysEmailModal(false);
                                        resetAnnouncementForm();

                                        setSysDialog({
                                            open: true,
                                            title: t("adminSettings.announcementSent"),
                                            message: data.message,
                                            icon: CheckIcon ? <CheckIcon /> : null,
                                            primaryText: t("adminSettings.done"),
                                            onPrimary: closeSysDialog,
                                        });
                                    } catch (err) {
                                        console.error("Failed to send announcement:", err);
                                        setSysDialog({
                                            open: true,
                                            title: "Error",
                                            message: "Failed to send announcement. Please try again.",
                                            icon: <AlertTriangle />,
                                            primaryText: t("adminSettings.ok"),
                                            onPrimary: closeSysDialog,
                                        });
                                    }
                                }}
                            >
                                {t("adminSettings.sendAnnouncement")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Export Analytics Report Modal */}
            {showExportModal && (
                <div
                    className="umg-modal-backdrop"
                    role="dialog"
                    aria-modal="true"
                    onClick={() => setShowExportModal(false)}
                >
                    <div className="umg-modal" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="umg-modal-header">
                            <h3><FileText size={18} /> {t("adminSettings.exportAnalyticsReportTitle")}</h3>
                            <button className="umg-modal-close" onClick={() => setShowExportModal(false)} aria-label="Close">×</button>
                        </div>

                        {/* Body */}
                        <div className="umg-modal-body">
                            {/* Format Selection */}
                            <div className="umg-field">
                                <label className="umg-label">{t("adminSettings.exportFormat")}</label>
                                <div className="admset-format-list">
                                    <label className="admset-format-option">
                                        <input
                                            type="radio"
                                            name="exportFormat"
                                            value="excel"
                                            checked={exportOptions.format === 'excel'}
                                            onChange={(e) => setExportOptions(prev => ({ ...prev, format: e.target.value }))}
                                            className="w-4 h-4"
                                        />
                                        <FileText className="admset-ic-sm" />
                                        <span>{t("adminSettings.excelFormat")}</span>
                                    </label>
                                    <label className="admset-format-option">
                                        <input
                                            type="radio"
                                            name="exportFormat"
                                            value="pdf"
                                            checked={exportOptions.format === 'pdf'}
                                            onChange={(e) => setExportOptions(prev => ({ ...prev, format: e.target.value }))}
                                            className="w-4 h-4"
                                        />
                                        <FileText className="admset-ic-sm" />
                                        <span>{t("adminSettings.pdfFormat")}</span>
                                    </label>
                                </div>
                            </div>

                            {/* Date Range Selection */}
                            <div className="umg-field">
                                <label className="umg-label">{t("adminSettings.dateRange")}</label>
                                <select
                                    className="umg-input"
                                    value={exportOptions.rangeType}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setExportOptions(prev => ({
                                            ...prev,
                                            rangeType: value,
                                            ...(value !== 'custom' && { startDate: '', endDate: '' })
                                        }));
                                    }}
                                >
                                    <option value="year">{t("adminSettings.fullYear")}</option>
                                    <option value="month">{t("adminSettings.specificMonth")}</option>
                                    <option value="custom">{t("adminSettings.customRange")}</option>
                                </select>
                            </div>

                            {/* Year Selection */}
                            {(exportOptions.rangeType === 'year' || exportOptions.rangeType === 'month') && (
                                <div className="umg-field">
                                    <label className="umg-label">{t("adminSettings.selectYear")}</label>
                                    <select
                                        className="umg-input"
                                        value={exportOptions.year}
                                        onChange={(e) => setExportOptions(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                                        disabled={loadingYears}
                                    >
                                        {loadingYears ? (
                                            <option value="">{t("adminSettings.loadingYears")}</option>
                                        ) : availableYears.length === 0 ? (
                                            <option value="">{t("adminSettings.noYearsAvailable")}</option>
                                        ) : (
                                            availableYears.map(year => (
                                                <option key={year} value={year}>{year}</option>
                                            ))
                                        )}
                                    </select>
                                    {loadingYears && (
                                        <div className="text-xs text-gray-500 mt-1">{t("adminSettings.fetchingYears")}</div>
                                    )}
                                    {!loadingYears && availableYears.length > 0 && (
                                        <div className="text-xs text-gray-500 mt-1">
                                            {t("adminSettings.showingYearsWithData", { count: availableYears.length })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Month Selection */}
                            {exportOptions.rangeType === 'month' && (
                                <div className="umg-field">
                                    <label className="umg-label">{t("adminSettings.selectMonth")}</label>
                                    <select
                                        className="umg-input"
                                        value={exportOptions.month}
                                        onChange={(e) => setExportOptions(prev => ({ ...prev, month: parseInt(e.target.value) }))}
                                        disabled={loadingMonths}
                                    >
                                        {loadingMonths ? (
                                            <option value="">{t("adminSettings.loadingMonths")}</option>
                                        ) : availableMonths.length === 0 ? (
                                            <option value="">{t("adminSettings.noMonthsAvailable", { year: exportOptions.year })}</option>
                                        ) : (
                                            availableMonths.map(monthNum => {
                                                const date = new Date(exportOptions.year, monthNum - 1);
                                                const currentYear = new Date().getFullYear();
                                                const currentMonth = new Date().getMonth() + 1;
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
                                                        {isFuture && ` ${t("adminSettings.futureSuffix")}`}
                                                    </option>
                                                );
                                            })
                                        )}
                                    </select>
                                    {loadingMonths && (
                                        <div className="text-xs text-gray-500 mt-1">{t("adminSettings.fetchingMonths")}</div>
                                    )}
                                    {!loadingMonths && availableMonths.length > 0 && (
                                        <div className="text-xs text-gray-500 mt-1">
                                            {t("adminSettings.showingMonthsWithData", { count: availableMonths.length, year: exportOptions.year })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Custom Date Range */}
                            {exportOptions.rangeType === 'custom' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="umg-field">
                                        <label className="umg-label">{t("adminSettings.startDate")}</label>
                                        <input
                                            type="date"
                                            className="umg-input"
                                            value={exportOptions.startDate}
                                            onChange={(e) => setExportOptions(prev => ({ ...prev, startDate: e.target.value }))}
                                            max={exportOptions.endDate || new Date().toISOString().split('T')[0]}
                                        />
                                    </div>
                                    <div className="umg-field">
                                        <label className="umg-label">{t("adminSettings.endDate")}</label>
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

                            {/* Export Summary */}
                            <div className="umg-field p-3 bg-gray-50 rounded">
                                <div className="text-sm text-gray-600">
                                    <div className="font-medium mb-1">{t("adminSettings.exportSummary")}</div>
                                    <div>{t("adminSettings.format", { format: exportOptions.format.toUpperCase() })}</div>
                                    {exportOptions.rangeType === 'year' && (
                                        <div>{t("adminSettings.periodFullYear", { year: exportOptions.year })}</div>
                                    )}
                                    {exportOptions.rangeType === 'month' && (
                                        <div>
                                            {t("adminSettings.periodMonth", {
                                                month: new Date(exportOptions.year, exportOptions.month - 1).toLocaleString('default', { month: 'long' }),
                                                year: exportOptions.year
                                            })}
                                        </div>
                                    )}
                                    {exportOptions.rangeType === 'custom' && (
                                        <div>
                                            {t("adminSettings.periodCustom", {
                                                start: exportOptions.startDate || t("adminSettings.periodStart"),
                                                end: exportOptions.endDate || t("adminSettings.periodEnd")
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="umg-modal-footer">
                            <button className="umg-btn-secondary" onClick={() => setShowExportModal(false)}>
                                {t("adminSettings.cancel")}
                            </button>
                            <button
                                className="umg-btn-primary"
                                onClick={handleAnalyticsExport}
                                disabled={exportLoading.reportExcel || exportLoading.reportPdf}
                            >
                                {exportLoading.reportExcel || exportLoading.reportPdf ? (
                                    <>
                                        <span className="animate-spin mr-2">⏳</span>
                                        {t("adminSettings.exporting")}
                                    </>
                                ) : (
                                    <>
                                        <Download className="admset-ic-sm mr-2" />
                                        {t("adminSettings.exportReport")}
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