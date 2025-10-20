const { Resend } = require("resend");
require("dotenv").config();

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Reusable function to send emails
const sendEmail = async ({ to, subject, html }) => {
  // Check if API key exists
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not set in environment variables");
    return { 
      success: false, 
      error: "Email service not configured" 
    };
  }

  try {
    const result = await resend.emails.send({
      from: "SarawakEats <onboarding@resend.dev>",
      to: to,
      subject: subject,
      html: html,
    });
    
    console.log("Email sent successfully to:", to);
    console.log("Email ID:", result.id);
    
    return { success: true };
    
  } catch (error) {
    console.error("Error sending email with Resend:", error);
    
    return { 
      success: false, 
      error: error.message 
    };
  }
};

module.exports = sendEmail;