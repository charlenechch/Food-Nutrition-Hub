import React, { useState, useEffect } from "react";
import { CiSearch } from "react-icons/ci";
import { Mail, Shield, Users, Activity, CircleCheckBig, CircleX, X, Bell, Send } from 'lucide-react';
import { HiOutlinePencilAlt } from "react-icons/hi";
import { RiDeleteBin5Line } from "react-icons/ri";

export default function UserManagement() {
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [page, setPage] = useState(1);
  const initialPageSize = typeof window !== "undefined" && window.innerWidth <= 680 ? 6 : 10;
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailForm, setEmailForm] = useState({
    recipientsOption: "All users",   
    selectedUserIds: [],               
    customEmails: "",                  
    template: "",
    subject: "",
    message: "",
    markAnnouncement: false,
  });
  const [specificSearch, setSpecificSearch] = useState("");

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
    //hardcoded user data
    const [users, setUsers] = useState([
      {
        id: 1,
        name: "Ahmad Rahman",
        email: "ahmad.rahman@email.com",
        city: "Kuching, Sarawak",
        role: "User",
        status: "Active",
        suspendedOn: null,
        submissions: 15,
        approved: 12,
        lastLogin: "16/01/2024, 02:30 pm",
      },
      {
        id: 2,
        name: "Sarah Lim",
        email: "sarah.lim@email.com",
        city: "Sibu, Sarawak",
        role: "User",
        status: "Active",
        suspendedOn: null,
        submissions: 23,
        approved: 21,
        lastLogin: "14/01/2024, 09:15 am",
      },
      {
        id: 3,
        name: "Rajesh Kumar",
        email: "rajesh.kumar@email.com",
        city: "Miri, Sarawak",
        role: "User",
        status: "Suspended",
        suspendedOn: "2024-01-11",
        submissions: 3,
        approved: 1,
        lastLogin: "10/01/2024, 04:45 pm",
      },
      {
        id: 4,
        name: "Maria Santos",
        email: "maria.santos@email.com",
        city: "Kuching, Sarawak",
        role: "Admin",
        status: "Active",
        suspendedOn: null,
        submissions: 0,
        approved: 0,
        lastLogin: "16/01/2024, 11:22 am",
      },
      {
        id: 5,
        name: "Jennifer Wong",
        email: "jennifer.wong@email.com",
        city: "Bintulu, Sarawak",
        role: "User",
        status: "Inactive",
        suspendedOn: null,
        submissions: 7,
        approved: 5,
        lastLogin: "15/12/2023, 01:55 pm",
      },
      {
        id: 6,
        name: "Kelvin Tan",
        email: "kelvin.tan@email.com",
        city: "Mukah, Sarawak",
        role: "User",
        status: "Active",
        suspendedOn: null,
        submissions: 9,
        approved: 7,
        lastLogin: "12/01/2024, 08:20 pm",
      },
      {
        id: 7,
        name: "Nur Aisyah",
        email: "aisyah.nur@email.com",
        city: "Kuching, Sarawak",
        role: "User",
        status: "Inactive",
        suspendedOn: null,
        submissions: 2,
        approved: 2,
        lastLogin: "02/01/2024, 10:00 am",
      },
      {
        id: 8,
        name: "Daniel Lee",
        email: "daniel.lee@email.com",
        city: "Samarahan, Sarawak",
        role: "Admin",
        status: "Active",
        suspendedOn: null,
        submissions: 4,
        approved: 4,
        lastLogin: "17/01/2024, 03:05 pm",
      },
      {
        id: 9,
        name: "Aman Shah",
        email: "aman.shah@email.com",
        city: "Miri, Sarawak",
        role: "User",
        status: "Active",
        suspendedOn: null,
        submissions: 11,
        approved: 9,
        lastLogin: "13/01/2024, 07:40 pm",
      },
      {
        id: 10,
        name: "Grace Chong",
        email: "grace.chong@email.com",
        city: "Bintulu, Sarawak",
        role: "User",
        status: "Suspended",
        suspendedOn: "2024-01-09",
        submissions: 5,
        approved: 3,
        lastLogin: "09/01/2024, 12:10 pm",
      },
      {
        id: 11,
        name: "Hendry Goh",
        email: "hendry.goh@email.com",
        city: "Sibu, Sarawak",
        role: "User",
        status: "Active",
        suspendedOn: null,
        submissions: 1,
        approved: 1,
        lastLogin: "05/01/2024, 06:25 pm",
      },
      {
        id: 12,
        name: "Mei Lin",
        email: "mei.lin@email.com",
        city: "Kapit, Sarawak",
        role: "User",
        status: "Inactive",
        suspendedOn: null,
        submissions: 0,
        approved: 0,
        lastLogin: "—",
      },
      {
        id: 13,
        name: "Farah Zain",
        email: "farah.zain@email.com",
        city: "Limbang, Sarawak",
        role: "User",
        status: "Active",
        suspendedOn: null,
        submissions: 6,
        approved: 4,
        lastLogin: "11/01/2024, 01:18 pm",
      },
      {
        id: 14,
        name: "Jonathan Ng",
        email: "jon.ng@email.com",
        city: "Kuching, Sarawak",
        role: "Admin",
        status: "Active",
        suspendedOn: null,
        submissions: 12,
        approved: 12,
        lastLogin: "17/01/2024, 04:10 pm",
      },
      {
        id: 15,
        name: "Melissa Tiong",
        email: "melissa.tiong@email.com",
        city: "Sarikei, Sarawak",
        role: "User",
        status: "Active",
        suspendedOn: null,
        submissions: 8,
        approved: 6,
        lastLogin: "08/01/2024, 09:05 am",
      },
      {
        id: 16,
        name: "Ivan Lau",
        email: "ivan.lau@email.com",
        city: "Kuching, Sarawak",
        role: "User",
        status: "Inactive",
        suspendedOn: null,
        submissions: 3,
        approved: 2,
        lastLogin: "28/12/2023, 05:45 pm",
      },
      {
        id: 17,
        name: "Zarina Ali",
        email: "zarina.ali@email.com",
        city: "Miri, Sarawak",
        role: "User",
        status: "Active",
        suspendedOn: null,
        submissions: 14,
        approved: 10,
        lastLogin: "16/01/2024, 10:42 am",
      },
      {
        id: 18,
        name: "Kelisa Yong",
        email: "kelisa.yong@email.com",
        city: "Bau, Sarawak",
        role: "User",
        status: "Suspended",
        suspendedOn: "2023-12-30",
        submissions: 2,
        approved: 0,
        lastLogin: "30/12/2023, 03:30 pm",
      },
      {
        id: 19,
        name: "Faizal Rahim",
        email: "faizal.rahim@email.com",
        city: "Sibu, Sarawak",
        role: "User",
        status: "Active",
        suspendedOn: null,
        submissions: 18,
        approved: 16,
        lastLogin: "15/01/2024, 08:12 pm",
      },
      {
        id: 20,
        name: "Claudia Ting",
        email: "claudia.ting@email.com",
        city: "Kuching, Sarawak",
        role: "Admin",
        status: "Active",
        suspendedOn: null,
        submissions: 1,
        approved: 1,
        lastLogin: "17/01/2024, 01:05 pm",
      },
      {
        id: 21,
        name: "Haziq Hamdan",
        email: "haziq.hamdan@email.com",
        city: "Bintulu, Sarawak",
        role: "User",
        status: "Inactive",
        suspendedOn: null,
        submissions: 0,
        approved: 0,
        lastLogin: "—",
      },
      {
        id: 22,
        name: "Tracy Lim",
        email: "tracy.lim@email.com",
        city: "Miri, Sarawak",
        role: "User",
        status: "Active",
        suspendedOn: null,
        submissions: 10,
        approved: 8,
        lastLogin: "12/01/2024, 10:50 am",
      },
      {
        id: 23,
        name: "Samuel Goh",
        email: "samuel.goh@email.com",
        city: "Samarahan, Sarawak",
        role: "User",
        status: "Active",
        suspendedOn: null,
        submissions: 4,
        approved: 3,
        lastLogin: "13/01/2024, 02:25 pm",
      },
      {
        id: 24,
        name: "Nabila Hassan",
        email: "nabila.hassan@email.com",
        city: "Kapit, Sarawak",
        role: "User",
        status: "Suspended",
        suspendedOn: "2024-01-05",
        submissions: 6,
        approved: 1,
        lastLogin: "05/01/2024, 10:00 am",
      },
      {
        id: 25,
        name: "Ricky Chai",
        email: "ricky.chai@email.com",
        city: "Kuching, Sarawak",
        role: "User",
        status: "Active",
        suspendedOn: null,
        submissions: 13,
        approved: 11,
        lastLogin: "17/01/2024, 05:40 pm",
      },
      {
        id: 26,
        name: "Adele Liew",
        email: "adele.liew@email.com",
        city: "Sibu, Sarawak",
        role: "User",
        status: "Inactive",
        suspendedOn: null,
        submissions: 2,
        approved: 1,
        lastLogin: "20/12/2023, 09:00 am",
      },
      {
        id: 27,
        name: "Muhd Iqbal",
        email: "m.iqbal@email.com",
        city: "Miri, Sarawak",
        role: "User",
        status: "Active",
        suspendedOn: null,
        submissions: 9,
        approved: 7,
        lastLogin: "16/01/2024, 07:05 pm",
      },
      {
        id: 28,
        name: "Vivian Toh",
        email: "vivian.toh@email.com",
        city: "Bintulu, Sarawak",
        role: "User",
        status: "Active",
        suspendedOn: null,
        submissions: 1,
        approved: 1,
        lastLogin: "11/01/2024, 03:12 pm",
      },
      {
        id: 29,
        name: "Rafidah Ahmad",
        email: "rafidah.ahmad@email.com",
        city: "Lundu, Sarawak",
        role: "User",
        status: "Active",
        suspendedOn: null,
        submissions: 7,
        approved: 6,
        lastLogin: "14/01/2024, 08:42 am",
      },
      {
        id: 30,
        name: "Kenji Yong",
        email: "kenji.yong@email.com",
        city: "Miri, Sarawak",
        role: "User",
        status: "Inactive",
        suspendedOn: null,
        submissions: 0,
        approved: 0,
        lastLogin: "—",
      },
    ]);
  
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
  
    useEffect(() => {
      if (!showEmailModal) return;
      const onKey = (e) => e.key === "Escape" && setShowEmailModal(false);
      document.addEventListener("keydown", onKey);
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", onKey);
        document.body.style.overflow = prev;
      };
    }, [showEmailModal]);
  
    const adminIds = users.filter(u => u.role === "Admin").map(u => u.id);
  
    const parseCustomEmails = (text) => {
      if (!text.trim()) return [];
      // split by comma, trim, basic email shape check, unique
      const seen = new Set();
      return text
        .split(",")
        .map(s => s.trim())
        .filter(s => s.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s))
        .filter(s => (seen.has(s) ? false : (seen.add(s), true)));
    };
  
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
  
    const filteredSpecificUsers = users.filter(u => {
      if (specificSearch.trim() === "") return true;
      const q = specificSearch.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.city.toLowerCase().includes(q)
      );
    });

    const [showUserModal, setShowUserModal] = useState(false);
    const [userMode, setUserMode] = useState("create"); // "create" | "edit"
    const emptyUser = {
    id: null,
    name: "",
    email: "",
    city: "",
    role: "User",           // "User" | "Admin"
    status: "Active",       // "Active" | "Inactive" | "Suspended"
    suspendedOn: null,
    submissions: 0,
    approved: 0,
    lastLogin: "—",
    };
    const [userForm, setUserForm] = useState(emptyUser);

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

    // Save (Create or Update)
    const saveUser = () => {
    // basic validation
    if (!userForm.name.trim()) return alert("Name is required.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userForm.email)) return alert("Valid email is required.");

    if (userMode === "create") {
        // generate a simple id; replace with backend id when you wire API
        const nextId = users.length ? Math.max(...users.map(u => u.id)) + 1 : 1;
        const newUser = {
        ...userForm,
        id: nextId,
        lastLogin: userForm.lastLogin || "—",
        suspendedOn: userForm.status === "Suspended"
            ? (userForm.suspendedOn || new Date().toISOString().slice(0,10))
            : null,
        };
        setUsers(prev => [newUser, ...prev]); // prepend for visibility
    } else {
        setUsers(prev =>
        prev.map(u =>
            u.id === userForm.id
            ? {
                ...userForm,
                suspendedOn: userForm.status === "Suspended"
                    ? (userForm.suspendedOn || new Date().toISOString().slice(0,10))
                    : null,
                }
            : u
        )
        );
    }
    setShowUserModal(false);
    setPage(1); // optional: jump to first page after changes
    };

    // Delete
    const deleteUserById = (id) => {
    const u = users.find(x => x.id === id);
    if (!u) return;
    if (window.confirm(`Delete user "${u.name}"? This cannot be undone.`)) {
        setUsers(prev => prev.filter(x => x.id !== id));
        setPage(1);
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
          <div className="umg-header-row">
            <div>
              <h2 className="umg-title">Enhanced User Management</h2>
              <p className="umg-subtitle">Comprehensive user account administration</p>
            </div>
            <button className="umg-email-btn" onClick={() => setShowEmailModal(true)}>
              <Mail />
              Send Email Notification
            </button>
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
                            {u.suspendedOn && (
                              <div className="umg-status-note">Suspended: {u.suspendedOn}</div>
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
          {showEmailModal && (
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
              {/* Header */}
              <div className="umg-modal-header">
                <h3><Mail size = "18"/> Send Email Notification</h3>
                <button className="umg-modal-close" onClick={() => setShowEmailModal(false)} aria-label="Close"><X/></button>
              </div>

              {/* Body */}
              <div className="umg-modal-body">
                {/* Recipients */}
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
                  
                  {/* Specific users: show a compact checklist */}
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

                  {/* Custom emails: show input */}
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

                {/* Template */}
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

                {/* Subject */}
                <div className="umg-field">
                  <label className="umg-label">Subject</label>
                  <input
                    className="umg-input"
                    placeholder="Enter email subject"
                    value={emailForm.subject}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, subject: e.target.value }))}
                  />
                </div>

                {/* Message */}
                <div className="umg-field">
                  <label className="umg-label">Message</label>
                  <textarea
                    className="umg-input umg-textarea"
                    placeholder="Enter your message"
                    value={emailForm.message}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, message: e.target.value }))}
                  />
                </div>

                {/* Announcement checkbox */}
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

              {/* Footer */}
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
        )}
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

                    {/* Role + Status row */}
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

                    <div className="umg-field">
                        <label className="umg-label">Status</label>
                        <select
                        className="umg-input"
                        value={userForm.status}
                        onChange={(e) => setUserForm(prev => ({ ...prev, status: e.target.value }))}
                        >
                        <option>Active</option>
                        <option>Inactive</option>
                        <option>Suspended</option>
                        </select>
                    </div>
                    </div>

                    {/* SuspendedOn (only if Suspended) */}
                    {userForm.status === "Suspended" && (
                    <div className="umg-field">
                        <label className="umg-label">Suspended On</label>
                        <input
                        className="umg-input"
                        type="date"
                        value={userForm.suspendedOn || ""}
                        onChange={(e) => setUserForm(prev => ({ ...prev, suspendedOn: e.target.value }))}
                        />
                    </div>
                    )}

                    <div className="umg-metrics-row">
                        {/* Submissions / Approved */}
                          <div className="umg-field">
                            <label className="umg-label">Submissions / Approved</label>
                            <div className="umg-value">
                            <span className="umg-pill">{userForm.submissions} submissions</span>
                            <span className="umg-subline">{userForm.approved} approved</span>
                            </div>
                        </div>

                        <div className="umg-field">
                            <label className="umg-label">Last Login</label>
                            <div className="umg-value">
                            <span className="umg-subline">{userForm.lastLogin || "—"}</span>
                            </div>
                        </div>
                    </div>
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

        </div>
    );
};
