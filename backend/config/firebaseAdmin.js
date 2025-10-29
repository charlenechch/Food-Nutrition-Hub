const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    // Use environment variable for service account (works for both local and production)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      
      console.log("Firebase Admin initialized successfully");
    } else {
      console.error("FIREBASE_SERVICE_ACCOUNT environment variable not found");
      console.error("Please add the Firebase service account JSON to your .env file");
    }
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error.message);
  }
}

module.exports = admin;