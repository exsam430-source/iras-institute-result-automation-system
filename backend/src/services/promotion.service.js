import StudentProfile from '../models/StudentProfile.model.js';
import SemesterResult from '../models/SemesterResult.model.js';
import CourseAssignment from '../models/CourseAssignment.model.js';
import Marks from '../models/Marks.model.js';
import User from '../models/User.model.js';
import {
  ASSIGNMENT_STATUS,
  MARKS_PHASE,
  ENROLLMENT_STATUS,
} from '../utils/constants.js';

// ─── CHECK PROMOTION ELIGIBILITY ─────────────────────────────
export const checkPromotionEligibility = async ({
  semester,
  sessionId,
  departmentId,
}) => {
  // Check all course assignments are approved
  const totalAssignments = await CourseAssignment.countDocuments({
    session: sessionId,
    semester: parseInt(semester),
    department: departmentId,
  });

  const approvedAssignments = await CourseAssignment.countDocuments({
    session: sessionId,
    semester: parseInt(semester),
    department: departmentId,
    status: ASSIGNMENT_STATUS.APPROVED,
  });

  const pendingAssignments = totalAssignments - approvedAssignments;

  // Check all semester results are published
  const totalStudents = await StudentProfile.countDocuments({
    session: sessionId,
    department: departmentId,
    currentSemester: parseInt(semester),
    enrollmentStatus: ENROLLMENT_STATUS.ACTIVE,
  });

  const publishedResults = await SemesterResult.countDocuments({
    session: sessionId,
    department: departmentId,
    semester: parseInt(semester),
    isPublished: true,
  });

  const unpublishedResults = totalStudents - publishedResults;

  const isEligible =
    pendingAssignments === 0 && unpublishedResults === 0;

  return {
    isEligible,
    totalAssignments,
    approvedAssignments,
    pendingAssignments,
    totalStudents,
    publishedResults,
    unpublishedResults,
    issues: [
      ...(pendingAssignments > 0
        ? [
            `${pendingAssignments} course result(s) not yet approved by HoD`,
          ]
        : []),
      ...(unpublishedResults > 0
        ? [
            `${unpublishedResults} student result(s) not yet published`,
          ]
        : []),
    ],
  };
};

// ─── PREVIEW PROMOTION ────────────────────────────────────────
export const previewPromotion = async ({
  semester,
  sessionId,
  departmentId,
}) => {
  const students = await StudentProfile.find({
    session: sessionId,
    department: departmentId,
    currentSemester: parseInt(semester),
    enrollmentStatus: ENROLLMENT_STATUS.ACTIVE,
  })
    .populate('user', 'firstName lastName email')
    .populate('program', 'name code totalSemesters')
    .lean();

  const preview = [];

  for (const student of students) {
    const semesterResult = await SemesterResult.findOne({
      student: student._id,
      semester: parseInt(semester),
      session: sessionId,
      isPublished: true,
    })
      .populate('courses.course', 'name code creditHours')
      .lean();

    const isFinalSemester =
      student.program?.totalSemesters === parseInt(semester);

    const failedCourses = semesterResult
      ? semesterResult.courses.filter((c) => !c.isPassed)
      : [];

    preview.push({
      studentId: student._id,
      rollNumber: student.rollNumber,
      studentName: `${student.user?.firstName} ${student.user?.lastName}`,
      currentSemester: student.currentSemester,
      nextSemester: isFinalSemester
        ? null
        : student.currentSemester + 1,
      semesterGPA: semesterResult?.semesterGPA || 0,
      cumulativeGPA: semesterResult?.cumulativeGPA || 0,
      totalCourses: semesterResult?.totalCoursesAttempted || 0,
      passedCourses: semesterResult?.totalCoursesPassed || 0,
      failedCourses: failedCourses.length,
      failedCoursesList: failedCourses.map((c) => ({
        code: c.courseCode,
        name: c.courseName,
        grade: c.grade,
        marks: c.totalMarks,
      })),
      action: isFinalSemester
        ? 'MARK_AS_GRADUATED'
        : 'PROMOTE_TO_NEXT_SEMESTER',
      hasFailedCourses: failedCourses.length > 0,
      isFinalSemester,
    });
  }

  return {
    preview,
    summary: {
      totalStudents: preview.length,
      studentsWithAllPassed: preview.filter((p) => !p.hasFailedCourses)
        .length,
      studentsWithFailedCourses: preview.filter((p) => p.hasFailedCourses)
        .length,
      finalSemesterStudents: preview.filter((p) => p.isFinalSemester).length,
      avgSemesterGPA:
        preview.length > 0
          ? Math.round(
              (preview.reduce((s, p) => s + p.semesterGPA, 0) /
                preview.length) *
                100
            ) / 100
          : 0,
    },
  };
};

// ─── EXECUTE PROMOTION ────────────────────────────────────────
export const executePromotion = async ({
  semester,
  sessionId,
  departmentId,
  promotedBy,
}) => {
  const students = await StudentProfile.find({
    session: sessionId,
    department: departmentId,
    currentSemester: parseInt(semester),
    enrollmentStatus: ENROLLMENT_STATUS.ACTIVE,
  })
    .populate('user', 'firstName lastName email')
    .populate('program', 'name code totalSemesters')
    .lean();

  const promotionResults = {
    promoted: [],
    graduated: [],
    failed: [],
    total: students.length,
  };

  for (const student of students) {
    try {
      const semesterResult = await SemesterResult.findOne({
        student: student._id,
        semester: parseInt(semester),
        session: sessionId,
        isPublished: true,
      }).lean();

      if (!semesterResult) {
        promotionResults.failed.push({
          studentId: student._id,
          rollNumber: student.rollNumber,
          reason: 'No published semester result found',
        });
        continue;
      }

      const isFinalSemester =
        student.program?.totalSemesters === parseInt(semester);

      const failedCourses = semesterResult.courses.filter(
        (c) => !c.isPassed
      );

      // Update semester record status
      await SemesterResult.findByIdAndUpdate(semesterResult._id, {
        status: 'promoted',
        promotedAt: new Date(),
      });

      // Update student profile
      const profileUpdateData = {
        $set: {
          cumulativeGPA: semesterResult.cumulativeGPA,
          totalCreditHoursAttempted: semesterResult.totalCreditHoursAttempted,
          totalCreditHoursEarned: semesterResult.totalCreditHoursEarned,
          totalQualityPoints: semesterResult.totalQualityPoints,
        },
        $push: {
          semesterRecords: {
            semester: parseInt(semester),
            session: sessionId,
            gpa: semesterResult.semesterGPA,
            cgpa: semesterResult.cumulativeGPA,
            totalCreditsAttempted: semesterResult.totalCreditHoursAttempted,
            totalCreditsEarned: semesterResult.totalCreditHoursEarned,
            coursesAttempted: semesterResult.totalCoursesAttempted,
            coursesPassed: semesterResult.totalCoursesPassed,
            coursesFailed: semesterResult.totalCoursesFailed,
            status: 'promoted',
            promotedAt: new Date(),
            promotedBy,
          },
        },
      };

      if (isFinalSemester) {
        // Mark as awaiting graduation
        profileUpdateData.$set.enrollmentStatus =
          ENROLLMENT_STATUS.AWAITING_GRADUATION;
      } else {
        // Promote to next semester
        profileUpdateData.$set.currentSemester =
          student.currentSemester + 1;
      }

      // Track failed courses
      for (const failedCourse of failedCourses) {
        const existingFailed = student.failedCourses?.find(
          (fc) =>
            fc.course?.toString() === failedCourse.course?.toString() &&
            !fc.isCleared
        );

        if (existingFailed) {
          // Increment attempt number
          await StudentProfile.updateOne(
            {
              _id: student._id,
              'failedCourses._id': existingFailed._id,
            },
            {
              $inc: { 'failedCourses.$.attemptNumber': 1 },
              $set: {
                'failedCourses.$.grade': failedCourse.grade,
                'failedCourses.$.marksObtained': failedCourse.totalMarks,
                'failedCourses.$.percentage': failedCourse.percentage,
              },
            }
          );
        } else {
          // Add new failed course
          await StudentProfile.updateOne(
            { _id: student._id },
            {
              $push: {
                failedCourses: {
                  course: failedCourse.course,
                  courseCode: failedCourse.courseCode,
                  courseName: failedCourse.courseName,
                  semester: parseInt(semester),
                  session: sessionId,
                  grade: failedCourse.grade,
                  marksObtained: failedCourse.totalMarks,
                  percentage: failedCourse.percentage,
                  attemptNumber: 1,
                  isCleared: false,
                },
              },
            }
          );
        }
      }

      await StudentProfile.findByIdAndUpdate(
        student._id,
        profileUpdateData,
        { runValidators: false }
      );

      if (isFinalSemester) {
        promotionResults.graduated.push({
          studentId: student._id,
          rollNumber: student.rollNumber,
          studentName: `${student.user?.firstName} ${student.user?.lastName}`,
          email: student.user?.email,
          semesterGPA: semesterResult.semesterGPA,
          cumulativeGPA: semesterResult.cumulativeGPA,
          failedCoursesCount: failedCourses.length,
        });
      } else {
        promotionResults.promoted.push({
          studentId: student._id,
          rollNumber: student.rollNumber,
          studentName: `${student.user?.firstName} ${student.user?.lastName}`,
          email: student.user?.email,
          fromSemester: parseInt(semester),
          toSemester: student.currentSemester + 1,
          semesterGPA: semesterResult.semesterGPA,
          cumulativeGPA: semesterResult.cumulativeGPA,
          failedCoursesCount: failedCourses.length,
          userId: student.user?._id,
        });
      }
    } catch (error) {
      promotionResults.failed.push({
        studentId: student._id,
        rollNumber: student.rollNumber,
        reason: error.message,
      });
    }
  }

  return promotionResults;
};