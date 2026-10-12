import Program from '../models/Program.model.js';
import Department from '../models/Department.model.js';
import Institute from '../models/Institute.model.js';
import Course from '../models/Course.model.js';
import StudentProfile from '../models/StudentProfile.model.js';
import AuditLog from '../models/AuditLog.model.js';
// ✅ FIXED: Added static import for Session (replaces dynamic import inside getProgramById)
import Session from '../models/Session.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../middleware/asyncHandler.middleware.js';
import { HTTP_STATUS } from '../utils/constants.js';
import { getPaginationMeta, parseSortString } from '../utils/helpers.js';

// ─── GET ALL PROGRAMS ─────────────────────────────────────────
export const getAllPrograms = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    limit = 10,
    search,
    department,
    institute,
    degreeType,
    isActive,
    sort = 'name',
  } = req.query;

  const filter = {};
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
    ];
  }
  if (department) filter.department = department;
  if (institute) filter.institute = institute;
  if (degreeType) filter.degreeType = degreeType;
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [programs, total] = await Promise.all([
    Program.find(filter)
      .populate('department', 'name code')
      .populate('institute', 'name code')
      .populate('createdBy', 'firstName lastName')
      .sort(parseSortString(sort))
      .skip(skip)
      .limit(parseInt(limit))
      .lean({ virtuals: true }),
    Program.countDocuments(filter),
  ]);

  // Add stats
  const programsWithStats = await Promise.all(
    programs.map(async (program) => {
      const [totalCourses, totalStudents] = await Promise.all([
        Course.countDocuments({ program: program._id, isActive: true }),
        StudentProfile.countDocuments({
          program: program._id,
          enrollmentStatus: 'active',
        }),
      ]);
      return { ...program, stats: { totalCourses, totalStudents } };
    })
  );

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        programs: programsWithStats,
        pagination: getPaginationMeta(total, page, limit),
      },
      'Programs fetched successfully'
    )
  );
});

// ─── GET SINGLE PROGRAM ───────────────────────────────────────
export const getProgramById = asyncHandler(async (req, res, next) => {
  const program = await Program.findById(req.params.id)
    .populate('department', 'name code hod')
    .populate('institute', 'name code logo')
    .populate('createdBy', 'firstName lastName')
    .lean({ virtuals: true });

  if (!program) {
    return next(new ApiError(HTTP_STATUS.NOT_FOUND, 'Program not found'));
  }

  // Get courses grouped by semester
  const courses = await Course.find({ program: program._id, isActive: true })
    .select('name code creditHours type category semester')
    .sort({ semester: 1, name: 1 })
    .lean();

  // Group by semester
  const coursesBySemester = courses.reduce((acc, course) => {
    const sem = course.semester;
    if (!acc[sem]) acc[sem] = [];
    acc[sem].push(course);
    return acc;
  }, {});

  const [totalStudents, totalSessions] = await Promise.all([
    StudentProfile.countDocuments({
      program: program._id,
      enrollmentStatus: 'active',
    }),
    // ✅ FIXED: Replaced dynamic import with static Session import at top of file
    Session.countDocuments({ program: program._id }),
  ]);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        program: {
          ...program,
          coursesBySemester,
          stats: {
            totalCourses: courses.length,
            totalStudents,
            totalSessions,
          },
        },
      },
      'Program fetched successfully'
    )
  );
});

// ─── CREATE PROGRAM ───────────────────────────────────────────
export const createProgram = asyncHandler(async (req, res, next) => {
  const {
    name,
    code,
    department,
    institute,
    degreeType,
    totalSemesters,
    totalCreditHours,
    description,
    eligibility,
    duration,
  } = req.body;

  // Verify department and institute
  const [departmentDoc, instituteDoc] = await Promise.all([
    Department.findById(department),
    Institute.findById(institute),
  ]);

  if (!departmentDoc) {
    return next(new ApiError(HTTP_STATUS.NOT_FOUND, 'Department not found'));
  }
  if (!instituteDoc) {
    return next(new ApiError(HTTP_STATUS.NOT_FOUND, 'Institute not found'));
  }

  // Check if department belongs to institute
  if (departmentDoc.institute.toString() !== institute) {
    return next(
      new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Department does not belong to the specified institute'
      )
    );
  }

  // Check unique code within department
  const existingProgram = await Program.findOne({
    code: code.toUpperCase(),
    department,
  });

  if (existingProgram) {
    return next(
      new ApiError(
        HTTP_STATUS.CONFLICT,
        `Program with code '${code.toUpperCase()}' already exists in this department`
      )
    );
  }

  const program = await Program.create({
    name,
    code: code.toUpperCase(),
    department,
    institute,
    degreeType,
    totalSemesters,
    totalCreditHours,
    description,
    eligibility,
    duration,
    createdBy: req.user._id,
  });

  await program.populate([
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
    action: 'PROGRAM_CREATED',
    resource: 'program',
    resourceId: program._id,
    newData: { name, code, degreeType },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    description: `Program '${name}' created`,
  });

  res.status(HTTP_STATUS.CREATED).json(
    new ApiResponse(
      HTTP_STATUS.CREATED,
      { program },
      'Program created successfully'
    )
  );
});

// ─── UPDATE PROGRAM ───────────────────────────────────────────
export const updateProgram = asyncHandler(async (req, res, next) => {
  const program = await Program.findById(req.params.id);

  if (!program) {
    return next(new ApiError(HTTP_STATUS.NOT_FOUND, 'Program not found'));
  }

  const allowedFields = [
    'name',
    'totalSemesters',
    'totalCreditHours',
    'description',
    'eligibility',
    'duration',
    'isActive',
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      program[field] = req.body[field];
    }
  });

  await program.save();
  await program.populate([
    { path: 'department', select: 'name code' },
    { path: 'institute', select: 'name code' },
  ]);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      { program },
      'Program updated successfully'
    )
  );
});

// ─── DELETE PROGRAM ───────────────────────────────────────────
export const deleteProgram = asyncHandler(async (req, res, next) => {
  const program = await Program.findById(req.params.id);

  if (!program) {
    return next(new ApiError(HTTP_STATUS.NOT_FOUND, 'Program not found'));
  }

  const activeStudents = await StudentProfile.countDocuments({
    program: program._id,
    enrollmentStatus: 'active',
  });

  if (activeStudents > 0) {
    return next(
      new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        `Cannot delete program with ${activeStudents} active student(s)`
      )
    );
  }

  program.isActive = false;
  await program.save();

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, null, 'Program deactivated successfully')
  );
});

// ─── GET PROGRAM COURSES ──────────────────────────────────────
export const getProgramCourses = asyncHandler(async (req, res, next) => {
  const program = await Program.findById(req.params.id);

  if (!program) {
    return next(new ApiError(HTTP_STATUS.NOT_FOUND, 'Program not found'));
  }

  const { semester } = req.query;
  const filter = { program: program._id, isActive: true };
  if (semester) filter.semester = parseInt(semester);

  const courses = await Course.find(filter)
    .populate('prerequisites', 'name code')
    .sort({ semester: 1, name: 1 })
    .lean();

  const coursesBySemester = courses.reduce((acc, course) => {
    const sem = course.semester;
    if (!acc[sem]) acc[sem] = [];
    acc[sem].push(course);
    return acc;
  }, {});

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      { courses, coursesBySemester },
      'Program courses fetched successfully'
    )
  );
});