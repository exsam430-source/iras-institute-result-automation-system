import AuditLog from '../models/AuditLog.model.js';
import StudentProfile from '../models/StudentProfile.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../middleware/asyncHandler.middleware.js';
import { HTTP_STATUS, ROLES } from '../utils/constants.js';
import {
  checkPromotionEligibility,
  previewPromotion,
  executePromotion,
} from '../services/promotion.service.js';
import { notifyStudentsSemesterPromotion } from '../services/notification.service.js';

// ─── CHECK ELIGIBILITY ────────────────────────────────────────
export const checkEligibility = asyncHandler(async (req, res, next) => {
  const { semester, sessionId, departmentId } = req.query;

  if (!semester || !sessionId || !departmentId) {
    return next(
      new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Semester, session, and department are required'
      )
    );
  }

  const eligibility = await checkPromotionEligibility({
    semester,
    sessionId,
    departmentId,
  });

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      { eligibility },
      eligibility.isEligible
        ? 'Department is eligible for semester promotion'
        : 'Department is not yet eligible for promotion'
    )
  );
});

// ─── PROMOTION PREVIEW ────────────────────────────────────────
export const getPromotionPreview = asyncHandler(async (req, res, next) => {
  const { semester, sessionId, departmentId } = req.query;

  if (!semester || !sessionId || !departmentId) {
    return next(
      new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Semester, session, and department are required'
      )
    );
  }

  if (
    req.user.role === ROLES.HOD &&
    req.user.department?._id.toString() !== departmentId
  ) {
    return next(
      new ApiError(
        HTTP_STATUS.FORBIDDEN,
        'You can only preview promotions for your own department'
      )
    );
  }

  const [eligibility, preview] = await Promise.all([
    checkPromotionEligibility({ semester, sessionId, departmentId }),
    previewPromotion({ semester, sessionId, departmentId }),
  ]);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      { eligibility, preview },
      'Promotion preview generated successfully'
    )
  );
});

// ─── INITIATE PROMOTION ───────────────────────────────────────
export const initiatePromotion = asyncHandler(async (req, res, next) => {
  const { semester, sessionId, departmentId, forcePromotion = false } = req.body;

  if (!semester || !sessionId || !departmentId) {
    return next(
      new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Semester, session, and department are required'
      )
    );
  }

  if (
    req.user.role === ROLES.HOD &&
    req.user.department?._id.toString() !== departmentId
  ) {
    return next(
      new ApiError(
        HTTP_STATUS.FORBIDDEN,
        'You can only initiate promotion for your own department'
      )
    );
  }

  if (!forcePromotion) {
    const eligibility = await checkPromotionEligibility({
      semester,
      sessionId,
      departmentId,
    });

    if (!eligibility.isEligible) {
      return next(
        new ApiError(
          HTTP_STATUS.BAD_REQUEST,
          `Cannot initiate promotion. Issues:\n${eligibility.issues.join('\n')}`
        )
      );
    }
  }

  const promotionResults = await executePromotion({
    semester,
    sessionId,
    departmentId,
    promotedBy: req.user._id,
  });

  // Notify promoted students
  if (promotionResults.promoted.length > 0) {
    const studentsPromotionData = await Promise.all(
      promotionResults.promoted.map(async (p) => {
        const profile = await StudentProfile.findById(p.studentId)
          .populate('user', 'firstName lastName email')
          .lean();
        return {
          userId: p.userId,
          user: profile?.user,
          fromSemester: p.fromSemester,
          toSemester: p.toSemester,
          semesterGPA: p.semesterGPA,
          cumulativeGPA: p.cumulativeGPA,
          totalCoursesPassed: 0,
          totalCoursesFailed: p.failedCoursesCount,
        };
      })
    );

    await notifyStudentsSemesterPromotion({
      studentsPromotionData,
      hodId: req.user._id,
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
    action: 'SEMESTER_PROMOTION_COMPLETED',
    resource: 'promotion',
    newData: {
      semester,
      sessionId,
      departmentId,
      promoted: promotionResults.promoted.length,
      graduated: promotionResults.graduated.length,
      failed: promotionResults.failed.length,
    },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    description: `Semester ${semester} promotion: ${promotionResults.promoted.length} promoted, ${promotionResults.graduated.length} graduated`,
  });

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      { results: promotionResults },
      `Promotion complete: ${promotionResults.promoted.length} promoted, ${promotionResults.graduated.length} graduated, ${promotionResults.failed.length} errors`
    )
  );
});

// ─── PROMOTION HISTORY ────────────────────────────────────────
export const getPromotionHistory = asyncHandler(async (req, res, next) => {
  const { departmentId } = req.query;

  const deptId =
    req.user.role === ROLES.HOD
      ? req.user.department?._id?.toString()
      : departmentId;

  const filter = {
    resource: 'promotion',
    action: 'SEMESTER_PROMOTION_COMPLETED',
  };

  if (deptId) {
    filter['newData.departmentId'] = deptId;
  }

  // ✅ CORRECT: Using AuditLog directly from top-level import (no dynamic import needed)
  const history = await AuditLog.find(filter)
    .populate('user', 'firstName lastName email avatar role')
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      { history },
      'Promotion history fetched successfully'
    )
  );
});