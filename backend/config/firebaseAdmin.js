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
}

module.exports = admin;