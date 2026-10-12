export const midTermMarksTemplate = ({
  firstName,
  courseName,
  courseCode,
  midTermMarks,
  midTermTotal,
  universityName,
  dashboardUrl,
}) => ({
  subject: `Mid-Term Marks Available - ${courseCode} | ${universityName}`,
  html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Mid-Term Marks</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f0f4f8; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #1E3A5F 0%, #2D5F8B 100%); padding: 32px; text-align: center; }
    .header h1 { color: #fff; font-size: 22px; font-weight: 700; margin-top: 8px; }
    .header p { color: rgba(255,255,255,0.8); font-size: 14px; }
    .icon { font-size: 40px; }
    .body { padding: 36px 32px; }
    .greeting { font-size: 18px; font-weight: 600; color: #1E3A5F; margin-bottom: 12px; }
    .text { font-size: 15px; color: #4B5563; line-height: 1.7; margin-bottom: 20px; }
    .marks-card { background: linear-gradient(135deg, #EFF6FF, #DBEAFE); border: 1px solid #BFDBFE; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center; }
    .course-name { font-size: 18px; font-weight: 700; color: #1E3A5F; margin-bottom: 4px; }
    .course-code { font-size: 13px; color: #6B7280; margin-bottom: 20px; }
    .marks-display { display: flex; justify-content: center; align-items: center; gap: 8px; }
    .marks-value { font-size: 48px; font-weight: 800; color: #1E3A5F; }
    .marks-sep { font-size: 32px; color: #9CA3AF; }
    .marks-total { font-size: 32px; font-weight: 600; color: #6B7280; }
    .marks-label { font-size: 13px; color: #6B7280; margin-top: 8px; }
    .btn-wrapper { text-align: center; margin: 28px 0; }
    .btn { display: inline-block; background: linear-gradient(135deg, #1E3A5F, #2D5F8B); color: #fff !important; text-decoration: none; padding: 13px 36px; border-radius: 8px; font-size: 15px; font-weight: 600; }
    .info-box { background: #F0FDF4; border-left: 4px solid #10B981; padding: 12px 16px; border-radius: 4px; margin: 16px 0; font-size: 13px; color: #065F46; }
    .footer { background: #F9FAFB; padding: 20px 32px; text-align: center; }
    .footer p { font-size: 12px; color: #9CA3AF; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="icon">📊</div>
      <h1>Mid-Term Marks Available</h1>
      <p>${universityName} - IRAS</p>
    </div>
    <div class="body">
      <p class="greeting">Dear ${firstName},</p>
      <p class="text">Your mid-term examination marks have been recorded by your teacher. You can view your marks below:</p>
      <div class="marks-card">
        <p class="course-name">${courseName}</p>
        <p class="course-code">Course Code: ${courseCode}</p>
        <div class="marks-display">
          <span class="marks-value">${midTermMarks}</span>
          <span class="marks-sep">/</span>
          <span class="marks-total">${midTermTotal}</span>
        </div>
        <p class="marks-label">Mid-Term Marks</p>
      </div>
      <div class="info-box">
        ℹ️ Internal and Final Term marks will be available after your teacher completes the assessment.
      </div>
      <div class="btn-wrapper">
        <a href="${dashboardUrl}" class="btn">📱 View in Dashboard</a>
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

export const finalsMarksTemplate = ({
  firstName,
  courseName,
  courseCode,
  midTermMarks,
  midTermTotal,
  internalMarks,
  internalTotal,
  finalTermMarks,
  finalTermTotal,
  totalMarks,
  totalTotal,
  percentage,
  grade,
  universityName,
  dashboardUrl,
}) => {
  const gradeColor =
    ['A', 'A-'].includes(grade)
      ? '#10B981'
      : ['B+', 'B', 'B-'].includes(grade)
      ? '#3B82F6'
      : ['C+', 'C', 'C-'].includes(grade)
      ? '#F59E0B'
      : grade === 'D'
      ? '#F97316'
      : '#EF4444';

  return {
    subject: `Complete Marks Available - ${courseCode} | ${universityName}`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Complete Marks</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f0f4f8; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #1E3A5F 0%, #2D5F8B 100%); padding: 32px; text-align: center; }
    .header h1 { color: #fff; font-size: 22px; font-weight: 700; margin-top: 8px; }
    .header p { color: rgba(255,255,255,0.8); font-size: 14px; }
    .icon { font-size: 40px; }
    .body { padding: 36px 32px; }
    .greeting { font-size: 18px; font-weight: 600; color: #1E3A5F; margin-bottom: 12px; }
    .text { font-size: 15px; color: #4B5563; line-height: 1.7; margin-bottom: 20px; }
    .marks-card { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 24px; margin: 24px 0; }
    .course-header { text-align: center; margin-bottom: 20px; }
    .course-name { font-size: 18px; font-weight: 700; color: #1E3A5F; }
    .course-code { font-size: 13px; color: #6B7280; }
    .marks-table { width: 100%; border-collapse: collapse; }
    .marks-table th { background: #1E3A5F; color: #fff; padding: 10px 14px; font-size: 13px; text-align: left; }
    .marks-table td { padding: 10px 14px; font-size: 14px; color: #374151; border-bottom: 1px solid #E5E7EB; }
    .marks-table tr:last-child td { border-bottom: none; font-weight: 700; background: #EFF6FF; }
    .grade-badge { display: inline-block; padding: 4px 16px; border-radius: 20px; font-size: 14px; font-weight: 700; color: #fff; background: ${gradeColor}; }
    .summary-row { display: flex; justify-content: space-between; align-items: center; background: linear-gradient(135deg, #EFF6FF, #DBEAFE); border-radius: 8px; padding: 16px 20px; margin-top: 16px; }
    .summary-item { text-align: center; }
    .summary-value { font-size: 24px; font-weight: 800; color: #1E3A5F; }
    .summary-label { font-size: 12px; color: #6B7280; margin-top: 2px; }
    .pending-note { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 12px 16px; border-radius: 4px; margin: 16px 0; font-size: 13px; color: #92400E; }
    .btn-wrapper { text-align: center; margin: 28px 0; }
    .btn { display: inline-block; background: linear-gradient(135deg, #1E3A5F, #2D5F8B); color: #fff !important; text-decoration: none; padding: 13px 36px; border-radius: 8px; font-size: 15px; font-weight: 600; }
    .footer { background: #F9FAFB; padding: 20px 32px; text-align: center; }
    .footer p { font-size: 12px; color: #9CA3AF; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="icon">🎯</div>
      <h1>Complete Marks Available</h1>
      <p>${universityName} - IRAS</p>
    </div>
    <div class="body">
      <p class="greeting">Dear ${firstName},</p>
      <p class="text">Your complete marks for the following course have been recorded and are pending HoD approval:</p>
      <div class="marks-card">
        <div class="course-header">
          <p class="course-name">${courseName}</p>
          <p class="course-code">Course Code: ${courseCode}</p>
        </div>
        <table class="marks-table">
          <tr>
            <th>Component</th>
            <th>Obtained</th>
            <th>Total</th>
          </tr>
          <tr>
            <td>Mid-Term</td>
            <td>${midTermMarks}</td>
            <td>${midTermTotal}</td>
          </tr>
          <tr>
            <td>Internal</td>
            <td>${internalMarks}</td>
            <td>${internalTotal}</td>
          </tr>
          <tr>
            <td>Final Term</td>
            <td>${finalTermMarks}</td>
            <td>${finalTermTotal}</td>
          </tr>
          <tr>
            <td><strong>Total</strong></td>
            <td><strong>${totalMarks}</strong></td>
            <td><strong>${totalTotal}</strong></td>
          </tr>
        </table>
        <div class="summary-row">
          <div class="summary-item">
            <div class="summary-value">${percentage}%</div>
            <div class="summary-label">Percentage</div>
          </div>
          <div class="summary-item">
            <div class="grade-badge">${grade}</div>
            <div class="summary-label" style="margin-top: 4px;">Grade</div>
          </div>
          <div class="summary-item">
            <div class="summary-value">${totalMarks}/${totalTotal}</div>
            <div class="summary-label">Marks Obtained</div>
          </div>
        </div>
      </div>
      <div class="pending-note">
        ⏳ These marks are currently <strong>pending HoD approval</strong>. Your official result will be confirmed after approval.
      </div>
      <div class="btn-wrapper">
        <a href="${dashboardUrl}" class="btn">📱 View in Dashboard</a>
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