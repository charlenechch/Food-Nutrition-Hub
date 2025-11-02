const express = require("express");
const router = express.Router();
const { requireAdmin } = require("../middleware/auth"); 
const Joi = require("joi");
const validator = require("validator");
const sanitizeHtml = require("sanitize-html");

// 🧹 Helper: sanitize string safely
function sanitizeInput(value) {
  if (typeof value === "string") {
    value = sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} });
    value = validator.trim(value);
  }
  return value;
}

// ✅ Validation schema
const userSchema = Joi.object({
  firstname: Joi.string().max(50).required(),
  lastname: Joi.string().max(50).required(),
  email: Joi.string().email().required(),
  city: Joi.string().max(100).allow("", null),
  role: Joi.string().valid("Admin", "User").required(),
  status: Joi.string().valid("Active", "Inactive", "Suspended").required(),
  suspendedOn: Joi.string().allow("", null),
  submissions: Joi.number().integer().min(0).allow(null),
  approved: Joi.number().integer().min(0).allow(null),
  lastLogin: Joi.string().allow("", null),
});

// ✅ 1. Get all users (for Admin User Management page)
router.get("/users", requireAdmin, async (req, res) => {
  try {
    const [rows] = await req.db.execute(
      "SELECT userID, firstname, lastname, email, city, role, status, suspendedOn, submissions, approved, lastLogin FROM user ORDER BY userID DESC"
    );
    res.json({ success: true, users: rows });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
});

// ✅ 2. Add new user
router.post("/users", requireAdmin, async (req, res) => {
  try {
    const { error, value } = userSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const u = Object.fromEntries(Object.entries(value).map(([k, v]) => [k, sanitizeInput(v)]));

    await req.db.execute(
      `INSERT INTO user (firstname, lastname, email, city, role, status, suspendedOn, submissions, approved, lastLogin)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [u.firstname, u.lastname, u.email, u.city, u.role, u.status, u.suspendedOn || null, u.submissions || 0, u.approved || 0, u.lastLogin || null]
    );
    res.json({ success: true, message: "User added successfully" });
  } catch (error) {
    console.error("Error adding user:", error);
    res.status(500).json({ success: false, message: "Failed to add user" });
  }
});

// ✅ 3. Edit user
router.put("/users/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = userSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const u = Object.fromEntries(Object.entries(value).map(([k, v]) => [k, sanitizeInput(v)]));

    await req.db.execute(
      `UPDATE user 
       SET firstname=?, lastname=?, email=?, city=?, role=?, status=?, suspendedOn=?, submissions=?, approved=?, lastLogin=? 
       WHERE userID=?`,
      [u.firstname, u.lastname, u.email, u.city, u.role, u.status, u.suspendedOn || null, u.submissions || 0, u.approved || 0, u.lastLogin || null, id]
    );
    res.json({ success: true, message: "User updated successfully" });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ success: false, message: "Failed to update user" });
  }
});

// ✅ 4. Delete user
router.delete("/users/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await req.db.execute("DELETE FROM user WHERE userID = ?", [id]);
    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ success: false, message: "Failed to delete user" });
  }
});

module.exports = router;
