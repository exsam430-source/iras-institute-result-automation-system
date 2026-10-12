import CourseAssignment from '../models/CourseAssignment.model.js';
import Course from '../models/Course.model.js';
import User from '../models/User.model.js';
import Session from '../models/Session.model.js';
import Department from '../models/Department.model.js';
import Institute from '../models/Institute.model.js';
import Program from '../models/Program.model.js';
import StudentProfile from '../models/StudentProfile.model.js';
import Marks from '../models/Marks.model.js';
import AuditLog from '../models/AuditLog.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../middleware/asyncHandler.middleware.js';
import { HTTP_STATUS, ROLES, ASSIGNMENT_STATUS, MARKS_PHASE } from '../utils/constants.js';
import { getPaginationMeta, parseSortString } from '../utils/helpers.js';
import {
  autoEnrollStudents,
  createMarksRecords,
  generateAwardList,
  updateAssignmentStatistics,
} from '../services/awardList.service.js';
import {
  notifyTeacherCourseAssigned,
  notifyHoDResultSubmitted,
  notifyStudentsResultApproved,
  notifyTeacherResultRejected,
} from '../services/notification.service.js';
import { buildSubmissionValidationResult } from '../utils/marksWorkflow.utils.js';

// ─── GET ALL COURSE ASSIGNMENTS ───────────────────────────────
export const getAllCourseAssignments = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    limit = 10,
    teacher,
    department,
    institute,
    session,
    semester,
    status,
    sort = '-createdAt',
  } = req.query;

  const filter = {};

  // Role-based filtering
  if (req.user.role === ROLES.TEACHER) {
    filter.teacher = req.user._id;
  } else if (req.user.role === ROLES.HOD) {
    filter.department = req.user.department?._id;
  } else if (req.user.role === ROLES.DIRECTOR) {
    filter.institute = req.user.institute?._id;
  } else {
    // Admin / SuperAdmin
    if (teacher) filter.teacher = teacher;
    if (department) filter.department = department;
    if (institute) filter.institute = institute;
  }

  if (session) filter.session = session;
  if (semester) filter.semester = parseInt(semester);
  if (status) filter.status = status;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [assignments, total] = await Promise.all([
    CourseAssignment.find(filter)
      .populate('course', 'name code creditHours type semester marksDistribution')
      .populate('teacher', 'firstName lastName email avatar')
      .populate('session', 'name startYear endYear')
      .populate('department', 'name code')
      .populate('institute', 'name code')
      .populate('program', 'name code')
      .populate('assignedBy', 'firstName lastName')
      .sort(parseSortString(sort))
      .skip(skip)
      .limit(parseInt(limit))
      .lean({ virtuals: true }),
    CourseAssignment.countDocuments(filter),
  ]);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        assignments,
        pagination: getPaginationMeta(total, page, limit),
      },
      'Course assignments fetched successfully'
    )
  );
});

// ─── GET SINGLE COURSE ASSIGNMENT ─────────────────────────────
export const getCourseAssignmentById = asyncHandler(async (req, res, next) => {
  const assignment = await CourseAssignment.findById(req.params.id)
    .populate('course', 'name code creditHours type semester marksDistribution description')
    .populate('teacher', 'firstName lastName email avatar phone')
    .populate('session', 'name startYear endYear currentSemester')
    .populate('department', 'name code')
    .populate('institute', 'name code logo')
    .populate('program', 'name code degreeType')
    .populate('assignedBy', 'firstName lastName')
    .populate('approvedBy', 'firstName lastName')
    .populate('rejectedBy', 'firstName lastName')
    .lean({ virtuals: true });

  if (!assignment) {
    return next(
      new ApiError(HTTP_STATUS.NOT_FOUND, 'Course assignment not found')
    );
  }

  // Role-based access check
  if (
    req.user.role === ROLES.TEACHER &&
    assignment.teacher._id.toString() !== req.user._id.toString()
  ) {
    return next(
      new ApiError(
        HTTP_STATUS.FORBIDDEN,
        'You can only view your own course assignments'
      )
    );
  }

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      { assignment },
      'Course assignment fetched successfully'
    )
  );
});

// ─── CREATE COURSE ASSIGNMENT (HoD assigns course to teacher) ─
// ─── CREATE COURSE ASSIGNMENT (HoD assigns course to teacher) ─
export const createCourseAssignment = asyncHandler(async (req, res, next) => {
  const {
    course,
    teacher,
    session,
    semester,
    institute,
    department,
    program,
    section,
    academicYear,
  } = req.body;

  // Validate all references
  const [courseDoc, teacherDoc, sessionDoc, departmentDoc, programDoc] =
    await Promise.all([
      Course.findById(course),
      User.findById(teacher),
      Session.findById(session),
      Department.findById(department),
      Program.findById(program),
    ]);

  if (!courseDoc) {
    return next(new ApiError(HTTP_STATUS.NOT_FOUND, 'Course not found'));
  }
  if (!teacherDoc) {
    return next(new ApiError(HTTP_STATUS.NOT_FOUND, 'Teacher not found'));
  }
  if (!sessionDoc) {
    return next(new ApiError(HTTP_STATUS.NOT_FOUND, 'Session not found'));
  }
  if (!departmentDoc) {
    return next(new ApiError(HTTP_STATUS.NOT_FOUND, 'Department not found'));
  }
  if (!programDoc) {
    return next(new ApiError(HTTP_STATUS.NOT_FOUND, 'Program not found'));
  }

  // Validate teacher role
  if (teacherDoc.role !== ROLES.TEACHER) {
    return next(
      new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Selected user must have the Teacher role'
      )
    );
  }

  // Validate teacher belongs to department
  if (
    teacherDoc.department &&
    teacherDoc.department.toString() !== department
  ) {
    return next(
      new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Teacher does not belong to the specified department'
      )
    );
  }

  // Check for duplicate assignment
  const existingAssignment = await CourseAssignment.findOne({
    course,
    session,
    department,
    ...(section ? { section: section.toUpperCase() } : {}),
  });

  if (existingAssignment) {
    return next(
      new ApiError(
        HTTP_STATUS.CONFLICT,
        `This course is already assigned for this session${section ? ` and section ${section}` : ''}. Please check existing assignments.`
      )
    );
  }

  // HoD can only assign in their own department
  if (
    req.user.role === ROLES.HOD &&
    req.user.department?._id.toString() !== department
  ) {
    return next(
      new ApiError(
        HTTP_STATUS.FORBIDDEN,
        'You can only assign courses in your own department'
      )
    );
  }

  // Create the assignment
  const assignment = await CourseAssignment.create({
    course,
    teacher,
    session,
    semester,
    institute,
    department,
    program,
    section: section ? section.toUpperCase() : null,
    academicYear: academicYear || new Date().getFullYear().toString(),
    assignedBy: req.user._id,
    assignedAt: new Date(),
    status: ASSIGNMENT_STATUS.ASSIGNED,
  });

  // ─── AUTO-ENROLL STUDENTS ─────────────────────────────────
  // ✅ FIXED: Destructure safely, handle empty result
  const enrollResult = await autoEnrollStudents({
    department,
    session,
    semester,
    program,
  });

  const enrolledStudents = enrollResult?.enrolledStudents || [];
  const students = enrollResult?.students || [];
  let enrolledCount = 0;

  if (enrolledStudents.length > 0) {
    assignment.enrolledStudents = enrolledStudents;
    assignment.awardListGenerated = true;
    assignment.awardListGeneratedAt = new Date();
    assignment.status = ASSIGNMENT_STATUS.AWARD_LIST_READY;

    await assignment.save();

    // Create marks records for each enrolled student
    enrolledCount = await createMarksRecords(assignment, students, courseDoc);
  } else {
    await assignment.save();
  }

  // Update statistics
  assignment.statistics.totalStudents = enrolledCount;
  await assignment.save();

  // Populate for response
  await assignment.populate([
    { path: 'course', select: 'name code creditHours semester marksDistribution' },
    { path: 'teacher', select: 'firstName lastName email avatar' },
    { path: 'session', select: 'name startYear endYear' },
    { path: 'department', select: 'name code' },
    { path: 'program', select: 'name code' },
  ]);

  // Notify teacher
  await notifyTeacherCourseAssigned({
    teacherUserId: teacher,
    courseName: courseDoc.name,
    courseCode: courseDoc.code,
    semester,
    session: sessionDoc.name,
    department: departmentDoc.name,
    courseAssignmentId: assignment._id,
    hodId: req.user._id,
  });

  await AuditLog.log({
    user: req.user._id,
    userSnapshot: {
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      role: req.user.role,
    },
    action: 'COURSE_ASSIGNED',
    resource: 'courseAssignment',
    resourceId: assignment._id,
    newData: {
      course: courseDoc.name,
      teacher: `${teacherDoc.firstName} ${teacherDoc.lastName}`,
      semester,
      session: sessionDoc.name,
      enrolledStudents: enrolledCount,
    },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    description: `Course '${courseDoc.name}' assigned to ${teacherDoc.firstName} ${teacherDoc.lastName}. ${enrolledCount} students auto-enrolled.`,
  });

  res.status(HTTP_STATUS.CREATED).json(
    new ApiResponse(
      HTTP_STATUS.CREATED,
      {
        assignment,
        enrolledCount,
        message: enrolledCount > 0
          ? `Course assigned successfully. ${enrolledCount} students auto-enrolled in award list.`
          : 'Course assigned successfully. No active students found for auto-enrollment.',
      },
      'Course assigned successfully'
    )
  );
});

// ─── UPDATE COURSE ASSIGNMENT ─────────────────────────────────
export const updateCourseAssignment = asyncHandler(async (req, res, next) => {
  const assignment = await CourseAssignment.findById(req.params.id);

  if (!assignment) {
    return next(
      new ApiError(HTTP_STATUS.NOT_FOUND, 'Course assignment not found')
    );
  }

  // Cannot update if already submitted/approved
  if (
    [ASSIGNMENT_STATUS.SUBMITTED, ASSIGNMENT_STATUS.APPROVED].includes(
      assignment.status
    )
  ) {
    return next(
      new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Cannot update a submitted or approved assignment'
      )
    );
  }

  const { teacher, section, academicYear } = req.body;

  // Validate new teacher if being changed
  if (teacher && teacher !== assignment.teacher.toString()) {
    const teacherDoc = await User.findById(teacher);
    if (!teacherDoc || teacherDoc.role !== ROLES.TEACHER) {
      return next(
        new ApiError(
          HTTP_STATUS.BAD_REQUEST,
          'Invalid teacher selected'
        )
      );
    }

    // Update marks records teacher reference
    await Marks.updateMany(
      { courseAssignment: assignment._id },
      { teacher }
    );

    // Notify new teacher
    const courseDoc = await Course.findById(assignment.course);
    const sessionDoc = await Session.findById(assignment.session);
    const deptDoc = await Department.findById(assignment.department);

    await notifyTeacherCourseAssigned({
      teacherUserId: teacher,
      courseName: courseDoc?.name,
      courseCode: courseDoc?.code,
      semester: assignment.semester,
      session: sessionDoc?.name,
      department: deptDoc?.name,
      courseAssignmentId: assignment._id,
      hodId: req.user._id,
    });

    assignment.teacher = teacher;
  }

  if (section !== undefined) assignment.section = section?.toUpperCase() || null;
  if (academicYear !== undefined) assignment.academicYear = academicYear;

  await assignment.save();

  await assignment.populate([
    { path: 'course', select: 'name code creditHours' },
    { path: 'teacher', select: 'firstName lastName email' },
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
    action: 'COURSE_REASSIGNED',
    resource: 'courseAssignment',
    resourceId: assignment._id,
    newData: req.body,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      { assignment },
      'Course assignment updated successfully'
    )
  );
});

// ─── DELETE COURSE ASSIGNMENT ─────────────────────────────────
export const deleteCourseAssignment = asyncHandler(async (req, res, next) => {
  const assignment = await CourseAssignment.findById(req.params.id);

  if (!assignment) {
    return next(
      new ApiError(HTTP_STATUS.NOT_FOUND, 'Course assignment not found')
    );
  }

  if (
    [ASSIGNMENT_STATUS.SUBMITTED, ASSIGNMENT_STATUS.APPROVED].includes(
      assignment.status
    )
  ) {
    return next(
      new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Cannot delete a submitted or approved assignment'
      )
    );
  }

  // Delete associated marks records
  await Marks.deleteMany({ courseAssignment: assignment._id });

  await assignment.deleteOne();

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      null,
      'Course assignment deleted successfully'
    )
  );
});

// ─── GET AWARD LIST ───────────────────────────────────────────
export const getAwardList = asyncHandler(async (req, res, next) => {
  const assignment = await CourseAssignment.findById(req.params.id);

  if (!assignment) {
    return next(
      new ApiError(HTTP_STATUS.NOT_FOUND, 'Course assignment not found')
    );
  }

  // Teacher can only view their own award list
  if (
    req.user.role === ROLES.TEACHER &&
    assignment.teacher.toString() !== req.user._id.toString()
  ) {
    return next(
      new ApiError(
        HTTP_STATUS.FORBIDDEN,
        'You can only view your own award lists'
      )
    );
  }

  const awardList = await generateAwardList(req.params.id);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      { awardList },
      'Award list fetched successfully'
    )
  );
});

// ─── REGENERATE AWARD LIST (add new students) ─────────────────
export const regenerateAwardList = asyncHandler(async (req, res, next) => {
  const assignment = await CourseAssignment.findById(req.params.id)
    .populate('course', 'name code marksDistribution');

  if (!assignment) {
    return next(
      new ApiError(HTTP_STATUS.NOT_FOUND, 'Course assignment not found')
    );
  }

  // Only allowed before submission
  if (
    [ASSIGNMENT_STATUS.SUBMITTED, ASSIGNMENT_STATUS.APPROVED].includes(
      assignment.status
    )
  ) {
    return next(
      new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Cannot regenerate award list for a submitted or approved assignment'
      )
    );
  }

  // Get fresh student list
  const { enrolledStudents, students } = await autoEnrollStudents({
    department: assignment.department,
    session: assignment.session,
    semester: assignment.semester,
    program: assignment.program,
  });

  // Find new students not already enrolled
  const existingStudentIds = assignment.enrolledStudents.map((s) =>
    s.student.toString()
  );

  const newStudents = students.filter(
    (s) => !existingStudentIds.includes(s._id.toString())
  );

  if (newStudents.length > 0) {
    // Add new students to enrollment
    const newEnrollments = newStudents.map((s) => ({
      student: s._id,
      enrolledAt: new Date(),
      isActive: true,
    }));

    assignment.enrolledStudents.push(...newEnrollments);

    // Create marks records for new students
    const newMarksCount = await createMarksRecords(
      assignment,
      newStudents,
      assignment.course
    );

    assignment.statistics.totalStudents = assignment.enrolledStudents.filter(
      (s) => s.isActive
    ).length;
  }

  assignment.awardListGeneratedAt = new Date();
  await assignment.save();

  const awardList = await generateAwardList(req.params.id);

  await AuditLog.log({
    user: req.user._id,
    userSnapshot: {
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      role: req.user.role,
    },
    action: 'STUDENTS_ENROLLED',
    resource: 'courseAssignment',
    resourceId: assignment._id,
    newData: { newStudentsAdded: newStudents.length },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    description: `Award list regenerated. ${newStudents.length} new students added.`,
  });

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        awardList,
        newStudentsAdded: newStudents.length,
      },
      `Award list updated. ${newStudents.length} new student(s) added.`
    )
  );
});

// ─── EXPORT AWARD LIST (Excel) ────────────────────────────────
export const exportAwardList = asyncHandler(async (req, res, next) => {
  const assignment = await CourseAssignment.findById(req.params.id);

  if (!assignment) {
    return next(
      new ApiError(HTTP_STATUS.NOT_FOUND, 'Course assignment not found')
    );
  }

  if (
    req.user.role === ROLES.TEACHER &&
    assignment.teacher.toString() !== req.user._id.toString()
  ) {
    return next(
      new ApiError(HTTP_STATUS.FORBIDDEN, 'Access denied')
    );
  }

  const awardList = await generateAwardList(req.params.id);

  const { generateMarksExcel } = await import('../services/upload.service.js');

  const buffer = await generateMarksExcel({
    course: awardList.assignment.course,
    teacher: awardList.assignment.teacher,
    session: awardList.assignment.session,
    semester: awardList.assignment.semester,
    department: awardList.assignment.department,
    institute: awardList.assignment.institute,
    entries: awardList.entries,
  });

  const fileName = `award-list-${awardList.assignment.course.code}-sem${awardList.assignment.semester}.xlsx`;

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${fileName}"`
  );
  res.send(Buffer.from(buffer));
});

// ─── SUBMIT RESULT TO HOD ─────────────────────────────────────
// ─── SUBMIT RESULT TO HOD ─────────────────────────────────────
export const submitResultToHoD = asyncHandler(async (req, res, next) => {
  const assignment = await CourseAssignment.findById(req.params.id)
    .populate('course', 'name code creditHours')
    .populate('teacher', 'firstName lastName email')
    .populate('session', 'name')
    .populate('department', 'name code');

  if (!assignment) {
    return next(new ApiError(HTTP_STATUS.NOT_FOUND, 'Course assignment not found'));
  }

  // Only teacher can submit
  if (assignment.teacher._id.toString() !== req.user._id.toString()) {
    return next(
      new ApiError(HTTP_STATUS.FORBIDDEN, 'Only the assigned teacher can submit results')
    );
  }

  // ✅ FIXED: Allow both FINALS_SAVED and REJECTED statuses
  const submittableStatuses = [
    ASSIGNMENT_STATUS.FINALS_SAVED,
    ASSIGNMENT_STATUS.REJECTED,
  ];

  if (!submittableStatuses.includes(assignment.status)) {
    return next(
      new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        assignment.status === ASSIGNMENT_STATUS.SUBMITTED
          ? 'Result has already been submitted to HoD'
          : assignment.status === ASSIGNMENT_STATUS.APPROVED
          ? 'Result has already been approved'
          : 'Please save all marks (mid-term and finals) before submitting'
      )
    );
  }

  const activeEnrolledStudentIds = assignment.enrolledStudents
    .filter((student) => student.isActive)
    .map((student) => student.student.toString());

  const existingMarks = await Marks.find({
    courseAssignment: assignment._id,
  }).select('student midTerm internal finalTerm').lean();

  const existingMarkStudentIds = existingMarks.map((mark) => mark.student.toString());
  const incompleteMarks = existingMarks.filter((mark) => {
    return !mark.midTerm?.isEntered || !mark.internal?.isEntered || !mark.finalTerm?.isEntered;
  }).length;

  const submissionValidation = buildSubmissionValidationResult({
    activeEnrolledStudentIds,
    existingMarkStudentIds,
    incompleteMarkCount: incompleteMarks,
  });

  if (!submissionValidation.canSubmit) {
    const reasons = [];
    if (submissionValidation.missingCount > 0) {
      reasons.push(`${submissionValidation.missingCount} enrolled student(s) do not have a mark record yet`);
    }
    if (submissionValidation.incompleteCount > 0) {
      reasons.push(`${submissionValidation.incompleteCount} student mark record(s) are incomplete`);
    }

    return next(
      new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        `Cannot submit results before all enrolled students have complete marks. ${reasons.join(' and ')}.`
      )
    );
  }

  // ✅ FIXED: Use correct MARKS_PHASE constant instead of ASSIGNMENT_STATUS
  await Marks.updateMany(
    {
      courseAssignment: assignment._id,
      marksPhase: {
        $in: [MARKS_PHASE.FINALS_ENTERED, MARKS_PHASE.REJECTED],
      },
    },
    {
      marksPhase: 'submitted-to-hod',
      submittedAt: new Date(),
    }
  );

  // Update assignment status
  assignment.status = ASSIGNMENT_STATUS.SUBMITTED;
  assignment.submittedAt = new Date();
  await assignment.save();

  // Update and cache statistics
  const statistics = await updateAssignmentStatistics(assignment._id);

  // Find HoD of department and notify
  const hodUser = await User.findOne({
    department: assignment.department._id,
    role: ROLES.HOD,
    isActive: true,
  });

  if (hodUser) {
    await notifyHoDResultSubmitted({
      hodUserId: hodUser._id,
      teacherName: `${assignment.teacher.firstName} ${assignment.teacher.lastName}`,
      courseName: assignment.course.name,
      courseCode: assignment.course.code,
      semester: assignment.semester,
      totalStudents: statistics.totalStudents,
      passRate: statistics.passRate,
      courseAssignmentId: assignment._id,
      courseId: assignment.course._id,
      senderId: req.user._id,
    });
  }

  await AuditLog.log({
    user: req.user._id,
    userSnapshot: {
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      role: req.user.role,
    },
    action: 'RESULT_SUBMITTED',
    resource: 'courseAssignment',
    resourceId: assignment._id,
    newData: {
      course: assignment.course.name,
      totalStudents: statistics.totalStudents,
      passRate: statistics.passRate,
    },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    description: `Result submitted to HoD for ${assignment.course.name}`,
  });

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        assignment: {
          _id: assignment._id,
          status: assignment.status,
          submittedAt: assignment.submittedAt,
          statistics,
        },
      },
      'Result submitted to HoD successfully. HoD has been notified.'
    )
  );
});

// ─── APPROVE RESULT (HoD) ─────────────────────────────────────
export const approveResult = asyncHandler(async (req, res, next) => {
  const assignment = await CourseAssignment.findById(req.params.id)
    .populate('course', 'name code creditHours')
    .populate('teacher', 'firstName lastName email')
    .populate('department', 'name code');

  if (!assignment) {
    return next(
      new ApiError(HTTP_STATUS.NOT_FOUND, 'Course assignment not found')
    );
  }

  // Only HoD of the department can approve
  if (
    req.user.role === ROLES.HOD &&
    req.user.department?._id.toString() !== assignment.department._id.toString()
  ) {
    return next(
      new ApiError(
        HTTP_STATUS.FORBIDDEN,
        'You can only approve results for your own department'
      )
    );
  }

  if (assignment.status !== ASSIGNMENT_STATUS.SUBMITTED) {
    return next(
      new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        assignment.status === ASSIGNMENT_STATUS.APPROVED
          ? 'This result has already been approved'
          : `Cannot approve result with status: ${assignment.status}`
      )
    );
  }

  // Approve all marks records
  await Marks.updateMany(
    {
      courseAssignment: assignment._id,
      marksPhase: 'submitted-to-hod',
    },
    {
      marksPhase: 'approved',
      approvedAt: new Date(),
      approvedBy: req.user._id,
    }
  );

  // Update assignment
  assignment.status = ASSIGNMENT_STATUS.APPROVED;
  assignment.approvedAt = new Date();
  assignment.approvedBy = req.user._id;
  assignment.rejectionReason = null;
  await assignment.save();

  // Get all approved marks with student info
  const approvedMarks = await Marks.find({
    courseAssignment: assignment._id,
    marksPhase: 'approved',
  })
    .populate({
      path: 'student',
      populate: { path: 'user', select: 'firstName lastName email' },
    })
    .lean();

  // Prepare student notification data
  const studentsData = approvedMarks
    .filter((m) => m.student?.user)
    .map((mark) => ({
      userId: mark.student.user._id,
      user: mark.student.user,
      marksData: {
        grade: mark.grade,
        totalObtained: mark.totalObtained,
        percentage: mark.percentage,
        gradePoints: mark.gradePoints,
      },
    }));

  // Notify all students
  await notifyStudentsResultApproved({
    studentsData,
    courseName: assignment.course.name,
    courseCode: assignment.course.code,
    semester: assignment.semester,
    courseAssignmentId: assignment._id,
    courseId: assignment.course._id,
    hodId: req.user._id,
  });

  await AuditLog.log({
    user: req.user._id,
    userSnapshot: {
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      role: req.user.role,
    },
    action: 'RESULT_APPROVED',
    resource: 'courseAssignment',
    resourceId: assignment._id,
    newData: {
      course: assignment.course.name,
      approvedStudents: studentsData.length,
    },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    description: `Result approved for ${assignment.course.name}. ${studentsData.length} students notified.`,
  });

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        assignment: {
          _id: assignment._id,
          status: assignment.status,
          approvedAt: assignment.approvedAt,
        },
        notifiedStudents: studentsData.length,
      },
      `Result approved successfully. ${studentsData.length} student(s) have been notified.`
    )
  );
});

// ─── REJECT RESULT (HoD) ──────────────────────────────────────
export const rejectResult = asyncHandler(async (req, res, next) => {
  const { rejectionReason } = req.body;

  const assignment = await CourseAssignment.findById(req.params.id)
    .populate('course', 'name code')
    .populate('teacher', 'firstName lastName email')
    .populate('department', 'name code');

  if (!assignment) {
    return next(
      new ApiError(HTTP_STATUS.NOT_FOUND, 'Course assignment not found')
    );
  }

  // Department ownership check for HoD
  if (
    req.user.role === ROLES.HOD &&
    req.user.department?._id.toString() !== assignment.department._id.toString()
  ) {
    return next(
      new ApiError(
        HTTP_STATUS.FORBIDDEN,
        'You can only reject results for your own department'
      )
    );
  }

  if (assignment.status !== ASSIGNMENT_STATUS.SUBMITTED) {
    return next(
      new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        `Cannot reject result with status: ${assignment.status}`
      )
    );
  }

  // Revert marks to finals-entered phase so teacher can edit
  await Marks.updateMany(
    {
      courseAssignment: assignment._id,
      marksPhase: 'submitted-to-hod',
    },
    {
      marksPhase: 'finals-entered',
      rejectedAt: new Date(),
      rejectedBy: req.user._id,
      rejectionReason,
    }
  );

  // Update assignment
  assignment.status = ASSIGNMENT_STATUS.REJECTED;
  assignment.rejectedAt = new Date();
  assignment.rejectedBy = req.user._id;
  assignment.rejectionReason = rejectionReason;
  await assignment.save();

  // Notify teacher
  await notifyTeacherResultRejected({
    teacherUserId: assignment.teacher._id,
    teacherUser: assignment.teacher,
    courseName: assignment.course.name,
    courseCode: assignment.course.code,
    semester: assignment.semester,
    rejectionReason,
    courseAssignmentId: assignment._id,
    courseId: assignment.course._id,
    hodId: req.user._id,
  });

  await AuditLog.log({
    user: req.user._id,
    userSnapshot: {
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      role: req.user.role,
    },
    action: 'RESULT_REJECTED',
    resource: 'courseAssignment',
    resourceId: assignment._id,
    newData: { rejectionReason },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    description: `Result rejected for ${assignment.course.name}. Reason: ${rejectionReason}`,
  });

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        assignment: {
          _id: assignment._id,
          status: assignment.status,
          rejectedAt: assignment.rejectedAt,
          rejectionReason: assignment.rejectionReason,
        },
      },
      'Result returned to teacher for correction. Teacher has been notified.'
    )
  );
});

// ─── GET TEACHER ASSIGNMENTS DASHBOARD ────────────────────────
export const getTeacherDashboard = asyncHandler(async (req, res, next) => {
  const teacherId = req.user._id;

  const [
    totalAssignments,
    pendingSubmission,
    submitted,
    approved,
    rejected,
    recentAssignments,
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
          ASSIGNMENT_STATUS.REJECTED,
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
    CourseAssignment.find({ teacher: teacherId })
      .populate('course', 'name code creditHours semester')
      .populate('session', 'name')
      .populate('department', 'name code')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean({ virtuals: true }),
  ]);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        stats: {
          totalAssignments,
          pendingSubmission,
          submitted,
          approved,
          rejected,
        },
        recentAssignments,
      },
      'Teacher dashboard data fetched successfully'
    )
  );
});

// ─── GET HOD PENDING RESULTS ──────────────────────────────────
export const getHoDPendingResults = asyncHandler(async (req, res, next) => {
  const departmentId = req.user.department?._id;

  if (!departmentId) {
    return next(
      new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'No department associated with your account'
      )
    );
  }

  const {
    page = 1,
    limit = 10,
    status = ASSIGNMENT_STATUS.SUBMITTED,
  } = req.query;

  const filter = { department: departmentId };
  if (status) filter.status = status;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [assignments, total] = await Promise.all([
    CourseAssignment.find(filter)
      .populate('course', 'name code creditHours semester')
      .populate('teacher', 'firstName lastName email avatar')
      .populate('session', 'name')
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean({ virtuals: true }),
    CourseAssignment.countDocuments(filter),
  ]);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        assignments,
        pagination: getPaginationMeta(total, page, limit),
      },
      'Pending results fetched successfully'
    )
  );
});

// ─── GET ENROLLED STUDENTS OF ASSIGNMENT ──────────────────────
export const getAssignmentStudents = asyncHandler(async (req, res, next) => {
  const assignment = await CourseAssignment.findById(req.params.id)
    .populate('course', 'name code');

  if (!assignment) {
    return next(
      new ApiError(HTTP_STATUS.NOT_FOUND, 'Course assignment not found')
    );
  }

  const enrolledIds = assignment.enrolledStudents
    .filter((s) => s.isActive)
    .map((s) => s.student);

  const students = await StudentProfile.find({ _id: { $in: enrolledIds } })
    .populate('user', 'firstName lastName email avatar')
    .populate('session', 'name')
    .select('rollNumber registrationNumber fatherName currentSemester cumulativeGPA user session')
    .sort({ rollNumber: 1 })
    .lean();

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      { students, total: students.length },
      'Enrolled students fetched successfully'
    )
  );
});