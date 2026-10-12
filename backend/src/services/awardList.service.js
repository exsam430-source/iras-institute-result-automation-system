import StudentProfile from '../models/StudentProfile.model.js';
import Marks from '../models/Marks.model.js';
import CourseAssignment from '../models/CourseAssignment.model.js';
import { MARKS_PHASE, ASSIGNMENT_STATUS } from '../utils/constants.js';

// ─── AUTO ENROLL STUDENTS ─────────────────────────────────────
// ─── AUTO ENROLL STUDENTS ─────────────────────────────────────
export const autoEnrollStudents = async (courseAssignment) => {
  const { department, session, semester, program } = courseAssignment;

  const students = await StudentProfile.find({
    department,
    session,
    program,
    currentSemester: semester,
    enrollmentStatus: 'active',
  })
    .select('_id rollNumber registrationNumber fatherName user')
    .populate('user', 'firstName lastName')
    .lean();

  // ✅ FIXED: Always return object, never undefined
  if (!students || students.length === 0) {
    return { enrolledStudents: [], students: [] };
  }

  const enrolledStudents = students.map((student) => ({
    student: student._id,
    enrolledAt: new Date(),
    isActive: true,
  }));

  return { enrolledStudents, students };
};

// ─── CREATE MARKS RECORDS FOR ENROLLED STUDENTS ───────────────
export const createMarksRecords = async (
  courseAssignment,
  students,
  course
) => {
  const marksRecords = [];

  for (const student of students) {
    // Check if marks record already exists
    const existing = await Marks.findOne({
      student: student._id,
      courseAssignment: courseAssignment._id,
    });

    if (!existing) {
      marksRecords.push({
        student: student._id,
        courseAssignment: courseAssignment._id,
        course: courseAssignment.course,
        teacher: courseAssignment.teacher,
        session: courseAssignment.session,
        department: courseAssignment.department,
        semester: courseAssignment.semester,
        midTerm: {
          obtained: null,
          total: course.marksDistribution?.midTerm || 20,
          isEntered: false,
          enteredAt: null,
          notifiedAt: null,
        },
        internal: {
          obtained: null,
          total: course.marksDistribution?.internal || 20,
          isEntered: false,
          enteredAt: null,
          notifiedAt: null,
        },
        finalTerm: {
          obtained: null,
          total: course.marksDistribution?.finalTerm || 60,
          isEntered: false,
          enteredAt: null,
          notifiedAt: null,
        },
        totalMarks: course.marksDistribution?.total || 100,
        marksPhase: MARKS_PHASE.NOT_STARTED,
        enteredBy: courseAssignment.assignedBy,
      });
    }
  }

  if (marksRecords.length > 0) {
    await Marks.insertMany(marksRecords, { ordered: false });
  }

  return marksRecords.length;
};

// ─── GENERATE AWARD LIST ──────────────────────────────────────
export const generateAwardList = async (courseAssignmentId) => {
  const assignment = await CourseAssignment.findById(courseAssignmentId)
    .populate('course', 'name code creditHours type marksDistribution semester')
    .populate('teacher', 'firstName lastName email')
    .populate('session', 'name startYear endYear')
    .populate('department', 'name code')
    .populate('institute', 'name code')
    .populate('program', 'name code')
    .lean();

  if (!assignment) {
    throw new Error('Course assignment not found');
  }

  // Get all enrolled students with their marks
  const enrolledStudentIds = assignment.enrolledStudents
    .filter((s) => s.isActive)
    .map((s) => s.student);

  // Fetch student profiles and marks in parallel
  const [studentProfiles, marksRecords] = await Promise.all([
    StudentProfile.find({ _id: { $in: enrolledStudentIds } })
      .populate('user', 'firstName lastName email')
      .populate('program', 'name code')
      .populate('session', 'name')
      .sort({ rollNumber: 1 })
      .lean(),
    Marks.find({ courseAssignment: courseAssignmentId })
      .lean(),
  ]);

  // Map marks by student ID for quick lookup
  const marksMap = {};
  marksRecords.forEach((mark) => {
    marksMap[mark.student.toString()] = mark;
  });

  // Build award list entries
  const entries = studentProfiles.map((student, index) => {
    const marks = marksMap[student._id.toString()];
    const user = student.user;

    return {
      serialNo: index + 1,
      studentId: student._id,
      marksId: marks?._id || null,
      rollNumber: student.rollNumber,
      registrationNumber: student.registrationNumber,
      studentName: user
        ? `${user.firstName} ${user.lastName}`
        : 'Unknown',
      fatherName: student.fatherName,
      program: student.program?.code || '',
      session: student.session?.name || '',

      // Marks data (progressive)
      midTermMarks: marks?.midTerm?.obtained ?? null,
      midTermTotal: marks?.midTerm?.total || 20,
      midTermEntered: marks?.midTerm?.isEntered || false,

      internalMarks: marks?.internal?.obtained ?? null,
      internalTotal: marks?.internal?.total || 20,
      internalEntered: marks?.internal?.isEntered || false,

      finalTermMarks: marks?.finalTerm?.obtained ?? null,
      finalTermTotal: marks?.finalTerm?.total || 60,
      finalTermEntered: marks?.finalTerm?.isEntered || false,

      totalMarks: marks?.totalObtained ?? null,
      totalTotal: marks?.totalMarks || 100,
      percentage: marks?.percentage ?? null,
      grade: marks?.grade ?? null,
      gradePoints: marks?.gradePoints ?? null,
      qualityPoints: marks?.qualityPoints ?? null,
      isPassed: marks?.isPassed ?? null,

      // Phase info
      marksPhase: marks?.marksPhase || MARKS_PHASE.NOT_STARTED,
      isApproved: marks?.marksPhase === MARKS_PHASE.APPROVED,

      // Display helpers
      remarks: marks?.isPassed === true
        ? 'Pass'
        : marks?.isPassed === false
        ? 'Fail'
        : 'Pending',

      lastUpdated: marks?.updatedAt || null,
    };
  });

  // Compute statistics (only from fully entered marks)
  const approvedEntries = entries.filter(
    (e) => e.marksPhase === MARKS_PHASE.APPROVED
  );
  const finalsEnteredEntries = entries.filter(
    (e) => [
      MARKS_PHASE.FINALS_ENTERED,
      MARKS_PHASE.SUBMITTED,
      MARKS_PHASE.APPROVED,
    ].includes(e.marksPhase) && e.totalMarks !== null
  );

  const statistics = computeAwardListStatistics(
    finalsEnteredEntries,
    entries.length
  );

  return {
    assignment: {
      _id: assignment._id,
      status: assignment.status,
      course: assignment.course,
      teacher: assignment.teacher,
      session: assignment.session,
      department: assignment.department,
      institute: assignment.institute,
      program: assignment.program,
      semester: assignment.semester,
      section: assignment.section,
      academicYear: assignment.academicYear,
      midTermSavedAt: assignment.midTermSavedAt,
      finalsSavedAt: assignment.finalsSavedAt,
      submittedAt: assignment.submittedAt,
      approvedAt: assignment.approvedAt,
      rejectedAt: assignment.rejectedAt,
      rejectionReason: assignment.rejectionReason,
    },
    entries,
    statistics,
    totalStudents: entries.length,
    marksEnteredCount: finalsEnteredEntries.length,
    midTermEnteredCount: entries.filter((e) => e.midTermEntered).length,
  };
};

// ─── COMPUTE AWARD LIST STATISTICS ───────────────────────────
export const computeAwardListStatistics = (entriesWithMarks, totalStudents) => {
  if (!entriesWithMarks || entriesWithMarks.length === 0) {
    return {
      totalStudents,
      marksEntered: 0,
      passedStudents: 0,
      failedStudents: 0,
      passRate: 0,
      averageMarks: 0,
      highestMarks: 0,
      lowestMarks: 0,
      gradeDistribution: {
        A: 0, 'A-': 0, 'B+': 0, B: 0, 'B-': 0,
        'C+': 0, C: 0, 'C-': 0, D: 0, F: 0,
      },
    };
  }

  const marksValues = entriesWithMarks
    .map((e) => e.totalMarks)
    .filter((m) => m !== null);

  const passedStudents = entriesWithMarks.filter((e) => e.isPassed).length;
  const failedStudents = entriesWithMarks.filter(
    (e) => e.isPassed === false
  ).length;

  const gradeDistribution = {
    A: 0, 'A-': 0, 'B+': 0, B: 0, 'B-': 0,
    'C+': 0, C: 0, 'C-': 0, D: 0, F: 0,
  };

  entriesWithMarks.forEach((entry) => {
    if (entry.grade && gradeDistribution.hasOwnProperty(entry.grade)) {
      gradeDistribution[entry.grade]++;
    }
  });

  return {
    totalStudents,
    marksEntered: entriesWithMarks.length,
    passedStudents,
    failedStudents,
    passRate:
      entriesWithMarks.length > 0
        ? Math.round((passedStudents / entriesWithMarks.length) * 100)
        : 0,
    averageMarks:
      marksValues.length > 0
        ? Math.round(
            (marksValues.reduce((a, b) => a + b, 0) / marksValues.length) * 100
          ) / 100
        : 0,
    highestMarks:
      marksValues.length > 0 ? Math.max(...marksValues) : 0,
    lowestMarks:
      marksValues.length > 0 ? Math.min(...marksValues) : 0,
    gradeDistribution,
  };
};

// ─── UPDATE ASSIGNMENT STATISTICS ────────────────────────────
export const updateAssignmentStatistics = async (courseAssignmentId) => {
  const marks = await Marks.find({
    courseAssignment: courseAssignmentId,
    marksPhase: {
      $in: [
        MARKS_PHASE.FINALS_ENTERED,
        MARKS_PHASE.SUBMITTED,
        MARKS_PHASE.APPROVED,
      ],
    },
  }).lean();

  const totalStudents = await Marks.countDocuments({
    courseAssignment: courseAssignmentId,
  });

  const statistics = computeAwardListStatistics(marks, totalStudents);

  await CourseAssignment.findByIdAndUpdate(courseAssignmentId, {
    statistics,
  });

  return statistics;
};