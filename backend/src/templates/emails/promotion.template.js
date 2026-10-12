export const semesterPromotionTemplate = ({
  firstName,
  fromSemester,
  toSemester,
  semesterGPA,
  cumulativeGPA,
  totalCoursesPassed,
  totalCoursesFailed,
  universityName,
  dashboardUrl,
}) => ({
  subject: `Promoted to Semester ${toSemester} 🎉 | ${universityName}`,
  html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Semester Promotion</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f0f4f8; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #4C1D95 0%, #7C3AED 100%); padding: 32px; text-align: center; }
    .header h1 { color: #fff; font-size: 22px; font-weight: 700; margin-top: 8px; }
    .header p { color: rgba(255,255,255,0.85); font-size: 14px; }
    .icon { font-size: 40px; }
    .body { padding: 36px 32px; }
    .greeting { font-size: 18px; font-weight: 600; color: #1E3A5F; margin-bottom: 12px; }
    .text { font-size: 15px; color: #4B5563; line-height: 1.7; margin-bottom: 20px; }
    .promotion-banner { background: linear-gradient(135deg, #4C1D95, #7C3AED); border-radius: 12px; padding: 28px; margin: 24px 0; text-align: center; color: #fff; }
    .arrow-display { display: flex; justify-content: center; align-items: center; gap: 16px; margin: 12px 0; }
    .sem-box { background: rgba(255,255,255,0.2); border-radius: 8px; padding: 12px 20px; }
    .sem-number { font-size: 32px; font-weight: 800; }
    .sem-label { font-size: 12px; opacity: 0.8; }
    .arrow { font-size: 28px; }
    .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin: 20px 0; }
    .stat-card { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; text-align: center; }
    .stat-value { font-size: 24px; font-weight: 800; color: #1E3A5F; }
    .stat-label { font-size: 12px; color: #6B7280; margin-top: 4px; }
    .failed-note { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 12px 16px; border-radius: 4px; margin: 16px 0; font-size: 13px; color: #92400E; }
    .btn-wrapper { text-align: center; margin: 28px 0; }
    .btn { display: inline-block; background: linear-gradient(135deg, #4C1D95, #7C3AED); color: #fff !important; text-decoration: none; padding: 13px 36px; border-radius: 8px; font-size: 15px; font-weight: 600; }
    .footer { background: #F9FAFB; padding: 20px 32px; text-align: center; }
    .footer p { font-size: 12px; color: #9CA3AF; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="icon">🎓</div>
      <h1>Congratulations! You're Promoted!</h1>
      <p>${universityName} - IRAS</p>
    </div>
    <div class="body">
      <p class="greeting">Dear ${firstName},</p>
      <p class="text">
        We are pleased to inform you that you have been promoted to the next semester.
        Congratulations on completing Semester ${fromSemester}!
      </p>
      <div class="promotion-banner">
        <p style="font-size: 14px; opacity: 0.9; margin-bottom: 12px;">SEMESTER PROMOTION</p>
        <div class="arrow-display">
          <div class="sem-box">
            <div class="sem-number">${fromSemester}</div>
            <div class="sem-label">From Semester</div>
          </div>
          <div class="arrow">➡️</div>
          <div class="sem-box">
            <div class="sem-number">${toSemester}</div>
            <div class="sem-label">To Semester</div>
          </div>
        </div>
      </div>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${semesterGPA}</div>
          <div class="stat-label">Semester GPA</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${cumulativeGPA}</div>
          <div class="stat-label">CGPA</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color: #10B981;">${totalCoursesPassed}</div>
          <div class="stat-label">Courses Passed</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color: #EF4444;">${totalCoursesFailed}</div>
          <div class="stat-label">Courses Failed</div>
        </div>
      </div>
      ${
        totalCoursesFailed > 0
          ? `<div class="failed-note">
          ⚠️ You have <strong>${totalCoursesFailed} failed course(s)</strong> that will be carried forward.
          These courses will appear in your academic record for repeat consideration.
        </div>`
          : ''
      }
      <div class="btn-wrapper">
        <a href="${dashboardUrl}" class="btn">🎓 View Semester Result</a>
      </div>
    </div>
    <div class="footer">
      <p><strong>${universityName}</strong></p>
      <p>© ${new Date().getFullYear()} ${universityName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
});