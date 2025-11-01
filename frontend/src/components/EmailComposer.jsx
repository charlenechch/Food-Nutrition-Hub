// src/components/EmailComposer.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Mail, X, Bell, Send } from "lucide-react";

function lockScroll() {
  const g = (window.__scrollLock ||= { count: 0, prev: {}, locked: false });
  if (g.count === 0 && !g.locked) {
    const docEl = document.documentElement;
    const body = document.body;
    const scrollY = window.scrollY || window.pageYOffset || 0;

    g.prev = {
      htmlOverflow: docEl.style.overflow,
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      savedScrollY: scrollY,
    };

    // iOS/desktop friendly lock
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    docEl.style.overflow = "hidden";
    body.style.overflow = "hidden";

    g.locked = true;
  }
  g.count += 1;
}

function unlockScroll() {
  const g = window.__scrollLock;
  if (!g) return;

  g.count = Math.max(0, g.count - 1);
  if (g.count > 0) return; // another modal still open

  const docEl = document.documentElement;
  const body = document.body;

  docEl.style.overflow = g.prev.htmlOverflow || "";
  body.style.overflow = g.prev.bodyOverflow || "";
  body.style.position = g.prev.bodyPosition || "";
  body.style.top = g.prev.bodyTop || "";

  if (typeof g.prev.savedScrollY === "number") {
    window.scrollTo(0, g.prev.savedScrollY);
  }
  g.locked = false;
}

// Reuses your existing CSS classes from User Management modal (umg-*)
export default function EmailComposer({
  isOpen,
  onClose,
  users = [],
  title = "Send Email",
  templates = {},
  defaultTemplateKey = "Custom message",
  defaultRecipientsOption = "All users", // "All users" | "Specific users" | "Administrators only" | "Custom Email Addresses"
  allowSpecificUsers = true,            // set false for System Settings if you want simpler flow
  showAnnouncementToggle = true,
  onSend = () => {},
}) {
  const [specificSearch, setSpecificSearch] = useState("");
  const [emailForm, setEmailForm] = useState({
    recipientsOption: defaultRecipientsOption,
    selectedUserIds: [],
    customEmails: "",
    template: defaultTemplateKey,
    subject: templates[defaultTemplateKey]?.subject || "",
    message: templates[defaultTemplateKey]?.message || "",
    markAnnouncement: false,
  });
  const handleClose = () => {
    try { unlockScroll(); } catch {}
    wasOpen.current = false;
    onClose?.();
    };

    const wasOpen = useRef(false);

    useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();

    if (isOpen && !wasOpen.current) {
        lockScroll();
        document.addEventListener("keydown", onKey);
        wasOpen.current = true;
    }

    if (!isOpen && wasOpen.current) {
        unlockScroll();
        document.removeEventListener("keydown", onKey);
        wasOpen.current = false;
    }

    return () => {
        if (wasOpen.current) {
        unlockScroll();
        document.removeEventListener("keydown", onKey);
        wasOpen.current = false;
        }
    };
    }, [isOpen, onClose]);

    useEffect(() => {
    return () => {
        try { unlockScroll(); } catch {}
        wasOpen.current = false;
    };
    }, []);


  const adminIds = useMemo(
    () => users.filter((u) => u.role === "Admin").map((u) => u.id),
    [users]
  );

  const parseCustomEmails = (text) => {
    if (!text.trim()) return [];
    const seen = new Set();
    return text
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s))
      .filter((s) => (seen.has(s) ? false : (seen.add(s), true)));
  };

  const filteredSpecificUsers = users.filter((u) => {
    if (specificSearch.trim() === "") return true;
    const q = specificSearch.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.city || "").toLowerCase().includes(q)
    );
  });

  const totalRecipients = (() => {
    switch (emailForm.recipientsOption) {
      case "All users":
        return users.length;
      case "Administrators only":
        return adminIds.length;
      case "Specific users":
        return emailForm.selectedUserIds.length;
      case "Custom Email Addresses":
        return parseCustomEmails(emailForm.customEmails).length;
      default:
        return 0;
    }
  })();

  if (!isOpen) return null;

  return (
    <div className="umg-modal-backdrop" role="dialog" aria-modal="true" onClick={handleClose}>
      <div className="umg-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="umg-modal-header">
          <h3><Mail size={18}/> {title}</h3>
          <button className="umg-modal-close" onClick={handleClose} aria-label="Close">
            <X />
          </button>
        </div>

        {/* Body */}
        <div className="umg-modal-body">
          {/* Recipients */}
          <div className="umg-field">
            <label className="umg-label">Recipients</label>
            <select
              className="umg-input"
              value={emailForm.recipientsOption}
              onChange={(e) =>
                setEmailForm({ ...emailForm, recipientsOption: e.target.value })
              }
            >
              <option>All users</option>
              {allowSpecificUsers && <option>Specific users</option>}
              <option>Administrators only</option>
              <option>Custom Email Addresses</option>
            </select>

            {/* Specific users */}
            {allowSpecificUsers && emailForm.recipientsOption === "Specific users" && (
              <div className="umg-specific-list">
                <input
                  className="umg-input"
                  placeholder="Search users to select…"
                  value={specificSearch}
                  onChange={(e) => setSpecificSearch(e.target.value)}
                />
                <div className="umg-specific-scroll">
                  {filteredSpecificUsers.length === 0 ? (
                    <div className="umg-empty">No matches.</div>
                  ) : (
                    filteredSpecificUsers.map((u) => (
                      <label key={u.id} className="umg-specific-row">
                        <input
                          type="checkbox"
                          className="umg-row-checkbox"
                          checked={emailForm.selectedUserIds.includes(u.id)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setEmailForm((prev) => ({
                              ...prev,
                              selectedUserIds: checked
                                ? [...prev.selectedUserIds, u.id]
                                : prev.selectedUserIds.filter((id) => id !== u.id),
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
            {emailForm.recipientsOption === "Custom Email Addresses" && (
              <div className="umg-field">
                <label className="umg-label">Enter email addresses</label>
                <textarea
                  className="umg-input umg-textarea"
                  placeholder="alice@mail.com, bob@mail.com"
                  value={emailForm.customEmails}
                  onChange={(e) =>
                    setEmailForm({ ...emailForm, customEmails: e.target.value })
                  }
                />
              </div>
            )}

            <div className="umg-hint">Total Recipients: {totalRecipients}</div>
          </div>

          {/* Template */}
          <div className="umg-field">
            <label className="umg-label">Email Template</label>
            <select
              className="umg-input"
              value={emailForm.template}
              onChange={(e) => {
                const value = e.target.value;
                const tpl = templates[value] || { subject: "", message: "" };
                setEmailForm((prev) => ({
                  ...prev,
                  template: value,
                  subject: tpl.subject,
                  message: tpl.message,
                }));
              }}
            >
              {Object.keys(templates).map((k) => (
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
              value={emailForm.subject}
              onChange={(e) =>
                setEmailForm((prev) => ({ ...prev, subject: e.target.value }))
              }
            />
          </div>

          {/* Message */}
          <div className="umg-field">
            <label className="umg-label">Message</label>
            <textarea
              className="umg-input umg-textarea"
              placeholder="Enter your message"
              value={emailForm.message}
              onChange={(e) =>
                setEmailForm((prev) => ({ ...prev, message: e.target.value }))
              }
            />
          </div>

          {/* Announcement toggle */}
          {showAnnouncementToggle && (
            <label className="umg-check">
              <input
                type="checkbox"
                checked={emailForm.markAnnouncement}
                onChange={(e) =>
                  setEmailForm({ ...emailForm, markAnnouncement: e.target.checked })
                }
              />
              <div>
                <div><Bell size={16} /> Mark as Announcement</div>
                <div className="umg-check-hint">Announcements appear in user notifications</div>
              </div>
            </label>
          )}
        </div>

        {/* Footer */}
        <div className="umg-modal-footer">
          <button className="umg-btn-secondary" onClick={handleClose}>Cancel</button>
          <button
            className="umg-btn-primary"
            onClick={() => {
              if (!emailForm.subject.trim() || !emailForm.message.trim()) {
                alert("Please provide a subject and message.");
                return;
              }
              let recipients = [];
              if (emailForm.recipientsOption === "All users") {
                recipients = users.map((u) => u.email);
              } else if (emailForm.recipientsOption === "Administrators only") {
                recipients = users.filter((u) => u.role === "Admin").map((u) => u.email);
              } else if (emailForm.recipientsOption === "Specific users") {
                const chosen = new Set(emailForm.selectedUserIds);
                recipients = users.filter((u) => chosen.has(u.id)).map((u) => u.email);
              } else if (emailForm.recipientsOption === "Custom Email Addresses") {
                recipients = parseCustomEmails(emailForm.customEmails);
              }

              onSend({
                recipients,
                total: recipients.length,
                subject: emailForm.subject,
                message: emailForm.message,
                markAnnouncement: emailForm.markAnnouncement,
                templateKey: emailForm.template,
                recipientsOption: emailForm.recipientsOption,
              });

              onClose();
            }}
          >
            <Send size={18} /> Send Email
          </button>
        </div>
      </div>
    </div>
  );
}
