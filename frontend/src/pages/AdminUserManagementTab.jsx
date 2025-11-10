import React, { useState, useEffect } from "react";
import { CiSearch } from "react-icons/ci";
import { Mail, Shield, Users, Activity, CircleCheckBig, CircleX, X, Bell, Send } from 'lucide-react';
import { HiOutlinePencilAlt } from "react-icons/hi";
import { RiDeleteBin5Line } from "react-icons/ri";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

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
  // const [showEmailModal, setShowEmailModal] = useState(false);
  // const [emailForm, setEmailForm] = useState({
  //   recipientsOption: "All users",   
  //   selectedUserIds: [],               
  //   customEmails: "",                  
  //   template: "",
  //   subject: "",
  //   message: "",
  //   markAnnouncement: false,
  // });
  // const [specificSearch, setSpecificSearch] = useState("");

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
    const suspendedCount = users.filter(u => u.status === "Suspended").length;
  
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
  
      const matchesStatus =
        statusFilter === "All Statuses" || u.status === statusFilter;
  
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
  
    // useEffect(() => {
    //   if (!showEmailModal) return;
    //   const onKey = (e) => e.key === "Escape" && setShowEmailModal(false);
    //   document.addEventListener("keydown", onKey);
    //   const prev = document.body.style.overflow;
    //   document.body.style.overflow = "hidden";
    //   return () => {
    //     document.removeEventListener("keydown", onKey);
    //     document.body.style.overflow = prev;
    //   };
    // }, [showEmailModal]);
  
    // const adminIds = users.filter(u => u.role === "Admin").map(u => u.id);
  
    // const parseCustomEmails = (text) => {
    //   if (!text.trim()) return [];
    //   // split by comma, trim, basic email shape check, unique
    //   const seen = new Set();
    //   return text
    //     .split(",")
    //     .map(s => s.trim())
    //     .filter(s => s.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s))
    //     .filter(s => (seen.has(s) ? false : (seen.add(s), true)));
    // };
  
    // const totalRecipients = (() => {
    //   switch (emailForm.recipientsOption) {
    //     case "All users":
    //       return users.length;
    //     case "Administrators only":
    //       return adminIds.length;
    //     case "Specific users":
    //       return emailForm.selectedUserIds.length;
    //     case "Custom Email Addresses":
    //       return parseCustomEmails(emailForm.customEmails).length;
    //     default:
    //       return 0;
    //   }
    // })();
  
    // const filteredSpecificUsers = users.filter(u => {
    //   if (specificSearch.trim() === "") return true;
    //   const q = specificSearch.toLowerCase();
    //   return (
    //     u.name.toLowerCase().includes(q) ||
    //     u.email.toLowerCase().includes(q) ||
    //     u.city.toLowerCase().includes(q)
    //   );
    // });

    const [showUserModal, setShowUserModal] = useState(false);
    const [userMode, setUserMode] = useState("create"); // "create" | "edit"
    const emptyUser = {
    id: null,
    name: "",
    email: "",
    city: "",
    role: "User",           // "User" | "Admin"
    status: "Active",       // "Active" | "Inactive" | "Suspended"
    suspendedUntil: null,
    submissions: 0,
    approved: 0,
    lastLogin: "—",
    };
    const [userForm, setUserForm] = useState(emptyUser);
    const [suspensionDate, setSuspensionDate] = useState(null);
    const [showDateInput, setShowDateInput] = useState(false);

    // Open Create
    const openCreateUser = () => {
    setUserMode("create");
    setUserForm(emptyUser);
    setShowUserModal(true);
    };

    // Open Edit
    const openEditUser = (u) => {
        setUserMode("edit");
        const dateString = u.suspendedUntil ? u.suspendedUntil.split('T')[0] : '';

        setUserForm({ ...u });
        setSuspensionDate(dateString);
        setShowDateInput(u.status === "Suspended");
        setShowUserModal(true);
    };

    // Save (Create or Update)
    const saveUser = async () => {
    // basic validation
    if (!userForm.name.trim()) return alert("Name is required.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userForm.email)) return alert("Valid email is required.");

    // Prepare status and date based on the UI states
        let finalStatus = userForm.status; // Default to existing status for Edit mode
        let finalSuspendedUntil = null;
        
        if (userMode === "create") {
            // Creation mode uses status/suspendedUntil directly from userForm
            finalStatus = userForm.status;
            finalSuspendedUntil = userForm.suspendedUntil;
        } else {
            // Edit mode: Determine final status based on the presence of suspensionDate
            if (suspensionDate) {
                // If the admin set a date, force status to Suspended
                finalStatus = "Suspended";
                finalSuspendedUntil = suspensionDate;

            } else {
                // If the date is cleared (e.g., by clicking "Unsuspend"), clear suspension
                // We revert status based on lastLogin (Active if recently logged in, Inactive otherwise)
                finalStatus = userForm.lastLogin === '—' ? "Inactive" : "Active";
                finalSuspendedUntil = null;
            }
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
            status: finalStatus,
            suspendedUntil: userForm.status === "Suspended" 
              ? (userForm.suspendedUntil || new Date().toISOString().slice(0,10))
              : null,
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
            status: finalStatus,
            suspendedUntil: userForm.status === "Suspended"
              ? (userForm.suspendedUntil || new Date().toISOString().slice(0,10))
              : null,
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
      alert(userMode === "create" ? "User created successfully!" : "User updated successfully!");

    } catch (err) {
      console.error("Error saving user:", err);
      alert(`Error: ${err.message}`);
    }
    };

    // Delete
    const deleteUserById = async (id) => {
    const u = users.find(x => x.id === id);
    if (!u) return;
    
    if (window.confirm(`Delete user "${u.name}"? This cannot be undone.`)) {
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
            alert("User deleted successfully!");

        } catch (err) {
            console.error("Error deleting user:", err);
            alert(`Error: ${err.message}`);
        }
    }
    };

    const invalidateSessions = (id) => {
        if (!id) return;
        if (!window.confirm("Invalidate all active sessions for this user? They’ll be logged out on all devices.")) {
            return;
        }

        // TODO: replace with real API call:
        // await fetch(`/api/admin/users/${id}/invalidate-sessions`, { method: "POST" })

        console.log("INVALIDATE_SESSIONS ▶ userId:", id);
        alert("Sessions invalidated. The user will be logged out everywhere.");
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
            {/* <button className="umg-email-btn" onClick={() => setShowEmailModal(true)}>
              <Mail />
              Send Email Notification
            </button> */}
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
                        <div className="umg-status-inline">
                          {u.status === "Active" && <span className="umg-pill umg-pill-active">Active</span>}
                          {u.status === "Inactive" && <span className="umg-pill umg-pill-inactive">Inactive</span>}
                          {u.status === "Suspended" && <span className="umg-pill umg-pill-suspended">Suspended</span>}
                        </div>
                      </td>

                      <td>
                        <span className="umg-pill umg-pill-role">{u.role}</span>
                      </td>

                      <td>
                        {u.status === "Active" && (
                          <span className="umg-pill umg-pill-active">Active</span>
                        )}
                        {u.status === "Inactive" && (
                          <span className="umg-pill umg-pill-inactive">Inactive</span>
                        )}
                        {u.status === "Suspended" && (
                          <div className="umg-status-stack">
                            <span className="umg-pill umg-pill-suspended">Suspended</span>
                            {u.suspendedUntil && (
                              <div className="umg-status-note">Suspended: {u.suspendedUntil}</div>
                            )}
                          </div>
                        )}
                      </td>

                      <td>
                        <div className="umg-submissions">
                          {u.submissions} submissions
                        </div>
                        <div className="umg-subline">{u.approved} approved</div>
                      </td>

                      <td>{u.lastLogin}</td>

                      <td className="umg-ellipsis-td">
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
          {/* {showEmailModal && (
          <div
            className="umg-modal-backdrop"
            role="dialog"
            aria-modal="true"
            onClick={() => setShowEmailModal(false)}
          >
            <div
              className="umg-modal"
              onClick={(e) => e.stopPropagation()} // prevent backdrop close
            >
              <div className="umg-modal-header">
                <h3><Mail size = "18"/> Send Email Notification</h3>
                <button className="umg-modal-close" onClick={() => setShowEmailModal(false)} aria-label="Close"><X/></button>
              </div>

              <div className="umg-modal-body">

                <div className="umg-field">
                  <label className="umg-label">Recipients</label>
                  <select
                    className="umg-input"
                    value={emailForm.recipients}
                    onChange={(e) => setEmailForm({ ...emailForm, recipientsOption: e.target.value })}
                  >
                    <option>All users</option>
                    <option>Specific users</option>
                    <option>Administrators only</option>
                    <option>Custom Email Addresses</option>
                  </select>
                  
                  {emailForm.recipientsOption === "Specific users" && (
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
                          filteredSpecificUsers.map(u => (
                            <label key={u.id} className="umg-specific-row">
                              <input
                                type="checkbox"
                                className="umg-row-checkbox"
                                checked={emailForm.selectedUserIds.includes(u.id)}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setEmailForm(prev => ({
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
                                <div className="umg-subline">{u.city}</div>
                              </div>
                            </label>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {emailForm.recipientsOption === "Custom Email Addresses" && (
                    <div className="umg-field">
                      <label className="umg-label">Enter email addresses</label>
                      <textarea
                        className="umg-input umg-textarea"
                        placeholder="Enter comma-separated emails, e.g. alice@mail.com, bob@mail.com"
                        value={emailForm.customEmails}
                        onChange={(e) =>
                          setEmailForm({ ...emailForm, customEmails: e.target.value })
                        }
                      />
                    </div>
                  )}

                  <div className="umg-hint">Total Recipients: {totalRecipients}</div>
                </div>

                <div className="umg-field">
                  <label className="umg-label">Email Template</label>
                  <select
                    className="umg-input"
                    value={emailForm.template}
                    onChange={(e) => {
                      const value = e.target.value;
                      const tpl = EMAIL_TEMPLATES[value] || { subject: "", message: "" };
                      setEmailForm(prev => ({
                        ...prev,
                        template: value,
                        subject: tpl.subject,   // always update
                        message: tpl.message,   // always update
                      }));
                    }}
                  >
                    <option value="Custom message">Custom message</option>
                    <option value="Welcome Message">Welcome Message</option>
                    <option value="Content Approval">Content Approval</option>
                    <option value="Content Rejection">Content Rejection</option>
                    <option value="System Update">System Update</option>
                  </select>
                </div>

                <div className="umg-field">
                  <label className="umg-label">Subject</label>
                  <input
                    className="umg-input"
                    placeholder="Enter email subject"
                    value={emailForm.subject}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, subject: e.target.value }))}
                  />
                </div>

                <div className="umg-field">
                  <label className="umg-label">Message</label>
                  <textarea
                    className="umg-input umg-textarea"
                    placeholder="Enter your message"
                    value={emailForm.message}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, message: e.target.value }))}
                  />
                </div>

                <label className="umg-check">
                  <input
                    type="checkbox"
                    checked={emailForm.markAnnouncement}
                    onChange={(e) => setEmailForm({ ...emailForm, markAnnouncement: e.target.checked })}
                  />
                  <div>
                    <div><Bell size = "16" /> Mark as Announcement</div>
                    <div className="umg-check-hint">Announcements appear in user notifications</div>
                  </div>
                </label>
              </div>

              <div className="umg-modal-footer">
                <button className="umg-btn-secondary" onClick={() => setShowEmailModal(false)}>Cancel</button>
                <button
                  className="umg-btn-primary"
                  onClick={() => {
                    if (!emailForm.subject.trim() || !emailForm.message.trim()) {
                      alert("Please provide a subject and message.");
                      return;
                    }

                    let recipients = [];
                    if (emailForm.recipientsOption === "All users") {
                      recipients = users.map(u => u.email);
                    } else if (emailForm.recipientsOption === "Administrators only") {
                      recipients = users.filter(u => u.role === "Admin").map(u => u.email);
                    } else if (emailForm.recipientsOption === "Specific users") {
                      const chosen = new Set(emailForm.selectedUserIds);
                      recipients = users.filter(u => chosen.has(u.id)).map(u => u.email);
                    } else if (emailForm.recipientsOption === "Custom Email Addresses") {
                      recipients = parseCustomEmails(emailForm.customEmails);
                    }

                    console.log("SEND EMAIL ▶", {
                      ...emailForm,
                      recipients,
                      total: recipients.length,
                    });

                    setShowEmailModal(false);
                  }}
                >
                  <Send size = "18"/> Send Email
                </button>
              </div>
            </div>
          </div>
        )} */}
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

                    {/* Role + Status + suspendedUntil row */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
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

                    {/* Right Side: Clean Status Display & Conditional Date Input */}
                    <div className="umg-field">
                      <label className="umg-label">Status</label>
                      
                      {/* Wrap this entire block in a check for "Edit User" mode */}
                      {userMode === "edit" ? (
                          <>
                          {/* Simple Status Display */}
                          <div className="umg-action-row umg-status-action-row">
                              <span className={`umg-pill ${userForm.status === "Suspended" ? "umg-pill-suspended" : (userForm.status === "Active" ? "umg-pill-active" : "umg-pill-inactive")}`}>
                                  {userForm.status}
                              </span>

                              {userForm.status !== "Suspended" && !showDateInput && (
                              <button
                                  type="button"
                                  className="umg-status-btn-ml umg-btn umg-btn-danger" 
                                  onClick={() => setShowDateInput(true)} 
                              >
                                  Suspend User
                              </button>
                              )}

                              {/* 2. Unsuspend Button (Visible ONLY if currently suspended) */}
                              {userForm.status === "Suspended" && (
                                  <button
                                      type="button"
                                      className="umg-status-btn-ml umg-btn umg-btn-warning" 
                                      onClick={() => {
                                          setSuspensionDate(null); 
                                          setShowDateInput(false); 
                                      }}
                                  >
                                      Clear Suspension
                                  </button>
                              )}
                          </div>

                            {/* Suspended Until Date (Only appears AFTER clicking "Suspend User" OR if user is already suspended) */}
                            {(showDateInput || userForm.status === "Suspended") && (
                              <div className="umg-field umg-full-width-field">
                                  {/* ... (Date input field and Cancel button) ... */}
                              </div>
                          )}
                          </>
                      ) : (
                          // Display default Active FOR CREATE MODE ONLY
                          <div className="umg-action-row umg-status-action-row">
                              <span className="umg-pill umg-pill-active">Active</span>
                          </div>
                      )}
                    </div>
                </div>
                
                {/* Hide submissions / Approved / Last login for "Create User" */}
                {userMode === "edit" && (
                    <div className="umg-metrics-row">
                        {/* Submissions / Approved */}
                        <div className="umg-field">
                            {/* ... (Existing Submissions/Approved fields) ... */}
                        </div>

                        <div className="umg-field">
                            {/* ... (Existing Last Login fields) ... */}
                        </div>
                    </div>
                )}

                    {userMode === "edit" && (
                    <div className="umg-metrics-row">
                        {/* Submissions / Approved (Existing code) */}
                        <div className="umg-field">
                            <label className="umg-label">Submissions / Approved</label>
                            {/* ... */}
                        </div>

                        {/* Last Login (Existing code) */}
                        <div className="umg-field">
                            <label className="umg-label">Last Login</label>
                            {/* ... */}
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
                                alert("Sessions invalidated. The user will be logged out everywhere.");
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
            </>
          )}
        </div>
    );
};
