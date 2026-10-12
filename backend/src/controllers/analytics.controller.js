import StudentProfile from '../models/StudentProfile.model.js';
import SemesterResult from '../models/SemesterResult.model.js';
import Institute from '../models/Institute.model.js';
import Department from '../models/Department.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../middleware/asyncHandler.middleware.js';
import { HTTP_STATUS, ROLES, ENROLLMENT_STATUS } from '../utils/constants.js';
import {
  getAdminOverviewAnalytics,
  getHoDAnalytics,
  getTeacherAnalytics,
  getStudentAnalytics,
  getResultDistributionAnalytics,
  getGPATrendsAnalytics,
} from '../services/analytics.service.js';

// ─── ADMIN OVERVIEW ───────────────────────────────────────────
export const getAdminOverview = asyncHandler(async (req, res, next) => {
  const analytics = await getAdminOverviewAnalytics();

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      { analytics },
      'Admin analytics fetched successfully'
    )
  );
});

// ─── HOD OVERVIEW ─────────────────────────────────────────────
export const getHoDOverview = asyncHandler(async (req, res, next) => {
  const departmentId =
    req.user.role === ROLES.HOD
      ? req.user.department?._id
      : req.query.departmentId;

  if (!departmentId) {
    return next(
      new ApiError(HTTP_STATUS.BAD_REQUEST, 'Department ID is required')
    );
  }

  const analytics = await getHoDAnalytics(departmentId);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      { analytics },
      'HoD analytics fetched successfully'
    )
  );
});

// ─── TEACHER OVERVIEW ─────────────────────────────────────────
export const getTeacherOverview = asyncHandler(async (req, res, next) => {
  const teacherId =
    req.user.role === ROLES.TEACHER ? req.user._id : req.query.teacherId;

  if (!teacherId) {
    return next(
      new ApiError(HTTP_STATUS.BAD_REQUEST, 'Teacher ID is required')
    );
  }

  const analytics = await getTeacherAnalytics(teacherId);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      { analytics },
      'Teacher analytics fetched successfully'
    )
  );
});

// ─── STUDENT OVERVIEW ─────────────────────────────────────────
export const getStudentOverview = asyncHandler(async (req, res, next) => {
  let profileId;

  if (req.user.role === ROLES.STUDENT) {
    const profile = await StudentProfile.findOne({
      user: req.user._id,
    }).lean();
    if (!profile) {
      return next(
        new ApiError(HTTP_STATUS.NOT_FOUND, 'Student profile not found')
      );
    }
    profileId = profile._id;
  } else {
    profileId = req.query.studentId;
    if (!profileId) {
      return next(
        new ApiError(HTTP_STATUS.BAD_REQUEST, 'Student ID is required')
      );
    }
  }

  const analytics = await getStudentAnalytics(profileId);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      { analytics },
      'Student analytics fetched successfully'
    )
  );
});

// ─── RESULT DISTRIBUTION ──────────────────────────────────────
export const getResultDistribution = asyncHandler(async (req, res, next) => {
  const { departmentId, semester, sessionId } = req.query;

  const deptId =
    req.user.role === ROLES.HOD
      ? req.user.department?._id?.toString()
      : departmentId;

  const analytics = await getResultDistributionAnalytics({
    departmentId: deptId,
    semester,
    sessionId,
  });

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      { analytics },
      'Result distribution analytics fetched successfully'
    )
  );
});

// ─── GPA TRENDS ───────────────────────────────────────────────
export const getGPATrends = asyncHandler(async (req, res, next) => {
  const { departmentId, sessionId } = req.query;

  const deptId =
    req.user.role === ROLES.HOD
      ? req.user.department?._id?.toString()
      : departmentId;

  const analytics = await getGPATrendsAnalytics({
    departmentId: deptId,
    sessionId,
  });

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      { analytics },
      'GPA trends analytics fetched successfully'
    )
  );
});

// ─── STUDENT PERFORMANCE ──────────────────────────────────────
export const getStudentPerformance = asyncHandler(async (req, res, next) => {
  const { departmentId, sessionId, semester } = req.query;

  const deptId =
    req.user.role === ROLES.HOD
      ? req.user.department?._id?.toString()
      : departmentId;

  if (!deptId) {
    return next(
      new ApiError(HTTP_STATUS.BAD_REQUEST, 'Department ID is required')
    );
  }

  const matchFilter = { department: deptId, isPublished: true };
  if (sessionId) matchFilter.session = sessionId;
  if (semester) matchFilter.semester = parseInt(semester);

  // ✅ CORRECT: Using SemesterResult directly from top-level static import
  const performance = await SemesterResult.aggregate([
    { $match: matchFilter },
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
        studentName: {
          $concat: ['$user.firstName', ' ', '$user.lastName'],
        },
        rollNumber: '$studentProfile.rollNumber',
        avatar: '$user.avatar',
        semester: 1,
        semesterGPA: 1,
        cumulativeGPA: 1,
        totalCoursesPassed: 1,
        totalCoursesFailed: 1,
        totalCreditHoursEarned: 1,
      },
    },
    { $sort: { cumulativeGPA: -1 } },
  ]);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      { performance },
      'Student performance analytics fetched successfully'
    )
  );
});

// ─── INSTITUTE ANALYTICS ──────────────────────────────────────
export const getInstituteAnalytics = asyncHandler(async (req, res, next) => {
  const { instituteId } = req.params;

  // ✅ CORRECT: Using Institute directly from top-level static import
  const institute = await Institute.findById(instituteId);

  if (!institute) {
    return next(
      new ApiError(HTTP_STATUS.NOT_FOUND, 'Institute not found')
    );
  }

  // ✅ CORRECT: Using Department directly from top-level static import
  // ✅ CORRECT: Using ENROLLMENT_STATUS.ACTIVE and ROLES.TEACHER from constants
  //            instead of hardcoded strings 'active' and 'teacher'
  const departmentAnalytics = await Department.aggregate([
    { $match: { institute: institute._id } },
    {
      $lookup: {
        from: 'studentprofiles',
        localField: '_id',
        foreignField: 'department',
        as: 'students',
        pipeline: [
          { $match: { enrollmentStatus: ENROLLMENT_STATUS.ACTIVE } },
        ],
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: 'department',
        as: 'teachers',
        pipeline: [
          { $match: { role: ROLES.TEACHER, isActive: true } },
        ],
      },
    },
    {
      $lookup: {
        from: 'programs',
        localField: '_id',
        foreignField: 'department',
        as: 'programs',
        pipeline: [{ $match: { isActive: true } }],
      },
    },
    {
      $project: {
        name: 1,
        code: 1,
        isActive: 1,
        totalStudents: { $size: '$students' },
        totalTeachers: { $size: '$teachers' },
        totalPrograms: { $size: '$programs' },
        avgCGPA: {
          $round: [{ $avg: '$students.cumulativeGPA' }, 2],
        },
      },
    },
    { $sort: { totalStudents: -1 } },
  ]);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        institute: {
          _id: institute._id,
          name: institute.name,
          code: institute.code,
        },
        departmentAnalytics,
      },
      'Institute analytics fetched successfully'
    )
  );
});