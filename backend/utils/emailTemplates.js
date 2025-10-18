// Generate OTP verification email HTML
function getVerificationEmailHTML({ otp, firstName = '', isResend = false }) {
  const greeting = firstName 
    ? `Welcome, ${firstName}!` 
    : 'Email Verification';
  
  const message = isResend
    ? "Here's your new verification code:"
    : "Thank you for registering with SarawakEats. To complete your registration and verify your email address, please use the following verification code:";

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2c5f2d; margin: 0;">🍽️ SarawakEats</h1>
        </div>
        
        <h2 style="color: #333; text-align: center; margin-bottom: 20px;">${greeting}</h2>
        
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          ${message}
        </p>
        
        <div style="background-color: #f0f7f0; border: 2px dashed #2c5f2d; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: center;">
          <p style="color: #666; font-size: 14px; margin: 0 0 10px 0;">Your Verification Code</p>
          <p style="font-size: 42px; letter-spacing: 12px; margin: 0; font-weight: bold; color: #2c5f2d; font-family: 'Courier New', monospace;">
            ${otp}
          </p>
        </div>
        
        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; color: #856404; font-size: 14px;">
            ⚠️ <strong>Important:</strong> This code will expire in <strong>5 minutes</strong>.
          </p>
        </div>
        
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          If you didn't ${isResend ? 'request this code' : 'create an account with SarawakEats'}, please ignore this email.
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
          © ${new Date().getFullYear()} SarawakEats - Preserving Sarawak's Food Heritage
        </p>
      </div>
    </div>
  `;
}

// Resend email subject for verification email
function getVerificationEmailSubject(isResend = false) {
  return isResend 
    ? "Your SarawakEats Verification Code" 
    : "Verify Your SarawakEats Account";
}

// Generate password reset email HTML
function getPasswordResetEmailHTML({ resetLink, firstName = '' }) {
  const greeting = firstName ? `Hello, ${firstName}!` : 'Hello!';
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2c5f2d; margin: 0;">🍽️ SarawakEats</h1>
        </div>
        
        <h2 style="color: #333; margin-bottom: 20px;">${greeting}</h2>
        
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          We received a request to reset your password. Click the button below to create a new password:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" 
             style="background-color: #2c5f2d; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
            Reset Password
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          Or copy and paste this link into your browser:
        </p>
        <p style="color: #2c5f2d; font-size: 14px; word-break: break-all;">
          ${resetLink}
        </p>
        
        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; color: #856404; font-size: 14px;">
            ⚠️ <strong>Important:</strong> This link will expire in <strong>1 hour</strong>.
          </p>
        </div>
        
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          If you didn't request a password reset, please ignore this email or contact support if you're concerned about your account security.
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
          © ${new Date().getFullYear()} SarawakEats - Preserving Sarawak's Food Heritage
        </p>
      </div>
    </div>
  `;
}

module.exports = {
  getVerificationEmailHTML,
  getVerificationEmailSubject,
  getPasswordResetEmailHTML
};