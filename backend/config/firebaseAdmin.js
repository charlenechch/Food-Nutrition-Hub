const admin = require("firebase-admin");

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      
      console.log("Firebase Admin initialized from environment variable");
    } 
    else {
      const serviceAccount = require("./firebase-service-account-key.json");
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      
      console.log("Firebase Admin initialized from local file");
    }
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error.message);
  }
} else {
  console.log("Firebase Admin already initialized");
}

// Helper function to delete Firebase user
async function deleteFirebaseUser(uid) {
  if (admin.apps.length === 0) {
    throw new Error('Firebase Admin not initialized');
  }
  return admin.auth().deleteUser(uid);
}

// Helper function to check if initialized
function isInitialized() {
  return admin.apps.length > 0;
}

module.exports = {
  admin,
  deleteFirebaseUser,
  isInitialized
};