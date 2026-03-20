const express = require("express");
const router = express.Router();
const { pool: db } = require("../config/db");
const { requireAuth } = require("../middleware/auth");

// Called internally by other route files to insert a notification.
async function createNotification(userID, type, message, dbPool) {
    try {
        await dbPool.execute(
            "INSERT INTO notifications (userID, type, message) VALUES (?, ?, ?)",
            [userID, type, message]
        );
    } catch (err) {
        console.error("❌ Failed to create notification:", err.message);
    }
}

// Fetch all notifications for the logged-in user, newest first.
router.get("/", requireAuth, async (req, res) => {
    try {
        const userID = req.session.user.userID;
        const [rows] = await db.execute(
            `SELECT notificationID, type, message, is_read, created_at
             FROM notifications
             WHERE userID = ?
             ORDER BY created_at DESC
             LIMIT 50`,
            [userID]
        );
        const unreadCount = rows.filter(n => n.is_read === 0).length;
        return res.json({ success: true, notifications: rows, unreadCount });
    } catch (err) {
        console.error("❌ Error fetching notifications:", err.message);
        return res.status(500).json({ success: false, message: "Failed to fetch notifications" });
    }
});

// Mark all notifications as read for the logged-in user.
router.patch("/read-all", requireAuth, async (req, res) => {
    try {
        const userID = req.session.user.userID;
        await db.execute(
            "UPDATE notifications SET is_read = 1 WHERE userID = ? AND is_read = 0",
            [userID]
        );
        return res.json({ success: true, message: "All notifications marked as read" });
    } catch (err) {
        console.error("❌ Error marking notifications as read:", err.message);
        return res.status(500).json({ success: false, message: "Failed to update notifications" });
    }
});

// Mark a single notification as read.
router.patch("/:id/read", requireAuth, async (req, res) => {
    try {
        const userID = req.session.user.userID;
        const notificationID = parseInt(req.params.id, 10);
        await db.execute(
            "UPDATE notifications SET is_read = 1 WHERE notificationID = ? AND userID = ?",
            [notificationID, userID]
        );
        return res.json({ success: true });
    } catch (err) {
        console.error("❌ Error marking notification as read:", err.message);
        return res.status(500).json({ success: false, message: "Failed to update notification" });
    }
});

// Delete a single notification (user can dismiss it).
router.delete("/:id", requireAuth, async (req, res) => {
    try {
        const userID = req.session.user.userID;
        const notificationID = parseInt(req.params.id, 10);
        await db.execute(
            "DELETE FROM notifications WHERE notificationID = ? AND userID = ?",
            [notificationID, userID]
        );
        return res.json({ success: true });
    } catch (err) {
        console.error("❌ Error deleting notification:", err.message);
        return res.status(500).json({ success: false, message: "Failed to delete notification" });
    }
});

async function isEmailNotificationsEnabled(userID, dbPool) {
    try {
        const [rows] = await dbPool.execute(
            "SELECT emailNotifications FROM userProfile WHERE userID = ?",
            [userID]
        );
        if (rows.length === 0) return true; // Default to true if no profile found
        return rows[0].emailNotifications === 1;
    } catch (err) {
        console.error("❌ Failed to check emailNotifications setting:", err.message);
        return true; // Default to true on error so emails don't get silently dropped
    }
}

module.exports = router;
module.exports.createNotification = createNotification;
module.exports.isEmailNotificationsEnabled = isEmailNotificationsEnabled;