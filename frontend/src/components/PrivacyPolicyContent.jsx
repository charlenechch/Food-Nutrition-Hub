import React from "react";
import "../css/PolicyContent.css";

export default function PrivacyPolicyContent() {
   return (
    <div className="tpm-doc-body">
      <p className="tpm-doc-text">Welcome to SarawakEats. We are committed to protecting your personal data and respecting your privacy. This Privacy Policy explains how we collect, use, store, and protect your information when you use our platform. By registering an account and agreeing to this policy, you consent to the practices described here in accordance with the Personal Data Protection Act 2010 (PDPA) of Malaysia.</p>

      <h3 className="tpm-doc-section">1. Who We Are</h3>
      <p className="tpm-doc-text">SarawakEats is a food and nutrition knowledge hub dedicated to preserving and promoting the traditional food heritage of the Bidayuh community in Sarawak, Malaysia. The platform is developed in collaboration with the Dayak Bidayuh Literary Society (DBLS).</p>
      <p className="tpm-doc-text">For any privacy-related enquiries, please contact us at:</p>
      <p className="tpm-doc-text">Email: info@sarawakeats.com<br />Phone: +60 82-123456</p>

      <h3 className="tpm-doc-section">2. Information We Collect</h3>
      <p className="tpm-doc-text">We collect the following personal data when you use SarawakEats:</p>
      <p className="tpm-doc-text">• Account information — your first name, last name, and email address when you register<br />
      • Authentication data — your password (stored in encrypted form) or your Google account identity if you sign in using Google SSO<br />
      • Profile information — your profile picture, bio, and location if you choose to provide them<br />
      • Preferences — your dietary preferences and allergy information<br />
      • User-generated content — recipes, community posts, and saved foods that you submit or save on the platform<br />
      • Device location — we may request access to your device's location to provide nearby restaurant recommendations. This is used solely for that purpose and is not stored on our servers<br />
      • Usage data — your last login date and account status</p>

      <h3 className="tpm-doc-section">3. How We Use Your Data</h3>
      <p className="tpm-doc-text">We use your personal data for the following purposes:</p>
      <p className="tpm-doc-text">• To create and manage your account<br />
      • To provide personalised features such as dietary recommendations and saved foods<br />
      • To allow you to contribute recipes and community posts to the platform<br />
      • To suggest nearby restaurants based on your location (if permission is granted)<br />
      • To send verification and notification emails related to your account<br />
      • To maintain the security and integrity of the platform<br />
      • To comply with legal obligations under Malaysian law</p>

      <h3 className="tpm-doc-section">4. How We Store and Protect Your Data</h3>
      <p className="tpm-doc-text">We take the security of your personal data seriously. The following measures are in place to protect your information:</p>
      <p className="tpm-doc-text">• Passwords are encrypted using industry-standard hashing before storage<br />
      • All sessions are secured using encrypted cookies<br />
      • The platform implements CSRF protection and rate limiting to prevent unauthorised access<br />
      • Media files such as profile pictures are stored securely through Cloudinary<br />
      • All data transmissions between your browser and our servers are protected using HTTPS</p>

      <h3 className="tpm-doc-section">5. Third-Party Services</h3>
      <p className="tpm-doc-text">To operate SarawakEats, we use the following third-party services that may process your data:</p>
      <p className="tpm-doc-text">• Authentication — Firebase (Google) for account verification and Google SSO<br />
      • Media storage — Cloudinary for profile pictures and uploaded images<br />
      • Backend hosting — Railway for server and database hosting<br />
      • Frontend hosting — Vercel for the web application<br />
      • Email delivery — Resend for sending verification and notification emails<br />
      • AI services — OpenAI for the nutrition analyser feature<br />
      • Domain — Namecheap for domain management</p>
      <p className="tpm-doc-text">Each of these services has their own privacy policies and data handling practices. We only share the minimum data necessary for these services to function.</p>

      <h3 className="tpm-doc-section">6. Data Retention</h3>
      <p className="tpm-doc-text">We retain your personal data for as long as your account remains active. Accounts that have been inactive for 2 years will be automatically deleted. You will receive a warning email 30 days before deletion to give you the opportunity to log in and keep your account. If you choose to delete your account manually, your personal data will be removed from our systems, including your profile information, saved foods, and contributions. Some data may be retained for a short period for legal or administrative purposes.</p>

      <h3 className="tpm-doc-section">7. Your Rights Under PDPA</h3>
      <p className="tpm-doc-text">Under the Personal Data Protection Act 2010 (PDPA) of Malaysia, you have the right to:</p>
      <p className="tpm-doc-text">• Access your personal data that we hold<br />
      • Correct any inaccurate or incomplete personal data<br />
      • Withdraw consent for the processing of your personal data<br />
      • Request deletion of your account and associated data through your profile settings</p>
      <p className="tpm-doc-text">To exercise any of these rights, please contact us at info@sarawakeats.com.</p>

      <h3 className="tpm-doc-section">8. Children's Privacy</h3>
      <p className="tpm-doc-text">SarawakEats is intended for users aged 13 and above. We do not knowingly collect personal data from children under the age of 13. If you believe a child under 13 has provided us with personal data, please contact us and we will take steps to remove that information.</p>

      <h3 className="tpm-doc-section">9. Changes to This Policy</h3>
      <p className="tpm-doc-text">We reserve the right to update this Privacy Policy at any time. When significant changes are made, you will be prompted to review and accept the updated policy upon your next login. Continued use of the platform after accepting the updated policy constitutes your agreement to the changes.</p>

      <h3 className="tpm-doc-section">10. Contact Us</h3>
      <p className="tpm-doc-text">If you have any questions or concerns about this Privacy Policy or how we handle your personal data, please contact us at:</p>
      <p className="tpm-doc-text">Email: info@sarawakeats.com<br />Phone: +60 82-123456</p>
    </div>
  );
}