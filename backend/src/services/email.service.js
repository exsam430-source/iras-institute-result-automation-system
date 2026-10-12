import { sendEmail } from '../config/email.js';
import { emailVerificationTemplate } from '../templates/emails/verification.template.js';
import { resetPasswordTemplate } from '../templates/emails/resetPassword.template.js';
import {
  midTermMarksTemplate,
  finalsMarksTemplate,
} from '../templates/emails/marksNotification.template.js';
import {
  resultApprovedTemplate,
  resultRejectedTeacherTemplate,
} from '../templates/emails/resultApproval.template.js';
import { semesterPromotionTemplate } from '../templates/emails/promotion.template.js';

const universityName =
  process.env.UNIVERSITY_NAME || 'University of Swat';
const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

// ─── SEND VERIFICATION EMAIL ──────────────────────────────────
export const sendVerificationEmail = async (user, token) => {
  const verificationUrl = `${clientUrl}/verify-email/${token}`;
  const template = emailVerificationTemplate({
    firstName: user.firstName,
    verificationUrl,
    universityName,
  });

  await sendEmail({
    to: user.email,
    subject: template.subject,
    html: template.html,
  });
};

// ─── SEND PASSWORD RESET EMAIL ────────────────────────────────
export const sendPasswordResetEmail = async (user, token) => {
  const resetUrl = `${clientUrl}/reset-password/${token}`;
  const template = resetPasswordTemplate({
    firstName: user.firstName,
    resetUrl,
    universityName,
  });

  await sendEmail({
    to: user.email,
    subject: template.subject,
    html: template.html,
  });
};

// ─── SEND MID-TERM MARKS EMAIL ────────────────────────────────
export const sendMidTermMarksEmail = async (user, marksData) => {
  const template = midTermMarksTemplate({
    firstName: user.firstName,
    courseName: marksData.courseName,
    courseCode: marksData.courseCode,
    midTermMarks: marksData.midTermMarks,
    midTermTotal: marksData.midTermTotal || 20,
    universityName,
    dashboardUrl: `${clientUrl}/student/results`,
  });

  await sendEmail({
    to: user.email,
    subject: template.subject,
    html: template.html,
  });
};

// ─── SEND FINALS MARKS EMAIL ──────────────────────────────────
export const sendFinalsMarksEmail = async (user, marksData) => {
  const template = finalsMarksTemplate({
    firstName: user.firstName,
    courseName: marksData.courseName,
    courseCode: marksData.courseCode,
    midTermMarks: marksData.midTermMarks,
    midTermTotal: marksData.midTermTotal || 20,
    internalMarks: marksData.internalMarks,
    internalTotal: marksData.internalTotal || 20,
    finalTermMarks: marksData.finalTermMarks,
    finalTermTotal: marksData.finalTermTotal || 60,
    totalMarks: marksData.totalMarks,
    totalTotal: marksData.totalTotal || 100,
    percentage: marksData.percentage,
    grade: marksData.grade,
    universityName,
    dashboardUrl: `${clientUrl}/student/results`,
  });

  await sendEmail({
    to: user.email,
    subject: template.subject,
    html: template.html,
  });
};

// ─── SEND RESULT APPROVED EMAIL ───────────────────────────────
export const sendResultApprovedEmail = async (user, resultData) => {
  const template = resultApprovedTemplate({
    firstName: user.firstName,
    courseName: resultData.courseName,
    courseCode: resultData.courseCode,
    grade: resultData.grade,
    totalMarks: resultData.totalMarks,
    totalTotal: resultData.totalTotal || 100,
    percentage: resultData.percentage,
    semester: resultData.semester,
    universityName,
    dashboardUrl: `${clientUrl}/student/results`,
  });

  await sendEmail({
    to: user.email,
    subject: template.subject,
    html: template.html,
  });
};

// ─── SEND RESULT REJECTED EMAIL (TO TEACHER) ─────────────────
export const sendResultRejectedEmail = async (teacher, rejectionData) => {
  const template = resultRejectedTeacherTemplate({
    firstName: teacher.firstName,
    courseName: rejectionData.courseName,
    courseCode: rejectionData.courseCode,
    semester: rejectionData.semester,
    rejectionReason: rejectionData.rejectionReason,
    universityName,
    dashboardUrl: `${clientUrl}/teacher/courses/${rejectionData.courseAssignmentId}`,
  });

  await sendEmail({
    to: teacher.email,
    subject: template.subject,
    html: template.html,
  });
};

// ─── SEND PROMOTION EMAIL ─────────────────────────────────────
export const sendPromotionEmail = async (user, promotionData) => {
  const template = semesterPromotionTemplate({
    firstName: user.firstName,
    fromSemester: promotionData.fromSemester,
    toSemester: promotionData.toSemester,
    semesterGPA: promotionData.semesterGPA,
    cumulativeGPA: promotionData.cumulativeGPA,
    totalCoursesPassed: promotionData.totalCoursesPassed,
    totalCoursesFailed: promotionData.totalCoursesFailed,
    universityName,
    dashboardUrl: `${clientUrl}/student/results/${promotionData.fromSemester}`,
  });

  await sendEmail({
    to: user.email,
    subject: template.subject,
    html: template.html,
  });
};

// ─── SEND BULK EMAILS ─────────────────────────────────────────
export const sendBulkEmails = async (emailsArray) => {
  const results = await Promise.allSettled(
    emailsArray.map(({ to, subject, html }) =>
      sendEmail({ to, subject, html })
    )
  );

  const succeeded = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  return { succeeded, failed, total: emailsArray.length };
};