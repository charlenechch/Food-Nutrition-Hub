const admin = require("firebase-admin");

let isInitialized = false;

// Check if Firebase Admin is already initialized (e.g., by another module)
if (admin.apps.length > 0) {
  isInitialized = true;
} else {
  // Not initialized, so let's try.
  try {
    const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    if (serviceAccountEnv) {
      // PRODUCTION / ENV variable

      // Decode the Base64 string back into JSON text
      const serviceAccountJson = Buffer.from(serviceAccountEnv, 'base64').toString('utf8');

      // Parse the decoded JSON text
      const serviceAccount = JSON.parse(serviceAccountJson);

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });

      isInitialized = true;
      console.log("✅ Firebase Admin initialized from Base64 env variable.");
    }
    else if (process.env.NODE_ENV !== 'production') {
      // LOCAL DEVELOPMENT / FILE
      // Only try to load the local file if NOT in production
      const serviceAccount = require("./firebase-service-account-key.json");
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      
      isInitialized = true;
      console.log("✅ Firebase Admin initialized from local file (dev mode).");
    }
    else {
      // --- PRODUCTION ERROR ---
      console.error("❌ CRITICAL: FIREBASE_SERVICE_ACCOUNT is NOT set in production!");
    }
  } catch (error) {
    // This will catch JSON.parse errors or bad service account files
    console.error("❌ CRITICAL: Failed to initialize Firebase Admin:", error.message);
  }
}

// Helper function to delete Firebase user
async function deleteFirebaseUser(uid) {
  // Check our flag *before* trying to use the admin SDK.
  if (!isInitialized) {
    console.error("❌ Firebase deletion failed: Admin SDK is not initialized.");
    // This is the error you were seeing, just clearer
    throw new Error("app/no-app: Firebase Admin SDK is not initialized.");
  }
  
  try {
    await admin.auth().deleteUser(uid);
    console.log("✅ Firebase deletion successful for UID:", uid);
  } catch (error) {
    console.error("❌ Firebase deletion failed:", error.message);
    throw error; // Re-throw the error to be caught by userProfile.js
  }
}

module.exports = {
  admin,
  deleteFirebaseUser,
  isInitialized
};