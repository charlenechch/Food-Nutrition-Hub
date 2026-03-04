import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { CiSearch } from "react-icons/ci";
import { Mail, Shield, Users, Activity, CircleCheckBig, CircleX, CircleOff, X, Bell, Send } from 'lucide-react';
import { HiOutlinePencilAlt } from "react-icons/hi";
import { RiDeleteBin5Line } from "react-icons/ri";
import Modal from "../components/Modal";
import { CircleAlert as AlertIcon, CheckCircle2 as SuccessIcon, TriangleAlert as WarnIcon } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Suspend User Modal Component
const SuspendUserModal = ({ user, onClose, onSave, onAlert }) => {
  const { t } = useTranslation();
  const [suspensionDate, setSuspensionDate] = useState(
    user?.suspendedUntil ? user.suspendedUntil.split('T')[0] : new Date().toISOString().slice(0, 10)
  );
  const [reason, setReason] = useState(user?.suspensionReason || "");

  const handleSave = () => {
    if (!suspensionDate) return onAlert?.(t("adminUser.missingDate"), t("adminUser.suspensionDateRequired"));
    if (!reason.trim()) return onAlert?.(t("adminUser.missingReason"), t("adminUser.suspensionReasonRequired"));
    onSave(user.id, suspensionDate, reason.trim());
  };

  return (
    <div
      className="umg-modal-backdrop"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="umg-modal umg-suspend-modal" onClick={(e) => e.stopPropagation()}>
        <div className="umg-modal-header">
          <h3><CircleOff size={18} /> {t("adminUser.suspendUserTitle", { name: user.name })}</h3>
          <button className="umg-modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="umg-modal-body">
          <div className="umg-field">
            <label className="umg-label">{t("adminUser.suspendedUntilLabel")}</label>
            <input
              className="umg-input"
              type="date"
              min={new Date().toISOString().slice(0, 10)}
              value={suspensionDate}
              onChange={(e) => setSuspensionDate(e.target.value)}
            />
            <div className="umg-hint">{t("adminUser.suspendHint")}</div>
          </div>

          <div className="umg-field">
            <label className="umg-label">{t("adminUser.suspensionReasonLabel")}</label>
            <textarea
              className="umg-input umg-textarea-small"
              placeholder={t("adminUser.suspensionReasonPlaceholder")}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>

        <div className="umg-modal-footer">
          <button type="button" className="umg-btn umg-btn-secondary" onClick={onClose}>
            {t("adminUser.cancelBtn")}
          </button>
          <button type="button" className="umg-btn umg-btn-danger" onClick={handleSave}>
            {t("adminUser.confirmSuspensionBtn")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function UserManagement() {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [page, setPage] = useState(1);
  const initialPageSize = typeof window !== "undefined" && window.innerWidth <= 680 ? 6 : 10;
  const [pageSize, setPageSize] = useState(initialPageSize);

  //================
  // CSRF
  //================
  const [csrfToken, setCsrfToken] = useState("");

  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const res = await fetch(`${API_BASE_URL}/api/csrf-token`, { credentials: "include" });
        const data = await res.json();
        setCsrfToken(data.csrfToken);
      } catch (err) {
        console.error("Failed to fetch CSRF token", err);
      }
    };
    fetchCsrfToken();
  }, []);

  // Fetch users from backend on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/admin/users`, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch users: ${response.status}`);
        }

        const data = await response.json();

        if (data.success && Array.isArray(data.users)) {
          setUsers(data.users);
          setError(null);
        } else {
          throw new Error("Invalid response format");
        }
      } catch (err) {
        console.error("Error fetching users:", err);
        setError(err.message);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const platformName = "SarawakEats";
  const EMAIL_TEMPLATES = {
    "Custom message": { subject: "", message: "" },
    "Welcome Message": {
      subject: `Welcome to ${platformName}!`,
      message: `Hello,\n\nWelcome to ${platformName}! We're excited to have you join our community dedicated to preserving and sharing Sarawakian culinary heritage. Explore traditional recipes, discover nutritional insights, and connect with fellow food enthusiasts.\n\nThanks,\n${platformName} Team`,
    },
    "Content Approval": {
      subject: `Your submission has been approved!`,
      message: `Hello,\n\nCongratulations! Your recipe/food submission has been reviewed and approved by our team. It is now live on the ${platformName} platform for the community to discover and enjoy. Thank you for contributing to our cultural heritage preservation efforts.\n\nThanks,\n${platformName} Team`,
    },
    "Content Rejection": {
      subject: `Update on your submission`,
      message: `Hello,\n\nThank you for your submission to ${platformName}. After careful review, we found that some adjustments are needed before publication. Please check the feedback provided and feel free to resubmit with the suggested improvements.\n\nThanks,\n${platformName} Team`,
    },
    "System Update": {
      subject: `${platformName} Platform Update`,
      message: `Hello,\n\nWe've made some exciting updates to the ${platformName} platform! Check out the new features and improvements designed to enhance your experience exploring Sarawakian cuisine and culture.\n\nThanks,\n${platformName} Team`,
    },
  };

  // Summary metrics
  const totalUsers = users.length;
  const adminCount = users.filter(u => u.role === "Admin").length;
  const contributors = users.filter(u => u.submissions > 0).length;
  const activeCount = users.filter(u => u.status === "Active").length;
  const suspendedCount = users.filter(u => u.suspendedUntil && new Date(u.suspendedUntil) > new Date()).length;

  // Filtering
  const filteredUsers = users.filter(u => {
    const q = userSearch.trim().toLowerCase();
    const matchesSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.city.toLowerCase().includes(q);

    const matchesRole = roleFilter === "All Roles" || u.role === roleFilter;

    let matchesStatus = true;
    if (statusFilter === "Suspended") {
      matchesStatus = u.suspendedUntil && new Date(u.suspendedUntil) > new Date();
    } else if (statusFilter === "Active" || statusFilter === "Inactive") {
      matchesStatus = u.status === statusFilter && (!u.suspendedUntil || new Date(u.suspendedUntil) <= new Date());
    } else {
      matchesStatus = true;
    }

    return matchesSearch && matchesRole && matchesStatus;
  });

  useEffect(() => { setPage(1); }, [userSearch, roleFilter, statusFilter]);

  const totalUsersFiltered = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalUsersFiltered / pageSize));
  const startIdx = (page - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, totalUsersFiltered);
  const pageUsers = filteredUsers.slice(startIdx, endIdx);

  const goPrev = () => setPage(p => Math.max(1, p - 1));
  const goNext = () => setPage(p => Math.min(totalPages, p + 1));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
    if (totalPages === 0 && page !== 1) setPage(1);
  }, [totalPages, page]);

  const [showUserModal, setShowUserModal] = useState(false);
  const [userMode, setUserMode] = useState("create");
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [userToSuspend, setUserToSuspend] = useState(null);

  const emptyUser = {
    id: null, name: "", email: "", city: "",
    role: "User", status: "Inactive",
    suspendedUntil: null, suspensionReason: "",
    submissions: 0, approved: 0, lastLogin: "—",
  };
  const [userForm, setUserForm] = useState(emptyUser);

  const [dlg, setDlg] = useState({
    open: false, title: "", message: "", icon: null, primaryText: "OK", onPrimary: null,
  });
  const closeDlg = () => setDlg((m) => ({ ...m, open: false, onPrimary: null }));

  const [confirm, setConfirm] = useState({
    open: false, title: "", message: "", icon: null,
    confirmText: "Confirm", cancelText: "Cancel", onConfirm: null,
  });
  const closeConfirm = () => setConfirm((m) => ({ ...m, open: false, onConfirm: null }));

  const openCreateUser = () => {
    setUserMode("create");
    setUserForm(emptyUser);
    setShowUserModal(true);
  };

  const openEditUser = (u) => {
    setUserMode("edit");
    setUserForm({ ...u });
    setShowUserModal(true);
  };

  const openSuspendUser = (u) => {
    setUserToSuspend(u);
    setShowSuspendModal(true);
  };

  const handleSuspendSave = async (userId, suspensionDate, reason) => {
    setShowSuspendModal(false);
    try {
      const response = await fetch(`${API_URL}/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
        credentials: "include",
        body: JSON.stringify({ suspendedUntil: suspensionDate, suspensionReason: reason }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to suspend user");
      }

      const data = await response.json();

      if (data.success && data.user) {
        setUsers(prev =>
          prev.map(u => u.id === userId ? { ...u, ...data.user, suspendedUntil: suspensionDate, suspensionReason: reason } : u)
        );
        setDlg({
          open: true,
          title: t("adminUser.userSuspended"),
          message: t("adminUser.userSuspendedMsg", { name: data.user.name, date: suspensionDate }),
          icon: <SuccessIcon />,
          onPrimary: closeDlg,
        });
      }
    } catch (err) {
      console.error("Error suspending user:", err);
      setDlg({
        open: true,
        title: t("adminUser.failedToSuspend"),
        message: err.message || t("adminUser.pleaseRetry"),
        icon: <AlertIcon />,
        onPrimary: closeDlg,
      });
    }
  };

  const handleUnsuspend = async (userId, userName) => {
    setConfirm({
      open: true,
      title: t("adminUser.unsuspendUser"),
      message: t("adminUser.unsuspendConfirm", { name: userName }),
      icon: <WarnIcon />,
      confirmText: t("adminUser.unsuspendBtn"),
      cancelText: t("adminUser.cancelBtn"),
      onConfirm: async () => {
        closeConfirm();
        try {
          const response = await fetch(`${API_URL}/api/admin/users/${userId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
            credentials: "include",
            body: JSON.stringify({ suspendedUntil: null, suspensionReason: "" }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to unsuspend user");
          }

          const data = await response.json();

          if (data.success && data.user) {
            setUsers(prev =>
              prev.map(u => u.id === userId ? { ...u, ...data.user, suspendedUntil: null, suspensionReason: "" } : u)
            );
            setDlg({
              open: true,
              title: t("adminUser.userUnsuspended"),
              message: t("adminUser.userUnsuspendedMsg", { name: data.user.name }),
              icon: <SuccessIcon />,
              onPrimary: closeDlg,
            });
          }
        } catch (err) {
          console.error("Error unsuspending user:", err);
          setDlg({
            open: true,
            title: t("adminUser.unsuspendFailed"),
            message: err.message || t("adminUser.pleaseRetry"),
            icon: <AlertIcon />,
            onPrimary: closeDlg,
          });
        }
      },
    });
  };

  const saveUser = async () => {
    if (!userForm.name.trim()) {
      setDlg({ open: true, title: t("adminUser.missingName"), message: t("adminUser.nameRequired"), icon: <AlertIcon />, onPrimary: closeDlg });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userForm.email)) {
      setDlg({ open: true, title: t("adminUser.invalidEmail"), message: t("adminUser.invalidEmailMsg"), icon: <AlertIcon />, onPrimary: closeDlg });
      return;
    }
    try {
      if (userMode === "create") {
        const response = await fetch(`${API_URL}/api/admin/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
          credentials: "include",
          body: JSON.stringify({
            name: userForm.name, email: userForm.email,
            city: userForm.city, role: userForm.role, status: "Inactive",
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to create user");
        }

        const data = await response.json();
        if (data.success && data.user) {
          setUsers(prev => [data.user, ...prev]);
        }
      } else {
        const response = await fetch(`${API_URL}/api/admin/users/${userForm.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
          credentials: "include",
          body: JSON.stringify({
            name: userForm.name, email: userForm.email,
            city: userForm.city, role: userForm.role,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to update user");
        }

        const data = await response.json();
        if (data.success && data.user) {
          setUsers(prev => prev.map(u => u.id === userForm.id ? data.user : u));
        }
      }

      setShowUserModal(false);
      setPage(1);
      setDlg({
        open: true,
        title: userMode === "create" ? t("adminUser.userCreated") : t("adminUser.userUpdated"),
        message: userMode === "create" ? t("adminUser.userCreatedMsg") : t("adminUser.userUpdatedMsg"),
        icon: <SuccessIcon />,
        onPrimary: closeDlg,
      });
    } catch (err) {
      console.error("Error saving user:", err);
      setDlg({
        open: true,
        title: t("adminUser.saveFailed"),
        message: err.message || t("adminUser.pleaseRetry"),
        icon: <AlertIcon />,
        onPrimary: closeDlg,
      });
    }
  };

  const deleteUserById = async (id, opts = {}) => {
    const { onSuccess } = opts;
    const u = users.find(x => x.id === id);
    if (!u) return;

    setConfirm({
      open: true,
      title: t("adminUser.deleteUser"),
      message: t("adminUser.deleteUserConfirm", { name: u.name }),
      icon: <WarnIcon />,
      confirmText: t("adminUser.deleteBtn"),
      cancelText: t("adminUser.cancelBtn"),
      onConfirm: async () => {
        closeConfirm();
        try {
          const response = await fetch(`${API_URL}/api/admin/users/${id}`, {
            method: "DELETE",
            headers: { "X-CSRF-Token": csrfToken },
            credentials: "include",
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to delete user");
          }

          setUsers(prev => prev.filter(x => x.id !== id));
          setPage(1);
          onSuccess?.();
          setDlg({
            open: true,
            title: t("adminUser.userDeleted"),
            message: t("adminUser.userDeletedMsg"),
            icon: <SuccessIcon />,
            onPrimary: closeDlg,
          });
        } catch (err) {
          console.error("Error deleting user:", err);
          setDlg({
            open: true,
            title: t("adminUser.deleteFailed"),
            message: err.message || t("adminUser.pleaseRetry"),
            icon: <AlertIcon />,
            onPrimary: closeDlg,
          });
        }
      },
    });
  };

  const renderPageNumbers = () => {
    let start = page - 1;
    let end = page + 1;
    if (page === 1) { end = 3; }
    else if (page === totalPages) { start = totalPages - 2; }
    start = Math.max(1, start);
    end = Math.min(totalPages, end);

    let pages = [];
    if (start > 1) pages.push('...');
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages) pages.push('...');

    return pages.map((p, index) => (
      <button
        key={index}
        onClick={() => p !== '...' && setPage(p)}
        className={`${page === p ? "active" : ""} ${p === '...' ? "umg-dots" : ""}`}
        disabled={p === '...'}
      >
        {p}
      </button>
    ));
  };

  return (
    <div className="user-mgmt">

      {loading && (
        <div className="umg-loading-container">
          <div className="umg-loading-spinner"></div>
          <p className="umg-loading-text">{t("adminUser.loadingUsers")}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="umg-header-row">
            <div>
              <h2 className="umg-title">{t("adminUser.title")}</h2>
              <p className="umg-subtitle">{t("adminUser.subtitle")}</p>
            </div>
          </div>

          {/* Summary cards */}
          <div className="umg-cards">
            <div className="umg-card">
              <div className="umg-card-title">{t("adminUser.totalUsers")}</div>
              <div className="umg-card-value">{totalUsers}</div>
              <div className="umg-card-icon"><Users size="40" color="#592700ff" /></div>
            </div>
            <div className="umg-card">
              <div className="umg-card-title">{t("adminUser.admin")}</div>
              <div className="umg-card-value umg-admin-value">{adminCount}</div>
              <div className="umg-card-icon"><Shield size="40" color="#7200ddff" /></div>
            </div>
            <div className="umg-card">
              <div className="umg-card-title">{t("adminUser.contributors")}</div>
              <div className="umg-card-value umg-contributor-value">{contributors}</div>
              <div className="umg-card-icon"><Activity size="40" color="#0000FF" /></div>
            </div>
            <div className="umg-card">
              <div className="umg-card-title">{t("adminUser.active")}</div>
              <div className="umg-card-value umg-active-value">{activeCount}</div>
              <div className="umg-card-icon"><CircleCheckBig size="40" color="green" /></div>
            </div>
            <div className="umg-card">
              <div className="umg-card-title">{t("adminUser.suspended")}</div>
              <div className="umg-card-value umg-issue-value">{suspendedCount}</div>
              <div className="umg-card-icon"><CircleX size="40" color="red" /></div>
            </div>
          </div>

          {/* Search + filters row */}
          <div className="umg-filterbar">
            <div className="umg-search">
              <CiSearch className="umg-search-icon" />
              <input
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder={t("adminUser.searchPlaceholder")}
              />
            </div>

            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="umg-select">
              <option>{t("adminUser.allRoles")}</option>
              <option>{t("adminUser.userRole")}</option>
              <option>{t("adminUser.adminRole")}</option>
            </select>

            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="umg-select">
              <option>{t("adminUser.allStatuses")}</option>
              <option>{t("adminUser.activeStatus")}</option>
              <option>{t("adminUser.inactiveStatus")}</option>
              <option>{t("adminUser.suspendedStatus")}</option>
            </select>
          </div>

          {/* List card */}
          <div className="umg-list-card">
            <div className="umg-list-head">
              <div className="umg-list-title">
                <Users />
                <span>{t("adminUser.userAccounts", { count: filteredUsers.length })}</span>
              </div>
              <button className="umg-btn-primary" onClick={openCreateUser}>
                {t("adminUser.createUser")}
              </button>
            </div>

            <table className="umg-table">
              <thead>
                <tr>
                  <th>{t("adminUser.tableHeaderName")}</th>
                  <th>{t("adminUser.tableHeaderRole")}</th>
                  <th>{t("adminUser.tableHeaderStatus")}</th>
                  <th>{t("adminUser.tableHeaderContributions")}</th>
                  <th>{t("adminUser.tableHeaderLastLogin")}</th>
                  <th className="umg-actions-th">{t("adminUser.tableHeaderActions")}</th>
                </tr>
              </thead>
              <tbody>
                {pageUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="umg-empty">{t("adminUser.noUsersFound")}</td>
                  </tr>
                ) : (
                  pageUsers.map(u => (
                    <tr key={u.id}>
                      <td data-label="User">
                        <div className="umg-mobile-content">
                          <div className="umg-name">{u.name}</div>
                          <div className="umg-subline umg-mobile-email">{u.email}</div>
                          <div className="umg-subline umg-city-desktop">{u.city}</div>
                          <div className="umg-status-inline">
                            {(u.suspendedUntil && new Date(u.suspendedUntil) > new Date()) && (
                              <span className="umg-pill umg-pill-suspended">{t("adminUser.suspendedStatus")}</span>
                            )}
                            {u.status === "Active" && (
                              <span className="umg-pill umg-pill-active">{t("adminUser.activeStatus")}</span>
                            )}
                            {u.status === "Inactive" && (
                              <span className="umg-pill umg-pill-inactive">{t("adminUser.inactiveStatus")}</span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td data-label="Email" className="umg-mobile-only-row">
                        <div className="umg-mobile-content umg-truncate-email" title={u.email}>
                          {u.email}
                        </div>
                      </td>

                      <td data-label="Role">
                        <div className="umg-mobile-content">
                          <span className="umg-pill umg-pill-role">{u.role}</span>
                        </div>
                      </td>

                      <td data-label="Status">
                        <div className="umg-mobile-content">
                          <div className="umg-status-stack">
                            {u.status === "Active" && (
                              <span className="umg-pill umg-pill-active">{t("adminUser.activeStatus")}</span>
                            )}
                            {u.status === "Inactive" && (
                              <span className="umg-pill umg-pill-inactive">{t("adminUser.inactiveStatus")}</span>
                            )}
                            {(u.suspendedUntil && new Date(u.suspendedUntil) > new Date()) && (
                              <>
                                <span className="umg-pill umg-pill-suspended">{t("adminUser.suspendedStatus")}</span>
                                <div className="umg-status-note">
                                  {u.suspensionReason && (
                                    <div>{t("adminUser.suspendedReason", { reason: u.suspensionReason })}</div>
                                  )}
                                  {u.suspendedUntil && (
                                    <div>{t("adminUser.suspendedUntil", { date: u.suspendedUntil.split('T')[0] })}</div>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </td>

                      <td data-label="Activity">
                        <div className="umg-submissions">
                          {t("adminUser.submissions", { count: u.submissions })}
                        </div>
                        <div className="umg-subline">{t("adminUser.approved", { count: u.approved })}</div>
                      </td>

                      <td data-label="Last Login">{u.lastLogin}</td>

                      <td className="umg-ellipsis-td umg-mobile-action-row" data-label="Actions">
                        {(u.suspendedUntil && new Date(u.suspendedUntil) > new Date()) ? (
                          <button
                            className="umg-ellipsis umg-unsuspend-btn"
                            title="Unsuspend user"
                            onClick={() => handleUnsuspend(u.id, u.name)}
                          >
                            <CircleCheckBig size={18} />
                          </button>
                        ) : (
                          <button
                            className="umg-ellipsis umg-suspend-btn"
                            title="Suspend user"
                            onClick={() => openSuspendUser(u)}
                          >
                            <CircleOff size={18} />
                          </button>
                        )}
                        <button
                          className="umg-ellipsis umg-mobile-action-btn"
                          title="Edit user"
                          onClick={() => openEditUser(u)}
                        >
                          <HiOutlinePencilAlt />
                        </button>
                        <button
                          className="umg-ellipsis umg-mobile-action-btn delete"
                          title="Delete user"
                          onClick={() => deleteUserById(u.id)}
                        >
                          <RiDeleteBin5Line />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="admin-pagination">
                <button onClick={goPrev} disabled={page === 1} className="umg-prev-next">
                  {t("adminUser.prevPage")}
                </button>
                {renderPageNumbers()}
                <button onClick={goNext} disabled={page === totalPages} className="umg-prev-next">
                  {t("adminUser.nextPage")}
                </button>
              </div>
            )}
          </div>

          {showUserModal && (
            <div
              className="umg-modal-backdrop"
              role="dialog"
              aria-modal="true"
              onClick={() => setShowUserModal(false)}
            >
              <div className="umg-modal" onClick={(e) => e.stopPropagation()}>
                <div className="umg-modal-header">
                  <h3>{userMode === "create" ? t("adminUser.createUserTitle") : t("adminUser.editUserTitle")}</h3>
                  <button className="umg-modal-close" onClick={() => setShowUserModal(false)} aria-label="Close">×</button>
                </div>

                <div className="umg-modal-body">
                  <div className="umg-field">
                    <label className="umg-label">{t("adminUser.nameLabel")}</label>
                    <input
                      className="umg-input"
                      value={userForm.name}
                      onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder={t("adminUser.namePlaceholder")}
                    />
                  </div>

                  <div className="umg-field">
                    <label className="umg-label">{t("adminUser.emailLabel")}</label>
                    <input
                      className="umg-input"
                      value={userForm.email}
                      onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder={t("adminUser.emailPlaceholder")}
                    />
                  </div>

                  <div className="umg-field">
                    <label className="umg-label">{t("adminUser.cityLabel")}</label>
                    <input
                      className="umg-input"
                      value={userForm.city}
                      onChange={(e) => setUserForm(prev => ({ ...prev, city: e.target.value }))}
                      placeholder={t("adminUser.cityPlaceholder")}
                    />
                  </div>

                  <div className="umg-metrics-row">
                    <div className="umg-field">
                      <label className="umg-label">{t("adminUser.roleLabel")}</label>
                      <select
                        className="umg-input"
                        value={userForm.role}
                        onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value }))}
                      >
                        <option>{t("adminUser.userRole")}</option>
                        <option>{t("adminUser.adminRole")}</option>
                      </select>
                    </div>

                    <div className="umg-field">
                      <label className="umg-label">{t("adminUser.currentStatusLabel")}</label>
                      <div className="umg-value">
                        <span className={`umg-pill ${userForm.status === "Active" ? "umg-pill-active" : "umg-pill-inactive"}`}>
                          {userForm.status}
                        </span>
                        {(userForm.suspendedUntil && new Date(userForm.suspendedUntil) > new Date()) && (
                          <span className="umg-pill umg-pill-suspended">{t("adminUser.suspendedStatus")}</span>
                        )}
                      </div>
                      {(userForm.suspendedUntil && new Date(userForm.suspendedUntil) > new Date()) && (
                        <div className="umg-suspension-details">
                          {userForm.suspensionReason && (
                            <div className="umg-hint">{t("adminUser.suspendedDetailsReason", { reason: userForm.suspensionReason })}</div>
                          )}
                          <div className="umg-hint">{t("adminUser.suspendedDetailsUntil", { date: userForm.suspendedUntil.split('T')[0] })}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {userMode === "edit" && (
                    <div className="umg-metrics-row">
                      <div className="umg-field">
                        <label className="umg-label">{t("adminUser.tableHeaderContributions")}</label>
                        <div className="umg-value">
                          {t("adminUser.submissionsApproved", { submissions: userForm.submissions, approved: userForm.approved })}
                        </div>
                      </div>
                      <div className="umg-field">
                        <label className="umg-label">{t("adminUser.lastLoginLabel")}</label>
                        <div className="umg-value">{userForm.lastLogin}</div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="umg-modal-footer">
                  {userMode === "edit" && (
                    <div className="umg-footer-left">
                      <button
                        type="button"
                        className="umg-btn umg-btn-danger"
                        onClick={() => {
                          if (!userForm?.id) return;
                          deleteUserById(userForm.id, { onSuccess: () => setShowUserModal(false) });
                        }}
                      >
                        {t("adminUser.deleteBtn")}
                      </button>
                    </div>
                  )}

                  <div className="umg-footer-spacer" />

                  <button type="button" className="umg-btn umg-btn-ghost" onClick={() => setShowUserModal(false)}>
                    {t("adminUser.cancelBtn")}
                  </button>

                  <button type="button" className="umg-btn umg-btn-primary" onClick={saveUser}>
                    {userMode === "create" ? t("adminUser.createBtn") : t("adminUser.saveChangesBtn")}
                  </button>
                </div>
              </div>
            </div>
          )}

          {showSuspendModal && userToSuspend && (
            <SuspendUserModal
              user={userToSuspend}
              onClose={() => setShowSuspendModal(false)}
              onSave={handleSuspendSave}
              onAlert={(title, message) => setDlg({
                open: true, title, message, icon: <AlertIcon />, onPrimary: closeDlg,
              })}
            />
          )}
        </>
      )}

      <Modal
        open={dlg.open}
        title={dlg.title}
        icon={dlg.icon}
        primaryText={dlg.primaryText || "OK"}
        onClose={closeDlg}
        onPrimary={dlg.onPrimary || closeDlg}
      >
        {dlg.message}
      </Modal>

      <Modal
        open={confirm.open}
        title={confirm.title}
        icon={confirm.icon}
        secondaryText={confirm.cancelText || "Cancel"}
        onSecondary={closeConfirm}
        primaryText={confirm.confirmText || "Confirm"}
        onPrimary={confirm.onConfirm}
        onClose={closeConfirm}
      >
        {confirm.message}
      </Modal>
    </div>
  );
}