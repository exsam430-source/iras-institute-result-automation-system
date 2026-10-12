import Institute from '../models/Institute.model.js';
import Department from '../models/Department.model.js';
import User from '../models/User.model.js';
import StudentProfile from '../models/StudentProfile.model.js';
import AuditLog from '../models/AuditLog.model.js';
// ✅ FIXED: Added static import for Program (replaces dynamic import inside getInstituteStatistics)
import Program from '../models/Program.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../middleware/asyncHandler.middleware.js';
import { HTTP_STATUS, ROLES } from '../utils/constants.js';
import {
  getPaginationMeta,
  parseSortString,
} from '../utils/helpers.js';
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from '../config/cloudinary.js';

// ─── GET ALL INSTITUTES ───────────────────────────────────────
export const getAllInstitutes = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    limit = 10,
    search,
    isActive,
    sort = '-createdAt',
  } = req.query;

  const filter = {};

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
      { shortName: { $regex: search, $options: 'i' } },
    ];
  }

  if (isActive !== undefined) {
    filter.isActive = isActive === 'true';
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sortObj = parseSortString(sort);

  const [institutes, total] = await Promise.all([
    Institute.find(filter)
      .populate('director', 'firstName lastName email avatar')
      .populate('totalDepartments')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .lean({ virtuals: true }),
    Institute.countDocuments(filter),
  ]);

  // Add extra stats for each institute
  const institutesWithStats = await Promise.all(
    institutes.map(async (institute) => {
      const [totalTeachers, totalStudents] = await Promise.all([
        User.countDocuments({
          institute: institute._id,
          role: ROLES.TEACHER,
          isActive: true,
        }),
        StudentProfile.countDocuments({
          institute: institute._id,
          enrollmentStatus: 'active',
        }),
      ]);

      return {
        ...institute,
        stats: {
          totalDepartments: institute.totalDepartments || 0,
          totalTeachers,
          totalStudents,
        },
      };
    })
  );

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        institutes: institutesWithStats,
        pagination: getPaginationMeta(total, page, limit),
      },
      'Institutes fetched successfully'
    )
  );
});

// ─── GET SINGLE INSTITUTE ─────────────────────────────────────
export const getInstituteById = asyncHandler(async (req, res, next) => {
  const institute = await Institute.findById(req.params.id)
    .populate('director', 'firstName lastName email avatar phone')
    .populate('createdBy', 'firstName lastName')
    .lean({ virtuals: true });

  if (!institute) {
    return next(
      new ApiError(HTTP_STATUS.NOT_FOUND, 'Institute not found')
    );
  }

  // Get departments
  const departments = await Department.find({
    institute: institute._id,
    isActive: true,
  })
    .populate('hod', 'firstName lastName email avatar')
    .lean({ virtuals: true });

  // Get stats
  const [totalTeachers, totalStudents, totalHoDs] = await Promise.all([
    User.countDocuments({
      institute: institute._id,
      role: ROLES.TEACHER,
      isActive: true,
    }),
    StudentProfile.countDocuments({
      institute: institute._id,
      enrollmentStatus: 'active',
    }),
    User.countDocuments({
      institute: institute._id,
      role: ROLES.HOD,
      isActive: true,
    }),
  ]);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        institute: {
          ...institute,
          departments,
          stats: {
            totalDepartments: departments.length,
            totalTeachers,
            totalStudents,
            totalHoDs,
          },
        },
      },
      'Institute fetched successfully'
    )
  );
});

// ─── CREATE INSTITUTE ─────────────────────────────────────────
export const createInstitute = asyncHandler(async (req, res, next) => {
  const {
    name,
    code,
    shortName,
    description,
    vision,
    mission,
    director,
    establishedYear,
    location,
    contactEmail,
    contactPhone,
    website,
  } = req.body;

  // Check if code already exists
  const existingInstitute = await Institute.findOne({
    code: code.toUpperCase(),
  });
  if (existingInstitute) {
    return next(
      new ApiError(
        HTTP_STATUS.CONFLICT,
        `Institute with code '${code.toUpperCase()}' already exists`
      )
    );
  }

  // Validate director if provided
  if (director) {
    const directorUser = await User.findById(director);
    if (!directorUser) {
      return next(
        new ApiError(HTTP_STATUS.NOT_FOUND, 'Director user not found')
      );
    }
    if (
      ![ROLES.DIRECTOR, ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(
        directorUser.role
      )
    ) {
      return next(
        new ApiError(
          HTTP_STATUS.BAD_REQUEST,
          'Director must have a director, admin, or superadmin role'
        )
      );
    }
  }

  const institute = await Institute.create({
    name,
    code: code.toUpperCase(),
    shortName,
    description,
    vision,
    mission,
    director: director || null,
    establishedYear,
    location,
    contactEmail,
    contactPhone,
    website,
    createdBy: req.user._id,
  });

  await institute.populate('director', 'firstName lastName email');

  await AuditLog.log({
    user: req.user._id,
    userSnapshot: {
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      role: req.user.role,
    },
    action: 'INSTITUTE_CREATED',
    resource: 'institute',
    resourceId: institute._id,
    newData: { name, code, shortName },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    description: `Institute '${name}' created`,
  });

  res.status(HTTP_STATUS.CREATED).json(
    new ApiResponse(
      HTTP_STATUS.CREATED,
      { institute },
      'Institute created successfully'
    )
  );
});

// ─── UPDATE INSTITUTE ─────────────────────────────────────────
export const updateInstitute = asyncHandler(async (req, res, next) => {
  const institute = await Institute.findById(req.params.id);

  if (!institute) {
    return next(
      new ApiError(HTTP_STATUS.NOT_FOUND, 'Institute not found')
    );
  }

  const allowedFields = [
    'name',
    'shortName',
    'description',
    'vision',
    'mission',
    'director',
    'establishedYear',
    'location',
    'contactEmail',
    'contactPhone',
    'website',
    'isActive',
  ];

  const updateData = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  });

  // Validate director if being updated
  if (updateData.director) {
    const directorUser = await User.findById(updateData.director);
    if (!directorUser) {
      return next(
        new ApiError(HTTP_STATUS.NOT_FOUND, 'Director user not found')
      );
    }
  }

  const previousData = institute.toObject();
  Object.assign(institute, updateData);
  await institute.save();

  await institute.populate('director', 'firstName lastName email avatar');

  await AuditLog.log({
    user: req.user._id,
    userSnapshot: {
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      role: req.user.role,
    },
    action: 'INSTITUTE_UPDATED',
    resource: 'institute',
    resourceId: institute._id,
    previousData: { name: previousData.name, isActive: previousData.isActive },
    newData: updateData,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      { institute },
      'Institute updated successfully'
    )
  );
});

// ─── DELETE INSTITUTE (Soft Delete) ───────────────────────────
export const deleteInstitute = asyncHandler(async (req, res, next) => {
  const institute = await Institute.findById(req.params.id);

  if (!institute) {
    return next(
      new ApiError(HTTP_STATUS.NOT_FOUND, 'Institute not found')
    );
  }

  // Check if institute has active departments
  const activeDepartments = await Department.countDocuments({
    institute: institute._id,
    isActive: true,
  });

  if (activeDepartments > 0) {
    return next(
      new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        `Cannot delete institute with ${activeDepartments} active department(s). Please deactivate all departments first.`
      )
    );
  }

  // Soft delete
  institute.isActive = false;
  await institute.save();

  await AuditLog.log({
    user: req.user._id,
    userSnapshot: {
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      role: req.user.role,
    },
    action: 'INSTITUTE_DELETED',
    resource: 'institute',
    resourceId: institute._id,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    description: `Institute '${institute.name}' deactivated`,
  });

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      null,
      'Institute deactivated successfully'
    )
  );
});

// ─── ASSIGN DIRECTOR ─────────────────────────────────────────
export const assignDirector = asyncHandler(async (req, res, next) => {
  const { directorId } = req.body;

  const [institute, director] = await Promise.all([
    Institute.findById(req.params.id),
    User.findById(directorId),
  ]);

  if (!institute) {
    return next(new ApiError(HTTP_STATUS.NOT_FOUND, 'Institute not found'));
  }

  if (!director) {
    return next(new ApiError(HTTP_STATUS.NOT_FOUND, 'Director user not found'));
  }

  if (
    ![ROLES.DIRECTOR, ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(director.role)
  ) {
    return next(
      new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Selected user does not have the required role to be a director'
      )
    );
  }

  institute.director = directorId;
  await institute.save();

  // Update director's institute reference
  director.institute = institute._id;
  await director.save({ validateBeforeSave: false });

  await institute.populate('director', 'firstName lastName email avatar');

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      { institute },
      'Director assigned successfully'
    )
  );
});

// ─── GET INSTITUTE DEPARTMENTS ────────────────────────────────
export const getInstituteDepartments = asyncHandler(async (req, res, next) => {
  const institute = await Institute.findById(req.params.id);

  if (!institute) {
    return next(new ApiError(HTTP_STATUS.NOT_FOUND, 'Institute not found'));
  }

  const departments = await Department.find({
    institute: institute._id,
  })
    .populate('hod', 'firstName lastName email avatar')
    .lean({ virtuals: true });

  // Add stats to each department
  const departmentsWithStats = await Promise.all(
    departments.map(async (dept) => {
      const [totalTeachers, totalStudents] = await Promise.all([
        User.countDocuments({
          department: dept._id,
          role: ROLES.TEACHER,
          isActive: true,
        }),
        StudentProfile.countDocuments({
          department: dept._id,
          enrollmentStatus: 'active',
        }),
      ]);

      return {
        ...dept,
        stats: { totalTeachers, totalStudents },
      };
    })
  );

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      { departments: departmentsWithStats },
      'Institute departments fetched successfully'
    )
  );
});

// ─── GET INSTITUTE STATISTICS ─────────────────────────────────
export const getInstituteStatistics = asyncHandler(async (req, res, next) => {
  const institute = await Institute.findById(req.params.id);

  if (!institute) {
    return next(new ApiError(HTTP_STATUS.NOT_FOUND, 'Institute not found'));
  }

  const [
    totalDepartments,
    totalTeachers,
    totalStudents,
    totalHoDs,
    totalPrograms,
    departmentBreakdown,
  ] = await Promise.all([
    Department.countDocuments({ institute: institute._id }),
    User.countDocuments({
      institute: institute._id,
      role: ROLES.TEACHER,
      isActive: true,
    }),
    StudentProfile.countDocuments({
      institute: institute._id,
      enrollmentStatus: 'active',
    }),
    User.countDocuments({
      institute: institute._id,
      role: ROLES.HOD,
      isActive: true,
    }),
    // ✅ FIXED: Replaced dynamic import with static Program import at top of file
    Program.countDocuments({
      institute: institute._id,
      isActive: true,
    }),
    Department.aggregate([
      { $match: { institute: institute._id } },
      {
        $lookup: {
          from: 'studentprofiles',
          localField: '_id',
          foreignField: 'department',
          as: 'students',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'department',
          as: 'teachers',
          pipeline: [{ $match: { role: 'teacher', isActive: true } }],
        },
      },
      {
        $project: {
          name: 1,
          code: 1,
          isActive: 1,
          totalStudents: { $size: '$students' },
          totalTeachers: { $size: '$teachers' },
        },
      },
    ]),
  ]);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        statistics: {
          totalDepartments,
          totalTeachers,
          totalStudents,
          totalHoDs,
          totalPrograms,
          departmentBreakdown,
        },
      },
      'Institute statistics fetched successfully'
    )
  );
});

// ─── UPLOAD INSTITUTE LOGO ────────────────────────────────────
export const uploadInstituteLogo = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(
      new ApiError(HTTP_STATUS.BAD_REQUEST, 'Please upload an image')
    );
  }

  const institute = await Institute.findById(req.params.id);

  if (!institute) {
    return next(new ApiError(HTTP_STATUS.NOT_FOUND, 'Institute not found'));
  }

  // Delete old logo if exists
  if (institute.logoPublicId) {
    await deleteFromCloudinary(institute.logoPublicId).catch(() => {});
  }

  const result = await uploadToCloudinary(req.file.buffer, {
    folder: 'iras/institute-logos',
    transformation: [
      { width: 300, height: 300, crop: 'fit' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
  });

  institute.logo = result.secure_url;
  institute.logoPublicId = result.public_id;
  await institute.save();

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      { logo: institute.logo },
      'Institute logo uploaded successfully'
    )
  );
});