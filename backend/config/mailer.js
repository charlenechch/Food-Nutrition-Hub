const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.BREVO_EMAIL,
    pass: process.env.BREVO_SMTP_KEY,
  },
});

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    await transporter.sendMail({
      from: "SarawakEats <noreply@sarawakeats.site>",
      to: to,
      subject: subject,
      html: html,
      text: text || "View this email in HTML",
    });

    console.log("📩 Email sent successfully to:", to);
    return { success: true };
  } catch (error) {
    console.error("❌ Unexpected Error:", error);
    return { success: false, error: error.message };
  }
};

module.exports = { sendEmail };