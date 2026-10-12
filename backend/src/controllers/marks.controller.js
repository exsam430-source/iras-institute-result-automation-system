import Marks from '../models/Marks.model.js';
import CourseAssignment from '../models/CourseAssignment.model.js';
import StudentProfile from '../models/StudentProfile.model.js';
import Course from '../models/Course.model.js';
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
  validateMarks,
  calculateGradeFromPercentage,
  calculateMarksTotal,
  calculatePercentage,
  calculateQualityPoints,
} from '../services/grade.service.js';
import {
  notifyMidTermMarksEntered,
  notifyFinalsMarksEntered,
} from '../services/notification.service.js';
import {
  updateAssignmentStatistics,
} from '../services/awardList.service.js';
import { parseExcelBuffer } from '../services/upload.service.js';
import { getPaginationMeta } from '../utils/helpers.js';
import { shouldPromoteAssignmentStatus } from '../utils/marksWorkflow.utils.js';

// ─── HELPER: Get assignment with ownership check ───────────────
const getAssignmentWithCheck = async (assignmentId, userId, userRole) => {
  const assignment = await CourseAssignment.findById(assignmentId)
    .populate('course', 'name code creditHours marksDistribution')
    .populate('teacher', 'firstName lastName email')
    .populate('department', 'name code')
    .populate('session', 'name');

  if (!assignment) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Course assignment not found');
  }

  if (
    userRole === ROLES.TEACHER &&
    assignment.teacher._id.toString() !== userId.toString()
  ) {
    throw new ApiError(
      HTTP_STATUS.FORBIDDEN,
      'You can only manage marks for your own assigned courses'
    );
  }

  return assignment;
};

// ─── HELPER: Calculate and update single mark record ──────────
const calculateAndUpdateMark = async (mark, marksDistribution) => {
  const midTerm = mark.midTerm?.obtained ?? 0;
  const internal = mark.internal?.obtained ?? 0;
  const finalTerm = mark.finalTerm?.obtained ?? 0;

  const total = calculateMarksTotal(midTerm, internal, finalTerm);
  const totalMarks =
    (marksDistribution?.midTerm || 20) +
    (marksDistribution?.internal || 20) +
    (marksDistribution?.finalTerm || 60);

  const percentage = calculatePercentage(total, totalMarks);
  const gradeInfo = await calculateGradeFromPercentage(percentage);
  const qualityPoints = calculateQualityPoints(
    gradeInfo.gradePoints,
    mark.course?.creditHours || 3
  );

  return {
    totalObtained: total,
    totalMarks,
    percentage,
    grade: gradeInfo.grade,
    gradePoints: gradeInfo.gradePoints,
    qualityPoints,
    isPassed: gradeInfo.isPassed,
  };
};

// ─── GET ALL MARKS FOR ASSIGNMENT ─────────────────────────────
export const getMarksByAssignment = asyncHandler(async (req, res, next) => {
  const { id: assignmentId } = req.params;
  const { page = 1, limit = 50 } = req.query;

  const assignment = await getAssignmentWithCheck(
    assignmentId,
    req.user._id,
    req.user.role
  ).catch((err) => next(err));

  if (!assignment) return;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [marks, total] = await Promise.all([
    Marks.find({ courseAssignment: assignmentId })
      .populate({
        path: 'student',
        select: 'rollNumber registrationNumber fatherName currentSemester',
        populate: {
          path: 'user',
          select: 'firstName lastName email avatar',
        },
      })
      .populate('course', 'name code creditHours marksDistribution')
      .sort({ 'student.rollNumber': 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean({ virtuals: true }),
    Marks.countDocuments({ courseAssignment: assignmentId }),
  ]);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        marks,
        assignment: {
          _id: assignment._id,
          status: assignment.status,
          course: assignment.course,
          semester: assignment.semester,
        },
        pagination: getPaginationMeta(total, page, limit),
      },
      'Marks fetched successfully'
    )
  );
});

// ─── GET SINGLE MARK RECORD ───────────────────────────────────
export const getSingleMark = asyncHandler(async (req, res, next) => {
  const mark = await Marks.findById(req.params.id)
    .populate({
      path: 'student',
      select: 'rollNumber registrationNumber fatherName currentSemester cumulativeGPA',
      populate: { path: 'user', select: 'firstName lastName email avatar' },
    })
    .populate('course', 'name code creditHours marksDistribution')
    .populate('teacher', 'firstName lastName')
    .populate('session', 'name')
    .lean({ virtuals: true });

  if (!mark) {
    return next(new ApiError(HTTP_STATUS.NOT_FOUND, 'Mark record not found'));
  }

  // Students can only view their own marks
  if (req.user.role === ROLES.STUDENT) {
    const studentProfile = await StudentProfile.findOne({
      user: req.user._id,
    });
    if (
      !studentProfile ||
      mark.student._id.toString() !== studentProfile._id.toString()
    ) {
      return next(
        new ApiError(HTTP_STATUS.FORBIDDEN, 'You can only view your own marks')
      );
    }
  }

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, { mark }, 'Mark record fetched successfully')
  );
});

// ─── SAVE MID-TERM MARKS ─────────────────────────────────────
export const saveMidTermMarks = asyncHandler(async (req, res, next) => {
  const { id: assignmentId } = req.params;
  const { marksData } = req.body;

  let assignment;
  try {
    assignment = await getAssignmentWithCheck(
      assignmentId,
      req.user._id,
      req.user.role
    );
  } catch (err) {
    return next(err);
  }

  const validStatuses = [
    ASSIGNMENT_STATUS.AWARD_LIST_READY,
    ASSIGNMENT_STATUS.ASSIGNED,
    ASSIGNMENT_STATUS.MIDTERM_SAVED,
    ASSIGNMENT_STATUS.REJECTED,
  ];

  if (!validStatuses.includes(assignment.status)) {
    return next(
      new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        `Cannot enter mid-term marks for assignment with status: ${assignment.status}`
      )
    );
  }

  const marksDistribution = assignment.course?.marksDistribution;
  const maxMidTerm = marksDistribution?.midTerm || 20;

  const results = { updated: [], failed: [], total: marksData.length };

  for (const entry of marksData) {
    try {
      const validation = validateMarks(entry.marks, maxMidTerm);
      if (!validation.valid) {
        results.failed.push({
          studentId: entry.studentId,
          reason: validation.error,
        });
        continue;
      }

      const markRecord = await Marks.findOne({
        student: entry.studentId,
        courseAssignment: assignmentId,
      }).populate('course', 'creditHours');

      if (!markRecord) {
        results.failed.push({
          studentId: entry.studentId,
          reason: 'Student not enrolled in this course',
        });
        continue;
      }

      markRecord.midTerm = {
        obtained: validation.value,
        total: maxMidTerm,
        isEntered: true,
        enteredAt: new Date(),
        notifiedAt: null,
      };

      markRecord.marksPhase = MARKS_PHASE.MIDTERM_ENTERED;
      markRecord.enteredBy = req.user._id;
      markRecord.midTermEnteredAt = new Date();

      await markRecord.save({ validateBeforeSave: false });

      results.updated.push({
        studentId: entry.studentId,
        marksId: markRecord._id,
        midTermMarks: validation.value,
      });
    } catch (error) {
      results.failed.push({
        studentId: entry.studentId,
        reason: error.message,
      });
    }
  }

  const shouldPromoteMidterm = shouldPromoteAssignmentStatus({
    updatedCount: results.updated.length,
    totalCount: results.total,
    failedCount: results.failed.length,
  });

  if (shouldPromoteMidterm) {
    await CourseAssignment.findByIdAndUpdate(
      assignmentId,
      {
        status: ASSIGNMENT_STATUS.MIDTERM_SAVED,
        midTermSavedAt: new Date(),
      },
      { new: true }
    );
  }

  // Notify students (async, non-blocking)
  if (results.updated.length > 0) {
    const notificationPromises = results.updated.map(async (updated) => {
      try {
        const markRecord = await Marks.findById(updated.marksId);
        const studentProfile = await StudentProfile.findById(
          updated.studentId
        ).populate('user', 'firstName lastName email');

        if (studentProfile?.user) {
          markRecord.midTerm.notifiedAt = new Date();
          await markRecord.save({ validateBeforeSave: false });

          await notifyMidTermMarksEntered({
            student: studentProfile,
            user: studentProfile.user,
            courseName: assignment.course.name,
            courseCode: assignment.course.code,
            midTermMarks: updated.midTermMarks,
            midTermTotal: maxMidTerm,
            courseAssignmentId: assignmentId,
            courseId: assignment.course._id,
            senderId: req.user._id,
          });
        }
      } catch (_err) {
        // Non-blocking
      }
    });

    Promise.allSettled(notificationPromises);
  }

  await AuditLog.log({
    user: req.user._id,
    userSnapshot: {
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      role: req.user.role,
    },
    action: 'MIDTERM_MARKS_SAVED',
    resource: 'marks',
    resourceId: assignment._id,
    newData: {
      assignmentId,
      updatedCount: results.updated.length,
      failedCount: results.failed.length,
    },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    description: `Mid-term marks saved for ${results.updated.length} students in ${assignment.course.name}`,
  });

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      { results },
      `Mid-term marks saved for ${results.updated.length} student(s). ${results.failed.length} failed. Students have been notified.`
    )
  );
});

// ─── SAVE FINALS MARKS (Internal + Final Term) ────────────────
export const saveFinalsMarks = asyncHandler(async (req, res, next) => {
  const { id: assignmentId } = req.params;
  const { marksData } = req.body;

  let assignment;
  try {
    assignment = await getAssignmentWithCheck(
      assignmentId,
      req.user._id,
      req.user.role
    );
  } catch (err) {
    return next(err);
  }

  // Must have mid-term saved first
  const validStatuses = [
    ASSIGNMENT_STATUS.MIDTERM_SAVED,
    ASSIGNMENT_STATUS.FINALS_SAVED,
    ASSIGNMENT_STATUS.REJECTED,
  ];

  if (!validStatuses.includes(assignment.status)) {
    return next(
      new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        assignment.status === ASSIGNMENT_STATUS.AWARD_LIST_READY ||
        assignment.status === ASSIGNMENT_STATUS.ASSIGNED
          ? 'Please save mid-term marks before entering internal and final term marks'
          : `Cannot enter final marks for assignment with status: ${assignment.status}`
      )
    );
  }

  const marksDistribution = assignment.course?.marksDistribution;
  const maxInternal = marksDistribution?.internal || 20;
  const maxFinalTerm = marksDistribution?.finalTerm || 60;

  const results = { updated: [], failed: [], total: marksData.length };

  for (const entry of marksData) {
    try {
      // Validate both marks
      const internalValidation = validateMarks(entry.internalMarks, maxInternal);
      const finalTermValidation = validateMarks(
        entry.finalTermMarks,
        maxFinalTerm
      );

      if (!internalValidation.valid) {
        results.failed.push({
          studentId: entry.studentId,
          reason: `Internal marks: ${internalValidation.error}`,
        });
        continue;
      }

      if (!finalTermValidation.valid) {
        results.failed.push({
          studentId: entry.studentId,
          reason: `Final term marks: ${finalTermValidation.error}`,
        });
        continue;
      }

      // Find mark record
      const markRecord = await Marks.findOne({
        student: entry.studentId,
        courseAssignment: assignmentId,
      }).populate('course', 'creditHours name code');

      if (!markRecord) {
        results.failed.push({
          studentId: entry.studentId,
          reason: 'Student not enrolled in this course',
        });
        continue;
      }

      // Check mid-term was entered
      if (!markRecord.midTerm?.isEntered) {
        results.failed.push({
          studentId: entry.studentId,
          reason: 'Mid-term marks must be entered before finals',
        });
        continue;
      }

      // Update internal and final term marks
      markRecord.internal = {
        obtained: internalValidation.value,
        total: maxInternal,
        isEntered: true,
        enteredAt: new Date(),
      };

      markRecord.finalTerm = {
        obtained: finalTermValidation.value,
        total: maxFinalTerm,
        isEntered: true,
        enteredAt: new Date(),
      };

      // Calculate totals and grade
      const calculated = await calculateAndUpdateMark(
        {
          midTerm: markRecord.midTerm,
          internal: markRecord.internal,
          finalTerm: markRecord.finalTerm,
          course: markRecord.course,
        },
        marksDistribution
      );

      markRecord.totalObtained = calculated.totalObtained;
      markRecord.totalMarks = calculated.totalMarks;
      markRecord.percentage = calculated.percentage;
      markRecord.grade = calculated.grade;
      markRecord.gradePoints = calculated.gradePoints;
      markRecord.qualityPoints = calculated.qualityPoints;
      markRecord.isPassed = calculated.isPassed;
      markRecord.marksPhase = MARKS_PHASE.FINALS_ENTERED;
      markRecord.finalsEnteredAt = new Date();
      markRecord.enteredBy = req.user._id;

      await markRecord.save({ validateBeforeSave: false });

      results.updated.push({
        studentId: entry.studentId,
        marksId: markRecord._id,
        internalMarks: internalValidation.value,
        finalTermMarks: finalTermValidation.value,
        totalMarks: calculated.totalObtained,
        percentage: calculated.percentage,
        grade: calculated.grade,
        isPassed: calculated.isPassed,
      });
    } catch (error) {
      results.failed.push({
        studentId: entry.studentId,
        reason: error.message,
      });
    }
  }

  const shouldPromoteFinals = shouldPromoteAssignmentStatus({
    updatedCount: results.updated.length,
    totalCount: results.total,
    failedCount: results.failed.length,
  });

  if (shouldPromoteFinals) {
    await CourseAssignment.findByIdAndUpdate(
      assignmentId,
      {
        status: ASSIGNMENT_STATUS.FINALS_SAVED,
        finalsSavedAt: new Date(),
      },
      { new: true }
    );

    await updateAssignmentStatistics(assignmentId);
  }

  // ─── NOTIFY STUDENTS (async, non-blocking) ────────────────
  if (results.updated.length > 0) {
    const notificationPromises = results.updated.map(async (updated) => {
      try {
        const studentProfile = await StudentProfile.findById(
          updated.studentId
        ).populate('user', 'firstName lastName email');

        if (studentProfile?.user) {
          await notifyFinalsMarksEntered({
            student: studentProfile,
            user: studentProfile.user,
            courseName: assignment.course.name,
            courseCode: assignment.course.code,
            marksData: {
              midTerm: assignment.course.marksDistribution?.midTerm || 20,
              internal: updated.internalMarks,
              finalTerm: updated.finalTermMarks,
              totalMarks: updated.totalMarks,
              percentage: updated.percentage,
              grade: updated.grade,
            },
            courseAssignmentId: assignmentId,
            courseId: assignment.course._id,
            senderId: req.user._id,
          });
        }
      } catch (_err) {
        // Non-blocking
      }
    });

    Promise.allSettled(notificationPromises);
  }

  await AuditLog.log({
    user: req.user._id,
    userSnapshot: {
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      role: req.user.role,
    },
    action: 'FINALS_MARKS_SAVED',
    resource: 'marks',
    resourceId: assignment._id,
    newData: {
      assignmentId,
      updatedCount: results.updated.length,
      failedCount: results.failed.length,
    },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    description: `Finals marks saved for ${results.updated.length} students in ${assignment.course.name}`,
  });

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      { results },
      `Finals marks saved for ${results.updated.length} student(s). ${results.failed.length} failed. Students have been notified.`
    )
  );
});

// ─── UPDATE SINGLE STUDENT MARK ───────────────────────────────
export const updateSingleStudentMark = asyncHandler(async (req, res, next) => {
  const { marksId } = req.params;
  const { midTermMarks, internalMarks, finalTermMarks, remarks } = req.body;

  const markRecord = await Marks.findById(marksId)
    .populate('course', 'name code creditHours marksDistribution')
    .populate('courseAssignment', 'status teacher');

  if (!markRecord) {
    return next(new ApiError(HTTP_STATUS.NOT_FOUND, 'Mark record not found'));
  }

  // Teacher ownership check
  if (req.user.role === ROLES.TEACHER) {
    if (
      markRecord.courseAssignment?.teacher?.toString() !==
      req.user._id.toString()
    ) {
      return next(
        new ApiError(
          HTTP_STATUS.FORBIDDEN,
          'You can only edit marks for your own courses'
        )
      );
    }
  }

  // Cannot edit approved marks
  if (markRecord.marksPhase === MARKS_PHASE.APPROVED) {
    return next(
      new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Approved marks cannot be edited. Please contact the administrator.'
      )
    );
  }

  // Cannot edit submitted marks (unless rejected)
  if (markRecord.marksPhase === 'submitted-to-hod') {
    return next(
      new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Submitted marks cannot be edited. Wait for HoD review.'
      )
    );
  }

  const marksDistribution = markRecord.course?.marksDistribution;

  // Update mid-term if provided
  if (midTermMarks !== undefined && midTermMarks !== null) {
    const validation = validateMarks(
      midTermMarks,
      marksDistribution?.midTerm || 20
    );
    if (!validation.valid) {
      return next(
        new ApiError(
          HTTP_STATUS.BAD_REQUEST,
          `Mid-term marks: ${validation.error}`
        )
      );
    }
    markRecord.midTerm.obtained = validation.value;
    markRecord.midTerm.isEntered = true;
    markRecord.midTerm.enteredAt = new Date();
  }

  // Update internal if provided
  if (internalMarks !== undefined && internalMarks !== null) {
    const validation = validateMarks(
      internalMarks,
      marksDistribution?.internal || 20
    );
    if (!validation.valid) {
      return next(
        new ApiError(
          HTTP_STATUS.BAD_REQUEST,
          `Internal marks: ${validation.error}`
        )
      );
    }
    markRecord.internal.obtained = validation.value;
    markRecord.internal.isEntered = true;
    markRecord.internal.enteredAt = new Date();
  }

  // Update final term if provided
  if (finalTermMarks !== undefined && finalTermMarks !== null) {
    const validation = validateMarks(
      finalTermMarks,
      marksDistribution?.finalTerm || 60
    );
    if (!validation.valid) {
      return next(
        new ApiError(
          HTTP_STATUS.BAD_REQUEST,
          `Final term marks: ${validation.error}`
        )
      );
    }
    markRecord.finalTerm.obtained = validation.value;
    markRecord.finalTerm.isEntered = true;
    markRecord.finalTerm.enteredAt = new Date();
  }

  if (remarks !== undefined) markRecord.remarks = remarks;

  // Recalculate if all marks are entered
  if (
    markRecord.midTerm?.isEntered &&
    markRecord.internal?.isEntered &&
    markRecord.finalTerm?.isEntered
  ) {
    const calculated = await calculateAndUpdateMark(
      {
        midTerm: markRecord.midTerm,
        internal: markRecord.internal,
        finalTerm: markRecord.finalTerm,
        course: markRecord.course,
      },
      marksDistribution
    );

    markRecord.totalObtained = calculated.totalObtained;
    markRecord.totalMarks = calculated.totalMarks;
    markRecord.percentage = calculated.percentage;
    markRecord.grade = calculated.grade;
    markRecord.gradePoints = calculated.gradePoints;
    markRecord.qualityPoints = calculated.qualityPoints;
    markRecord.isPassed = calculated.isPassed;

    // Update phase based on what's entered
    if (
      markRecord.internal?.isEntered &&
      markRecord.finalTerm?.isEntered
    ) {
      markRecord.marksPhase = MARKS_PHASE.FINALS_ENTERED;
    }
  } else if (markRecord.midTerm?.isEntered) {
    markRecord.marksPhase = MARKS_PHASE.MIDTERM_ENTERED;
  }

  markRecord.enteredBy = req.user._id;
  await markRecord.save({ validateBeforeSave: false });

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      { mark: markRecord },
      'Mark updated successfully'
    )
  );
});

// ─── IMPORT MARKS FROM EXCEL ──────────────────────────────────
export const importMarksFromExcel = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(
      new ApiError(HTTP_STATUS.BAD_REQUEST, 'Please upload an Excel file')
    );
  }

  const { id: assignmentId } = req.params;
  const { overwriteExisting = false, phase = 'all' } = req.body;

  let assignment;
  try {
    assignment = await getAssignmentWithCheck(
      assignmentId,
      req.user._id,
      req.user.role
    );
  } catch (err) {
    return next(err);
  }

  // Check status
  if (
    [ASSIGNMENT_STATUS.SUBMITTED, ASSIGNMENT_STATUS.APPROVED].includes(
      assignment.status
    )
  ) {
    return next(
      new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Cannot import marks for a submitted or approved assignment'
      )
    );
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

  const marksDistribution = assignment.course?.marksDistribution;
  const results = { imported: [], failed: [], total: rows.length };

  for (const row of rows) {
    try {
      const rollNumber =
        row.roll_number || row.roll_no || row.rollnumber;

      if (!rollNumber) {
        results.failed.push({
          row: JSON.stringify(row),
          reason: 'Roll number not found in row',
        });
        continue;
      }

      // Find student by roll number
      const studentProfile = await StudentProfile.findOne({
        rollNumber: rollNumber.toString().trim().toUpperCase(),
      });

      if (!studentProfile) {
        results.failed.push({
          rollNumber,
          reason: `Student with roll number '${rollNumber}' not found`,
        });
        continue;
      }

      // Find marks record
      const markRecord = await Marks.findOne({
        student: studentProfile._id,
        courseAssignment: assignmentId,
      }).populate('course', 'creditHours');

      if (!markRecord) {
        results.failed.push({
          rollNumber,
          reason: 'Student not enrolled in this course',
        });
        continue;
      }

      let updated = false;

      // Import mid-term marks
      if (
        (phase === 'midterm' || phase === 'all') &&
        (row.mid_term || row.midterm || row.mid) !== undefined
      ) {
        const midValue = row.mid_term || row.midterm || row.mid;
        if (midValue !== null && midValue !== '') {
          if (!markRecord.midTerm.isEntered || overwriteExisting) {
            const validation = validateMarks(
              midValue,
              marksDistribution?.midTerm || 20
            );
            if (validation.valid) {
              markRecord.midTerm.obtained = validation.value;
              markRecord.midTerm.isEntered = true;
              markRecord.midTerm.enteredAt = new Date();
              updated = true;
            }
          }
        }
      }

      // Import internal marks
      if (
        (phase === 'finals' || phase === 'all') &&
        (row.internal || row.internal_marks) !== undefined
      ) {
        const internalValue = row.internal || row.internal_marks;
        if (internalValue !== null && internalValue !== '') {
          if (!markRecord.internal.isEntered || overwriteExisting) {
            const validation = validateMarks(
              internalValue,
              marksDistribution?.internal || 20
            );
            if (validation.valid) {
              markRecord.internal.obtained = validation.value;
              markRecord.internal.isEntered = true;
              markRecord.internal.enteredAt = new Date();
              updated = true;
            }
          }
        }
      }

      // Import final term marks
      if (
        (phase === 'finals' || phase === 'all') &&
        (row.final_term || row.final || row.finalterm) !== undefined
      ) {
        const finalValue =
          row.final_term || row.final || row.finalterm;
        if (finalValue !== null && finalValue !== '') {
          if (!markRecord.finalTerm.isEntered || overwriteExisting) {
            const validation = validateMarks(
              finalValue,
              marksDistribution?.finalTerm || 60
            );
            if (validation.valid) {
              markRecord.finalTerm.obtained = validation.value;
              markRecord.finalTerm.isEntered = true;
              markRecord.finalTerm.enteredAt = new Date();
              updated = true;
            }
          }
        }
      }

      if (updated) {
        // Recalculate if all components are entered
        if (
          markRecord.midTerm?.isEntered &&
          markRecord.internal?.isEntered &&
          markRecord.finalTerm?.isEntered
        ) {
          const calculated = await calculateAndUpdateMark(
            {
              midTerm: markRecord.midTerm,
              internal: markRecord.internal,
              finalTerm: markRecord.finalTerm,
              course: markRecord.course,
            },
            marksDistribution
          );

          Object.assign(markRecord, calculated);
          markRecord.marksPhase = MARKS_PHASE.FINALS_ENTERED;
        } else if (markRecord.midTerm?.isEntered) {
          markRecord.marksPhase = MARKS_PHASE.MIDTERM_ENTERED;
        }

        markRecord.enteredBy = req.user._id;
        await markRecord.save({ validateBeforeSave: false });

        results.imported.push({ rollNumber, marksId: markRecord._id });
      } else {
        results.failed.push({
          rollNumber,
          reason: 'No valid marks data found in row or marks already entered',
        });
      }
    } catch (error) {
      results.failed.push({
        row: JSON.stringify(row),
        reason: error.message,
      });
    }
  }

  // Update assignment status if marks were imported
  if (results.imported.length > 0) {
    const allFinalsEntered = await Marks.countDocuments({
      courseAssignment: assignmentId,
      marksPhase: {
        $in: [MARKS_PHASE.FINALS_ENTERED, MARKS_PHASE.APPROVED],
      },
    });

    const totalStudents = assignment.enrolledStudents.filter(
      (s) => s.isActive
    ).length;

    if (allFinalsEntered > 0) {
      assignment.status = ASSIGNMENT_STATUS.FINALS_SAVED;
      assignment.finalsSavedAt = new Date();
    } else {
      const midTermEntered = await Marks.countDocuments({
        courseAssignment: assignmentId,
        'midTerm.isEntered': true,
      });
      if (midTermEntered > 0) {
        assignment.status = ASSIGNMENT_STATUS.MIDTERM_SAVED;
        assignment.midTermSavedAt = new Date();
      }
    }

    await assignment.save();
    await updateAssignmentStatistics(assignmentId);
  }

  await AuditLog.log({
    user: req.user._id,
    userSnapshot: {
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      role: req.user.role,
    },
    action: 'MARKS_IMPORTED',
    resource: 'marks',
    resourceId: assignment._id,
    newData: {
      imported: results.imported.length,
      failed: results.failed.length,
      phase,
    },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    description: `Marks imported from Excel: ${results.imported.length} success, ${results.failed.length} failed`,
  });

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      { results },
      `Import complete: ${results.imported.length} records imported, ${results.failed.length} failed`
    )
  );
});

// ─── GET STUDENT MARKS (all semesters) ────────────────────────
export const getStudentAllMarks = asyncHandler(async (req, res, next) => {
  const { studentId } = req.params;

  let profileId;

  // Students can only view their own marks
  if (req.user.role === ROLES.STUDENT || studentId === 'self') {
    const profile = await StudentProfile.findOne({ user: req.user._id });
    if (!profile) {
      return next(new ApiError(HTTP_STATUS.NOT_FOUND, 'Student profile not found'));
    }
    profileId = profile._id;
  } else {
    profileId = studentId;
  }

  const marks = await Marks.find({ student: profileId })
    .populate('course', 'name code creditHours type semester')
    .populate('session', 'name startYear endYear')
    .populate('teacher', 'firstName lastName')
    .select(
      'midTerm internal finalTerm totalObtained totalMarks percentage grade gradePoints qualityPoints isPassed marksPhase semester remarks course session teacher'
    )
    .sort({ semester: 1, createdAt: 1 })
    .lean({ virtuals: true });

  // Group by semester
  const marksBySemester = marks.reduce((acc, mark) => {
    const sem = mark.semester;
    if (!acc[sem]) acc[sem] = [];
    acc[sem].push(mark);
    return acc;
  }, {});

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      { marks, marksBySemester, total: marks.length },
      'Student marks fetched successfully'
    )
  );
});

// ─── GET STUDENT SEMESTER MARKS ───────────────────────────────
export const getStudentSemesterMarks = asyncHandler(async (req, res, next) => {
  const { studentId, semester } = req.params;

  let profileId;

  if (req.user.role === ROLES.STUDENT || studentId === 'self') {
    const profile = await StudentProfile.findOne({ user: req.user._id });
    if (!profile) {
      return next(new ApiError(HTTP_STATUS.NOT_FOUND, 'Student profile not found'));
    }
    profileId = profile._id;
  } else {
    profileId = studentId;
  }

  const marks = await Marks.find({
    student: profileId,
    semester: parseInt(semester),
  })
    .populate('course', 'name code creditHours type marksDistribution')
    .populate('teacher', 'firstName lastName')
    .populate('session', 'name')
    .select(
      'midTerm internal finalTerm totalObtained totalMarks percentage grade gradePoints qualityPoints isPassed marksPhase remarks course teacher session'
    )
    .lean({ virtuals: true });

  // Calculate semester summary
  const approvedMarks = marks.filter((m) => m.marksPhase === MARKS_PHASE.APPROVED);

  let semesterGPA = 0;
  if (approvedMarks.length > 0) {
    const totalQualityPoints = approvedMarks.reduce((sum, m) => sum + (m.qualityPoints || 0), 0);
    const totalCreditHours = approvedMarks.reduce((sum, m) => sum + (m.course?.creditHours || 0), 0);
    if (totalCreditHours > 0) {
      semesterGPA = Math.round((totalQualityPoints / totalCreditHours) * 100) / 100;
    }
  }

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        semester: parseInt(semester),
        marks,
        summary: {
          totalCourses: marks.length,
          approvedCourses: approvedMarks.length,
          pendingCourses: marks.length - approvedMarks.length,
          semesterGPA,
          passedCourses: approvedMarks.filter((m) => m.isPassed).length,
          failedCourses: approvedMarks.filter((m) => !m.isPassed).length,
        },
      },
      'Student semester marks fetched successfully'
    )
  );
});
