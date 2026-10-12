import { Router } from 'express';
import {
  getMarksByAssignment,
  getSingleMark,
  saveMidTermMarks,
  saveFinalsMarks,
  updateSingleStudentMark,
  importMarksFromExcel,
  getStudentAllMarks,
  getStudentSemesterMarks,
} from '../controllers/marks.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { restrictTo } from '../middleware/role.middleware.js';
import validate from '../middleware/validate.middleware.js';
import { uploadDocument } from '../middleware/upload.middleware.js';
import asyncHandler from '../middleware/asyncHandler.middleware.js';
import StudentProfile from '../models/StudentProfile.model.js';
import ApiError from '../utils/ApiError.js';
import {
  saveMidTermMarksValidator,
  saveFinalsMarksValidator,
  updateSingleMarkValidator,
} from '../utils/validators/marks.validator.js';
import { ROLES, HTTP_STATUS } from '../utils/constants.js';

const router = Router();

router.use(protect);

// ─── STUDENT SELF ROUTE ───────────────────────────────────────
// Must be BEFORE /:id route
router.get(
  '/student/current',
  restrictTo(ROLES.STUDENT),
  asyncHandler(async (req, res, next) => {
    const profile = await StudentProfile.findOne({ user: req.user._id });
    if (!profile) {
      return next(new ApiError(HTTP_STATUS.NOT_FOUND, 'Student profile not found'));
    }
    req.params.studentId = profile._id.toString();
    return getStudentAllMarks(req, res, next);
  })
);

// ─── STUDENT MARKS ROUTES ─────────────────────────────────────
router.get(
  '/student/:studentId/all',
  restrictTo(
    ROLES.SUPER_ADMIN,
    ROLES.ADMIN,
    ROLES.HOD,
    ROLES.TEACHER,
    ROLES.STUDENT
  ),
  getStudentAllMarks
);

router.get(
  '/student/:studentId/semester/:semester',
  restrictTo(
    ROLES.SUPER_ADMIN,
    ROLES.ADMIN,
    ROLES.HOD,
    ROLES.TEACHER,
    ROLES.STUDENT
  ),
  getStudentSemesterMarks
);

// ─── ASSIGNMENT MARKS ROUTES ──────────────────────────────────
router.get(
  '/assignment/:id',
  restrictTo(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HOD, ROLES.TEACHER),
  getMarksByAssignment
);

// ─── PROGRESSIVE MARKS SAVE ───────────────────────────────────
router.patch(
  '/assignment/:id/save-midterm',
  restrictTo(ROLES.TEACHER, ROLES.SUPER_ADMIN, ROLES.ADMIN),
  validate(saveMidTermMarksValidator),
  saveMidTermMarks
);

router.patch(
  '/assignment/:id/save-finals',
  restrictTo(ROLES.TEACHER, ROLES.SUPER_ADMIN, ROLES.ADMIN),
  validate(saveFinalsMarksValidator),
  saveFinalsMarks
);

// ─── IMPORT FROM EXCEL ────────────────────────────────────────
router.post(
  '/assignment/:id/import',
  restrictTo(ROLES.TEACHER, ROLES.SUPER_ADMIN, ROLES.ADMIN),
  uploadDocument,
  importMarksFromExcel
);

// ─── SINGLE MARK ROUTES ───────────────────────────────────────
// Must be AFTER /student/* and /assignment/* routes
router.get(
  '/:id',
  restrictTo(
    ROLES.SUPER_ADMIN,
    ROLES.ADMIN,
    ROLES.HOD,
    ROLES.TEACHER,
    ROLES.STUDENT
  ),
  getSingleMark
);

router.patch(
  '/:marksId/update',
  restrictTo(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEACHER),
  validate(updateSingleMarkValidator),
  updateSingleStudentMark
);

export default router;