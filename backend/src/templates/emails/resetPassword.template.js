export const resetPasswordTemplate = ({
  firstName,
  resetUrl,
  universityName,
}) => ({
  subject: `Password Reset Request - ${universityName}`,
  html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Password Reset</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f0f4f8; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #991B1B 0%, #DC2626 100%); padding: 40px 32px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 24px; font-weight: 700; margin-top: 12px; }
    .header p { color: rgba(255,255,255,0.8); font-size: 14px; margin-top: 4px; }
    .logo-circle { width: 64px; height: 64px; background: rgba(255,255,255,0.15); border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center; font-size: 28px; }
    .body { padding: 40px 32px; }
    .greeting { font-size: 20px; font-weight: 600; color: #1E3A5F; margin-bottom: 16px; }
    .text { font-size: 15px; color: #4B5563; line-height: 1.7; margin-bottom: 20px; }
    .btn-wrapper { text-align: center; margin: 32px 0; }
    .btn { display: inline-block; background: linear-gradient(135deg, #991B1B 0%, #DC2626 100%); color: #ffffff !important; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; }
    .divider { border: none; border-top: 1px solid #E5E7EB; margin: 24px 0; }
    .link-text { font-size: 13px; color: #6B7280; word-break: break-all; }
    .link-text a { color: #DC2626; }
    .warning { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 12px 16px; border-radius: 4px; margin: 20px 0; font-size: 13px; color: #92400E; }
    .danger { background: #FEE2E2; border-left: 4px solid #EF4444; padding: 12px 16px; border-radius: 4px; margin: 20px 0; font-size: 13px; color: #991B1B; }
    .footer { background: #F9FAFB; padding: 24px 32px; text-align: center; }
    .footer p { font-size: 12px; color: #9CA3AF; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="logo-circle">🔐</div>
      <h1>Password Reset</h1>
      <p>${universityName} - IRAS</p>
    </div>
    <div class="body">
      <p class="greeting">Hello, ${firstName}!</p>
      <p class="text">
        We received a request to reset your password for your IRAS account.
        Click the button below to create a new password.
      </p>
      <div class="btn-wrapper">
        <a href="${resetUrl}" class="btn">🔑 Reset My Password</a>
      </div>
      <div class="warning">
        ⚠️ This link will expire in <strong>10 minutes</strong> for security reasons.
      </div>
      <div class="danger">
        🚨 If you did not request a password reset, your account may be at risk.
        Please contact your administrator immediately.
      </div>
      <hr class="divider" />
      <p class="text">If the button doesn't work, copy and paste this link:</p>
      <p class="link-text"><a href="${resetUrl}">${resetUrl}</a></p>
    </div>
    <div class="footer">
      <p><strong>${universityName}</strong></p>
      <p>Mingora, Swat, Khyber Pakhtunkhwa, Pakistan</p>
      <p style="margin-top: 8px;">© ${new Date().getFullYear()} ${universityName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
});