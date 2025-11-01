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
import "./AdminSystemSettings.css";

export default function AdminSystemSettings({
  onPageChange = () => {},
  language = "en",
  users = [],
}) {
  // Hardcoded fallback users for the email modal preview
  const mockUsers = useMemo(
    () =>
      users.length
        ? users
        : [
            { id: 1, name: "Joanna Lee", email: "joanna@example.com" },
            { id: 2, name: "Brian Tan", email: "brian@example.com" },
            { id: 3, name: "Lucy Goh", email: "lucy@example.com" },
          ],
    [users]
  );

  const [emailOpen, setEmailOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(true);

  const t = {
    platform: "Platform",
    backupRestore: "Backup/Restore",
    dataExport: "Data Export",
    backup: "Backup",
    restore: "Restore",
  };

  const openEmail = () => {
    setEmailOpen(true);
    setEmailSuccess(false);
  };

  const closeEmail = () => {
    if (emailSending) return;
    setEmailOpen(false);
    setEmailSubject("");
    setEmailBody("");
    setEmailSuccess(false);
  };

  const sendEmail = async () => {
    // Demo only — no API call
    setEmailSending(true);
    setTimeout(() => {
      setEmailSending(false);
      setEmailSuccess(true);
      // Keep modal open to show success; user can close manually
    }, 900);
  };

  return (
    <div className="admset-wrap">
      <div className="admset-grid">
        {/* ===== Left Card: Settings / Communication / Monitoring ===== */}
        <div className="admset-card">
          <div className="admset-card-header">
            <h3 className="admset-card-title">
              <Settings className="admset-ic" />
              {t.platform} Configuration
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
                  onClick={openEmail}
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
    </div>
  );
}
