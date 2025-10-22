const express = require("express");
const router = express.Router();
const db = require("../config/db");

// ✅ Get own profile (/api/userProfile)
router.get("/", async (req, res) => {
  try {
    // ✅ If user is guest or not logged in → Return guest JSON but do NOT destroy session
    if (!req.session || !req.session.user) {
      return res.status(401).json({
        success: false,
        guest: true,
        message: "Guest access - please login to view profile",
      });
    }

    const userID = req.session.user.userID;
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

    if (!rows.length) {
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
        dietary: profile.dietary ? JSON.parse(profile.dietary || "[]") : [],
        allergies: profile.allergies ? JSON.parse(profile.allergies || "[]") : [],
        emailNotifications: profile.emailNotifications ?? true,
        pushNotifications: profile.pushNotifications ?? true,
        profileVisibility: profile.profileVisibility ?? true,
        language: profile.language || "en",
      },
    });
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ View another user's profile (/api/userProfile/:id)
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

    if (!rows.length) {
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
        dietary: profile.dietary ? JSON.parse(profile.dietary || "[]") : [],
        allergies: profile.allergies ? JSON.parse(profile.allergies || "[]") : [],
        emailNotifications: profile.emailNotifications ?? true,
        pushNotifications: profile.pushNotifications ?? true,
        profileVisibility: profile.profileVisibility ?? true,
        language: profile.language || "en",
      },
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
