const { Resend } = require("resend");
require("dotenv").config();

// Create a Resend client using the API key from .env file or Railway variables
const resend = new Resend(process.env.RESEND_API_KEY);

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