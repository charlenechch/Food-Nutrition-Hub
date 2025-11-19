const { Resend } = require("resend");
require("dotenv").config();

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const data = await resend.emails.send({
      from: "SarawakEats <onboarding@resend.dev>", // Use this default for testing
      to: to, // MUST be your own email address until you verify a domain
      subject: subject,
      html: html,
      text: text || "View this email in HTML",
    });

    if (data.error) {
      console.error("❌ Resend API Error:", data.error);
      return { success: false, error: data.error };
    }

    console.log("📩 Email sent via Resend:", data.id);
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error("❌ Unexpected Error:", error);
    return { success: false, error: error.message };
  }
};

module.exports = { sendEmail };