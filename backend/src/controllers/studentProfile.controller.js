import StudentProfile from '../models/StudentProfile.model.js';
import User from '../models/User.model.js';
import Institute from '../models/Institute.model.js';
import Department from '../models/Department.model.js';
import Program from '../models/Program.model.js';
import Session from '../models/Session.model.js';
import Marks from '../models/Marks.model.js';
import SemesterResult from '../models/SemesterResult.model.js';
import AuditLog from '../models/AuditLog.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../middleware/asyncHandler.middleware.js';
import { HTTP_STATUS, ROLES, ENROLLMENT_STATUS } from '../utils/constants.js';
import { getPaginationMeta, parseSortString } from '../utils/helpers.js';
import {
  generateRollNumber,
  generateRegistrationNumber,
} from '../utils/generateRollNumber.js';
import { sendVerificationEmail } from '../services/email.service.js';
import { generateEmailVerificationToken } from '../utils/generateToken.js';

// ─── CREATE STUDENT (with Profile) ───────────────────────────
export const createStudent = asyncHandler(async (req, res, next) => {
  const {
    firstName,
    lastName,
    email,
    password,
    institute,
    department,
    program,
    session,
    fatherName,
    fatherCnic,
    guardianPhone,
    phone,
    cnic,
    gender,
    dateOfBirth,
    bloodGroup,
    address,
    admissionDate,
    admissionType,
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

  // Validate all references
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

  // Validate relationships
  if (departmentDoc.institute.toString() !== institute) {
    return next(
      new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Department does not belong to the specified institute'
      )
    );
  }
  if (programDoc.department.toString() !== department) {
    return next(
      new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Program does not belong to the specified department'
      )
    );
  }
  if (sessionDoc.program.toString() !== program) {
    return next(
      new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Session does not belong to the specified program'
      )
    );
  }

  // Generate roll number and registration number
  const [rollNumber, registrationNumber] = await Promise.all([
    generateRollNumber(instituteDoc, departmentDoc, sessionDoc),
    generateRegistrationNumber(programDoc, sessionDoc),
  ]);

  // Create user account
  const newUser = await User.create({
    firstName,
    lastName,
    email: email.toLowerCase(),
    password,
    role: ROLES.STUDENT,
    institute,
    department,
    phone: phone || null,
    cnic: cnic || null,
    gender: gender || null,
    dateOfBirth: dateOfBirth || null,
    address: address || {},
    mustChangePassword: mustChangePassword !== false,
    createdBy: req.user._id,
  });

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
    fatherName,
    fatherCnic: fatherCnic || null,
    guardianPhone: guardianPhone || null,
    bloodGroup: bloodGroup || null,
    admissionDate: admissionDate || new Date(),
    admissionType: admissionType || 'regular',
    enrollmentStatus: ENROLLMENT_STATUS.ACTIVE,
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
  } catch (_err) {
    // Non-blocking
  }

  await studentProfile.populate([
    { path: 'user', select: 'firstName lastName email avatar phone gender' },
    { path: 'institute', select: 'name code' },
    { path: 'department', select: 'name code' },
    { path: 'program', select: 'name code degreeType' },
    { path: 'session', select: 'name startYear endYear' },
  ]);

  await AuditLog.log({
    user: req.user._id,
    userSnapshot: {
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      role: req.user.role,
    },
    action: 'STUDENT_PROFILE_CREATED',
    resource: 'studentProfile',
    resourceId: studentProfile._id,
    newData: { rollNumber, registrationNumber, program, session },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    description: `Student profile created: ${rollNumber} - ${firstName} ${lastName}`,
  });

  res.status(HTTP_STATUS.CREATED).json(
    new ApiResponse(
      HTTP_STATUS.CREATED,
      { studentProfile },
      `Student created successfully. Roll Number: ${rollNumber}`
    )
  );
});

// ─── GET ALL STUDENTS ─────────────────────────────────────────
export const getAllStudents = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    limit = 10,
    search,
    institute,
    department,
    program,
    session,
    semester,
    enrollmentStatus,
    sort = 'rollNumber',
  } = req.query;

  // Build user search filter
  let userFilter = {};
  if (search) {
    userFilter = {
      $or: [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ],
    };
  }

  // Find matching users
  let userIds = null;
  if (search) {
    const matchingUsers = await User.find(userFilter).select('_id').lean();
    userIds = matchingUsers.map((u) => u._id);
  }

  // Build profile filter
  const profileFilter = {};

  if (userIds !== null) {
    profileFilter.$or = [
      { user: { $in: userIds } },
      { rollNumber: { $regex: search, $options: 'i' } },
      { registrationNumber: { $regex: search, $options: 'i' } },
      { fatherName: { $regex: search, $options: 'i' } },
    ];
  }

  // Role-based filtering
  if (req.user.role === ROLES.HOD) {
    profileFilter.department = req.user.department?._id;
  } else if (req.user.role === ROLES.DIRECTOR) {
    profileFilter.institute = req.user.institute?._id;
  } else {
    if (institute) profileFilter.institute = institute;
    if (department) profileFilter.department = department;
  }

  if (program) profileFilter.program = program;
  if (session) profileFilter.session = session;
  if (semester) profileFilter.currentSemester = parseInt(semester);
  if (enrollmentStatus) profileFilter.enrollmentStatus = enrollmentStatus;
  else profileFilter.enrollmentStatus = ENROLLMENT_STATUS.ACTIVE;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [students, total] = await Promise.all([
    StudentProfile.find(profileFilter)
      .populate('user', 'firstName lastName email avatar phone gender cnic isActive')
      .populate('institute', 'name code')
      .populate('department', 'name code')
      .populate('program', 'name code degreeType')
      .populate('session', 'name startYear endYear')
      .sort(parseSortString(sort))
      .skip(skip)
      .limit(parseInt(limit))
      .lean({ virtuals: true }),
    StudentProfile.countDocuments(profileFilter),
  ]);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        students,
        pagination: getPaginationMeta(total, page, limit),
      },
      'Students fetched successfully'
    )
  );
});

// ─── GET SINGLE STUDENT ───────────────────────────────────────
export const getStudentById = asyncHandler(async (req, res, next) => {
  const studentProfile = await StudentProfile.findById(req.params.id)
    .populate('user', 'firstName lastName email avatar phone gender cnic dateOfBirth address isActive isEmailVerified lastLogin createdAt')
    .populate('institute', 'name code logo')
    .populate('department', 'name code')
    .populate('program', 'name code degreeType totalSemesters totalCreditHours')
    .populate('session', 'name startYear endYear currentSemester')
    .populate({
      path: 'failedCourses.course',
      select: 'name code creditHours semester',
    })
    .lean({ virtuals: true });

  if (!studentProfile) {
    return next(
      new ApiError(HTTP_STATUS.NOT_FOUND, 'Student profile not found')
    );
  }

  // Get semester results summary
  const semesterResults = await SemesterResult.find({
    student: studentProfile._id,
    isPublished: true,
  })
    .select('semester semesterGPA cumulativeGPA status totalCoursesPassed totalCoursesFailed totalCreditHoursEarned')
    .populate('session', 'name')
    .sort({ semester: 1 })
    .lean();

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      { studentProfile: { ...studentProfile, semesterResults } },
      'Student profile fetched successfully'
    )
  );
});

// ─── GET STUDENT BY USER ID ───────────────────────────────────
export const getStudentByUserId = asyncHandler(async (req, res, next) => {
  const studentProfile = await StudentProfile.findOne({ user: req.params.userId })
    .populate('user', 'firstName lastName email avatar phone gender cnic dateOfBirth address isActive isEmailVerified lastLogin')
    .populate('institute', 'name code logo')
    .populate('department', 'name code')
    .populate('program', 'name code degreeType totalSemesters')
    .populate('session', 'name startYear endYear')
    .lean({ virtuals: true });

  if (!studentProfile) {
    return next(
      new ApiError(HTTP_STATUS.NOT_FOUND, 'Student profile not found')
    );
  }

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      { studentProfile },
      'Student profile fetched successfully'
    )
  );
});

// ─── UPDATE STUDENT PROFILE ───────────────────────────────────
export const updateStudentProfile = asyncHandler(async (req, res, next) => {
  const studentProfile = await StudentProfile.findById(req.params.id);

  if (!studentProfile) {
    return next(
      new ApiError(HTTP_STATUS.NOT_FOUND, 'Student profile not found')
    );
  }

  const allowedFields = [
    'fatherName',
    'fatherCnic',
    'guardianPhone',
    'bloodGroup',
    'admissionDate',
    'admissionType',
    'enrollmentStatus',
    'scholarship',
    'scholarshipDetails',
  ];

  // Admin/HoD can update enrollment status
  if (
    [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HOD].includes(req.user.role)
  ) {
    allowedFields.push('enrollmentStatus');
  }

  const previousData = {
    fatherName: studentProfile.fatherName,
    enrollmentStatus: studentProfile.enrollmentStatus,
  };

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      studentProfile[field] = req.body[field];
    }
  });

  await studentProfile.save();

  await studentProfile.populate([
    { path: 'user', select: 'firstName lastName email avatar' },
    { path: 'program', select: 'name code' },
    { path: 'session', select: 'name' },
  ]);

  await AuditLog.log({
    user: req.user._id,
    userSnapshot: {
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      role: req.user.role,
    },
    action: 'STUDENT_PROFILE_UPDATED',
    resource: 'studentProfile',
    resourceId: studentProfile._id,
    previousData,
    newData: req.body,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      { studentProfile },
      'Student profile updated successfully'
    )
  );
});

// ─── GET MY STUDENT PROFILE (Student self) ────────────────────
export const getMyStudentProfile = asyncHandler(async (req, res, next) => {
  const studentProfile = await StudentProfile.findOne({ user: req.user._id })
    .populate('user', 'firstName lastName email avatar phone gender cnic dateOfBirth address isEmailVerified lastLogin')
    .populate('institute', 'name code logo')
    .populate('department', 'name code contactEmail contactPhone')
    .populate('program', 'name code degreeType totalSemesters totalCreditHours')
    .populate('session', 'name startYear endYear currentSemester')
    .populate({
      path: 'failedCourses.course',
      select: 'name code creditHours semester',
    })
    .lean({ virtuals: true });

  if (!studentProfile) {
    return next(
      new ApiError(HTTP_STATUS.NOT_FOUND, 'Student profile not found')
    );
  }

  // Get current semester marks (all courses)
  const currentMarks = await Marks.find({
    student: studentProfile._id,
    semester: studentProfile.currentSemester,
  })
    .populate('course', 'name code creditHours type')
    .select('midTerm internal finalTerm totalObtained percentage grade gradePoints marksPhase isPassed course')
    .lean();

  // Get all approved semester results
  const semesterResults = await SemesterResult.find({
    student: studentProfile._id,
    isPublished: true,
  })
    .select('semester semesterGPA cumulativeGPA status totalCoursesPassed totalCoursesFailed totalCreditHoursEarned totalCreditHoursAttempted')
    .populate('session', 'name startYear endYear')
    .sort({ semester: 1 })
    .lean();

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        studentProfile,
        currentMarks,
        semesterResults,
      },
      'Student profile fetched successfully'
    )
  );
});

// ─── GET STUDENT ACADEMIC RECORD ──────────────────────────────
export const getStudentAcademicRecord = asyncHandler(async (req, res, next) => {
  // Can be accessed by student (own), HoD, Admin
  let studentProfile;

  if (req.user.role === ROLES.STUDENT) {
    studentProfile = await StudentProfile.findOne({ user: req.user._id });
  } else {
    studentProfile = await StudentProfile.findById(req.params.id);
  }

  if (!studentProfile) {
    return next(
      new ApiError(HTTP_STATUS.NOT_FOUND, 'Student profile not found')
    );
  }

  await studentProfile.populate([
    { path: 'user', select: 'firstName lastName email avatar' },
    { path: 'institute', select: 'name code' },
    { path: 'department', select: 'name code' },
    { path: 'program', select: 'name code degreeType totalSemesters' },
    { path: 'session', select: 'name startYear endYear' },
  ]);

  // Get all marks organized by semester
  const allMarks = await Marks.find({
    student: studentProfile._id,
    marksPhase: 'approved',
  })
    .populate('course', 'name code creditHours type semester')
    .populate('session', 'name')
    .sort({ semester: 1, createdAt: 1 })
    .lean();

  // Get all semester results
  const semesterResults = await SemesterResult.find({
    student: studentProfile._id,
  })
    .populate('session', 'name startYear endYear')
    .sort({ semester: 1 })
    .lean();

  // Organize marks by semester
  const marksBySemester = allMarks.reduce((acc, mark) => {
    const sem = mark.semester;
    if (!acc[sem]) acc[sem] = [];
    acc[sem].push(mark);
    return acc;
  }, {});

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        studentProfile,
        academicRecord: {
          marksBySemester,
          semesterResults,
          summary: {
            currentSemester: studentProfile.currentSemester,
            cumulativeGPA: studentProfile.cumulativeGPA,
            totalCreditHoursAttempted: studentProfile.totalCreditHoursAttempted,
            totalCreditHoursEarned: studentProfile.totalCreditHoursEarned,
            activeFailedCourses: studentProfile.activeFailedCoursesCount,
            enrollmentStatus: studentProfile.enrollmentStatus,
          },
        },
      },
      'Student academic record fetched successfully'
    )
  );
});

// ─── GET STUDENTS BY SEMESTER (for course assignment) ─────────
export const getStudentsBySemester = asyncHandler(async (req, res, next) => {
  const { semester, department, session, program } = req.query;

  if (!semester || !department) {
    return next(
      new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Semester and department are required'
      )
    );
  }

  const filter = {
    department,
    currentSemester: parseInt(semester),
    enrollmentStatus: ENROLLMENT_STATUS.ACTIVE,
  };

  if (session) filter.session = session;
  if (program) filter.program = program;

  const students = await StudentProfile.find(filter)
    .populate('user', 'firstName lastName email avatar')
    .populate('session', 'name startYear endYear')
    .select('rollNumber registrationNumber fatherName currentSemester cumulativeGPA user session program')
    .sort({ rollNumber: 1 })
    .lean();

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      { students, total: students.length },
      `${students.length} student(s) found for semester ${semester}`
    )
  );
});

// ─── GET STUDENT CURRENT SEMESTER MARKS ───────────────────────
// ─── GET STUDENT CURRENT SEMESTER MARKS ───────────────────────
export const getStudentCurrentMarks = asyncHandler(async (req, res, next) => {
  // Students can only view their own marks
  let studentProfile;

  if (req.user.role === ROLES.STUDENT) {
    studentProfile = await StudentProfile.findOne({ user: req.user._id });
  } else {
    // Admin/HoD can view any student
    const { id } = req.params;
    studentProfile = await StudentProfile.findById(id);
  }

  if (!studentProfile) {
    return next(new ApiError(HTTP_STATUS.NOT_FOUND, 'Student profile not found'));
  }

  const Marks = (await import('../models/Marks.model.js')).default;

  const marks = await Marks.find({
    student: studentProfile._id,
    semester: studentProfile.currentSemester,
  })
    .populate({
      path: 'course',
      select: 'name code creditHours type semester marksDistribution',
    })
    .populate({
      path: 'teacher',
      select: 'firstName lastName',
    })
    .select(
      'midTerm internal finalTerm totalObtained totalMarks percentage grade gradePoints qualityPoints isPassed marksPhase course teacher remarks semester'
    )
    .lean();

  const marksWithStatus = marks.map((mark) => ({
    ...mark,
    displayStatus: getMarksDisplayStatus(mark.marksPhase),
    canViewFullResult: ['submitted-to-hod', 'approved'].includes(mark.marksPhase),
    isApproved: mark.marksPhase === 'approved',
  }));

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        semester: studentProfile.currentSemester,
        marks: marksWithStatus,
        total: marks.length,
      },
      'Current semester marks fetched successfully'
    )
  );
});

// ─── HELPER ───────────────────────────────────────────────────
const getMarksDisplayStatus = (phase) => {
  const statusMap = {
    'not-started': 'Marks Not Yet Entered',
    'midterm-entered': 'Mid-Term Marks Available',
    'finals-entered': 'Complete Marks Available (Pending Approval)',
    'submitted-to-hod': 'Result Submitted to HoD',
    approved: 'Result Officially Approved',
    rejected: 'Result Returned for Correction',
  };
  return statusMap[phase] || 'Unknown Status';
};