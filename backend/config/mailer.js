const axios = require("axios");
require("dotenv").config();

console.log("🔑 Brevo API Key loaded:", process.env.BREVO_API_KEY ? "✅ Found" : "❌ Missing");

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: { name: "SarawakEats", email: "noreply@sarawakeats.site" },
        to: [{ email: to }],
        subject: subject,
        htmlContent: html,
        textContent: text || "View this email in HTML",
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("📩 Email sent successfully to:", to);
    return { success: true };
  } catch (error) {
    console.error("❌ Unexpected Error:", error.response?.data || error.message);
    return { success: false, error: error.message };
  }
};

module.exports = { sendEmail };