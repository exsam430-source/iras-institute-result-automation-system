import SemesterResult from '../models/SemesterResult.model.js';
import Marks from '../models/Marks.model.js';
import StudentProfile from '../models/StudentProfile.model.js';
import CourseAssignment from '../models/CourseAssignment.model.js';
import Course from '../models/Course.model.js';
import Session from '../models/Session.model.js';
import User from '../models/User.model.js';
import AuditLog from '../models/AuditLog.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../middleware/asyncHandler.middleware.js';
import {
  HTTP_STATUS,
  ROLES,
  MARKS_PHASE,
  ASSIGNMENT_STATUS,
} from '../utils/constants.js';
import {
  calculateSemesterGPA,
  calculateCumulativeGPA,
} from '../services/grade.service.js';
import { getPaginationMeta } from '../utils/helpers.js';

// ─── CALCULATE SEMESTER RESULTS FOR ALL STUDENTS ──────────────
export const calculateSemesterResults = asyncHandler(async (req, res, next) => {
  const { semester, sessionId, departmentId } = req.body;

  if (!semester || !sessionId || !departmentId) {
    return next(
      new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Semester, session, and department are required'
      )
    );
  }

  // Verify all course results are approved for this semester
  const pendingAssignments = await CourseAssignment.countDocuments({
  session: sessionId,
  semester: parseInt(semester),
  department: departmentId,
  status: { $ne: ASSIGNMENT_STATUS.APPROVED },  // ← All must be approved
});

if (pendingAssignments > 0) {
  return next(new ApiError(400, `${pendingAssignments} course result(s) not yet approved`));
}

  // Get all active students for this semester
  const students = await StudentProfile.find({
    session: sessionId,
    department: departmentId,
    currentSemester: parseInt(semester),
    enrollmentStatus: 'active',
  })
    .populate('user', 'firstName lastName email')
    .populate('program', 'name code')
    .lean();

  if (students.length === 0) {
    return next(
      new ApiError(
        HTTP_STATUS.NOT_FOUND,
        'No active students found for this semester'
      )
    );
  }

  const calculationResults = {
    calculated: [],
    failed: [],
    total: students.length,
  };

  for (const student of students) {
    try {
      // Get all approved marks for this student this semester
      const marks = await Marks.find({
        student: student._id,
        semester: parseInt(semester),
        session: sessionId,
        marksPhase: MARKS_PHASE.APPROVED,
      })
        .populate('course', 'name code creditHours')
        .lean();

      if (marks.length === 0) {
        calculationResults.failed.push({
          studentId: student._id,
          rollNumber: student.rollNumber,
          reason: 'No approved marks found for this student',
        });
        continue;
      }

      // Build course results
      const courseResults = marks.map((mark) => ({
        course: mark.course._id,
        courseCode: mark.course.code,
        courseName: mark.course.name,
        creditHours: mark.course.creditHours,
        marks: mark._id,
        midTermMarks: mark.midTerm?.obtained,
        internalMarks: mark.internal?.obtained,
        finalTermMarks: mark.finalTerm?.obtained,
        totalMarks: mark.totalObtained,
        percentage: mark.percentage,
        grade: mark.grade,
        gradePoints: mark.gradePoints,
        qualityPoints: mark.qualityPoints,
        isPassed: mark.isPassed,
        isRepeated: mark.isRepeated,
        attemptNumber: mark.attemptNumber,
      }));

      // Calculate semester GPA
      const totalCreditHoursAttempted = courseResults.reduce(
        (sum, c) => sum + (c.creditHours || 0),
        0
      );
      const totalCreditHoursEarned = courseResults
        .filter((c) => c.isPassed)
        .reduce((sum, c) => sum + (c.creditHours || 0), 0);
      const totalQualityPoints = courseResults.reduce(
        (sum, c) => sum + (c.qualityPoints || 0),
        0
      );

      const semesterGPA =
        totalCreditHoursAttempted > 0
          ? Math.round(
              (totalQualityPoints / totalCreditHoursAttempted) * 100
            ) / 100
          : 0;

      // Get previous semester results for CGPA calculation
      const previousResults = await SemesterResult.find({
        student: student._id,
        semester: { $lt: parseInt(semester) },
        isPublished: true,
      }).lean();

      const allResults = [
        ...previousResults,
        { totalQualityPoints, totalCreditHoursAttempted },
      ];

      const cumulativeGPA = calculateCumulativeGPA(allResults);

      // Upsert semester result
      const semesterResult = await SemesterResult.findOneAndUpdate(
        {
          student: student._id,
          semester: parseInt(semester),
          session: sessionId,
        },
        {
          student: student._id,
          session: sessionId,
          department: departmentId,
          program: student.program._id,
          semester: parseInt(semester),
          courses: courseResults,
          totalCreditHoursAttempted,
          totalCreditHoursEarned,
          totalQualityPoints,
          semesterGPA,
          cumulativeGPA,
          totalCoursesAttempted: courseResults.length,
          totalCoursesPassed: courseResults.filter((c) => c.isPassed).length,
          totalCoursesFailed: courseResults.filter((c) => !c.isPassed).length,
          status: 'completed',
          calculatedAt: new Date(),
          calculatedBy: req.user._id,
        },
        { upsert: true, new: true, runValidators: true }
      );

      calculationResults.calculated.push({
        studentId: student._id,
        rollNumber: student.rollNumber,
        studentName: `${student.user.firstName} ${student.user.lastName}`,
        semesterGPA,
        cumulativeGPA,
        totalCourses: courseResults.length,
        passed: courseResults.filter((c) => c.isPassed).length,
        failed: courseResults.filter((c) => !c.isPassed).length,
        semesterResultId: semesterResult._id,
      });
    } catch (error) {
      calculationResults.failed.push({
        studentId: student._id,
        rollNumber: student.rollNumber,
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
    action: 'SEMESTER_RESULT_CALCULATED',
    resource: 'semesterResult',
    newData: {
      semester,
      sessionId,
      departmentId,
      calculated: calculationResults.calculated.length,
      failed: calculationResults.failed.length,
    },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    description: `Semester ${semester} results calculated for ${calculationResults.calculated.length} students`,
  });

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      { results: calculationResults },
      `Semester results calculated: ${calculationResults.calculated.length} success, ${calculationResults.failed.length} failed`
    )
  );
});

// ─── PUBLISH SEMESTER RESULTS ─────────────────────────────────
export const publishSemesterResults = asyncHandler(async (req, res, next) => {
  const { semester, sessionId, departmentId } = req.body;

  if (!semester || !sessionId || !departmentId) {
    return next(
      new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Semester, session, and department are required'
      )
    );
  }

  // Find all calculated results for this semester
  const results = await SemesterResult.find({
    semester: parseInt(semester),
    session: sessionId,
    department: departmentId,
    status: 'completed',
    isPublished: false,
  });

  if (results.length === 0) {
    return next(
      new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'No calculated results found to publish. Please calculate results first.'
      )
    );
  }

  // Publish all results and update student profiles
  const publishedIds = [];
  for (const result of results) {
    result.isPublished = true;
    result.publishedAt = new Date();
    result.publishedBy = req.user._id;
    await result.save();

    // Update student's cumulative GPA in profile
    await StudentProfile.findByIdAndUpdate(result.student, {
      cumulativeGPA: result.cumulativeGPA,
      totalCreditHoursAttempted: result.totalCreditHoursAttempted,
      totalCreditHoursEarned: result.totalCreditHoursEarned,
      totalQualityPoints: result.totalQualityPoints,
      $push: {
        semesterRecords: {
          semester: result.semester,
          session: result.session,
          gpa: result.semesterGPA,
          cgpa: result.cumulativeGPA,
          totalCreditsAttempted: result.totalCreditHoursAttempted,
          totalCreditsEarned: result.totalCreditHoursEarned,
          coursesAttempted: result.totalCoursesAttempted,
          coursesPassed: result.totalCoursesPassed,
          coursesFailed: result.totalCoursesFailed,
          status: 'completed',
        },
      },
    });

    // Update failed courses in student profile
    const failedCourses = result.courses.filter((c) => !c.isPassed);
    if (failedCourses.length > 0) {
      for (const failedCourse of failedCourses) {
        const studentProfile = await StudentProfile.findById(result.student);
        if (studentProfile) {
          studentProfile.addFailedCourse({
            course: failedCourse.course,
            courseCode: failedCourse.courseCode,
            courseName: failedCourse.courseName,
            semester: result.semester,
            session: result.session,
            grade: failedCourse.grade,
            marksObtained: failedCourse.totalMarks,
            percentage: failedCourse.percentage,
          });
          await studentProfile.save({ validateBeforeSave: false });
        }
      }
    }

    publishedIds.push(result._id);
  }

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        publishedCount: publishedIds.length,
        publishedIds,
      },
      `${publishedIds.length} semester results published successfully`
    )
  );
});

// ─── GET STUDENT ALL SEMESTER RESULTS ─────────────────────────
// ✅ FIXED: Handle 'self' route param and student role together
export const getStudentSemesterResults = asyncHandler(async (req, res, next) => {
  const { studentId } = req.params;

  let profileId;

  // ✅ FIXED: Handle both ROLES.STUDENT and explicit 'self' param
  if (req.user.role === ROLES.STUDENT || studentId === 'self') {
    const profile = await StudentProfile.findOne({ user: req.user._id });
    if (!profile) {
      return next(
        new ApiError(HTTP_STATUS.NOT_FOUND, 'Student profile not found')
      );
    }
    profileId = profile._id;
  } else {
    profileId = studentId;
  }

  const results = await SemesterResult.find({
    student: profileId,
    isPublished: true,
  })
    .populate('session', 'name startYear endYear')
    .populate('courses.course', 'name code creditHours type')
    .sort({ semester: 1 })
    .lean({ virtuals: true });

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      { results, total: results.length },
      'Semester results fetched successfully'
    )
  );
});

// ─── GET SPECIFIC SEMESTER RESULT ─────────────────────────────
// ✅ FIXED: Handle 'self' route param and student role together
export const getStudentSpecificSemesterResult = asyncHandler(
  async (req, res, next) => {
    const { studentId, semester } = req.params;

    let profileId;

    // ✅ FIXED: Handle both ROLES.STUDENT and explicit 'self' param
    if (req.user.role === ROLES.STUDENT || studentId === 'self') {
      const profile = await StudentProfile.findOne({ user: req.user._id });
      if (!profile) {
        return next(
          new ApiError(HTTP_STATUS.NOT_FOUND, 'Student profile not found')
        );
      }
      profileId = profile._id;
    } else {
      profileId = studentId;
    }

    const result = await SemesterResult.findOne({
      student: profileId,
      semester: parseInt(semester),
    })
      .populate('session', 'name startYear endYear')
      .populate({
        path: 'student',
        // ✅ FIXED: Added currentSemester to select fields
        select: 'rollNumber registrationNumber fatherName currentSemester',
        populate: { path: 'user', select: 'firstName lastName' },
      })
      .populate('courses.course', 'name code creditHours type category')
      .populate('publishedBy', 'firstName lastName')
      .lean({ virtuals: true });

    if (!result) {
      return next(
        new ApiError(
          HTTP_STATUS.NOT_FOUND,
          `No result found for semester ${semester}`
        )
      );
    }

    res.status(HTTP_STATUS.OK).json(
      new ApiResponse(
        HTTP_STATUS.OK,
        { result },
        'Semester result fetched successfully'
      )
    );
  }
);

// ─── GET SEMESTER STATISTICS ──────────────────────────────────
export const getSemesterStatistics = asyncHandler(async (req, res, next) => {
  const { semester, sessionId, departmentId } = req.query;

  if (!semester || !departmentId) {
    return next(
      new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Semester and department are required'
      )
    );
  }

  const filter = {
    semester: parseInt(semester),
    department: departmentId,
    isPublished: true,
  };
  if (sessionId) filter.session = sessionId;

  const results = await SemesterResult.find(filter).lean();

  if (results.length === 0) {
    return res.status(HTTP_STATUS.OK).json(
      new ApiResponse(
        HTTP_STATUS.OK,
        { statistics: null },
        'No published results found'
      )
    );
  }

  // Aggregate statistics
  const totalStudents = results.length;
  const gpas = results.map((r) => r.semesterGPA);
  const avgGPA =
    Math.round(
      (gpas.reduce((a, b) => a + b, 0) / gpas.length) * 100
    ) / 100;
  const highestGPA = Math.max(...gpas);
  const lowestGPA = Math.min(...gpas);

  const gpaDistribution = {
    excellent: results.filter((r) => r.semesterGPA >= 3.5).length,
    good: results.filter(
      (r) => r.semesterGPA >= 2.5 && r.semesterGPA < 3.5
    ).length,
    average: results.filter(
      (r) => r.semesterGPA >= 1.5 && r.semesterGPA < 2.5
    ).length,
    poor: results.filter((r) => r.semesterGPA < 1.5).length,
  };

  const studentsWithAllPassed = results.filter(
    (r) => r.totalCoursesFailed === 0
  ).length;
  const studentsWithFailedCourses = results.filter(
    (r) => r.totalCoursesFailed > 0
  ).length;

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        statistics: {
          totalStudents,
          avgGPA,
          highestGPA,
          lowestGPA,
          gpaDistribution,
          studentsWithAllPassed,
          studentsWithFailedCourses,
          passRate: Math.round(
            (studentsWithAllPassed / totalStudents) * 100
          ),
        },
      },
      'Semester statistics fetched successfully'
    )
  );
});

// ─── GET DEPARTMENT SEMESTER RESULTS ──────────────────────────
export const getDepartmentSemesterResults = asyncHandler(
  async (req, res, next) => {
    const { page = 1, limit = 20, semester, sessionId } = req.query;
    const departmentId =
      req.user.role === ROLES.HOD
        ? req.user.department?._id
        : req.query.departmentId;

    if (!departmentId) {
      return next(
        new ApiError(
          HTTP_STATUS.BAD_REQUEST,
          'Department ID is required'
        )
      );
    }

    const filter = {
      department: departmentId,
      isPublished: true,
    };

    if (semester) filter.semester = parseInt(semester);
    if (sessionId) filter.session = sessionId;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [results, total] = await Promise.all([
      SemesterResult.find(filter)
        .populate({
          path: 'student',
          select: 'rollNumber registrationNumber cumulativeGPA',
          populate: { path: 'user', select: 'firstName lastName email avatar' },
        })
        .populate('session', 'name startYear endYear')
        .select(
          'semester semesterGPA cumulativeGPA totalCoursesPassed totalCoursesFailed status isPublished student session'
        )
        .sort({ semester: 1, semesterGPA: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      SemesterResult.countDocuments(filter),
    ]);

    res.status(HTTP_STATUS.OK).json(
      new ApiResponse(
        HTTP_STATUS.OK,
        {
          results,
          pagination: getPaginationMeta(total, page, limit),
        },
        'Department semester results fetched successfully'
      )
    );
  }
);