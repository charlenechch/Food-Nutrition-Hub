// AdminSystemSettings.jsx
import React, { useMemo, useState } from "react";
import {
    FiSettings as Settings,
    FiBell as Bell,
    FiAlertTriangle as AlertTriangle,
    FiArchive as Archive,
    FiDownload as Download,
    FiMail as Mail,
    FiFileText as FileText,
    FiX as X,
} from "react-icons/fi";

export default function AdminSystemSettings({
    onPageChange = () => { },
    language = "en",
    users = [],
}) {

    const platformName = "SarawakEats";
    const SYSTEM_EMAIL_TEMPLATES = {
        "Custom message": { subject: "", message: "" },
        "Maintenance Window": {
            subject: "Scheduled Maintenance Notice",
            message:
                `Hello,\n\nWe will perform scheduled maintenance from <Date>, <Time> to <Date>, <Time>. ${platformName} may be unavailable during this time.\n\nThanks,\nSystem Admin`,
        },
        "Policy Update": {
            subject: "Platform Policy Update",
            message:
                `Hello,\n\nWe've updated our community guidelines and privacy policy. Please review the changes in the Terms of Service and Privacy Policy at the website footer section.\n\nThanks,\nSystem Admin`,
        },
        "New Feature Rollout": {
            subject: "New Features Released",
            message:
                `Hello,\n\nWe've rolled out new features to improve your experience. Check out the website.\n\nThanks,\nSystem Admin`,
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
        template: "Maintenance Window",
        subject: SYSTEM_EMAIL_TEMPLATES["Maintenance Window"].subject,
        message: SYSTEM_EMAIL_TEMPLATES["Maintenance Window"].message,
        markAnnouncement: true,
    });

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

    // --- open from the button under Communication ---
    <button
        className="admset-btn admset-btn-outline justify-start"
        onClick={() => setShowSysEmailModal(true)}
    >
        <Mail className="admset-ic-sm" />
        Send Announcement
    </button>

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
                                    onClick={() => onPageChange("system-alerts")}
                                >
                                    <Bell className="admset-ic-sm" />
                                    View Alerts
                                    <span className="admset-badge danger">12</span>
                                </button>

                                <button
                                    className="admset-btn admset-btn-outline justify-start relative"
                                    onClick={() => onPageChange("error-logs")}
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

                        {/* Export */}
                        <div className="admset-block">
                            <div className="admset-label mb-6">Data Export Options</div>

                            <button className="admset-btn admset-btn-outline w-full justify-start">
                                <Download className="admset-ic-sm" />
                                Export Food Database (CSV)
                            </button>

                            <button className="admset-btn admset-btn-outline w-full justify-start mt-8">
                                <FileText className="admset-ic-sm" />
                                Export Analytics Report
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ===== Announcement Modal ===== */}
            {emailOpen && (
                <div className="admset-modal-overlay" role="dialog" aria-modal="true">
                    <div className="admset-modal">
                        <div className="admset-modal-header">
                            <h4>Send Announcement</h4>
                            <button className="admset-icon-btn" onClick={closeEmail} aria-label="Close">
                                <X />
                            </button>
                        </div>

                        <div className="admset-modal-body">
                            <div className="admset-field">
                                <label>To</label>
                                <div className="admset-chip-list">
                                    {mockUsers.map((u) => (
                                        <span key={u.id} className="admset-chip">
                                            {u.name}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="admset-field">
                                <label>Subject</label>
                                <input
                                    value={emailSubject}
                                    onChange={(e) => setEmailSubject(e.target.value)}
                                    placeholder="Announcement subject"
                                />
                            </div>

                            <div className="admset-field">
                                <label>Message</label>
                                <textarea
                                    rows={5}
                                    value={emailBody}
                                    onChange={(e) => setEmailBody(e.target.value)}
                                    placeholder="Write your announcement here…"
                                />
                            </div>

                            {emailSuccess && (
                                <div className="admset-alert success">Announcement queued (demo).</div>
                            )}
                        </div>

                        <div className="admset-modal-footer">
                            <button className="admset-btn admset-btn-outline" onClick={closeEmail} disabled={emailSending}>
                                Cancel
                            </button>
                            <button
                                className="admset-btn admset-btn-primary"
                                onClick={sendEmail}
                                disabled={emailSending || !emailSubject.trim() || !emailBody.trim()}
                            >
                                {emailSending ? "Sending…" : "Send"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
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
                        <h3><Mail size={18}/> Send System Announcement</h3>
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
                                subject: tpl.subject,
                                message: tpl.message,
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
                            alert("Please provide a subject and message.");
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
                        }}
                        >
                        Send Email
                        </button>
                    </div>
                    </div>
                </div>
                )}
        </div>
    );
}
