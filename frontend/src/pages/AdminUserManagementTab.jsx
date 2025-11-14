import React, { useState, useEffect } from "react";
import { CiSearch } from "react-icons/ci";
import { Mail, Shield, Users, Activity, CircleCheckBig, CircleX, CircleOff, X, Bell, Send } from 'lucide-react';
import { HiOutlinePencilAlt } from "react-icons/hi";
import { RiDeleteBin5Line } from "react-icons/ri";
import Modal from "../components/Modal";
import { CircleAlert as AlertIcon, CheckCircle2 as SuccessIcon, TriangleAlert as WarnIcon } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Suspend User Modal Component
    const SuspendUserModal = ({ user, onClose, onSave, onAlert }) => {
    // State for the suspension details
    const [suspensionDate, setSuspensionDate] = useState(
        // Default to today or load existing suspension date
        user?.suspendedUntil ? user.suspendedUntil.split('T')[0] : new Date().toISOString().slice(0, 10)
    );
    const [reason, setReason] = useState(user?.suspensionReason || "");

    const handleSave = () => {
        if (!suspensionDate) return onAlert?.("Missing Date", "Suspension date is required.");
        if (!reason.trim()) return onAlert?.("Missing Reason", "Suspension reason is required.");

        // Call the parent handler with the collected data
        onSave(user.id, suspensionDate, reason.trim());
    };

    return (
        <div
            className="umg-modal-backdrop"
            role="dialog"
            aria-modal="true"
            onClick={onClose}
        >
            {/* umg-suspend-modal is a new CSS class for size/styling */}
            <div className="umg-modal umg-suspend-modal" onClick={(e) => e.stopPropagation()}>
                <div className="umg-modal-header">
                    <h3><CircleOff size={18} /> Suspend User: {user.name}</h3>
                    <button className="umg-modal-close" onClick={onClose} aria-label="Close">×</button>
                </div>

                <div className="umg-modal-body">
                    {/* Suspended Until Date */}
                    <div className="umg-field">
                        <label className="umg-label">Suspended Until</label>
                        <input
                            className="umg-input"
                            type="date"
                            min={new Date().toISOString().slice(0, 10)}
                            value={suspensionDate}
                            onChange={(e) => setSuspensionDate(e.target.value)}
                        />
                        <div className="umg-hint">The user will be automatically unsuspended after this date.</div>
                    </div>

                    {/* Reason */}
                    <div className="umg-field">
                        <label className="umg-label">Suspension Reason</label>
                        <textarea
                            className="umg-input umg-textarea-small" // umg-textarea-small is a new CSS class
                            placeholder="State the rule violation or reason for suspension (e.g., 'Violated ToS: Spamming content')."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                    </div>
                </div>

                <div className="umg-modal-footer">
                    <button
                        type="button"
                        className="umg-btn umg-btn-secondary"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="umg-btn umg-btn-danger"
                        onClick={handleSave}
                    >
                        Confirm Suspension
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [page, setPage] = useState(1);
  const initialPageSize = typeof window !== "undefined" && window.innerWidth <= 680 ? 6 : 10;
  const [pageSize, setPageSize] = useState(initialPageSize);

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
        setUsers([]); // Fallback to empty array
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []); // Empty dependency array = run once on mount

    const categories = [
    "All Categories",
    "Poultry",
    "Seafood",
    "Vegetables",
    "Fermented",
    "Desserts",
    "Rice Dish",
    "Noodles",
    "Soup",
    "Meat",
  ];

  const platformName = "SarawakEats";
  const EMAIL_TEMPLATES = {
    "Custom message": {
      subject: "",
      message: "",
    },
    "Welcome Message": {
      subject: `Welcome to ${platformName}!`,
      message:
        `Hello,\n\nWelcome to ${platformName}! We're excited to have you join our community dedicated to preserving and sharing Sarawakian culinary heritage. Explore traditional recipes, discover nutritional insights, and connect with fellow food enthusiasts.\n\nThanks,\n${platformName} Team`,
    },
    "Content Approval": {
      subject: `Your submission has been approved!`,
      message:
        `Hello,\n\nCongratulations! Your recipe/food submission has been reviewed and approved by our team. It is now live on the ${platformName} platform for the community to discover and enjoy. Thank you for contributing to our cultural heritage preservation efforts.\n\nThanks,\n${platformName} Team`,
    },
    "Content Rejection": {
      subject: `Update on your submission`,
      message:
        `Hello,\n\nThank you for your submission to ${platformName}. After careful review, we found that some adjustments are needed before publication. Please check the feedback provided and feel free to resubmit with the suggested improvements.\n\nThanks,\n${platformName} Team`,
    },
    "System Update": {
      subject: `${platformName} Platform Update`,
      message:
        `Hello,\n\nWe've made some exciting updates to the ${platformName} platform! Check out the new features and improvements designed to enhance your experience exploring Sarawakian cuisine and culture.\n\nThanks,\n${platformName} Team`,
    },
  };
  
    // Summary metrics (derived so they always stay fresh)
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
  
      const matchesRole =
        roleFilter === "All Roles" || u.role === roleFilter;
  
      let matchesStatus = true;
      if (statusFilter === "Suspended") {
        matchesStatus = u.suspendedUntil && new Date(u.suspendedUntil) > new Date();
      } else if (statusFilter === "Active" || statusFilter === "Inactive") {
        // When checking for Active/Inactive, ALSO make sure they are NOT suspended
        matchesStatus = u.status === statusFilter && (!u.suspendedUntil || new Date(u.suspendedUntil) <= new Date());
      } else {
        // All Statuses
        matchesStatus = true;
      }
  
      return matchesSearch && matchesRole && matchesStatus;
    });
  
    useEffect(() => {
      setPage(1);
    }, [userSearch, roleFilter, statusFilter]);
  
    const totalUsersFiltered = filteredUsers.length;
    const totalPages = Math.max(1, Math.ceil(totalUsersFiltered / pageSize));
    const startIdx = (page - 1) * pageSize;
    const endIdx = Math.min(startIdx + pageSize, totalUsersFiltered);
    const pageUsers = filteredUsers.slice(startIdx, endIdx);
  
    const goPrev = () => setPage(p => Math.max(1, p - 1));
    const goNext = () => setPage(p => Math.min(totalPages, p + 1));
  
    useEffect(() => {
      if (page > totalPages) {
        setPage(totalPages);
      }
      if (totalPages === 0 && page !== 1) {
        setPage(1);
      }
    }, [totalPages, page]);

    const [showUserModal, setShowUserModal] = useState(false);
    const [userMode, setUserMode] = useState("create"); // "create" | "edit"
    const [showSuspendModal, setShowSuspendModal] = useState(false);
    const [userToSuspend, setUserToSuspend] = useState(null);

    const emptyUser = {
      id: null,
      name: "",
      email: "",
      city: "",
      role: "User",           // "User" | "Admin"
      status: "Inactive",       // "Active" | "Inactive" | "Suspended"
      suspendedUntil: null,
      suspensionReason: "",
      submissions: 0,
      approved: 0,
      lastLogin: "—",
    };
    const [userForm, setUserForm] = useState(emptyUser);

    const [dlg, setDlg] = useState({
      open: false,
      title: "",
      message: "",
      icon: null,
      primaryText: "OK",
      onPrimary: null,
    });
    const closeDlg = () => setDlg((m) => ({ ...m, open: false, onPrimary: null }));

    const [confirm, setConfirm] = useState({
      open: false,
      title: "",
      message: "",
      icon: null,
      confirmText: "Confirm",
      cancelText: "Cancel",
      onConfirm: null,
    });
    const closeConfirm = () => setConfirm((m) => ({ ...m, open: false, onConfirm: null }));


    // Open Create
    const openCreateUser = () => {
    setUserMode("create");
    setUserForm(emptyUser);
    setShowUserModal(true);
    };

    // Open Edit
    const openEditUser = (u) => {
        setUserMode("edit");
        setUserForm({ ...u });
        setShowUserModal(true);
    };

    // Handle Suspension
    const openSuspendUser = (u) => {
        setUserToSuspend(u);
        setShowSuspendModal(true);
    };

    const handleSuspendSave = async (userId, suspensionDate, reason) => {
        setShowSuspendModal(false);
        try {
            // This is the API call to update the user's status to Suspended
            const response = await fetch(`${API_URL}/api/admin/users/${userId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    suspendedUntil: suspensionDate,
                    suspensionReason: reason,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to suspend user");
            }

            const data = await response.json();
            
            if (data.success && data.user) {
                // Update local state to reflect new status
                setUsers(prev =>
                    prev.map(u => u.id === userId ? { ...u, ...data.user, suspendedUntil: suspensionDate, suspensionReason: reason } : u)
                );
                setDlg({
                  open: true,
                  title: "User Suspended",
                  message: `User ${data.user.name} suspended until ${suspensionDate}.`,
                  icon: <SuccessIcon />,
                  onPrimary: closeDlg,
                });
            }

        } catch (err) {
            console.error("Error suspending user:", err);
            setDlg({
              open: true,
              title: "Failed to Suspend",
              message: err.message || "Please try again.",
              icon: <AlertIcon />,
              onPrimary: closeDlg,
            });
        }
    };

    // handle Unsuspension
    const handleUnsuspend = async (userId, userName) => {
      setConfirm({
        open: true,
        title: "Unsuspend User",
        message: `Are you sure you want to unsuspend "${userName}"?`,
        icon: <WarnIcon />,
        confirmText: "Unsuspend",
        cancelText: "Cancel",
        onConfirm: async () => {
          closeConfirm();

        try {
            // This is the API call to clear the suspension
            const response = await fetch(`${API_URL}/api/admin/users/${userId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ 
                    suspendedUntil: null, // Clear suspension date
                    suspensionReason: "", // Clear reason
                }),
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
                  title: "User Unsuspended",
                  message: `User ${data.user.name} has been unsuspended.`,
                  icon: <SuccessIcon />,
                  onPrimary: closeDlg,
                });
            }

        } catch (err) {
            console.error("Error unsuspending user:", err);
            setDlg({
              open: true,
              title: "Unsuspend Failed",
              message: err.message || "Please try again.",
              icon: <AlertIcon />,
              onPrimary: closeDlg,
            });
        }
      },
    });
  };

    // Save (Create or Update)
    const saveUser = async () => {
    if (!userForm.name.trim()) {
      setDlg({ open: true, title: "Missing Name", message: "Name is required.", icon: <AlertIcon />, onPrimary: closeDlg });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userForm.email)) {
      setDlg({ open: true, title: "Invalid Email", message: "Please enter a valid email address.", icon: <AlertIcon />, onPrimary: closeDlg });
      return;
    }
    try {
      if (userMode === "create") {
        // Call backend to create user
        const response = await fetch(`${API_URL}/api/admin/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: userForm.name,
            email: userForm.email,
            city: userForm.city,
            role: userForm.role,
            status: "Inactive",
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to create user");
        }

        const data = await response.json();
        
        // Add new user to local state
        if (data.success && data.user) {
          setUsers(prev => [data.user, ...prev]); // prepend for visibility
        }

      } else {
        // Call backend to update user
        const response = await fetch(`${API_URL}/api/admin/users/${userForm.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: userForm.name,
            email: userForm.email,
            city: userForm.city,
            role: userForm.role,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to update user");
        }

        const data = await response.json();

        // Update user in local state
        if (data.success && data.user) {
          setUsers(prev =>
            prev.map(u => u.id === userForm.id ? data.user : u)
          );
        }
      }

      setShowUserModal(false);
      setPage(1);
      setDlg({
        open: true,
        title: userMode === "create" ? "User Created" : "User Updated",
        message: userMode === "create"
          ? "The user has been created successfully."
          : "The user has been updated successfully.",
        icon: <SuccessIcon />,
        onPrimary: closeDlg,
      });
    } catch (err) {
      console.error("Error saving user:", err);
      setDlg({
        open: true,
        title: "Save Failed",
        message: err.message || "Please try again.",
        icon: <AlertIcon />,
        onPrimary: closeDlg,
      });
    }
    };

    // Delete
    const deleteUserById = async (id) => {
      const u = users.find(x => x.id === id);
      if (!u) return;
      
      setConfirm({
        open: true,
        title: "Delete User",
        message: `Delete user "${u.name}"? This cannot be undone.`,
        icon: <WarnIcon />,
        confirmText: "Delete",
        cancelText: "Cancel",
        onConfirm: async () => {
          closeConfirm();
          try {
              const response = await fetch(`${API_URL}/api/admin/users/${id}`, {
                  method: "DELETE",
                  credentials: "include",
              });

              if (!response.ok) {
                  const errorData = await response.json();
                  throw new Error(errorData.message || "Failed to delete user");
              }

              // Remove user from local state after successful deletion
              setUsers(prev => prev.filter(x => x.id !== id));
              setPage(1);
              setDlg({ open: true, title: "User Deleted", message: "The user has been removed.", icon: <SuccessIcon />, onPrimary: closeDlg });

          } catch (err) {
              console.error("Error deleting user:", err);
              setDlg({ open: true, title: "Delete Failed", message: err.message || "Please try again.", icon: <AlertIcon />, onPrimary: closeDlg });
          }
        },
      });
    }

    const invalidateSessions = (id) => {
      if (!id) return;
      setConfirm({
        open: true,
        title: "Invalidate Sessions",
        message: "Invalidate all active sessions for this user? They’ll be logged out on all devices.",
        icon: <WarnIcon />,
        confirmText: "Invalidate",
        cancelText: "Cancel",
        onConfirm: async () => {
          closeConfirm();

          // TODO: replace with real API call:
          // await fetch(`/api/admin/users/${id}/invalidate-sessions`, { method: "POST" })

          console.log("INVALIDATE_SESSIONS ▶ userId:", id);
          setDlg({
            open: true,
            title: "Sessions Invalidated",
            message: "The user will be logged out everywhere.",
            icon: <SuccessIcon />,
            onPrimary: closeDlg,
          });
        },
      });
    };
  
    return (
        // User Management
        <div className="user-mgmt">
          {/* ✅ ADD THESE 3 BLOCKS HERE - RIGHT AFTER <div className="user-mgmt"> */}
          
          {/* Loading State */}
          {loading && (
            <div className="umg-loading-container">
              <div className="umg-loading-spinner"></div>
              <p className="umg-loading-text">Loading users...</p>
            </div>
          )}

          {/* Wrap existing content - only show when loaded successfully */}
          {!loading && !error && (
            <>
          <div className="umg-header-row">
            <div>
              <h2 className="umg-title">Enhanced User Management</h2>
              <p className="umg-subtitle">Comprehensive user account administration</p>
            </div>
          </div>

          {/* Summary cards */}
          <div className="umg-cards">
            <div className="umg-card">
              <div className="umg-card-title">Total Users</div>
              <div className="umg-card-value">{totalUsers}</div>
              <div className="umg-card-icon"><Users size="40" color="#592700ff"/></div>
            </div>
            <div className="umg-card">
              <div className="umg-card-title">Admin</div>
              <div className="umg-card-value umg-admin-value">{adminCount}</div>
              <div className="umg-card-icon"><Shield size="40" color="#7200ddff"/></div>
            </div>
            <div className="umg-card">
              <div className="umg-card-title">Contributors</div>
              <div className="umg-card-value umg-contributor-value">{contributors}</div>
              <div className="umg-card-icon"><Activity size="40" color="#0000FF"/></div>
            </div>
            <div className="umg-card">
              <div className="umg-card-title">Active</div>
              <div className="umg-card-value umg-active-value">{activeCount}</div>
              <div className="umg-card-icon"><CircleCheckBig size="40" color="green"/></div>
            </div>
            <div className="umg-card">
              <div className="umg-card-title">Suspended</div>
              <div className="umg-card-value umg-issue-value">{suspendedCount}</div>
              <div className="umg-card-icon"><CircleX size="40" color="red"/></div>
            </div>
          </div>

          {/* Search + filters row */}
          <div className="umg-filterbar">
            <div className="umg-search">
              <CiSearch className="umg-search-icon" />
              <input
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search users…"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="umg-select"
            >
              <option>All Roles</option>
              <option>User</option>
              <option>Admin</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="umg-select"
            >
              <option>All Statuses</option>
              <option>Active</option>
              <option>Inactive</option>
              <option>Suspended</option>
            </select>
          </div>

          {/* List card */}
          <div className="umg-list-card">
            <div className="umg-list-head">
              <div className="umg-list-title">
                <Users />
                <span>User Accounts ({filteredUsers.length})</span>
              </div>
              <button className="umg-btn-primary" onClick={openCreateUser}>
                + Add User
              </button>
            </div>

            <table className="umg-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Contributions</th>
                  <th>Last Login</th>
                  <th className="umg-actions-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="umg-empty">No users found.</td>
                  </tr>
                ) : (
                  pageUsers.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div className="umg-name">{u.name}</div>
                        <div className="umg-subline">{u.email}</div>
                        <div className="umg-subline">{u.city}</div>
                        
                        {/* Corrected inline status for mobile */}
                        <div className="umg-status-inline">
                          {(u.suspendedUntil && new Date(u.suspendedUntil) > new Date()) && (
                            <span className="umg-pill umg-pill-suspended">Suspended</span>
                          )}
                          {u.status === "Active" && (
                            <span className="umg-pill umg-pill-active">Active</span>
                          )}
                          {u.status === "Inactive" && (
                            <span className="umg-pill umg-pill-inactive">Inactive</span>
                          )}
                        </div>
                      </td>

                      <td>
                        <span className="umg-pill umg-pill-role">{u.role}</span>
                      </td>

                      <td>
                        <div className="umg-status-stack">
                          {/*  Show Activity pill (Active/Inactive) */}
                          {u.status === "Active" && (
                            <span className="umg-pill umg-pill-active">Active</span>
                          )}
                          {u.status === "Inactive" && (
                            <span className="umg-pill umg-pill-inactive">Inactive</span>
                          )}

                          {/* Show Suspension pill if they are suspended */}
                          {(u.suspendedUntil && new Date(u.suspendedUntil) > new Date()) && (
                            <>
                              <span className="umg-pill umg-pill-suspended">Suspended</span>
                              <div className="umg-status-note">
                                {u.suspensionReason && (
                                  <div>Reason: {u.suspensionReason}</div>
                                )}
                                {u.suspendedUntil && (
                                  <div>Until: {u.suspendedUntil.split('T')[0]}</div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </td>

                      <td>
                        <div className="umg-submissions">
                          {u.submissions} submissions
                        </div>
                        <div className="umg-subline">{u.approved} approved</div>
                      </td>

                      <td>{u.lastLogin}</td>

                      <td className="umg-ellipsis-td">
                          {(u.suspendedUntil && new Date(u.suspendedUntil) > new Date()) ? (
                              <button
                                  className="umg-ellipsis umg-unsuspend-btn"
                                  title="Unsuspend user"
                                  onClick={() => handleUnsuspend(u.id, u.name)}
                              >
                                  <CircleCheckBig size={18} /> {/* Green check for reactivation */}
                              </button>
                          ) : (
                              <button
                                  className="umg-ellipsis umg-suspend-btn"
                                  title="Suspend user"
                                  onClick={() => openSuspendUser(u)}
                              >
                                  <CircleOff size={18} /> {/* Red circle-off for suspension */}
                              </button>
                          )}

                        <button
                            className="umg-ellipsis"
                            title="Edit user"
                            onClick={() => openEditUser(u)}
                        >
                            <HiOutlinePencilAlt />
                        </button>
                        <button
                            className="umg-ellipsis"
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
            <div className="umg-pager">
              <div className="umg-pager-left">
                <label className="umg-pager-label">Rows per page:</label>
                <select
                  value={pageSize}
                    onChange={(e) => {
                      const size = Number(e.target.value);
                      setPageSize(size); 
                      setPage(1);        
                    }}
                  onBlur={(e) => setPageSize(Number(e.target.value))}
                  className="umg-pager-select"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>

                <span className="umg-pager-range">
                  {totalUsersFiltered === 0 ? "0-0 of 0" : `${startIdx + 1}–${endIdx} of ${totalUsersFiltered}`}
                </span>
              </div>

              <div className="umg-pager-right">
                <button
                  className="umg-page-btn"
                  onClick={goPrev}
                  disabled={page === 1}
                  aria-label="Previous page"
                >
                  ‹
                </button>

                <span className="umg-page-indicator">{page} / {totalPages}</span>

                <button
                  className="umg-page-btn"
                  onClick={goNext}
                  disabled={page === totalPages}
                  aria-label="Next page"
                >
                  ›
                </button>
              </div>
            </div>
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
                    <h3>{userMode === "create" ? " Create User" : " Edit User"}</h3>
                    <button className="umg-modal-close" onClick={() => setShowUserModal(false)} aria-label="Close">×</button>
                </div>

                <div className="umg-modal-body">
                    {/* Name */}
                    <div className="umg-field">
                    <label className="umg-label">Name</label>
                    <input
                        className="umg-input"
                        value={userForm.name}
                        onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Full name"
                    />
                    </div>

                    {/* Email */}
                    <div className="umg-field">
                    <label className="umg-label">Email</label>
                    <input
                        className="umg-input"
                        value={userForm.email}
                        onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="email@example.com"
                    />
                    </div>

                    {/* City */}
                    <div className="umg-field">
                    <label className="umg-label">City</label>
                    <input
                        className="umg-input"
                        value={userForm.city}
                        onChange={(e) => setUserForm(prev => ({ ...prev, city: e.target.value }))}
                        placeholder="Kuching, Sarawak"
                    />
                    </div>

                    {/* Role + Status row - Cleaned up to retain Role edit and show read-only Status */}
                    <div className="umg-metrics-row"> 
                        
                        {/* 1. Role Field (RETAINS EDITABLE SELECT) */}
                        <div className="umg-field">
                          <label className="umg-label">Role</label>
                          <select
                              className="umg-input"
                              value={userForm.role}
                              onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value }))}
                          >
                              <option>User</option>
                              <option>Admin</option>
                          </select>
                        </div>
                        
                        {/* 2. Status Field (READ-ONLY DISPLAY) */}
                        <div className="umg-field">
                            <label className="umg-label">Current Status</label>
                            
                            <div className="umg-value">
                                {/* Show Activity Status */}
                                <span className={`umg-pill ${userForm.status === "Active" ? "umg-pill-active" : "umg-pill-inactive"}`}>
                                    {userForm.status}
                                </span>
                                
                                {/* Show Suspension Status */}
                                {(userForm.suspendedUntil && new Date(userForm.suspendedUntil) > new Date()) && (
                                   <span className="umg-pill umg-pill-suspended">
                                        Suspended
                                    </span>
                                )}
                            </div>
                            
                            {/* Display suspension details if user IS suspended */}
                            {(userForm.suspendedUntil && new Date(userForm.suspendedUntil) > new Date()) && (
                                <div className="umg-suspension-details">
                                    {userForm.suspensionReason && (
                                        <div className="umg-hint">Reason: {userForm.suspensionReason}</div>
                                    )}
                                    <div className="umg-hint">Suspended until: {userForm.suspendedUntil.split('T')[0]}</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {userMode === "edit" && (
                    <div className="umg-metrics-row">
                        {/* Submissions / Approved (Existing code) */}
                        <div className="umg-field">
                            <label className="umg-label">Submissions / Approved</label>
                            <div className="umg-value">
                                {userForm.submissions} submissions / {userForm.approved} approved
                            </div>
                        </div>

                        {/* Last Login (Existing code) */}
                        <div className="umg-field">
                            <label className="umg-label">Last Login</label>
                            <div className="umg-value">
                                {userForm.lastLogin}
                            </div>
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
                            if (userForm?.id && window.confirm(`Delete user "${userForm.name}"? This cannot be undone.`)) {
                                deleteUserById(userForm.id);
                                setShowUserModal(false);
                            }
                            }}
                        >
                            Delete
                        </button>

                        <button
                            type="button"
                            className="umg-btn umg-btn-warning"
                            title="Force logout this user on all devices"
                            onClick={() => {
                            if (!userForm?.id) return;
                            if (window.confirm("Invalidate all active sessions for this user? They’ll be logged out on all devices.")) {
                                // await fetch(`/api/admin/users/${userForm.id}/invalidate-sessions`, { method: "POST" })
                                console.log("INVALIDATE_SESSIONS ▶", userForm.id);
                                setDlg({
                                  open: true,
                                  title: "Sessions Invalidated",
                                  message: "The user will be logged out everywhere.",
                                  icon: <SuccessIcon />,
                                  onPrimary: closeDlg,
                                });                            
                              }
                            }}
                        >
                            Invalidate session
                        </button>
                        </div>
                    )}

                    <div className="umg-footer-spacer" />

                    <button
                        type="button"
                        className="umg-btn umg-btn-ghost"
                        onClick={() => setShowUserModal(false)}
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        className="umg-btn umg-btn-primary"
                        onClick={saveUser}
                    >
                        {userMode === "create" ? "Create" : "Save Changes"}
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
                    open: true,
                    title,
                    message,
                    icon: <AlertIcon />,
                    onPrimary: closeDlg,
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
};
