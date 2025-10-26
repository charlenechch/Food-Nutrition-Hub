const db = require("./db");

const userProfile = [
  {
    userID: 1,
    location: 'Kuching, Sarawak',
    bio: 'Passionate about preserving Sarawak culinary heritage',
    dietaryPreference: 'none',
    allergies: 'noAllergies',
    avatar: 'IR',
    emailNotifications: true,
    pushNotifications: true,
    profileVisibility: true,
    language: 'en',
  },
  {
    userID: 2,
    location: 'Miri, Sarawak',
    bio: 'Food enthusiast and recipe collector',
    dietaryPreference: 'vegetarian',
    allergies: 'nutsAllergy',
    avatar: 'LC',
    emailNotifications: true,
    pushNotifications: false,
    profileVisibility: true,
    language: 'en',
  },
  {
    userID: 5,
    location: 'Sibu, Sarawak',
    bio: 'Traditional Sarawak cuisine lover',
    dietaryPreference: 'halal',
    allergies: 'seafoodAllergy',
    avatar: 'FC',
    emailNotifications: false,
    pushNotifications: true,
    profileVisibility: true,
    language: 'ms',
  },
  {
    userID: 6,
    location: 'Bintulu, Sarawak',
    bio: 'Home cook sharing family recipes',
    dietaryPreference: 'vegan',
    allergies: 'noAllergies',
    avatar: 'VT',
    emailNotifications: true,
    pushNotifications: true,
    profileVisibility: false,
    language: 'en',
  },
  {
    userID: 9,
    location: 'Kota Samarahan, Sarawak',
    bio: 'Food blogger and photographer',
    dietaryPreference: 'none',
    allergies: 'spicyRestriction',
    avatar: 'VL',
    emailNotifications: true,
    pushNotifications: true,
    profileVisibility: true,
    language: 'en',
  },
  {
    userID: 10,
    location: 'Sri Aman, Sarawak',
    bio: 'Love exploring local markets and street food',
    dietaryPreference: 'vegetarian',
    allergies: 'noAllergies',
    avatar: 'LS',
    emailNotifications: false,
    pushNotifications: false,
    profileVisibility: true,
    language: 'ms',
  },
  {
    userID: 11,
    location: 'Limbang, Sarawak',
    bio: 'Traditional cooking methods expert',
    dietaryPreference: 'halal',
    allergies: 'nutsAllergy',
    avatar: 'EB',
    emailNotifications: true,
    pushNotifications: true,
    profileVisibility: true,
    language: 'ms',
  },
  {
    userID: 12,
    location: 'Kapit, Sarawak',
    bio: 'Indigenous recipes preservationist',
    dietaryPreference: 'none',
    allergies: 'seafoodAllergy',
    avatar: 'BB',
    emailNotifications: true,
    pushNotifications: false,
    profileVisibility: true,
    language: 'en',
  },
  {
    userID: 14,
    location: 'Sarikei, Sarawak',
    bio: 'Fusion cuisine experimenter',
    dietaryPreference: 'vegan',
    allergies: 'spicyRestriction',
    avatar: 'LJ',
    emailNotifications: false,
    pushNotifications: true,
    profileVisibility: false,
    language: 'en',
  },
  {
    userID: 16,
    location: 'Betong, Sarawak',
    bio: 'Local ingredients specialist',
    dietaryPreference: 'vegetarian',
    allergies: 'noAllergies',
    avatar: 'ML',
    emailNotifications: true,
    pushNotifications: true,
    profileVisibility: true,
    language: 'ms',
  }
];

(async () => {
  try {
    for (const profile of userProfile) {
      const sql = `
        INSERT INTO userProfile (userID, location, bio, dietaryPreference, allergies, avatar, emailNotifications, pushNotifications, profileVisibility, language)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        profile.userID,
        profile.location,
        profile.bio,
        profile.dietaryPreference,
        profile.allergies,
        profile.avatar,
        profile.emailNotifications,
        profile.pushNotifications,
        profile.profileVisibility,
        profile.language,
      ];

      await db.query(sql, values);
      console.log(`✅ Inserted profile for userID ${profile.userID}`);
    }

    console.log("🎉 All dummy user profiles inserted successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error inserting user profiles:", err.message);
    process.exit(1);
  }
})();
