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
    FiCheckCircle as CheckIcon
} from "react-icons/fi";
import Modal from "../components/Modal";
import { useNavigate } from "react-router-dom";

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

    const t = {
        platform: "SarawakEats",
        backupRestore: "Backup/Restore",
        dataExport: "Data Export",
        backup: "Backup",
        restore: "Restore",
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

    const [exportLoading, setExportLoading] = useState({
        csv: false,
        report: false
    });

    const handleExport = async (type, format = 'csv') => {
        try {
            // Set loading state
            const loadingKey = type === 'food-csv' ? 'csv' : 'report';
            setExportLoading(prev => ({ ...prev, [loadingKey]: true }));

            let endpoint, filename;
            
            if (type === 'food-csv') {
                endpoint = `${API_URL}/api/export/food-csv`;
                filename = `food-database-${new Date().toISOString().split('T')[0]}.csv`;
            } else {
                endpoint = `${API_URL}/api/export/analytics-report?format=${format}`;
                
                const extension = format === 'pdf' ? 'pdf' : 
                                format === 'excel' ? 'xlsx' : 'csv';
                filename = `analytics-report-${new Date().toISOString().split('T')[0]}.${extension}`;
            }

            console.log('Exporting from:', endpoint); // Debug log

            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Accept': format === 'excel' 
                        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                        : format === 'pdf' 
                        ? 'application/pdf'
                        : 'text/csv'
                }
            });

            console.log('Response status:', response.status); // Debug log

            if (!response.ok) {
            const errorText = await response.text();
            console.error('Export error response:', errorText);
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
            alert(`Failed to export: ${error.message}`);
        } finally {
            setExportLoading(prev => ({ ...prev, [type === 'food-csv' ? 'csv' : 'report']: false }));
        }
    };

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

                            <button 
                                className="admset-btn admset-btn-outline w-full justify-start"
                                onClick={() => handleExport('food-csv')}
                                disabled={exportLoading.csv}
                            >
                                <Download className="admset-ic-sm" />
                                {exportLoading.csv ? 'Exporting...' : 'Export Food Database (CSV)'}
                            </button>

                            <div className="mt-8">
                                <div className="admset-label-sm mb-4">Export Analytics Report</div>
                                <div className="flex gap-2">
                                    <button 
                                        className="admset-btn admset-btn-outline flex-1 justify-start"
                                        onClick={() => handleExport('analytics-report', 'csv')}
                                        disabled={exportLoading.report}
                                    >
                                        <FileText className="admset-ic-sm" />
                                        CSV
                                    </button>
                                    <button 
                                        className="admset-btn admset-btn-outline flex-1 justify-start"
                                        onClick={() => handleExport('analytics-report', 'excel')}
                                        disabled={exportLoading.report}
                                    >
                                        📊 Excel
                                    </button>
                                    <button 
                                        className="admset-btn admset-btn-outline flex-1 justify-start"
                                        onClick={() => handleExport('analytics-report', 'pdf')}
                                        disabled={exportLoading.report}
                                    >
                                        📄 PDF
                                    </button>
                                </div>
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
