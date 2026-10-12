import Department from '../models/Department.model.js';
import Institute from '../models/Institute.model.js';
import User from '../models/User.model.js';
import StudentProfile from '../models/StudentProfile.model.js';
import Program from '../models/Program.model.js';
import AuditLog from '../models/AuditLog.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../middleware/asyncHandler.middleware.js';
import { HTTP_STATUS, ROLES } from '../utils/constants.js';
import { getPaginationMeta, parseSortString } from '../utils/helpers.js';

// ─── GET ALL DEPARTMENTS ──────────────────────────────────────
export const getAllDepartments = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    limit = 10,
    search,
    institute,
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

  if (institute) filter.institute = institute;
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  // HoD can only see their own department
  if (req.user.role === ROLES.HOD) {
    filter._id = req.user.department?._id;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sortObj = parseSortString(sort);

  const [departments, total] = await Promise.all([
    Department.find(filter)
      .populate('institute', 'name code logo')
      .populate('hod', 'firstName lastName email avatar')
      .populate('createdBy', 'firstName lastName')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .lean({ virtuals: true }),
    Department.countDocuments(filter),
  ]);

  // Add stats
  const departmentsWithStats = await Promise.all(
    departments.map(async (dept) => {
      const [totalTeachers, totalStudents, totalPrograms] = await Promise.all([
        User.countDocuments({
          department: dept._id,
          role: ROLES.TEACHER,
          isActive: true,
        }),
        StudentProfile.countDocuments({
          department: dept._id,
          enrollmentStatus: 'active',
        }),
        Program.countDocuments({ department: dept._id, isActive: true }),
      ]);

      return {
        ...dept,
        stats: { totalTeachers, totalStudents, totalPrograms },
      };
    })
  );

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        departments: departmentsWithStats,
        pagination: getPaginationMeta(total, page, limit),
      },
      'Departments fetched successfully'
    )
  );
});

// ─── GET SINGLE DEPARTMENT ────────────────────────────────────
export const getDepartmentById = asyncHandler(async (req, res, next) => {
  const department = await Department.findById(req.params.id)
    .populate('institute', 'name code logo')
    .populate('hod', 'firstName lastName email avatar phone')
    .populate('createdBy', 'firstName lastName')
    .lean({ virtuals: true });

  if (!department) {
    return next(
      new ApiError(HTTP_STATUS.NOT_FOUND, 'Department not found')
    );
  }

  // Get full stats
  const [
    teachers,
    totalStudents,
    programs,
    semesterBreakdown,
  ] = await Promise.all([
    User.find({
      department: department._id,
      role: ROLES.TEACHER,
      isActive: true,
    }).select('firstName lastName email avatar phone'),
    StudentProfile.countDocuments({
      department: department._id,
      enrollmentStatus: 'active',
    }),
    Program.find({ department: department._id, isActive: true }).select(
      'name code degreeType totalSemesters'
    ),
    StudentProfile.aggregate([
      {
        $match: {
          department: department._id,
          enrollmentStatus: 'active',
        },
      },
      {
        $group: {
          _id: '$currentSemester',
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        department: {
          ...department,
          teachers,
          programs,
          stats: {
            totalTeachers: teachers.length,
            totalStudents,
            totalPrograms: programs.length,
            semesterBreakdown,
          },
        },
      },
      'Department fetched successfully'
    )
  );
});

// ─── CREATE DEPARTMENT ────────────────────────────────────────
export const createDepartment = asyncHandler(async (req, res, next) => {
  const {
    name,
    code,
    institute,
    description,
    vision,
    mission,
    hod,
    establishedYear,
    contactEmail,
    contactPhone,
  } = req.body;

  // Verify institute exists
  const instituteDoc = await Institute.findById(institute);
  if (!instituteDoc) {
    return next(
      new ApiError(HTTP_STATUS.NOT_FOUND, 'Institute not found')
    );
  }

  if (!instituteDoc.isActive) {
    return next(
      new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Cannot create department under an inactive institute'
      )
    );
  }

  // Check if code is unique within institute
  const existingDept = await Department.findOne({
    code: code.toUpperCase(),
    institute,
  });

  if (existingDept) {
    return next(
      new ApiError(
        HTTP_STATUS.CONFLICT,
        `Department with code '${code.toUpperCase()}' already exists in this institute`
      )
    );
  }

  // Validate HoD if provided
  if (hod) {
    const hodUser = await User.findById(hod);
    if (!hodUser) {
      return next(new ApiError(HTTP_STATUS.NOT_FOUND, 'HoD user not found'));
    }
    if (hodUser.role !== ROLES.HOD) {
      return next(
        new ApiError(
          HTTP_STATUS.BAD_REQUEST,
          'Selected user must have the HoD role'
        )
      );
    }
  }

  const department = await Department.create({
    name,
    code: code.toUpperCase(),
    institute,
    description,
    vision,
    mission,
    hod: hod || null,
    establishedYear,
    contactEmail,
    contactPhone,
    createdBy: req.user._id,
  });

  // Update HoD user's department reference if assigned
  if (hod) {
    await User.findByIdAndUpdate(hod, {
      department: department._id,
      institute,
    });
  }

  await department.populate([
    { path: 'institute', select: 'name code' },
    { path: 'hod', select: 'firstName lastName email avatar' },
  ]);

  await AuditLog.log({
    user: req.user._id,
    userSnapshot: {
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      role: req.user.role,
    },
    action: 'DEPARTMENT_CREATED',
    resource: 'department',
    resourceId: department._id,
    newData: { name, code, institute },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    description: `Department '${name}' created under institute '${instituteDoc.name}'`,
  });

  res.status(HTTP_STATUS.CREATED).json(
    new ApiResponse(
      HTTP_STATUS.CREATED,
      { department },
      'Department created successfully'
    )
  );
});

// ─── UPDATE DEPARTMENT ────────────────────────────────────────
export const updateDepartment = asyncHandler(async (req, res, next) => {
  const department = await Department.findById(req.params.id);

  if (!department) {
    return next(
      new ApiError(HTTP_STATUS.NOT_FOUND, 'Department not found')
    );
  }

  const allowedFields = [
    'name',
    'description',
    'vision',
    'mission',
    'establishedYear',
    'contactEmail',
    'contactPhone',
    'isActive',
  ];

  const previousData = department.toObject();
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      department[field] = req.body[field];
    }
  });

  await department.save();

  await department.populate([
    { path: 'institute', select: 'name code' },
    { path: 'hod', select: 'firstName lastName email avatar' },
  ]);

  await AuditLog.log({
    user: req.user._id,
    userSnapshot: {
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      role: req.user.role,
    },
    action: 'DEPARTMENT_UPDATED',
    resource: 'department',
    resourceId: department._id,
    previousData: { name: previousData.name },
    newData: req.body,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      { department },
      'Department updated successfully'
    )
  );
});

// ─── DELETE DEPARTMENT (Soft Delete) ──────────────────────────
export const deleteDepartment = asyncHandler(async (req, res, next) => {
  const department = await Department.findById(req.params.id);

  if (!department) {
    return next(
      new ApiError(HTTP_STATUS.NOT_FOUND, 'Department not found')
    );
  }

  // Check for active students
  const activeStudents = await StudentProfile.countDocuments({
    department: department._id,
    enrollmentStatus: 'active',
  });

  if (activeStudents > 0) {
    return next(
      new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        `Cannot delete department with ${activeStudents} active student(s)`
      )
    );
  }

  department.isActive = false;
  await department.save();

  await AuditLog.log({
    user: req.user._id,
    userSnapshot: {
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      role: req.user.role,
    },
    action: 'DEPARTMENT_DELETED',
    resource: 'department',
    resourceId: department._id,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    description: `Department '${department.name}' deactivated`,
  });

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, null, 'Department deactivated successfully')
  );
});

// ─── ASSIGN HOD ───────────────────────────────────────────────
export const assignHoD = asyncHandler(async (req, res, next) => {
  const { hodId } = req.body;
  const { id: departmentId } = req.params;

  const [department, hodUser] = await Promise.all([
    Department.findById(departmentId),
    User.findById(hodId),
  ]);

  if (!department) {
    return next(new ApiError(HTTP_STATUS.NOT_FOUND, 'Department not found'));
  }

  if (!hodUser) {
    return next(new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found'));
  }

  if (hodUser.role !== ROLES.HOD) {
    return next(
      new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Selected user must have the HoD role to be assigned as HoD'
      )
    );
  }

  // Remove HoD reference from previous HoD's department if applicable
  if (department.hod && department.hod.toString() !== hodId) {
    await User.findByIdAndUpdate(department.hod, {
      $unset: { department: 1 },
    });
  }

  // Update department HoD
  department.hod = hodId;
  await department.save();

  // Update HoD user references
  hodUser.department = department._id;
  hodUser.institute = department.institute;
  await hodUser.save({ validateBeforeSave: false });

  await department.populate('hod', 'firstName lastName email avatar');

  await AuditLog.log({
    user: req.user._id,
    userSnapshot: {
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      role: req.user.role,
    },
    action: 'HOD_ASSIGNED',
    resource: 'department',
    resourceId: department._id,
    newData: { hodId },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    description: `${hodUser.firstName} ${hodUser.lastName} assigned as HoD of ${department.name}`,
  });

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      { department },
      'HoD assigned successfully'
    )
  );
});

// ─── GET DEPARTMENT TEACHERS ──────────────────────────────────
export const getDepartmentTeachers = asyncHandler(async (req, res, next) => {
  const department = await Department.findById(req.params.id);

  if (!department) {
    return next(new ApiError(HTTP_STATUS.NOT_FOUND, 'Department not found'));
  }

  const { page = 1, limit = 20, search } = req.query;
  const filter = {
    department: department._id,
    role: ROLES.TEACHER,
    isActive: true,
  };

  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [teachers, total] = await Promise.all([
    User.find(filter)
      .select('firstName lastName email avatar phone gender')
      .sort({ firstName: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    User.countDocuments(filter),
  ]);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        teachers,
        pagination: getPaginationMeta(total, page, limit),
      },
      'Department teachers fetched successfully'
    )
  );
});

// ─── GET DEPARTMENT STUDENTS ──────────────────────────────────
export const getDepartmentStudents = asyncHandler(async (req, res, next) => {
  const department = await Department.findById(req.params.id);

  if (!department) {
    return next(new ApiError(HTTP_STATUS.NOT_FOUND, 'Department not found'));
  }

  const {
    page = 1,
    limit = 20,
    search,
    semester,
    session,
    enrollmentStatus,
  } = req.query;

  const filter = { department: department._id };
  if (semester) filter.currentSemester = parseInt(semester);
  if (session) filter.session = session;
  if (enrollmentStatus) filter.enrollmentStatus = enrollmentStatus;
  else filter.enrollmentStatus = 'active';

  const skip = (parseInt(page) - 1) * parseInt(limit);

  let query = StudentProfile.find(filter)
    .populate({
      path: 'user',
      select: 'firstName lastName email avatar phone gender',
      match: search
        ? {
            $or: [
              { firstName: { $regex: search, $options: 'i' } },
              { lastName: { $regex: search, $options: 'i' } },
              { email: { $regex: search, $options: 'i' } },
            ],
          }
        : {},
    })
    .populate('program', 'name code degreeType')
    .populate('session', 'name startYear endYear')
    .sort({ rollNumber: 1 })
    .skip(skip)
    .limit(parseInt(limit));

  const [students, total] = await Promise.all([
    query.lean(),
    StudentProfile.countDocuments(filter),
  ]);

  // Filter out null users (due to search match)
  const filteredStudents = students.filter((s) => s.user !== null);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        students: filteredStudents,
        pagination: getPaginationMeta(total, page, limit),
      },
      'Department students fetched successfully'
    )
  );
});

// ─── GET DEPARTMENT STATISTICS ────────────────────────────────
export const getDepartmentStatistics = asyncHandler(async (req, res, next) => {
  const department = await Department.findById(req.params.id)
    .populate('institute', 'name code');

  if (!department) {
    return next(new ApiError(HTTP_STATUS.NOT_FOUND, 'Department not found'));
  }

  const [
    totalTeachers,
    totalStudents,
    totalPrograms,
    semesterBreakdown,
    enrollmentTrend,
  ] = await Promise.all([
    User.countDocuments({
      department: department._id,
      role: ROLES.TEACHER,
      isActive: true,
    }),
    StudentProfile.countDocuments({
      department: department._id,
      enrollmentStatus: 'active',
    }),
    Program.countDocuments({
      department: department._id,
      isActive: true,
    }),
    StudentProfile.aggregate([
      {
        $match: {
          department: department._id,
          enrollmentStatus: 'active',
        },
      },
      {
        $group: {
          _id: '$currentSemester',
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          semester: '$_id',
          count: 1,
          _id: 0,
        },
      },
    ]),
    StudentProfile.aggregate([
      { $match: { department: department._id } },
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
        },
      },
      { $sort: { _id: -1 } },
      { $limit: 5 },
    ]),
  ]);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        department: {
          _id: department._id,
          name: department.name,
          code: department.code,
          institute: department.institute,
        },
        statistics: {
          totalTeachers,
          totalStudents,
          totalPrograms,
          semesterBreakdown,
          enrollmentTrend,
        },
      },
      'Department statistics fetched successfully'
    )
  );
});