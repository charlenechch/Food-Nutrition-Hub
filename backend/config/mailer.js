const { Resend } = require("resend");
require("dotenv").config();

// Create a Resend client using the API key from .env file or Railway variables
// --- START DEBUG CODE ---
const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
  console.error("FATAL ERROR: RESEND_API_KEY is not defined in the environment.");
  throw new Error("Crashing the app because RESEND_API_KEY is missing.");
}

console.log("Successfully found RESEND_API_KEY. It starts with:", apiKey.substring(0, 5));

const resend = new Resend(apiKey);
// --- END DEBUG CODE ---

// Reusable function to send emails
const sendEmail = async ({ to, subject, html }) => {
  try {
    await resend.emails.send({
      // Resend's default address for testing
      from: "SarawakEats <onboarding@resend.dev>",
      to: to,
      subject: subject,
      html: html,
    });
    console.log("Email sent successfully using Resend.");
  } catch (error) {
    console.error("Error sending email with Resend:", error);
  }
};

module.exports = sendEmail;