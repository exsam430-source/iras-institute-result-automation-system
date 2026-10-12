export const resultApprovedTemplate = ({
  firstName,
  courseName,
  courseCode,
  grade,
  totalMarks,
  totalTotal,
  percentage,
  semester,
  universityName,
  dashboardUrl,
}) => {
  const isPassed = percentage >= 45;
  const statusColor = isPassed ? '#10B981' : '#EF4444';
  const statusText = isPassed ? 'PASSED ✅' : 'FAILED ❌';

  return {
    subject: `Result Officially Approved - ${courseCode} | ${universityName}`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Result Approved</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f0f4f8; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #065F46 0%, #10B981 100%); padding: 32px; text-align: center; }
    .header h1 { color: #fff; font-size: 22px; font-weight: 700; margin-top: 8px; }
    .header p { color: rgba(255,255,255,0.85); font-size: 14px; }
    .icon { font-size: 40px; }
    .body { padding: 36px 32px; }
    .greeting { font-size: 18px; font-weight: 600; color: #1E3A5F; margin-bottom: 12px; }
    .text { font-size: 15px; color: #4B5563; line-height: 1.7; margin-bottom: 20px; }
    .result-card { border: 2px solid ${statusColor}; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center; }
    .status-badge { display: inline-block; background: ${statusColor}; color: #fff; padding: 6px 20px; border-radius: 20px; font-size: 14px; font-weight: 700; margin-bottom: 16px; }
    .course-name { font-size: 18px; font-weight: 700; color: #1E3A5F; }
    .course-code { font-size: 13px; color: #6B7280; margin-bottom: 16px; }
    .result-grid { display: flex; justify-content: space-around; gap: 12px; }
    .result-item { text-align: center; }
    .result-value { font-size: 28px; font-weight: 800; color: ${statusColor}; }
    .result-label { font-size: 12px; color: #6B7280; margin-top: 2px; }
    .action-note { background: #F0FDF4; border-left: 4px solid #10B981; padding: 12px 16px; border-radius: 4px; margin: 16px 0; font-size: 13px; color: #065F46; }
    .btn-wrapper { text-align: center; margin: 28px 0; }
    .btn { display: inline-block; background: linear-gradient(135deg, #065F46, #10B981); color: #fff !important; text-decoration: none; padding: 13px 36px; border-radius: 8px; font-size: 15px; font-weight: 600; }
    .footer { background: #F9FAFB; padding: 20px 32px; text-align: center; }
    .footer p { font-size: 12px; color: #9CA3AF; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="icon">✅</div>
      <h1>Result Officially Approved</h1>
      <p>${universityName} - IRAS | Semester ${semester}</p>
    </div>
    <div class="body">
      <p class="greeting">Dear ${firstName},</p>
      <p class="text">
        Your result for the following course has been officially approved by the Head of Department.
        You can now view your official result and generate your transcript.
      </p>
      <div class="result-card">
        <div class="status-badge">${statusText}</div>
        <p class="course-name">${courseName}</p>
        <p class="course-code">Course Code: ${courseCode} | Semester ${semester}</p>
        <div class="result-grid">
          <div class="result-item">
            <div class="result-value">${totalMarks}/${totalTotal}</div>
            <div class="result-label">Total Marks</div>
          </div>
          <div class="result-item">
            <div class="result-value">${percentage}%</div>
            <div class="result-label">Percentage</div>
          </div>
          <div class="result-item">
            <div class="result-value">${grade}</div>
            <div class="result-label">Grade</div>
          </div>
        </div>
      </div>
      <div class="action-note">
        ✅ Your result is now official. You can view detailed results and download your transcript from the student dashboard.
      </div>
      <div class="btn-wrapper">
        <a href="${dashboardUrl}" class="btn">📋 View Official Result</a>
      </div>
    </div>
    <div class="footer">
      <p><strong>${universityName}</strong></p>
      <p>© ${new Date().getFullYear()} ${universityName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
  };
};

export const resultRejectedTeacherTemplate = ({
  firstName,
  courseName,
  courseCode,
  semester,
  rejectionReason,
  universityName,
  dashboardUrl,
}) => ({
  subject: `Result Returned for Correction - ${courseCode} | ${universityName}`,
  html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Result Rejected</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f0f4f8; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #92400E 0%, #F59E0B 100%); padding: 32px; text-align: center; }
    .header h1 { color: #fff; font-size: 22px; font-weight: 700; margin-top: 8px; }
    .header p { color: rgba(255,255,255,0.85); font-size: 14px; }
    .icon { font-size: 40px; }
    .body { padding: 36px 32px; }
    .greeting { font-size: 18px; font-weight: 600; color: #1E3A5F; margin-bottom: 12px; }
    .text { font-size: 15px; color: #4B5563; line-height: 1.7; margin-bottom: 20px; }
    .reason-card { background: #FEF3C7; border: 1px solid #FCD34D; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .reason-title { font-size: 14px; font-weight: 700; color: #92400E; margin-bottom: 8px; }
    .reason-text { font-size: 14px; color: #78350F; line-height: 1.6; }
    .course-info { background: #F8FAFC; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .course-info p { font-size: 14px; color: #374151; line-height: 1.8; }
    .action-note { background: #EFF6FF; border-left: 4px solid #3B82F6; padding: 12px 16px; border-radius: 4px; margin: 16px 0; font-size: 13px; color: #1E40AF; }
    .btn-wrapper { text-align: center; margin: 28px 0; }
    .btn { display: inline-block; background: linear-gradient(135deg, #92400E, #F59E0B); color: #fff !important; text-decoration: none; padding: 13px 36px; border-radius: 8px; font-size: 15px; font-weight: 600; }
    .footer { background: #F9FAFB; padding: 20px 32px; text-align: center; }
    .footer p { font-size: 12px; color: #9CA3AF; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="icon">↩️</div>
      <h1>Result Returned for Correction</h1>
      <p>${universityName} - IRAS</p>
    </div>
    <div class="body">
      <p class="greeting">Dear ${firstName},</p>
      <p class="text">
        The Head of Department has reviewed the result you submitted and returned it for correction.
        Please review the reason below and make the necessary corrections.
      </p>
      <div class="course-info">
        <p><strong>Course:</strong> ${courseName}</p>
        <p><strong>Code:</strong> ${courseCode}</p>
        <p><strong>Semester:</strong> ${semester}</p>
      </div>
      <div class="reason-card">
        <p class="reason-title">📝 Reason for Return:</p>
        <p class="reason-text">${rejectionReason || 'Please review and correct the marks before resubmitting.'}</p>
      </div>
      <div class="action-note">
        🔵 Please log in to your dashboard, correct the marks, and resubmit to the HoD for approval.
      </div>
      <div class="btn-wrapper">
        <a href="${dashboardUrl}" class="btn">✏️ Correct & Resubmit</a>
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