const express = require("express");
const router = express.Router();
const db = require('../config/db');

function formatRelativeTime(date) {
  if (!date) return 'Unknown date';
  
  try {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return 'Unknown date';
    }
    return parsedDate.toLocaleDateString();
  } catch (error) {
    console.log("Error formatting relative time:", error);
    return 'Unknown date';
  }
}

function formatDate(date) {
  if (!date) {
    console.log("No date provided to formatDate");
    return 'Unknown date';
  }
  
  try {
    // Handle MySQL datetime format and other date strings
    const parsedDate = new Date(date);
    
    if (isNaN(parsedDate.getTime())) {
      console.log("⚠️ [BACKEND] Invalid date:", date);
      return 'Unknown date';
    }
    
    return parsedDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.log("Error formatting date:", error, "Raw date:", date);
    return 'Unknown date';
  }
}

// Get user profile by identifier (userProfileID or username)
router.get("/:identifier", async (req, res) => {
  try {
    const { identifier } = req.params;
    console.log("Fetching profile for identifier:", identifier);
    
    // Check if identifier is numeric (userProfileID) or string (username)
    const isNumericId = !isNaN(identifier) && !isNaN(parseFloat(identifier));
    
    let userQuery;
    let queryParams;

    if (isNumericId) {
      // Search by userProfileID (existing functionality)
      userQuery = `
        SELECT 
          u.userID,
          u.firstname as firstName,
          u.lastname as lastName,
          u.email,
          u.role,
          up.userProfileID,
          up.location,
          up.bio,
          up.dietaryPreference as dietary,
          up.allergies,
          up.avatar,
          up.emailNotifications,
          up.pushNotifications,
          up.profileVisibility,
          up.language,
          up.recipes,
          up.foods,
          up.likes
        FROM userProfile up
        JOIN user u ON up.userID = u.userID
        WHERE up.userProfileID = ?
      `;
      queryParams = [identifier];
    } else {
      // Search by first name as username (fallback)
      userQuery = `
        SELECT 
          u.userID,
          u.firstname as firstName,
          u.lastname as lastName,
          u.email,
          u.role,
          up.userProfileID,
          up.location,
          up.bio,
          up.dietaryPreference as dietary,
          up.allergies,
          up.avatar,
          up.emailNotifications,
          up.pushNotifications,
          up.profileVisibility,
          up.language,
          up.recipes,
          up.foods,
          up.likes
        FROM userProfile up
        JOIN user u ON up.userID = u.userID
        WHERE u.firstname = ?
      `;
      queryParams = [identifier];
    }

    console.log("Executing SQL query:", userQuery);
    console.log("Query parameters:", queryParams);
    
    const [userResults] = await db.execute(userQuery, queryParams);
    console.log("User query results length:", userResults.length);

    if (userResults.length === 0) {
      console.log("No user found with identifier:", identifier);
      return res.status(404).json({ 
        error: "User not found",
        details: `No user found with identifier: ${identifier}`
      });
    }

    const user = userResults[0];
    console.log("✅ [BACKEND] User found:", {
      id: user.userID,
      name: `${user.firstName} ${user.lastName}`,
      profileID: user.userProfileID
    });

    // Get saved foods
    let savedFoods = [];
    try {
      console.log("Fetching saved foods for userProfileID:", user.userProfileID);
      
      const savedFoodsQuery = `
        SELECT 
          sf.saveID,
          sf.foodID,
          f.name,
          f.origin,
          f.image
        FROM saveFood sf
        JOIN food f ON sf.foodID = f.foodID
        WHERE sf.userProfileID = ?
      `;

      const [savedFoodsResults] = await db.execute(savedFoodsQuery, [user.userProfileID]);
      console.log("📦 [BACKEND] Saved foods found:", savedFoodsResults.length);

      // Format saved foods
      savedFoods = savedFoodsResults.map(food => ({
        id: food.foodID,
        saveId: food.saveID,
        name: food.name,
        origin: food.origin,
        image: food.image,
        savedDate: formatRelativeTime(new Date()) // Use current date
      }));
    } catch (savedFoodsError) {
      console.log("⚠️ [BACKEND] Error with saved foods, using empty array:", savedFoodsError.message);
      savedFoods = []; // Return empty array if any error occurs
    }

    // Get ALL contributions (pending, approved, rejected)
    let contributions = [];
    try {
      console.log("Fetching all contributions for userProfileID:", user.userProfileID);
      
      const contributionsQuery = `
        SELECT 
          p.postID as id,
          p.foodName as title,
          p.origin,
          p.status,
          p.created_at as submittedDate,
          p.photos as image,
          p.culturalStory,
          p.recipe
        FROM posts p
        WHERE p.userProfileID = ? 
        ORDER BY p.created_at DESC
      `;

      console.log("Executing contributions query:", contributionsQuery);
      const [contributionsResults] = await db.execute(contributionsQuery, [user.userProfileID]);
      console.log("All contributions found:", contributionsResults.length);

      contributions = contributionsResults.map(contribution => {
        const type = contribution.recipe ? 'Recipe' : 'Food';

        // Debug the date value
      console.log("Raw submittedDate:", contribution.submittedDate);
      console.log("Type of submittedDate:", typeof contribution.submittedDate);
        
        const payload = {
          name: contribution.title,
          origin: contribution.origin,
          description: contribution.culturalStory || '',
          images: contribution.image ? [contribution.image] : [],
          imageData: contribution.image || '',
          ...(contribution.recipe && {
            ingredients: '',
            instructions: contribution.recipe,
            difficulty: 'Medium',
            prepTime: 0,
            cookTime: 0,
            servings: 0
          })
        };

        return {
          id: contribution.id,
          type: type,
          title: contribution.title,
          submittedDate: formatDate(contribution.submittedDate),
          status: mapStatus(contribution.status),
          image: contribution.image,
          payload: payload
        };
      });
    } catch (contributionsError) {
      console.log("Error with contributions, using empty array:", contributionsError.message);
      contributions = [];
    }

    // Build profile response
    const profile = {
      userID: user.userID,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role || 'Member',
      location: user.location,
      bio: user.bio,
      avatar: user.avatar,
      stats: {
        recipes: user.recipes || 0,
        foods: user.foods || 0,
        likes: user.likes || 0
      },
      savedFoods: savedFoods,
      status: contributions,
      prefs: {
        dietary: user.dietary || 'none',
        allergies: user.allergies || 'noAllergies',
        emailNotifications: Boolean(user.emailNotifications),
        pushNotifications: Boolean(user.pushNotifications),
        profileVisibility: Boolean(user.profileVisibility),
        language: user.language || 'en'
      }
    };

    console.log("Successfully built profile response");
    res.json(profile);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ 
      error: "Internal server error",
      details: error.message 
    });
  }
});

// Update user profile
router.put("/:userProfileID", async (req, res) => {
  try {
    const { userProfileID } = req.params;
    const { firstName, lastName, email, location, bio } = req.body;

    console.log("✏️ [BACKEND] Updating profile for userProfileID:", userProfileID);

    // First get the userID from userProfile
    const [profileResults] = await db.execute(
      "SELECT userID FROM userProfile WHERE userProfileID = ?",
      [userProfileID]
    );

    if (profileResults.length === 0) {
      console.log("❌ [BACKEND] User profile not found for update:", userProfileID);
      return res.status(404).json({ error: "User profile not found" });
    }

    const userID = profileResults[0].userID;

    // Update user table
    await db.execute(
      "UPDATE user SET firstname = ?, lastname = ?, email = ? WHERE userID = ?",
      [firstName, lastName, email, userID]
    );

    // Update userProfile table
    await db.execute(
      "UPDATE userProfile SET location = ?, bio = ? WHERE userProfileID = ?",
      [location, bio, userProfileID]
    );

    console.log("Profile updated successfully");
    res.json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update user preferences
router.patch("/:userProfileID/preferences", async (req, res) => {
  try {
    const { userProfileID } = req.params;
    const { prefs } = req.body;

    console.log("⚙️ [BACKEND] Updating preferences for userProfileID:", userProfileID);

    await db.execute(
      `UPDATE userProfile 
       SET dietaryPreference = ?, allergies = ?, 
           emailNotifications = ?, pushNotifications = ?, 
           profileVisibility = ?, language = ?
       WHERE userProfileID = ?`,
      [
        prefs.dietary,
        prefs.allergies,
        prefs.emailNotifications,
        prefs.pushNotifications,
        prefs.profileVisibility,
        prefs.language,
        userProfileID
      ]
    );

    console.log("Preferences updated successfully");
    res.json({ message: "Preferences updated successfully" });
  } catch (error) {
    console.error("Error updating preferences:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

function mapStatus(status) {
  const statusMap = {
    'Pending': 'under_review',
    'Approved': 'approved',
    'Rejected': 'needs_revision'
  };
  return statusMap[status] || status;
}

module.exports = router;