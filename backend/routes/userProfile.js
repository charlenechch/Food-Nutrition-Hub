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

    const [rows] = await db.execute(
      `SELECT 
        u.userID, u.firstname AS firstName, u.lastname AS lastName, u.email, u.role,
        up.userProfileID, up.location, up.bio, up.avatar,
        up.dietaryPreference AS dietary, up.allergies,
        up.emailNotifications, up.pushNotifications, up.profileVisibility, up.language,
        up.recipes, up.foods, up.likes
      FROM userProfile up
      JOIN user u ON up.userID = u.userID
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
        dietary: profile.dietary || [],
        allergies: profile.allergies || [],
        emailNotifications: !!profile.emailNotifications,
        pushNotifications: !!profile.pushNotifications,
        profileVisibility: !!profile.profileVisibility,
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
        dietary: profile.dietary || [],
        allergies: profile.allergies || [],
        emailNotifications: !!profile.emailNotifications,
        pushNotifications: !!profile.pushNotifications,
        profileVisibility: !!profile.profileVisibility,
        language: profile.language || "en",
      },
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ 3. Update profile (PUT)
router.put("/:userProfileID", async (req, res) => {
  try {
    const { userProfileID } = req.params;
    const { firstName, lastName, email, location, bio } = req.body;

    await db.execute(
      `UPDATE user u 
       JOIN userProfile up ON u.userID = up.userID
       SET u.firstname = ?, u.lastname = ?, u.email = ?,
           up.location = ?, up.bio = ?
       WHERE up.userProfileID = ?`,
      [firstName, lastName, email, location, bio, userProfileID]
    );

    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ 4. Update preferences (PATCH)
router.patch("/:userProfileID/preferences", async (req, res) => {
  try {
    const { userProfileID } = req.params;
    const { prefs } = req.body;

    await db.execute(
      `UPDATE userProfile SET 
       dietaryPreference = ?, allergies = ?, 
       emailNotifications = ?, pushNotifications = ?, 
       profileVisibility = ?, language = ?
       WHERE userProfileID = ?`,
      [
        JSON.stringify(prefs.dietary || []),
        JSON.stringify(prefs.allergies || []),
        prefs.emailNotifications || false,
        prefs.pushNotifications || false,
        prefs.profileVisibility || false,
        prefs.language || "en",
        userProfileID,
      ]
    );

    res.json({ message: "Preferences updated successfully" });
  } catch (err) {
    console.error("Error updating preferences:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
