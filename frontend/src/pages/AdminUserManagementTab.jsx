import React, { useState, useEffect } from "react";
import axios from "axios";
import { CiSearch } from "react-icons/ci";
import { Mail, Shield, Users, Activity, CircleCheckBig, CircleX, X, Bell, Send } from 'lucide-react';
import { HiOutlinePencilAlt } from "react-icons/hi";
import { RiDeleteBin5Line } from "react-icons/ri";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function AdminUserManagement() {
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const initialPageSize =
    typeof window !== "undefined" && window.innerWidth <= 680 ? 6 : 10;
  const [pageSize, setPageSize] = useState(initialPageSize);

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userMode, setUserMode] = useState("create"); // create | edit
  const [specificSearch, setSpecificSearch] = useState("");
  const [emailForm, setEmailForm] = useState({
    recipientsOption: "All users",
    selectedUserIds: [],
    customEmails: "",
    template: "",
    subject: "",
    message: "",
    markAnnouncement: false,
  });

  const emptyUser = {
    id: null,
    name: "",
    email: "",
    city: "",
    role: "User",
    status: "Active",
    suspendedOn: null,
    submissions: 0,
    approved: 0,
    lastLogin: "—",
  };
  const [userForm, setUserForm] = useState(emptyUser);

  // 🧠 Fetch all users from backend
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/api/admin/users`, {
          withCredentials: true,
        });
        if (res.data.success) {
          const formatted = res.data.users.map((u) => ({
            id: u.userID,
            name: `${u.firstname} ${u.lastname}`,
            email: u.email,
            city: u.city || "—",
            role: u.role,
            status: u.status,
            suspendedOn: u.suspendedOn,
            submissions: u.submissions || 0,
            approved: u.approved || 0,
            lastLogin: u.lastLogin || "—",
          }));
          setUsers(formatted);
        }
      } catch (err) {
        console.error("Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // 🧾 Summary metrics
  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.role === "Admin").length;
  const contributors = users.filter((u) => u.submissions > 0).length;
  const activeCount = users.filter((u) => u.status === "Active").length;
  const suspendedCount = users.filter((u) => u.status === "Suspended").length;

  // 🔍 Filtering
  const filteredUsers = users.filter((u) => {
    const q = userSearch.trim().toLowerCase();
    const matchesSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.city.toLowerCase().includes(q);
    const matchesRole = roleFilter === "All Roles" || u.role === roleFilter;
    const matchesStatus =
      statusFilter === "All Statuses" || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalUsersFiltered = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalUsersFiltered / pageSize));
  const startIdx = (page - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, totalUsersFiltered);
  const pageUsers = filteredUsers.slice(startIdx, endIdx);

  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages, p + 1));

  // 📤 Create or update user
  const saveUser = async () => {
    try {
      if (!userForm.name.trim()) return alert("Name is required.");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userForm.email))
        return alert("Valid email is required.");

      const [firstname, ...rest] = userForm.name.split(" ");
      const lastname = rest.join(" ") || "";

      const payload = {
        firstname,
        lastname,
        email: userForm.email,
        city: userForm.city,
        role: userForm.role,
        status: userForm.status,
        suspendedOn:
          userForm.status === "Suspended"
            ? userForm.suspendedOn ||
              new Date().toISOString().slice(0, 10)
            : null,
        submissions: userForm.submissions,
        approved: userForm.approved,
        lastLogin: userForm.lastLogin,
      };

      if (userMode === "create") {
        await axios.post(`${API_URL}/api/admin/users`, payload, {
          withCredentials: true,
        });
        alert("✅ User created successfully!");
      } else {
        await axios.put(`${API_URL}/api/admin/users/${userForm.id}`, payload, {
          withCredentials: true,
        });
        alert("✅ User updated successfully!");
      }

      const res = await axios.get(`${API_URL}/api/admin/users`, {
        withCredentials: true,
      });
      if (res.data.success) {
        const formatted = res.data.users.map((u) => ({
          id: u.userID,
          name: `${u.firstname} ${u.lastname}`,
          email: u.email,
          city: u.city || "—",
          role: u.role,
          status: u.status,
          suspendedOn: u.suspendedOn,
          submissions: u.submissions || 0,
          approved: u.approved || 0,
          lastLogin: u.lastLogin || "—",
        }));
        setUsers(formatted);
      }

      setShowUserModal(false);
      setPage(1);
    } catch (err) {
      console.error("Error saving user:", err);
      alert(err.response?.data?.message || "Error saving user");
    }
  };

  // 🗑️ Delete user
  const deleteUserById = async (id) => {
    if (!window.confirm("Delete this user? This cannot be undone.")) return;
    try {
      await axios.delete(`${API_URL}/api/admin/users/${id}`, {
        withCredentials: true,
      });
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      console.error("Error deleting user:", err);
      alert("Failed to delete user");
    }
  };

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

  if (loading) return <p className="umg-loading">Loading users...</p>;

  return (
    <div className="user-mgmt">
      <div className="umg-header-row">
        <div>
          <h2 className="umg-title">Admin User Management</h2>
          <p className="umg-subtitle">Manage all registered users</p>
        </div>
        <button className="umg-btn-primary" onClick={openCreateUser}>
          + Add User
        </button>
      </div>

      {/* Summary Cards */}
      <div className="umg-cards">
        <div className="umg-card">
          <div className="umg-card-title">Total Users</div>
          <div className="umg-card-value">{totalUsers}</div>
          <div className="umg-card-icon">
            <Users size="40" color="#592700ff" />
          </div>
        </div>
        <div className="umg-card">
          <div className="umg-card-title">Admin</div>
          <div className="umg-card-value umg-admin-value">{adminCount}</div>
          <div className="umg-card-icon">
            <Shield size="40" color="#7200ddff" />
          </div>
        </div>
        <div className="umg-card">
          <div className="umg-card-title">Contributors</div>
          <div className="umg-card-value umg-contributor-value">
            {contributors}
          </div>
          <div className="umg-card-icon">
            <Activity size="40" color="#0000FF" />
          </div>
        </div>
        <div className="umg-card">
          <div className="umg-card-title">Active</div>
          <div className="umg-card-value umg-active-value">{activeCount}</div>
          <div className="umg-card-icon">
            <CircleCheckBig size="40" color="green" />
          </div>
        </div>
        <div className="umg-card">
          <div className="umg-card-title">Suspended</div>
          <div className="umg-card-value umg-issue-value">
            {suspendedCount}
          </div>
          <div className="umg-card-icon">
            <CircleX size="40" color="red" />
          </div>
        </div>
      </div>

      {/* Filters */}
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

      {/* Table */}
      <div className="umg-list-card">
        <div className="umg-list-head">
          <div className="umg-list-title">
            <Users />
            <span>User Accounts ({filteredUsers.length})</span>
          </div>
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
                <td colSpan="6" className="umg-empty">
                  No users found.
                </td>
              </tr>
            ) : (
              pageUsers.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="umg-name">{u.name}</div>
                    <div className="umg-subline">{u.email}</div>
                    <div className="umg-subline">{u.city}</div>
                  </td>
                  <td>
                    <span className="umg-pill umg-pill-role">{u.role}</span>
                  </td>
                  <td>
                    {u.status === "Active" && (
                      <span className="umg-pill umg-pill-active">Active</span>
                    )}
                    {u.status === "Inactive" && (
                      <span className="umg-pill umg-pill-inactive">
                        Inactive
                      </span>
                    )}
                    {u.status === "Suspended" && (
                      <span className="umg-pill umg-pill-suspended">
                        Suspended
                      </span>
                    )}
                  </td>
                  <td>
                    {u.submissions} submissions
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
          <span className="umg-pager-range">
            {totalUsersFiltered === 0
              ? "0–0 of 0"
              : `${startIdx + 1}–${endIdx} of ${totalUsersFiltered}`}
          </span>
          <div className="umg-pager-right">
            <button
              className="umg-page-btn"
              onClick={goPrev}
              disabled={page === 1}
            >
              ‹
            </button>
            <span className="umg-page-indicator">
              {page} / {totalPages}
            </span>
            <button
              className="umg-page-btn"
              onClick={goNext}
              disabled={page === totalPages}
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {/* User Modal */}
      {showUserModal && (
        <div
          className="umg-modal-backdrop"
          onClick={() => setShowUserModal(false)}
        >
          <div className="umg-modal" onClick={(e) => e.stopPropagation()}>
            <div className="umg-modal-header">
              <h3>
                {userMode === "create" ? "Create User" : "Edit User"}
              </h3>
              <button
                className="umg-modal-close"
                onClick={() => setShowUserModal(false)}
              >
                ×
              </button>
            </div>
            <div className="umg-modal-body">
              <div className="umg-field">
                <label className="umg-label">Name</label>
                <input
                  className="umg-input"
                  value={userForm.name}
                  onChange={(e) =>
                    setUserForm((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="Full name"
                />
              </div>
              <div className="umg-field">
                <label className="umg-label">Email</label>
                <input
                  className="umg-input"
                  value={userForm.email}
                  onChange={(e) =>
                    setUserForm((p) => ({ ...p, email: e.target.value }))
                  }
                  placeholder="email@example.com"
                />
              </div>
              <div className="umg-field">
                <label className="umg-label">City</label>
                <input
                  className="umg-input"
                  value={userForm.city}
                  onChange={(e) =>
                    setUserForm((p) => ({ ...p, city: e.target.value }))
                  }
                  placeholder="Kuching, Sarawak"
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="umg-field">
                  <label className="umg-label">Role</label>
                  <select
                    className="umg-input"
                    value={userForm.role}
                    onChange={(e) =>
                      setUserForm((p) => ({ ...p, role: e.target.value }))
                    }
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
                    onChange={(e) =>
                      setUserForm((p) => ({ ...p, status: e.target.value }))
                    }
                  >
                    <option>Active</option>
                    <option>Inactive</option>
                    <option>Suspended</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="umg-modal-footer">
              <button
                type="button"
                className="umg-btn-ghost"
                onClick={() => setShowUserModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="umg-btn-primary"
                onClick={saveUser}
              >
                {userMode === "create"
                  ? "Create"
                  : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
