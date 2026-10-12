import { Router } from 'express';
import {
  calculateSemesterResults,
  publishSemesterResults,
  getStudentSemesterResults,
  getStudentSpecificSemesterResult,
  getSemesterStatistics,
  getDepartmentSemesterResults,
} from '../controllers/semesterResult.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { restrictTo } from '../middleware/role.middleware.js';
import asyncHandler from '../middleware/asyncHandler.middleware.js';
import StudentProfile from '../models/StudentProfile.model.js';
import ApiError from '../utils/ApiError.js';
import { ROLES, HTTP_STATUS } from '../utils/constants.js';

const router = Router();

router.use(protect);

// ─── ADMIN / HOD ACTIONS ─────────────────────────────────────
router.post(
  '/calculate',
  restrictTo(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HOD),
  calculateSemesterResults
);

router.post(
  '/publish',
  restrictTo(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HOD),
  publishSemesterResults
);

// ─── STATISTICS & DEPARTMENT ──────────────────────────────────
router.get(
  '/statistics',
  restrictTo(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DIRECTOR, ROLES.HOD),
  getSemesterStatistics
);

router.get(
  '/department',
  restrictTo(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DIRECTOR, ROLES.HOD),
  getDepartmentSemesterResults
);

// ─── STUDENT SELF ROUTE ───────────────────────────────────────
// ✅ FIXED: Handle 'self' properly
router.get(
  '/my-results',
  restrictTo(ROLES.STUDENT),
  asyncHandler(async (req, res, next) => {
    const profile = await StudentProfile.findOne({ user: req.user._id });
    if (!profile) {
      return next(new ApiError(HTTP_STATUS.NOT_FOUND, 'Student profile not found'));
    }
    req.params.studentId = profile._id.toString();
    return getStudentSemesterResults(req, res, next);
  })
);

// ─── STUDENT RESULTS (Admin/HoD/Student view) ────────────────
router.get(
  '/student/:studentId',
  restrictTo(
    ROLES.SUPER_ADMIN,
    ROLES.ADMIN,
    ROLES.DIRECTOR,
    ROLES.HOD,
    ROLES.STUDENT
  ),
  getStudentSemesterResults
);

router.get(
  '/student/:studentId/semester/:semester',
  restrictTo(
    ROLES.SUPER_ADMIN,
    ROLES.ADMIN,
    ROLES.DIRECTOR,
    ROLES.HOD,
    ROLES.STUDENT
  ),
  getStudentSpecificSemesterResult
);

export default router;