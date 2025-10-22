const express = require("express");
const router = express.Router();
const db = require("../config/db");

// ✅ 1. Get logged-in user's profile using session (/api/userProfile)
router.get("/", async (req, res) => {
  try {
    
    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: "Not logged in" });
    }

    const userID = req.session.user.userID;

    // Try to fetch user profile (with userProfile data if it exists)
    const [rows] = await db.execute(
      `SELECT
        u.userID, u.firstname AS firstName, u.lastname AS lastName, u.email, u.role,
        up.userProfileID, up.location, up.bio, up.avatar,
        up.dietaryPreference AS dietary, up.allergies,
        up.emailNotifications, up.pushNotifications, up.profileVisibility, up.language,
        up.recipes, up.foods, up.likes
      FROM user u
      LEFT JOIN userProfile up ON up.userID = u.userID
      WHERE u.userID = ?`,
      [userID]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const profile = rows[0];
    res.json({
      ...profile,
      stats: {
        recipes: profile.recipes || 0,
        foods: profile.foods || 0,
        likes: profile.likes || 0,
      },
      prefs: {
        dietary: profile.dietary ? (Array.isArray(profile.dietary) ? profile.dietary : JSON.parse(profile.dietary || "[]")) : [],
        allergies: profile.allergies ? (Array.isArray(profile.allergies) ? profile.allergies : JSON.parse(profile.allergies || "[]")) : [],
        emailNotifications: profile.emailNotifications !== null ? !!profile.emailNotifications : true,
        pushNotifications: profile.pushNotifications !== null ? !!profile.pushNotifications : true,
        profileVisibility: profile.profileVisibility !== null ? !!profile.profileVisibility : true,
        language: profile.language || "en",
      },
    });
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ 2. Get other user's profile via ID or name (/api/userProfile/:identifier)
router.get("/:identifier", async (req, res) => {
  try {
    const identifier = req.params.identifier;
    const [rows] = await db.execute(
      `SELECT 
        u.userID, u.firstname AS firstName, u.lastname AS lastName, u.email, u.role,
        up.userProfileID, up.location, up.bio, up.avatar,
        up.dietaryPreference AS dietary, up.allergies,
        up.emailNotifications, up.pushNotifications, up.profileVisibility, up.language,
        up.recipes, up.foods, up.likes
      FROM userProfile up
      JOIN user u ON up.userID = u.userID
      WHERE u.userID = ? OR u.firstname = ?`,
      [identifier, identifier]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "User profile not found" });
    }

    const profile = rows[0];
    res.json({
      ...profile,
      stats: {
        recipes: profile.recipes || 0,
        foods: profile.foods || 0,
        likes: profile.likes || 0,
      },
      prefs: {
        dietary: profile.dietary ? (Array.isArray(profile.dietary) ? profile.dietary : JSON.parse(profile.dietary || "[]")) : [],
        allergies: profile.allergies ? (Array.isArray(profile.allergies) ? profile.allergies : JSON.parse(profile.allergies || "[]")) : [],
        emailNotifications: profile.emailNotifications !== null ? !!profile.emailNotifications : true,
        pushNotifications: profile.pushNotifications !== null ? !!profile.pushNotifications : true,
        profileVisibility: profile.profileVisibility !== null ? !!profile.profileVisibility : true,
        language: profile.language || "en",
      },
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ 3. Update profile (PUT)
router.put("/:userID", async (req, res) => {
  try {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: "Not logged in" });
    }

    const { userID } = req.params;
    const targetUserID = parseInt(userID);
    const loggedInUserID = req.session.user.userID;

    // Check authorization: user can only update their own profile (or admin can update any)
    if (loggedInUserID !== targetUserID && req.session.user.role !== 'admin') {
      return res.status(403).json({ error: "Not authorized" });
    }

    const { firstName, lastName, email, location, bio } = req.body;

    // Update user and profile tables
    await db.execute(
      `UPDATE user u 
       JOIN userProfile up ON u.userID = up.userID
       SET u.firstname = ?, u.lastname = ?, u.email = ?,
           up.location = ?, up.bio = ?
       WHERE u.userID = ?`,
      [firstName, lastName, email, location, bio, targetUserID]
    );

    res.json({ message: "Profile updated successfully", success: true });
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ 4. Update preferences (PATCH)
router.patch("/:userID/preferences", async (req, res) => {
  try {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: "Not logged in" });
    }

    const { userID } = req.params;
    const targetUserID = parseInt(userID);
    const loggedInUserID = req.session.user.userID;

    // Check authorization: user can only update their own preferences (or admin can update any)
    if (loggedInUserID !== targetUserID && req.session.user.role !== 'admin') {
      return res.status(403).json({ error: "Not authorized" });
    }

    const { prefs } = req.body;

    await db.execute(
      `UPDATE userProfile SET 
       dietaryPreference = ?, allergies = ?, 
       emailNotifications = ?, pushNotifications = ?, 
       profileVisibility = ?, language = ?
       WHERE userID = ?`,
      [
        JSON.stringify(prefs.dietary || []),
        JSON.stringify(prefs.allergies || []),
        prefs.emailNotifications || false,
        prefs.pushNotifications || false,
        prefs.profileVisibility || false,
        prefs.language || "en",
        targetUserID,
      ]
    );

    res.json({ message: "Preferences updated successfully", success: true });
  } catch (err) {
    console.error("Error updating preferences:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;