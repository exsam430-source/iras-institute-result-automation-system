import Notification from '../models/Notification.model.js';
import { NOTIFICATION_TYPES } from '../utils/constants.js';
import { sendToUser } from '../config/socket.js';
import {
  sendMidTermMarksEmail,
  sendFinalsMarksEmail,
  sendResultApprovedEmail,
  sendResultRejectedEmail,
  sendPromotionEmail,
} from './email.service.js';

// ─── CREATE SINGLE NOTIFICATION ───────────────────────────────
export const createNotification = async ({
  recipientId,
  senderId,
  type,
  title,
  message,
  data = {},
  priority = 'medium',
  sendEmail = false,
  emailData = null,
}) => {
  try {
    const notification = await Notification.create({
      recipient: recipientId,
      sender: senderId || null,
      type,
      title,
      message,
      data,
      priority,
    });

    // Send real-time notification via Socket.IO
    sendToUser(recipientId.toString(), 'notification:new', {
      _id: notification._id,
      type,
      title,
      message,
      data,
      priority,
      isRead: false,
      createdAt: notification.createdAt,
    });

    // Send email if requested
    if (sendEmail && emailData) {
      sendEmailNotification(type, emailData).catch(() => {
        // Non-blocking email failures
      });
    }

    return notification;
  } catch (error) {
    console.error('Notification creation error:', error);
    return null;
  }
};

// ─── CREATE BULK NOTIFICATIONS ────────────────────────────────
export const createBulkNotifications = async (notifications) => {
  try {
    const created = await Notification.createBulk(notifications);

    // Send real-time notifications
    notifications.forEach((notif) => {
      sendToUser(notif.recipient.toString(), 'notification:new', {
        type: notif.type,
        title: notif.title,
        message: notif.message,
        data: notif.data || {},
        priority: notif.priority || 'medium',
        isRead: false,
        createdAt: new Date(),
      });
    });

    return created;
  } catch (error) {
    console.error('Bulk notification error:', error);
    return [];
  }
};

// ─── NOTIFY MID-TERM MARKS ENTERED ───────────────────────────
export const notifyMidTermMarksEntered = async ({
  student,
  user,
  courseName,
  courseCode,
  midTermMarks,
  midTermTotal,
  courseAssignmentId,
  courseId,
  senderId,
}) => {
  const notification = await createNotification({
    recipientId: user._id,
    senderId,
    type: NOTIFICATION_TYPES.MIDTERM_MARKS_ENTERED,
    title: `Mid-Term Marks Available - ${courseCode}`,
    message: `Your mid-term marks for ${courseName} have been recorded: ${midTermMarks}/${midTermTotal}`,
    data: {
      courseAssignmentId,
      courseId,
      courseName,
      courseCode,
      midTermMarks,
      semester: student.currentSemester,
    },
    priority: 'high',
    sendEmail: true,
    emailData: { user, courseName, courseCode, midTermMarks, midTermTotal },
  });

  return notification;
};

// ─── NOTIFY FINALS MARKS ENTERED ─────────────────────────────
export const notifyFinalsMarksEntered = async ({
  student,
  user,
  courseName,
  courseCode,
  marksData,
  courseAssignmentId,
  courseId,
  senderId,
}) => {
  const notification = await createNotification({
    recipientId: user._id,
    senderId,
    type: NOTIFICATION_TYPES.FINALS_MARKS_ENTERED,
    title: `Complete Marks Available - ${courseCode}`,
    message: `Your marks for ${courseName}: Total ${marksData.totalMarks}/100, Grade: ${marksData.grade} (Pending Approval)`,
    data: {
      courseAssignmentId,
      courseId,
      courseName,
      courseCode,
      midTermMarks: marksData.midTerm,
      internalMarks: marksData.internal,
      finalTermMarks: marksData.finalTerm,
      totalMarks: marksData.totalMarks,
      percentage: marksData.percentage,
      grade: marksData.grade,
      semester: student.currentSemester,
    },
    priority: 'high',
    sendEmail: true,
    emailData: { user, courseName, courseCode, ...marksData },
  });

  return notification;
};

// ─── NOTIFY HOD: RESULT SUBMITTED ────────────────────────────
export const notifyHoDResultSubmitted = async ({
  hodUserId,
  teacherName,
  courseName,
  courseCode,
  semester,
  totalStudents,
  passRate,
  courseAssignmentId,
  courseId,
  senderId,
}) => {
  const notification = await createNotification({
    recipientId: hodUserId,
    senderId,
    type: NOTIFICATION_TYPES.RESULT_SUBMITTED_TO_HOD,
    title: `Result Submitted for Review - ${courseCode}`,
    message: `${teacherName} has submitted results for ${courseName} (Semester ${semester}). ${totalStudents} students | Pass Rate: ${passRate}%`,
    data: {
      courseAssignmentId,
      courseId,
      courseName,
      courseCode,
      semester,
      totalStudents,
      passRate,
    },
    priority: 'urgent',
  });

  return notification;
};

// ─── NOTIFY STUDENTS: RESULT APPROVED ────────────────────────
export const notifyStudentsResultApproved = async ({
  studentsData,
  courseName,
  courseCode,
  semester,
  courseAssignmentId,
  courseId,
  hodId,
}) => {
  const notifications = studentsData.map(({ userId, marksData }) => ({
    recipient: userId,
    sender: hodId,
    type: NOTIFICATION_TYPES.RESULT_APPROVED,
    title: `Result Officially Approved - ${courseCode}`,
    message: `Your result for ${courseName} has been officially approved. Grade: ${marksData.grade} | Total: ${marksData.totalObtained}/100`,
    data: {
      courseAssignmentId,
      courseId,
      courseName,
      courseCode,
      grade: marksData.grade,
      totalMarks: marksData.totalObtained,
      percentage: marksData.percentage,
      semester,
    },
    priority: 'high',
  }));

  const created = await createBulkNotifications(notifications);

  // Send emails asynchronously
  Promise.allSettled(
    studentsData.map(({ user, marksData }) =>
      sendResultApprovedEmail(user, {
        courseName,
        courseCode,
        grade: marksData.grade,
        totalMarks: marksData.totalObtained,
        totalTotal: 100,
        percentage: marksData.percentage,
        semester,
      })
    )
  ).catch(() => {});

  return created;
};

// ─── NOTIFY TEACHER: RESULT REJECTED ─────────────────────────
export const notifyTeacherResultRejected = async ({
  teacherUserId,
  teacherUser,
  courseName,
  courseCode,
  semester,
  rejectionReason,
  courseAssignmentId,
  courseId,
  hodId,
}) => {
  const notification = await createNotification({
    recipientId: teacherUserId,
    senderId: hodId,
    type: NOTIFICATION_TYPES.RESULT_REJECTED,
    title: `Result Returned for Correction - ${courseCode}`,
    message: `Your submitted result for ${courseName} (Semester ${semester}) has been returned. Reason: ${rejectionReason}`,
    data: {
      courseAssignmentId,
      courseId,
      courseName,
      courseCode,
      semester,
      rejectionReason,
    },
    priority: 'urgent',
    sendEmail: true,
  });

  // Send email
  sendResultRejectedEmail(teacherUser, {
    courseName,
    courseCode,
    semester,
    rejectionReason,
    courseAssignmentId,
  }).catch(() => {});

  return notification;
};

// ─── NOTIFY STUDENTS: SEMESTER PROMOTION ─────────────────────
export const notifyStudentsSemesterPromotion = async ({
  studentsPromotionData,
  hodId,
}) => {
  const notifications = studentsPromotionData.map(
    ({ userId, fromSemester, toSemester, semesterGPA, cumulativeGPA }) => ({
      recipient: userId,
      sender: hodId,
      type: NOTIFICATION_TYPES.SEMESTER_PROMOTED,
      title: `🎓 Promoted to Semester ${toSemester}!`,
      message: `Congratulations! You have been promoted from Semester ${fromSemester} to Semester ${toSemester}. Semester GPA: ${semesterGPA} | CGPA: ${cumulativeGPA}`,
      data: {
        fromSemester,
        toSemester,
        semesterGPA,
        cumulativeGPA,
        semester: toSemester,
      },
      priority: 'high',
    })
  );

  const created = await createBulkNotifications(notifications);

  // Send emails asynchronously
  Promise.allSettled(
    studentsPromotionData.map(({ user, ...promotionData }) =>
      sendPromotionEmail(user, promotionData)
    )
  ).catch(() => {});

  return created;
};

// ─── NOTIFY: COURSE ASSIGNED TO TEACHER ──────────────────────
export const notifyTeacherCourseAssigned = async ({
  teacherUserId,
  courseName,
  courseCode,
  semester,
  session,
  department,
  courseAssignmentId,
  hodId,
}) => {
  return createNotification({
    recipientId: teacherUserId,
    senderId: hodId,
    type: NOTIFICATION_TYPES.COURSE_ASSIGNED,
    title: `New Course Assigned - ${courseCode}`,
    message: `You have been assigned to teach ${courseName} (${courseCode}) for Semester ${semester}, Session ${session}. Department: ${department}`,
    data: {
      courseAssignmentId,
      courseName,
      courseCode,
      semester,
    },
    priority: 'high',
  });
};

// ─── SEND EMAIL BASED ON NOTIFICATION TYPE ────────────────────
const sendEmailNotification = async (type, emailData) => {
  switch (type) {
    case NOTIFICATION_TYPES.MIDTERM_MARKS_ENTERED:
      await sendMidTermMarksEmail(emailData.user, emailData);
      break;
    case NOTIFICATION_TYPES.FINALS_MARKS_ENTERED:
      await sendFinalsMarksEmail(emailData.user, emailData);
      break;
    default:
      break;
  }
};