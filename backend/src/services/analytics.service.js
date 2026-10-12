import User from '../models/User.model.js';
import Institute from '../models/Institute.model.js';
import Department from '../models/Department.model.js';
import Program from '../models/Program.model.js';
import Session from '../models/Session.model.js';
import Course from '../models/Course.model.js';
import StudentProfile from '../models/StudentProfile.model.js';
import CourseAssignment from '../models/CourseAssignment.model.js';
import Marks from '../models/Marks.model.js';
import SemesterResult from '../models/SemesterResult.model.js';
import Notification from '../models/Notification.model.js';
import {
  ROLES,
  ASSIGNMENT_STATUS,
  MARKS_PHASE,
  ENROLLMENT_STATUS,
} from '../utils/constants.js';

// ─── ADMIN OVERVIEW ANALYTICS ─────────────────────────────────
export const getAdminOverviewAnalytics = async () => {
  const [
    totalInstitutes,
    totalDepartments,
    totalPrograms,
    totalCourses,
    totalUsers,
    totalStudents,
    totalTeachers,
    totalHoDs,
    activeStudents,
    totalAssignments,
    approvedResults,
    pendingResults,
    recentUsers,
    usersByRole,
    studentsByEnrollment,
    institutesBreakdown,
    monthlyRegistrations,
  ] = await Promise.all([
    Institute.countDocuments({ isActive: true }),
    Department.countDocuments({ isActive: true }),
    Program.countDocuments({ isActive: true }),
    Course.countDocuments({ isActive: true }),
    User.countDocuments(),
    User.countDocuments({ role: ROLES.STUDENT }),
    User.countDocuments({ role: ROLES.TEACHER }),
    User.countDocuments({ role: ROLES.HOD }),
    StudentProfile.countDocuments({
      enrollmentStatus: ENROLLMENT_STATUS.ACTIVE,
    }),
    CourseAssignment.countDocuments(),
    CourseAssignment.countDocuments({ status: ASSIGNMENT_STATUS.APPROVED }),
    CourseAssignment.countDocuments({
      status: {
        $in: [ASSIGNMENT_STATUS.SUBMITTED, ASSIGNMENT_STATUS.FINALS_SAVED],
      },
    }),
    User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('firstName lastName email role avatar createdAt isActive')
      .lean(),
    User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { role: '$_id', count: 1, _id: 0 } },
    ]),
    StudentProfile.aggregate([
      {
        $group: {
          _id: '$enrollmentStatus',
          count: { $sum: 1 },
        },
      },
      { $project: { status: '$_id', count: 1, _id: 0 } },
    ]),
    Institute.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'departments',
          localField: '_id',
          foreignField: 'institute',
          as: 'departments',
        },
      },
      {
        $lookup: {
          from: 'studentprofiles',
          localField: '_id',
          foreignField: 'institute',
          as: 'students',
          pipeline: [
            {
              $match: { enrollmentStatus: ENROLLMENT_STATUS.ACTIVE },
            },
          ],
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'institute',
          as: 'teachers',
          pipeline: [
            { $match: { role: ROLES.TEACHER, isActive: true } },
          ],
        },
      },
      {
        $project: {
          name: 1,
          code: 1,
          totalDepartments: { $size: '$departments' },
          totalStudents: { $size: '$students' },
          totalTeachers: { $size: '$teachers' },
        },
      },
    ]),
    User.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
          students: {
            $sum: {
              $cond: [{ $eq: ['$role', ROLES.STUDENT] }, 1, 0],
            },
          },
          teachers: {
            $sum: {
              $cond: [{ $eq: ['$role', ROLES.TEACHER] }, 1, 0],
            },
          },
        },
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 },
      {
        $project: {
          year: '$_id.year',
          month: '$_id.month',
          count: 1,
          students: 1,
          teachers: 1,
          _id: 0,
        },
      },
    ]),
  ]);

  return {
    overview: {
      totalInstitutes,
      totalDepartments,
      totalPrograms,
      totalCourses,
      totalUsers,
      totalStudents,
      activeStudents,
      totalTeachers,
      totalHoDs,
      totalAssignments,
      approvedResults,
      pendingResults,
    },
    recentUsers,
    usersByRole,
    studentsByEnrollment,
    institutesBreakdown,
    monthlyRegistrations: monthlyRegistrations.reverse(),
  };
};

// ─── HOD DEPARTMENT ANALYTICS ─────────────────────────────────
export const getHoDAnalytics = async (departmentId) => {
  const [
    totalTeachers,
    totalStudents,
    totalPrograms,
    totalCourses,
    totalAssignments,
    approvedResults,
    pendingApproval,
    semesterBreakdown,
    gradeDistribution,
    gpaDistribution,
    recentSubmissions,
    topPerformers,
    courseCompletionRate,
    sessionBreakdown,
  ] = await Promise.all([
    User.countDocuments({
      department: departmentId,
      role: ROLES.TEACHER,
      isActive: true,
    }),
    StudentProfile.countDocuments({
      department: departmentId,
      enrollmentStatus: ENROLLMENT_STATUS.ACTIVE,
    }),
    Program.countDocuments({ department: departmentId, isActive: true }),
    Course.countDocuments({ department: departmentId, isActive: true }),
    CourseAssignment.countDocuments({ department: departmentId }),
    CourseAssignment.countDocuments({
      department: departmentId,
      status: ASSIGNMENT_STATUS.APPROVED,
    }),
    CourseAssignment.countDocuments({
      department: departmentId,
      status: ASSIGNMENT_STATUS.SUBMITTED,
    }),
    StudentProfile.aggregate([
      {
        $match: {
          department: departmentId,
          enrollmentStatus: ENROLLMENT_STATUS.ACTIVE,
        },
      },
      { $group: { _id: '$currentSemester', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $project: { semester: '$_id', count: 1, _id: 0 } },
    ]),
    Marks.aggregate([
      {
        $match: {
          department: departmentId,
          marksPhase: MARKS_PHASE.APPROVED,
        },
      },
      { $group: { _id: '$grade', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $project: { grade: '$_id', count: 1, _id: 0 } },
    ]),
    SemesterResult.aggregate([
      {
        $match: {
          department: departmentId,
          isPublished: true,
        },
      },
      {
        $bucket: {
          groupBy: '$semesterGPA',
          boundaries: [0, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.01],
          default: 'Other',
          output: { count: { $sum: 1 } },
        },
      },
    ]),
    CourseAssignment.find({
      department: departmentId,
      status: ASSIGNMENT_STATUS.SUBMITTED,
    })
      .populate('course', 'name code')
      .populate('teacher', 'firstName lastName avatar')
      .sort({ submittedAt: -1 })
      .limit(5)
      .select('course teacher submittedAt statistics semester')
      .lean(),
    SemesterResult.aggregate([
      {
        $match: {
          department: departmentId,
          isPublished: true,
        },
      },
      { $sort: { cumulativeGPA: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'studentprofiles',
          localField: 'student',
          foreignField: '_id',
          as: 'studentProfile',
        },
      },
      { $unwind: '$studentProfile' },
      {
        $lookup: {
          from: 'users',
          localField: 'studentProfile.user',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          rollNumber: '$studentProfile.rollNumber',
          studentName: {
            $concat: ['$user.firstName', ' ', '$user.lastName'],
          },
          avatar: '$user.avatar',
          semesterGPA: 1,
          cumulativeGPA: 1,
          semester: 1,
        },
      },
    ]),
    CourseAssignment.aggregate([
      { $match: { department: departmentId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
      { $project: { status: '$_id', count: 1, _id: 0 } },
    ]),
    StudentProfile.aggregate([
      {
        $match: {
          department: departmentId,
          enrollmentStatus: ENROLLMENT_STATUS.ACTIVE,
        },
      },
      {
        $lookup: {
          from: 'sessions',
          localField: 'session',
          foreignField: '_id',
          as: 'sessionInfo',
        },
      },
      { $unwind: '$sessionInfo' },
      {
        $group: {
          _id: '$sessionInfo.name',
          count: { $sum: 1 },
          avgCGPA: { $avg: '$cumulativeGPA' },
        },
      },
      { $sort: { _id: -1 } },
      {
        $project: {
          session: '$_id',
          count: 1,
          avgCGPA: { $round: ['$avgCGPA', 2] },
          _id: 0,
        },
      },
    ]),
  ]);

  return {
    overview: {
      totalTeachers,
      totalStudents,
      totalPrograms,
      totalCourses,
      totalAssignments,
      approvedResults,
      pendingApproval,
    },
    semesterBreakdown,
    gradeDistribution,
    gpaDistribution,
    recentSubmissions,
    topPerformers,
    courseCompletionRate,
    sessionBreakdown,
  };
};

// ─── TEACHER ANALYTICS ────────────────────────────────────────
export const getTeacherAnalytics = async (teacherId) => {
  const [
    totalAssignments,
    pendingSubmission,
    submitted,
    approved,
    rejected,
    totalStudentsTaught,
    assignmentsByStatus,
    recentAssignments,
    gradeDistribution,
    avgPassRate,
  ] = await Promise.all([
    CourseAssignment.countDocuments({ teacher: teacherId }),
    CourseAssignment.countDocuments({
      teacher: teacherId,
      status: {
        $in: [
          ASSIGNMENT_STATUS.ASSIGNED,
          ASSIGNMENT_STATUS.AWARD_LIST_READY,
          ASSIGNMENT_STATUS.MIDTERM_SAVED,
          ASSIGNMENT_STATUS.FINALS_SAVED,
        ],
      },
    }),
    CourseAssignment.countDocuments({
      teacher: teacherId,
      status: ASSIGNMENT_STATUS.SUBMITTED,
    }),
    CourseAssignment.countDocuments({
      teacher: teacherId,
      status: ASSIGNMENT_STATUS.APPROVED,
    }),
    CourseAssignment.countDocuments({
      teacher: teacherId,
      status: ASSIGNMENT_STATUS.REJECTED,
    }),
    Marks.countDocuments({ teacher: teacherId }),
    CourseAssignment.aggregate([
      { $match: { teacher: teacherId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { status: '$_id', count: 1, _id: 0 } },
    ]),
    CourseAssignment.find({ teacher: teacherId })
      .populate('course', 'name code semester creditHours')
      .populate('session', 'name')
      .populate('department', 'name code')
      .sort({ createdAt: -1 })
      .limit(6)
      .select('course session department status semester statistics createdAt')
      .lean({ virtuals: true }),
    Marks.aggregate([
      {
        $match: {
          teacher: teacherId,
          marksPhase: MARKS_PHASE.APPROVED,
        },
      },
      { $group: { _id: '$grade', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $project: { grade: '$_id', count: 1, _id: 0 } },
    ]),
    CourseAssignment.aggregate([
      {
        $match: {
          teacher: teacherId,
          status: ASSIGNMENT_STATUS.APPROVED,
        },
      },
      {
        $group: {
          _id: null,
          avgPassRate: { $avg: '$statistics.passRate' },
          avgMarks: { $avg: '$statistics.averageMarks' },
          totalStudents: { $sum: '$statistics.totalStudents' },
        },
      },
      {
        $project: {
          avgPassRate: { $round: ['$avgPassRate', 1] },
          avgMarks: { $round: ['$avgMarks', 1] },
          totalStudents: 1,
          _id: 0,
        },
      },
    ]),
  ]);

  return {
    overview: {
      totalAssignments,
      pendingSubmission,
      submitted,
      approved,
      rejected,
      totalStudentsTaught,
    },
    assignmentsByStatus,
    recentAssignments,
    gradeDistribution,
    performance: avgPassRate[0] || {
      avgPassRate: 0,
      avgMarks: 0,
      totalStudents: 0,
    },
  };
};

// ─── STUDENT ANALYTICS ────────────────────────────────────────
export const getStudentAnalytics = async (studentProfileId) => {
  const [
    studentProfile,
    currentMarks,
    semesterResults,
    totalApprovedCourses,
    totalPassedCourses,
    totalFailedCourses,
    gpaProgression,
    gradeDistribution,
    unreadNotifications,
  ] = await Promise.all([
    StudentProfile.findById(studentProfileId)
      .populate('program', 'name code degreeType totalSemesters')
      .populate('session', 'name startYear endYear')
      .populate('department', 'name code')
      .populate('institute', 'name code')
      .lean({ virtuals: true }),
    Marks.find({
      student: studentProfileId,
      semester: (
        await StudentProfile.findById(studentProfileId).select(
          'currentSemester'
        )
      )?.currentSemester,
    })
      .populate('course', 'name code creditHours')
      .select(
        'midTerm internal finalTerm totalObtained percentage grade isPassed marksPhase course'
      )
      .lean(),
    SemesterResult.find({
      student: studentProfileId,
      isPublished: true,
    })
      .select(
        'semester semesterGPA cumulativeGPA totalCoursesPassed totalCoursesFailed totalCreditHoursEarned status'
      )
      .populate('session', 'name')
      .sort({ semester: 1 })
      .lean(),
    Marks.countDocuments({
      student: studentProfileId,
      marksPhase: MARKS_PHASE.APPROVED,
    }),
    Marks.countDocuments({
      student: studentProfileId,
      marksPhase: MARKS_PHASE.APPROVED,
      isPassed: true,
    }),
    Marks.countDocuments({
      student: studentProfileId,
      marksPhase: MARKS_PHASE.APPROVED,
      isPassed: false,
    }),
    SemesterResult.find({
      student: studentProfileId,
      isPublished: true,
    })
      .select('semester semesterGPA cumulativeGPA')
      .sort({ semester: 1 })
      .lean(),
    Marks.aggregate([
      {
        $match: {
          student: studentProfileId,
          marksPhase: MARKS_PHASE.APPROVED,
        },
      },
      { $group: { _id: '$grade', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $project: { grade: '$_id', count: 1, _id: 0 } },
    ]),
    Notification.getUnreadCount(
      studentProfile?.user || studentProfileId
    ),
  ]);

  const completionPercentage = studentProfile?.program?.totalSemesters
    ? Math.round(
        ((studentProfile.currentSemester - 1) /
          studentProfile.program.totalSemesters) *
          100
      )
    : 0;

  return {
    overview: {
      rollNumber: studentProfile?.rollNumber,
      currentSemester: studentProfile?.currentSemester,
      totalSemesters: studentProfile?.program?.totalSemesters,
      cumulativeGPA: studentProfile?.cumulativeGPA,
      totalCreditHoursEarned: studentProfile?.totalCreditHoursEarned,
      totalCreditHoursAttempted: studentProfile?.totalCreditHoursAttempted,
      enrollmentStatus: studentProfile?.enrollmentStatus,
      completionPercentage,
      totalApprovedCourses,
      totalPassedCourses,
      totalFailedCourses,
      activeFailedCourses: studentProfile?.activeFailedCoursesCount || 0,
      unreadNotifications,
    },
    currentSemesterMarks: currentMarks,
    semesterResults,
    gpaProgression,
    gradeDistribution,
    academicInfo: {
      program: studentProfile?.program?.name,
      programCode: studentProfile?.program?.code,
      department: studentProfile?.department?.name,
      institute: studentProfile?.institute?.name,
      session: studentProfile?.session?.name,
    },
  };
};

// ─── RESULT DISTRIBUTION ANALYTICS ───────────────────────────
export const getResultDistributionAnalytics = async ({
  departmentId,
  semester,
  sessionId,
}) => {
  const matchFilter = {};
  if (departmentId) matchFilter.department = departmentId;
  if (semester) matchFilter.semester = parseInt(semester);
  if (sessionId) matchFilter.session = sessionId;
  matchFilter.marksPhase = MARKS_PHASE.APPROVED;

  const [gradeDistribution, passFailRatio, averageByComponent] =
    await Promise.all([
      Marks.aggregate([
        { $match: matchFilter },
        { $group: { _id: '$grade', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
        { $project: { grade: '$_id', count: 1, _id: 0 } },
      ]),
      Marks.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: '$isPassed',
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            status: {
              $cond: [{ $eq: ['$_id', true] }, 'Passed', 'Failed'],
            },
            count: 1,
            _id: 0,
          },
        },
      ]),
      Marks.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: null,
            avgMidTerm: { $avg: '$midTerm.obtained' },
            avgInternal: { $avg: '$internal.obtained' },
            avgFinalTerm: { $avg: '$finalTerm.obtained' },
            avgTotal: { $avg: '$totalObtained' },
            avgPercentage: { $avg: '$percentage' },
          },
        },
        {
          $project: {
            avgMidTerm: { $round: ['$avgMidTerm', 2] },
            avgInternal: { $round: ['$avgInternal', 2] },
            avgFinalTerm: { $round: ['$avgFinalTerm', 2] },
            avgTotal: { $round: ['$avgTotal', 2] },
            avgPercentage: { $round: ['$avgPercentage', 2] },
            _id: 0,
          },
        },
      ]),
    ]);

  return {
    gradeDistribution,
    passFailRatio,
    averageByComponent: averageByComponent[0] || {},
  };
};

// ─── GPA TRENDS ANALYTICS ─────────────────────────────────────
export const getGPATrendsAnalytics = async ({ departmentId, sessionId }) => {
  const matchFilter = { isPublished: true };
  if (departmentId) matchFilter.department = departmentId;
  if (sessionId) matchFilter.session = sessionId;

  const gpaTrends = await SemesterResult.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: '$semester',
        avgGPA: { $avg: '$semesterGPA' },
        avgCGPA: { $avg: '$cumulativeGPA' },
        minGPA: { $min: '$semesterGPA' },
        maxGPA: { $max: '$semesterGPA' },
        totalStudents: { $sum: 1 },
        passedAll: {
          $sum: {
            $cond: [{ $eq: ['$totalCoursesFailed', 0] }, 1, 0],
          },
        },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        semester: '$_id',
        avgGPA: { $round: ['$avgGPA', 2] },
        avgCGPA: { $round: ['$avgCGPA', 2] },
        minGPA: { $round: ['$minGPA', 2] },
        maxGPA: { $round: ['$maxGPA', 2] },
        totalStudents: 1,
        passedAll: 1,
        passRate: {
          $round: [
            {
              $multiply: [
                { $divide: ['$passedAll', '$totalStudents'] },
                100,
              ],
            },
            1,
          ],
        },
        _id: 0,
      },
    },
  ]);

  return { gpaTrends };
};