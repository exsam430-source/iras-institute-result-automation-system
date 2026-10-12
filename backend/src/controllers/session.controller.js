import Session from '../models/Session.model.js';
import Program from '../models/Program.model.js';
import Department from '../models/Department.model.js';
import StudentProfile from '../models/StudentProfile.model.js';
import AuditLog from '../models/AuditLog.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../middleware/asyncHandler.middleware.js';
import { HTTP_STATUS } from '../utils/constants.js';
import { getPaginationMeta, parseSortString } from '../utils/helpers.js';

// ─── GET ALL SESSIONS ─────────────────────────────────────────
export const getAllSessions = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    limit = 10,
    department,
    institute,
    program,
    isActive,
    sort = '-startYear',
  } = req.query;

  const filter = {};
  if (department) filter.department = department;
  if (institute) filter.institute = institute;
  if (program) filter.program = program;
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [sessions, total] = await Promise.all([
    Session.find(filter)
      .populate('program', 'name code degreeType')
      .populate('department', 'name code')
      .populate('institute', 'name code')
      .populate('createdBy', 'firstName lastName')
      .populate('totalStudents')
      .sort(parseSortString(sort))
      .skip(skip)
      .limit(parseInt(limit))
      .lean({ virtuals: true }),
    Session.countDocuments(filter),
  ]);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        sessions,
        pagination: getPaginationMeta(total, page, limit),
      },
      'Sessions fetched successfully'
    )
  );
});

// ─── GET SINGLE SESSION ───────────────────────────────────────
export const getSessionById = asyncHandler(async (req, res, next) => {
  const session = await Session.findById(req.params.id)
    .populate('program', 'name code degreeType totalSemesters')
    .populate('department', 'name code hod')
    .populate('institute', 'name code logo')
    .populate('createdBy', 'firstName lastName')
    .lean({ virtuals: true });

  if (!session) {
    return next(new ApiError(HTTP_STATUS.NOT_FOUND, 'Session not found'));
  }

  // Get students and semester breakdown
  const [totalStudents, semesterBreakdown] = await Promise.all([
    StudentProfile.countDocuments({
      session: session._id,
      enrollmentStatus: 'active',
    }),
    StudentProfile.aggregate([
      { $match: { session: session._id } },
      {
        $group: {
          _id: '$currentSemester',
          count: { $sum: 1 },
          active: {
            $sum: {
              $cond: [{ $eq: ['$enrollmentStatus', 'active'] }, 1, 0],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { semester: '$_id', count: 1, active: 1, _id: 0 } },
    ]),
  ]);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        session: {
          ...session,
          stats: { totalStudents, semesterBreakdown },
        },
      },
      'Session fetched successfully'
    )
  );
});

// ─── CREATE SESSION ───────────────────────────────────────────
export const createSession = asyncHandler(async (req, res, next) => {
  const {
    startYear,
    endYear,
    program,
    department,
    institute,
    admissionDate,
    isCurrent,
  } = req.body;

  // Validate references
  const [programDoc, departmentDoc] = await Promise.all([
    Program.findById(program),
    Department.findById(department),
  ]);

  if (!programDoc) {
    return next(new ApiError(HTTP_STATUS.NOT_FOUND, 'Program not found'));
  }
  if (!departmentDoc) {
    return next(new ApiError(HTTP_STATUS.NOT_FOUND, 'Department not found'));
  }

  const sessionName = `${startYear}-${endYear}`;

  // Check uniqueness: name + program combination
  const existingSession = await Session.findOne({
    name: sessionName,
    program,
  });

  if (existingSession) {
    return next(
      new ApiError(
        HTTP_STATUS.CONFLICT,
        `Session '${sessionName}' already exists for this program`
      )
    );
  }

  // If setting as current, unset previous current session for same program
  if (isCurrent) {
    await Session.updateMany({ program, isCurrent: true }, { isCurrent: false });
  }

  const session = await Session.create({
    name: sessionName,
    startYear,
    endYear,
    program,
    department,
    institute,
    admissionDate,
    isCurrent: isCurrent || false,
    createdBy: req.user._id,
  });

  await session.populate([
    { path: 'program', select: 'name code degreeType' },
    { path: 'department', select: 'name code' },
    { path: 'institute', select: 'name code' },
  ]);

  await AuditLog.log({
    user: req.user._id,
    userSnapshot: {
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      role: req.user.role,
    },
    action: 'SESSION_CREATED',
    resource: 'session',
    resourceId: session._id,
    newData: { name: sessionName, program, department },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    description: `Session '${sessionName}' created`,
  });

  res.status(HTTP_STATUS.CREATED).json(
    new ApiResponse(
      HTTP_STATUS.CREATED,
      { session },
      'Session created successfully'
    )
  );
});

// ─── UPDATE SESSION ───────────────────────────────────────────
export const updateSession = asyncHandler(async (req, res, next) => {
  const { isActive, isCurrent, admissionDate, currentSemester } = req.body;
  const session = await Session.findById(req.params.id);

  if (!session) {
    return next(new ApiError(HTTP_STATUS.NOT_FOUND, 'Session not found'));
  }

  // If setting as current, unset others
  if (isCurrent === true) {
    await Session.updateMany(
      { program: session.program, isCurrent: true, _id: { $ne: session._id } },
      { isCurrent: false }
    );
  }

  if (isActive !== undefined) session.isActive = isActive;
  if (isCurrent !== undefined) session.isCurrent = isCurrent;
  if (admissionDate !== undefined) session.admissionDate = admissionDate;
  if (currentSemester !== undefined) session.currentSemester = currentSemester;

  await session.save();

  await session.populate([
    { path: 'program', select: 'name code' },
    { path: 'department', select: 'name code' },
  ]);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      { session },
      'Session updated successfully'
    )
  );
});

// ─── DELETE SESSION ───────────────────────────────────────────
export const deleteSession = asyncHandler(async (req, res, next) => {
  const session = await Session.findById(req.params.id);

  if (!session) {
    return next(new ApiError(HTTP_STATUS.NOT_FOUND, 'Session not found'));
  }

  const totalStudents = await StudentProfile.countDocuments({
    session: session._id,
  });

  if (totalStudents > 0) {
    return next(
      new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        `Cannot delete session with ${totalStudents} student(s) enrolled`
      )
    );
  }

  await session.deleteOne();

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, null, 'Session deleted successfully')
  );
});

// ─── GET SESSION STUDENTS ─────────────────────────────────────
export const getSessionStudents = asyncHandler(async (req, res, next) => {
  const session = await Session.findById(req.params.id);

  if (!session) {
    return next(new ApiError(HTTP_STATUS.NOT_FOUND, 'Session not found'));
  }

  const { page = 1, limit = 20, semester, enrollmentStatus } = req.query;
  const filter = { session: session._id };
  if (semester) filter.currentSemester = parseInt(semester);
  if (enrollmentStatus) filter.enrollmentStatus = enrollmentStatus;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [students, total] = await Promise.all([
    StudentProfile.find(filter)
      .populate('user', 'firstName lastName email avatar')
      .populate('program', 'name code')
      .select('rollNumber registrationNumber currentSemester enrollmentStatus cumulativeGPA fatherName')
      .sort({ rollNumber: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    StudentProfile.countDocuments(filter),
  ]);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        students,
        pagination: getPaginationMeta(total, page, limit),
      },
      'Session students fetched successfully'
    )
  );
});