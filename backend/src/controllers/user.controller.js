import User from '../models/User.model.js';
import StudentProfile from '../models/StudentProfile.model.js';
import Institute from '../models/Institute.model.js';
import Department from '../models/Department.model.js';
import Program from '../models/Program.model.js';
import Session from '../models/Session.model.js';
import AuditLog from '../models/AuditLog.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../middleware/asyncHandler.middleware.js';
import { HTTP_STATUS, ROLES } from '../utils/constants.js';
import { getPaginationMeta, parseSortString } from '../utils/helpers.js';
import {
  generateRollNumber,
  generateRegistrationNumber,
} from '../utils/generateRollNumber.js';
import { parseExcelBuffer } from '../services/upload.service.js';
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from '../config/cloudinary.js';
import {
  sendVerificationEmail,
} from '../services/email.service.js';
import {
  generateEmailVerificationToken,
} from '../utils/generateToken.js';

// ─── GET ALL USERS ────────────────────────────────────────────
export const getAllUsers = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    limit = 10,
    search,
    role,
    institute,
    department,
    isActive,
    sort = '-createdAt',
    gender,
  } = req.query;

  const filter = {};

  // Role-based access control for listing users
  if (req.user.role === ROLES.HOD) {
    // HoD can only see users in their department
    filter.department = req.user.department?._id;
    filter.role = { $in: [ROLES.TEACHER, ROLES.STUDENT] };
  } else if (req.user.role === ROLES.DIRECTOR) {
    // Director can see users in their institute
    filter.institute = req.user.institute?._id;
  }

  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { cnic: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
  }

  if (role && req.user.role !== ROLES.HOD) filter.role = role;
  if (institute && req.user.role !== ROLES.DIRECTOR) filter.institute = institute;
  if (department) filter.department = department;
  if (isActive !== undefined) filter.isActive = isActive === 'true';
  if (gender) filter.gender = gender;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [users, total] = await Promise.all([
    User.find(filter)
      .populate('institute', 'name code')
      .populate('department', 'name code')
      .populate('createdBy', 'firstName lastName')
      .sort(parseSortString(sort))
      .skip(skip)
      .limit(parseInt(limit))
      .lean({ virtuals: true }),
    User.countDocuments(filter),
  ]);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        users,
        pagination: getPaginationMeta(total, page, limit),
      },
      'Users fetched successfully'
    )
  );
});

// ─── GET SINGLE USER ──────────────────────────────────────────
export const getUserById = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id)
    .populate('institute', 'name code logo')
    .populate('department', 'name code')
    .populate('createdBy', 'firstName lastName')
    .lean({ virtuals: true });

  if (!user) {
    return next(new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found'));
  }

  // Get student profile if student
  let studentProfile = null;
  if (user.role === ROLES.STUDENT) {
    studentProfile = await StudentProfile.findOne({ user: user._id })
      .populate('program', 'name code degreeType totalSemesters')
      .populate('session', 'name startYear endYear')
      .populate('institute', 'name code')
      .populate('department', 'name code')
      .lean({ virtuals: true });
  }

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      { user, studentProfile },
      'User fetched successfully'
    )
  );
});

// ─── CREATE USER ──────────────────────────────────────────────
export const createUser = asyncHandler(async (req, res, next) => {
  const {
    firstName,
    lastName,
    email,
    password,
    role,
    institute,
    department,
    phone,
    cnic,
    gender,
    dateOfBirth,
    address,
    mustChangePassword,
  } = req.body;

  // Check email uniqueness
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return next(
      new ApiError(
        HTTP_STATUS.CONFLICT,
        `User with email '${email}' already exists`
      )
    );
  }

  // Check CNIC uniqueness
  if (cnic) {
    const existingCnic = await User.findOne({ cnic });
    if (existingCnic) {
      return next(
        new ApiError(
          HTTP_STATUS.CONFLICT,
          `User with CNIC '${cnic}' already exists`
        )
      );
    }
  }

  // Validate institute & department references
  if (institute) {
    const instituteDoc = await Institute.findById(institute);
    if (!instituteDoc) {
      return next(new ApiError(HTTP_STATUS.NOT_FOUND, 'Institute not found'));
    }
  }

  if (department) {
    const deptDoc = await Department.findById(department);
    if (!deptDoc) {
      return next(new ApiError(HTTP_STATUS.NOT_FOUND, 'Department not found'));
    }
  }

  // HoD can only create teachers and students in their department
  if (req.user.role === ROLES.HOD) {
    if (![ROLES.TEACHER, ROLES.STUDENT].includes(role)) {
      return next(
        new ApiError(
          HTTP_STATUS.FORBIDDEN,
          'HoD can only create teacher or student accounts'
        )
      );
    }
  }

  const user = await User.create({
    firstName,
    lastName,
    email: email.toLowerCase(),
    password,
    role,
    institute: institute || null,
    department: department || null,
    phone: phone || null,
    cnic: cnic || null,
    gender: gender || null,
    dateOfBirth: dateOfBirth || null,
    address: address || {},
    mustChangePassword: mustChangePassword || false,
    createdBy: req.user._id,
  });

  // Send email verification
  try {
    const verificationToken = generateEmailVerificationToken(user._id);
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    );
    await user.save({ validateBeforeSave: false });
    await sendVerificationEmail(user, verificationToken);
  } catch (_err) {
    // Non-blocking - don't fail user creation if email fails
  }

  await user.populate([
    { path: 'institute', select: 'name code' },
    { path: 'department', select: 'name code' },
  ]);

  await AuditLog.log({
    user: req.user._id,
    userSnapshot: {
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      role: req.user.role,
    },
    action: 'USER_CREATED',
    resource: 'user',
    resourceId: user._id,
    newData: { firstName, lastName, email, role },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    description: `${role} account created for ${firstName} ${lastName}`,
  });

  // Remove sensitive fields from response
  const userObj = user.toObject();
  delete userObj.password;

  res.status(HTTP_STATUS.CREATED).json(
    new ApiResponse(
      HTTP_STATUS.CREATED,
      { user: userObj },
      'User created successfully'
    )
  );
});

// ─── UPDATE USER ──────────────────────────────────────────────
export const updateUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found'));
  }

  // Prevent updating own role
  if (
    req.params.id === req.user._id.toString() &&
    req.body.role &&
    req.body.role !== user.role
  ) {
    return next(
      new ApiError(HTTP_STATUS.FORBIDDEN, 'You cannot change your own role')
    );
  }

  const allowedFields = [
    'firstName',
    'lastName',
    'phone',
    'cnic',
    'gender',
    'dateOfBirth',
    'address',
    'institute',
    'department',
    'isActive',
    'mustChangePassword',
  ];

  // Only superadmin can change roles
  if (req.user.role === ROLES.SUPER_ADMIN && req.body.role) {
    allowedFields.push('role');
  }

  const previousData = { firstName: user.firstName, lastName: user.lastName };

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      user[field] = req.body[field];
    }
  });

  await user.save({ validateBeforeSave: false });

  await user.populate([
    { path: 'institute', select: 'name code' },
    { path: 'department', select: 'name code' },
  ]);

  await AuditLog.log({
    user: req.user._id,
    userSnapshot: {
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      role: req.user.role,
    },
    action: 'USER_UPDATED',
    resource: 'user',
    resourceId: user._id,
    previousData,
    newData: req.body,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  const userObj = user.toObject();
  delete userObj.password;

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, { user: userObj }, 'User updated successfully')
  );
});

// ─── DELETE USER (Soft Delete) ────────────────────────────────
export const deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found'));
  }

  // Cannot delete yourself
  if (req.params.id === req.user._id.toString()) {
    return next(
      new ApiError(HTTP_STATUS.BAD_REQUEST, 'You cannot delete your own account')
    );
  }

  // Cannot delete superadmin
  if (user.role === ROLES.SUPER_ADMIN) {
    return next(
      new ApiError(HTTP_STATUS.FORBIDDEN, 'Super admin account cannot be deleted')
    );
  }

  user.isActive = false;
  await user.save({ validateBeforeSave: false });

  await AuditLog.log({
    user: req.user._id,
    userSnapshot: {
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      role: req.user.role,
    },
    action: 'USER_DELETED',
    resource: 'user',
    resourceId: user._id,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    description: `User account '${user.email}' deactivated`,
  });

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, null, 'User account deactivated successfully')
  );
});

// ─── TOGGLE USER STATUS ───────────────────────────────────────
export const toggleUserStatus = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found'));
  }

  if (req.params.id === req.user._id.toString()) {
    return next(
      new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'You cannot change your own account status'
      )
    );
  }

  user.isActive = !user.isActive;
  await user.save({ validateBeforeSave: false });

  const action = user.isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED';
  const message = user.isActive
    ? 'User account activated successfully'
    : 'User account deactivated successfully';

  await AuditLog.log({
    user: req.user._id,
    userSnapshot: {
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      role: req.user.role,
    },
    action,
    resource: 'user',
    resourceId: user._id,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    description: `${user.email} ${user.isActive ? 'activated' : 'deactivated'}`,
  });

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      { isActive: user.isActive },
      message
    )
  );
});

// ─── RESET USER PASSWORD (Admin) ──────────────────────────────
export const resetUserPassword = asyncHandler(async (req, res, next) => {
  const { newPassword } = req.body;
  const user = await User.findById(req.params.id).select('+password');

  if (!user) {
    return next(new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found'));
  }

  user.password = newPassword;
  user.mustChangePassword = true;
  user.loginAttempts = 0;
  user.lockUntil = undefined;
  user.refreshTokens = [];
  await user.save();

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      null,
      'Password reset successfully. User must change password on next login.'
    )
  );
});

// ─── BULK IMPORT USERS (Excel) ────────────────────────────────
export const bulkImportStudents = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(
      new ApiError(HTTP_STATUS.BAD_REQUEST, 'Please upload an Excel file')
    );
  }

  const { institute, department, program, session } = req.body;

  if (!institute || !department || !program || !session) {
    return next(
      new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Institute, department, program, and session are required for bulk import'
      )
    );
  }

  // Validate references
  const [instituteDoc, departmentDoc, programDoc, sessionDoc] =
    await Promise.all([
      Institute.findById(institute),
      Department.findById(department),
      Program.findById(program),
      Session.findById(session),
    ]);

  if (!instituteDoc) {
    return next(new ApiError(HTTP_STATUS.NOT_FOUND, 'Institute not found'));
  }
  if (!departmentDoc) {
    return next(new ApiError(HTTP_STATUS.NOT_FOUND, 'Department not found'));
  }
  if (!programDoc) {
    return next(new ApiError(HTTP_STATUS.NOT_FOUND, 'Program not found'));
  }
  if (!sessionDoc) {
    return next(new ApiError(HTTP_STATUS.NOT_FOUND, 'Session not found'));
  }

  // Parse Excel
  let parsedData;
  try {
    parsedData = await parseExcelBuffer(req.file.buffer);
  } catch (error) {
    return next(
      new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        `Failed to parse Excel file: ${error.message}`
      )
    );
  }

  const { rows } = parsedData;

  if (rows.length === 0) {
    return next(
      new ApiError(HTTP_STATUS.BAD_REQUEST, 'No data found in the Excel file')
    );
  }

  if (rows.length > 200) {
    return next(
      new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Cannot import more than 200 students at once'
      )
    );
  }

  const results = {
    success: [],
    failed: [],
    total: rows.length,
  };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + 2; // Excel row number (1 = header, 2 = first data row)

    try {
      // Validate required fields
      if (!row.first_name || !row.last_name || !row.email || !row.password || !row.father_name) {
        results.failed.push({
          row: rowNumber,
          email: row.email || 'N/A',
          reason: 'Required fields missing (first_name, last_name, email, password, father_name)',
        });
        continue;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(row.email)) {
        results.failed.push({
          row: rowNumber,
          email: row.email,
          reason: 'Invalid email format',
        });
        continue;
      }

      // Check email uniqueness
      const emailExists = await User.findOne({
        email: row.email.toLowerCase(),
      });
      if (emailExists) {
        results.failed.push({
          row: rowNumber,
          email: row.email,
          reason: 'Email already exists',
        });
        continue;
      }

      // Create user
      const newUser = await User.create({
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email.toLowerCase().trim(),
        password: row.password,
        role: ROLES.STUDENT,
        institute,
        department,
        phone: row.phone || null,
        cnic: row.cnic || null,
        gender: ['male', 'female'].includes(row.gender?.toLowerCase())
          ? row.gender.toLowerCase()
          : null,
        dateOfBirth: row.date_of_birth || null,
        mustChangePassword: true,
        createdBy: req.user._id,
      });

      // Generate roll number and registration number
      const [rollNumber, registrationNumber] = await Promise.all([
        generateRollNumber(instituteDoc, departmentDoc, sessionDoc),
        generateRegistrationNumber(programDoc, sessionDoc),
      ]);

      // Create student profile
      const studentProfile = await StudentProfile.create({
        user: newUser._id,
        rollNumber,
        registrationNumber,
        institute,
        department,
        program,
        session,
        currentSemester: 1,
        fatherName: row.father_name,
        fatherCnic: row.father_cnic || null,
        guardianPhone: row.guardian_phone || null,
        bloodGroup: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].includes(
          row.blood_group
        )
          ? row.blood_group
          : null,
        admissionType: ['regular', 'lateral', 'transfer'].includes(
          row.admission_type
        )
          ? row.admission_type
          : 'regular',
        createdBy: req.user._id,
      });

      // Send verification email
      try {
        const verificationToken = generateEmailVerificationToken(newUser._id);
        newUser.emailVerificationToken = verificationToken;
        newUser.emailVerificationExpires = new Date(
          Date.now() + 24 * 60 * 60 * 1000
        );
        await newUser.save({ validateBeforeSave: false });
        await sendVerificationEmail(newUser, verificationToken);
      } catch (_emailErr) {
        // Non-blocking
      }

      results.success.push({
        row: rowNumber,
        email: newUser.email,
        rollNumber,
        registrationNumber,
        studentId: studentProfile._id,
      });
    } catch (error) {
      results.failed.push({
        row: rowNumber,
        email: row.email || 'N/A',
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
    action: 'STUDENT_PROFILE_CREATED',
    resource: 'user',
    newData: {
      bulkImport: true,
      successCount: results.success.length,
      failedCount: results.failed.length,
      institute,
      department,
      program,
      session,
    },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    description: `Bulk import: ${results.success.length} students created, ${results.failed.length} failed`,
  });

  res.status(HTTP_STATUS.CREATED).json(
    new ApiResponse(
      HTTP_STATUS.CREATED,
      { results },
      `Import complete: ${results.success.length} students created, ${results.failed.length} failed`
    )
  );
});

// ─── DOWNLOAD IMPORT TEMPLATE ─────────────────────────────────
export const downloadImportTemplate = asyncHandler(async (req, res, next) => {
  const { generateStudentImportTemplate } = await import(
    '../services/upload.service.js'
  );

  const buffer = await generateStudentImportTemplate();

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    'attachment; filename=student_import_template.xlsx'
  );
  res.send(Buffer.from(buffer));
});

// ─── UPLOAD USER AVATAR (Admin) ───────────────────────────────
export const uploadUserAvatar = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new ApiError(HTTP_STATUS.BAD_REQUEST, 'Please upload an image'));
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found'));
  }

  // Delete old avatar
  if (user.avatarPublicId) {
    await deleteFromCloudinary(user.avatarPublicId).catch(() => {});
  }

  const result = await uploadToCloudinary(req.file.buffer, {
    folder: 'iras/avatars',
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
  });

  user.avatar = result.secure_url;
  user.avatarPublicId = result.public_id;
  await user.save({ validateBeforeSave: false });

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      { avatar: user.avatar },
      'Avatar updated successfully'
    )
  );
});

// ─── GET USER STATS (Admin Dashboard) ────────────────────────
export const getUserStats = asyncHandler(async (req, res, next) => {
  const [
    totalUsers,
    totalStudents,
    totalTeachers,
    totalHoDs,
    totalAdmins,
    activeUsers,
    recentUsers,
    usersByRole,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: ROLES.STUDENT }),
    User.countDocuments({ role: ROLES.TEACHER }),
    User.countDocuments({ role: ROLES.HOD }),
    User.countDocuments({ role: { $in: [ROLES.ADMIN, ROLES.SUPER_ADMIN] } }),
    User.countDocuments({ isActive: true }),
    User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('firstName lastName email role avatar createdAt')
      .lean(),
    User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        stats: {
          totalUsers,
          totalStudents,
          totalTeachers,
          totalHoDs,
          totalAdmins,
          activeUsers,
          inactiveUsers: totalUsers - activeUsers,
        },
        recentUsers,
        usersByRole,
      },
      'User statistics fetched successfully'
    )
  );
});