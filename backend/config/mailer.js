const nodemailer = require("nodemailer");
require("dotenv").config();

// 1. Create the transporter (The connection to Gmail)
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,  // Use port 465 for secure SSL connections
  secure: true, // Must be true for port 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 2. Verify connection for debugging
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Email Service Error:", error);
  } else {
    console.log("✅ Email Service Ready");
  }
});

// 3. Reusable Send Function
// Keep the same arguments ({ to, subject, html }) so it's easy to use
const sendEmail = async ({ to, subject, html, text }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("❌ EMAIL_USER or EMAIL_PASS is missing in .env");
    return { success: false, error: "Email configuration missing" };
  }

  try {
    const info = await transporter.sendMail({
      from: `"SarawakEats" <${process.env.EMAIL_USER}>`, // Professional label
      to: to,
      subject: subject,
      text: text || "Please view this email in an HTML compatible viewer.", // Fallback
      html: html,
    });

    console.log("📩 Email sent: %s", info.messageId);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error("❌ Error sending email:", error);
    return { success: false, error: error.message };
  }
};

module.exports = { sendEmail };