import { Router } from 'express';
import {
  getAllCourseAssignments,
  getCourseAssignmentById,
  createCourseAssignment,
  updateCourseAssignment,
  deleteCourseAssignment,
  getAwardList,
  regenerateAwardList,
  exportAwardList,
  submitResultToHoD,
  approveResult,
  rejectResult,
  getTeacherDashboard,
  getHoDPendingResults,
  getAssignmentStudents,
} from '../controllers/courseAssignment.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { restrictTo } from '../middleware/role.middleware.js';
import validate from '../middleware/validate.middleware.js';
import {
  createCourseAssignmentValidator,
  updateCourseAssignmentValidator,
  rejectResultValidator,
} from '../utils/validators/courseAssignment.validator.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

router.use(protect);

// ─── DASHBOARD ROUTES ─────────────────────────────────────────
router.get(
  '/teacher-dashboard',
  restrictTo(ROLES.TEACHER),
  getTeacherDashboard
);

router.get(
  '/hod-pending',
  restrictTo(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HOD),
  getHoDPendingResults
);

// ─── LIST & CREATE ────────────────────────────────────────────
router.get(
  '/',
  restrictTo(
    ROLES.SUPER_ADMIN,
    ROLES.ADMIN,
    ROLES.DIRECTOR,
    ROLES.HOD,
    ROLES.TEACHER
  ),
  getAllCourseAssignments
);

router.post(
  '/',
  restrictTo(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HOD),
  validate(createCourseAssignmentValidator),
  createCourseAssignment
);

// ─── SINGLE ASSIGNMENT ────────────────────────────────────────
router.get(
  '/:id',
  restrictTo(
    ROLES.SUPER_ADMIN,
    ROLES.ADMIN,
    ROLES.DIRECTOR,
    ROLES.HOD,
    ROLES.TEACHER
  ),
  getCourseAssignmentById
);

router.patch(
  '/:id',
  restrictTo(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HOD),
  validate(updateCourseAssignmentValidator),
  updateCourseAssignment
);

router.delete(
  '/:id',
  restrictTo(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HOD),
  deleteCourseAssignment
);

// ─── AWARD LIST ROUTES ────────────────────────────────────────
router.get(
  '/:id/award-list',
  restrictTo(
    ROLES.SUPER_ADMIN,
    ROLES.ADMIN,
    ROLES.HOD,
    ROLES.TEACHER
  ),
  getAwardList
);

router.post(
  '/:id/award-list/regenerate',
  restrictTo(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HOD),
  regenerateAwardList
);

router.get(
  '/:id/award-list/export',
  restrictTo(
    ROLES.SUPER_ADMIN,
    ROLES.ADMIN,
    ROLES.HOD,
    ROLES.TEACHER
  ),
  exportAwardList
);

// ─── ENROLLED STUDENTS ────────────────────────────────────────
router.get(
  '/:id/students',
  restrictTo(
    ROLES.SUPER_ADMIN,
    ROLES.ADMIN,
    ROLES.HOD,
    ROLES.TEACHER
  ),
  getAssignmentStudents
);

// ─── RESULT FLOW ROUTES ───────────────────────────────────────
// Teacher submits to HoD
router.post(
  '/:id/submit',
  restrictTo(ROLES.TEACHER),
  submitResultToHoD
);

// HoD approves
router.post(
  '/:id/approve',
  restrictTo(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HOD),
  approveResult
);

// HoD rejects
router.post(
  '/:id/reject',
  restrictTo(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HOD),
  validate(rejectResultValidator),
  rejectResult
);

export default router;