const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { requireAuth } = require("../middleware/auth");

// ✅ Helper Functions
function formatDate(date) {
  if (!date) return "Unknown date";
  const d = new Date(date);
  return isNaN(d) ? "Unknown date" : d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ✅ 1. Fetch current user's profile using session (IMPORTANT)
router.get("/", requireAuth, async (req, res) => {
  try {
    const userID = req.session.user.userID; // ✅ From session
    const [result] = await db.execute(
      `SELECT 
        u.userID, u.firstname AS firstName, u.lastname AS lastName, u.email, u.role,
        up.userProfileID, up.location, up.bio, up.avatar, up.dietaryPreference, 
        up.allergies, up.emailNotifications, up.pushNotifications, 
        up.profileVisibility, up.language, up.recipes, up.foods, up.likes
      FROM user u
      LEFT JOIN userProfile up ON u.userID = up.userID
      WHERE u.userID = ?`,
      [userID]
    );

    if (!result || result.length === 0) {
      return res.status(404).json({ message: "No profile found", userID });
    }

    res.json(result[0]);
  } catch (err) {
    console.error("❌ Error fetching current user profile:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ 2. Fetch any profile by ID or username (YOUR ORIGINAL FEATURE - KEPT)
router.get("/:identifier", async (req, res) => {
  try {
    const { identifier } = req.params;
    const isNumeric = !isNaN(identifier);

    const query = isNumeric
      ? `SELECT u.userID, u.firstname AS firstName, u.lastname AS lastName, u.email, u.role,
          up.userProfileID, up.location, up.bio, up.avatar
         FROM userProfile up
         JOIN user u ON up.userID = u.userID
         WHERE up.userProfileID = ?`
      : `SELECT u.userID, u.firstname AS firstName, u.lastname AS lastName, u.email, u.role,
          up.userProfileID, up.location, up.bio, up.avatar
         FROM userProfile up
         JOIN user u ON up.userID = u.userID
         WHERE u.firstname = ?`;

    const [results] = await db.execute(query, [identifier]);

    if (results.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(results[0]);
  } catch (err) {
    console.error("❌ Error fetching profile by identifier:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ 3. Update user profile (first name, last name, email, bio, etc.)
router.put("/:userProfileID", requireAuth, async (req, res) => {
  try {
    const { userProfileID } = req.params;
    const { firstName, lastName, email, location, bio } = req.body;

    // ✅ Ensure profile exists
    const [profileCheck] = await db.execute(
      "SELECT userID FROM userProfile WHERE userProfileID = ?",
      [userProfileID]
    );
    if (profileCheck.length === 0) {
      return res.status(404).json({ message: "Profile not found" });
    }

    const userID = profileCheck[0].userID;

    // ✅ Update main user table
    await db.execute(
      "UPDATE user SET firstname = ?, lastname = ?, email = ? WHERE userID = ?",
      [firstName, lastName, email, userID]
    );

    // ✅ Update profile details
    await db.execute(
      "UPDATE userProfile SET location = ?, bio = ? WHERE userProfileID = ?",
      [location, bio, userProfileID]
    );

    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    console.error("❌ Error updating profile:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ 4. Update user preferences (notifications, dietary, etc.)
router.patch("/:userProfileID/preferences", requireAuth, async (req, res) => {
  try {
    const { userProfileID } = req.params;
    const { prefs } = req.body;

    await db.execute(
      `UPDATE userProfile SET
        dietaryPreference = ?, allergies = ?, emailNotifications = ?, 
        pushNotifications = ?, profileVisibility = ?, language = ?
      WHERE userProfileID = ?`,
      [
        prefs.dietary,
        prefs.allergies,
        prefs.emailNotifications,
        prefs.pushNotifications,
        prefs.profileVisibility,
        prefs.language,
        userProfileID,
      ]
    );

    res.json({ message: "Preferences updated successfully" });
  } catch (err) {
    console.error("❌ Error updating preferences:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
