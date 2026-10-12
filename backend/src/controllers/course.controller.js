import Course from '../models/Course.model.js';
import Program from '../models/Program.model.js';
import Department from '../models/Department.model.js';
import Institute from '../models/Institute.model.js';
import CourseAssignment from '../models/CourseAssignment.model.js';
import AuditLog from '../models/AuditLog.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../middleware/asyncHandler.middleware.js';
import { HTTP_STATUS } from '../utils/constants.js';
import { getPaginationMeta, parseSortString } from '../utils/helpers.js';

// ─── GET ALL COURSES ──────────────────────────────────────────
export const getAllCourses = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    limit = 10,
    search,
    program,
    department,
    institute,
    semester,
    type,
    category,
    isActive,
    sort = 'semester,name',
  } = req.query;

  const filter = {};
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
    ];
  }
  if (program) filter.program = program;
  if (department) filter.department = department;
  if (institute) filter.institute = institute;
  if (semester) filter.semester = parseInt(semester);
  if (type) filter.type = type;
  if (category) filter.category = category;
  if (isActive !== undefined) filter.isActive = isActive === 'true';
  else filter.isActive = true;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [courses, total] = await Promise.all([
    Course.find(filter)
      .populate('program', 'name code degreeType')
      .populate('department', 'name code')
      .populate('institute', 'name code')
      .populate('prerequisites', 'name code')
      .sort(parseSortString(sort))
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Course.countDocuments(filter),
  ]);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        courses,
        pagination: getPaginationMeta(total, page, limit),
      },
      'Courses fetched successfully'
    )
  );
});

// ─── GET SINGLE COURSE ────────────────────────────────────────
export const getCourseById = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id)
    .populate('program', 'name code degreeType totalSemesters')
    .populate('department', 'name code')
    .populate('institute', 'name code')
    .populate('prerequisites', 'name code creditHours semester')
    .populate('createdBy', 'firstName lastName')
    .lean();

  if (!course) {
    return next(new ApiError(HTTP_STATUS.NOT_FOUND, 'Course not found'));
  }

  // Get assignment count
  const totalAssignments = await CourseAssignment.countDocuments({
    course: course._id,
  });

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      { course: { ...course, totalAssignments } },
      'Course fetched successfully'
    )
  );
});

// ─── CREATE COURSE ────────────────────────────────────────────
export const createCourse = asyncHandler(async (req, res, next) => {
  const {
    name,
    code,
    creditHours,
    type,
    category,
    program,
    department,
    institute,
    semester,
    prerequisites,
    description,
    marksDistribution,
  } = req.body;

  // Validate references
  const [programDoc, departmentDoc, instituteDoc] = await Promise.all([
    Program.findById(program),
    Department.findById(department),
    Institute.findById(institute),
  ]);

  if (!programDoc) {
    return next(new ApiError(HTTP_STATUS.NOT_FOUND, 'Program not found'));
  }
  if (!departmentDoc) {
    return next(new ApiError(HTTP_STATUS.NOT_FOUND, 'Department not found'));
  }
  if (!instituteDoc) {
    return next(new ApiError(HTTP_STATUS.NOT_FOUND, 'Institute not found'));
  }

  // Check semester validity
  if (semester > programDoc.totalSemesters) {
    return next(
      new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        `Semester ${semester} exceeds program's total semesters (${programDoc.totalSemesters})`
      )
    );
  }

  // Check unique code within program
  const existingCourse = await Course.findOne({
    code: code.toUpperCase(),
    program,
  });

  if (existingCourse) {
    return next(
      new ApiError(
        HTTP_STATUS.CONFLICT,
        `Course with code '${code.toUpperCase()}' already exists in this program`
      )
    );
  }

  // Validate prerequisites exist
  if (prerequisites && prerequisites.length > 0) {
    const validPrereqs = await Course.countDocuments({
      _id: { $in: prerequisites },
      program,
    });

    if (validPrereqs !== prerequisites.length) {
      return next(
        new ApiError(
          HTTP_STATUS.BAD_REQUEST,
          'One or more prerequisites are invalid or not from the same program'
        )
      );
    }
  }

  // Validate marks distribution total
  if (marksDistribution) {
    const total =
      (marksDistribution.midTerm || 20) +
      (marksDistribution.internal || 20) +
      (marksDistribution.finalTerm || 60);

    if (total !== 100) {
      return next(
        new ApiError(
          HTTP_STATUS.BAD_REQUEST,
          `Marks distribution must total 100. Current total: ${total}`
        )
      );
    }
  }

  const course = await Course.create({
    name,
    code: code.toUpperCase(),
    creditHours,
    type: type || 'theory',
    category: category || 'core',
    program,
    department,
    institute,
    semester,
    prerequisites: prerequisites || [],
    description,
    marksDistribution: marksDistribution || {
      midTerm: 20,
      internal: 20,
      finalTerm: 60,
    },
    createdBy: req.user._id,
  });

  await course.populate([
    { path: 'program', select: 'name code' },
    { path: 'department', select: 'name code' },
    { path: 'prerequisites', select: 'name code' },
  ]);

  await AuditLog.log({
    user: req.user._id,
    userSnapshot: {
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      role: req.user.role,
    },
    action: 'COURSE_CREATED',
    resource: 'course',
    resourceId: course._id,
    newData: { name, code, semester, creditHours },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    description: `Course '${name} (${code})' created for semester ${semester}`,
  });

  res.status(HTTP_STATUS.CREATED).json(
    new ApiResponse(
      HTTP_STATUS.CREATED,
      { course },
      'Course created successfully'
    )
  );
});

// ─── BULK CREATE COURSES ──────────────────────────────────────
export const bulkCreateCourses = asyncHandler(async (req, res, next) => {
  const { courses } = req.body;

  const results = { created: [], failed: [] };

  for (const courseData of courses) {
    try {
      const existing = await Course.findOne({
        code: courseData.code.toUpperCase(),
        program: courseData.program,
      });

      if (existing) {
        results.failed.push({
          code: courseData.code,
          reason: `Course with code '${courseData.code}' already exists`,
        });
        continue;
      }

      const course = await Course.create({
        ...courseData,
        code: courseData.code.toUpperCase(),
        createdBy: req.user._id,
      });

      results.created.push({
        _id: course._id,
        name: course.name,
        code: course.code,
      });
    } catch (error) {
      results.failed.push({
        code: courseData.code,
        reason: error.message,
      });
    }
  }

  await AuditLog.log({
    user: req.user._id,
    userSnapshot: {
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      role: req.user.role,
    },
    action: 'COURSE_CREATED',
    resource: 'course',
    newData: { bulkCount: results.created.length },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    description: `Bulk created ${results.created.length} courses`,
  });

  res.status(HTTP_STATUS.CREATED).json(
    new ApiResponse(
      HTTP_STATUS.CREATED,
      { results },
      `${results.created.length} course(s) created, ${results.failed.length} failed`
    )
  );
});

// ─── UPDATE COURSE ────────────────────────────────────────────
export const updateCourse = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    return next(new ApiError(HTTP_STATUS.NOT_FOUND, 'Course not found'));
  }

  // Validate marks distribution if provided
  if (req.body.marksDistribution) {
    const md = req.body.marksDistribution;
    const total =
      (md.midTerm ?? course.marksDistribution.midTerm) +
      (md.internal ?? course.marksDistribution.internal) +
      (md.finalTerm ?? course.marksDistribution.finalTerm);

    if (total !== 100) {
      return next(
        new ApiError(
          HTTP_STATUS.BAD_REQUEST,
          `Marks distribution must total 100. Current total: ${total}`
        )
      );
    }
  }

  const allowedFields = [
    'name',
    'creditHours',
    'type',
    'category',
    'semester',
    'prerequisites',
    'description',
    'marksDistribution',
    'isActive',
  ];

  const previousData = { name: course.name, code: course.code };

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      course[field] = req.body[field];
    }
  });

  await course.save();

  await course.populate([
    { path: 'program', select: 'name code' },
    { path: 'department', select: 'name code' },
    { path: 'prerequisites', select: 'name code' },
  ]);

  await AuditLog.log({
    user: req.user._id,
    userSnapshot: {
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      role: req.user.role,
    },
    action: 'COURSE_UPDATED',
    resource: 'course',
    resourceId: course._id,
    previousData,
    newData: req.body,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      { course },
      'Course updated successfully'
    )
  );
});

// ─── DELETE COURSE ────────────────────────────────────────────
export const deleteCourse = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    return next(new ApiError(HTTP_STATUS.NOT_FOUND, 'Course not found'));
  }

  // Check if course has assignments
  const assignments = await CourseAssignment.countDocuments({
    course: course._id,
  });

  if (assignments > 0) {
    return next(
      new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        `Cannot delete course with ${assignments} assignment(s). Deactivate it instead.`
      )
    );
  }

  course.isActive = false;
  await course.save();

  await AuditLog.log({
    user: req.user._id,
    userSnapshot: {
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      role: req.user.role,
    },
    action: 'COURSE_DELETED',
    resource: 'course',
    resourceId: course._id,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    description: `Course '${course.name}' deactivated`,
  });

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, null, 'Course deactivated successfully')
  );
});

// ─── GET COURSES BY SEMESTER ──────────────────────────────────
export const getCoursesBySemester = asyncHandler(async (req, res, next) => {
  const { semester } = req.params;
  const { program, department } = req.query;

  if (!program && !department) {
    return next(
      new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Either program or department is required'
      )
    );
  }

  const filter = {
    semester: parseInt(semester),
    isActive: true,
  };

  if (program) filter.program = program;
  if (department) filter.department = department;

  const courses = await Course.find(filter)
    .populate('program', 'name code')
    .populate('prerequisites', 'name code')
    .sort({ name: 1 })
    .lean();

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      { courses },
      `Semester ${semester} courses fetched successfully`
    )
  );
});