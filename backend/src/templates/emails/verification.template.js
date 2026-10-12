export const emailVerificationTemplate = ({
  firstName,
  verificationUrl,
  universityName,
}) => ({
  subject: `Verify Your Email - ${universityName}`,
  html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Email Verification</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f0f4f8; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #1E3A5F 0%, #2D5F8B 100%); padding: 40px 32px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 24px; font-weight: 700; margin-top: 12px; }
    .header p { color: rgba(255,255,255,0.8); font-size: 14px; margin-top: 4px; }
    .logo-circle { width: 64px; height: 64px; background: rgba(255,255,255,0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto; font-size: 28px; }
    .body { padding: 40px 32px; }
    .greeting { font-size: 20px; font-weight: 600; color: #1E3A5F; margin-bottom: 16px; }
    .text { font-size: 15px; color: #4B5563; line-height: 1.7; margin-bottom: 20px; }
    .btn-wrapper { text-align: center; margin: 32px 0; }
    .btn { display: inline-block; background: linear-gradient(135deg, #1E3A5F 0%, #2D5F8B 100%); color: #ffffff !important; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; letter-spacing: 0.5px; }
    .divider { border: none; border-top: 1px solid #E5E7EB; margin: 24px 0; }
    .link-text { font-size: 13px; color: #6B7280; word-break: break-all; }
    .link-text a { color: #2D5F8B; }
    .warning { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 12px 16px; border-radius: 4px; margin: 20px 0; font-size: 13px; color: #92400E; }
    .footer { background: #F9FAFB; padding: 24px 32px; text-align: center; }
    .footer p { font-size: 12px; color: #9CA3AF; line-height: 1.6; }
    .footer strong { color: #6B7280; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="logo-circle">🎓</div>
      <h1>${universityName}</h1>
      <p>Institute Result Automation System</p>
    </div>
    <div class="body">
      <p class="greeting">Hello, ${firstName}!</p>
      <p class="text">
        Welcome to <strong>${universityName} IRAS</strong>. Your account has been successfully created.
        Please verify your email address to activate your account and access the system.
      </p>
      <div class="btn-wrapper">
        <a href="${verificationUrl}" class="btn">✅ Verify Email Address</a>
      </div>
      <div class="warning">
        ⚠️ This verification link will expire in <strong>24 hours</strong>. Please verify your email before it expires.
      </div>
      <hr class="divider" />
      <p class="text">If the button doesn't work, copy and paste this link into your browser:</p>
      <p class="link-text"><a href="${verificationUrl}">${verificationUrl}</a></p>
      <hr class="divider" />
      <p class="text" style="font-size: 13px; color: #9CA3AF;">
        If you didn't create an account, please ignore this email or contact your system administrator.
      </p>
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