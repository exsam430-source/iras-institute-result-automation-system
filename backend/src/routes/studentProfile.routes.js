import { Router } from 'express';
import {
  createStudent,
  getAllStudents,
  getStudentById,
  getStudentByUserId,
  updateStudentProfile,
  getMyStudentProfile,
  getStudentAcademicRecord,
  getStudentsBySemester,
  getStudentCurrentMarks,
} from '../controllers/studentProfile.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { restrictTo } from '../middleware/role.middleware.js';
import validate from '../middleware/validate.middleware.js';
import { createStudentValidator } from '../utils/validators/user.validator.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

router.use(protect);

// ─── STUDENT SELF ROUTES ──────────────────────────────────────
router.get(
  '/my-profile',
  restrictTo(ROLES.STUDENT),
  getMyStudentProfile
);

router.get(
  '/my-academic-record',
  restrictTo(ROLES.STUDENT),
  getStudentAcademicRecord
);

router.get(
  '/my-current-marks',
  restrictTo(ROLES.STUDENT),
  getStudentCurrentMarks
);

// ─── QUERY ROUTES ─────────────────────────────────────────────
router.get(
  '/by-semester',
  restrictTo(
    ROLES.SUPER_ADMIN,
    ROLES.ADMIN,
    ROLES.DIRECTOR,
    ROLES.HOD,
    ROLES.TEACHER
  ),
  getStudentsBySemester
);

router.get(
  '/by-user/:userId',
  restrictTo(
    ROLES.SUPER_ADMIN,
    ROLES.ADMIN,
    ROLES.DIRECTOR,
    ROLES.HOD
  ),
  getStudentByUserId
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
  getAllStudents
);

router.post(
  '/',
  restrictTo(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HOD),
  validate(createStudentValidator),
  createStudent
);

// ─── SINGLE STUDENT ───────────────────────────────────────────
router.get(
  '/:id',
  restrictTo(
    ROLES.SUPER_ADMIN,
    ROLES.ADMIN,
    ROLES.DIRECTOR,
    ROLES.HOD,
    ROLES.TEACHER
  ),
  getStudentById
);

router.patch(
  '/:id',
  restrictTo(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HOD),
  updateStudentProfile
);

// ─── ACADEMIC RECORD (Admin/HoD view of specific student) ─────
router.get(
  '/:id/academic-record',
  restrictTo(
    ROLES.SUPER_ADMIN,
    ROLES.ADMIN,
    ROLES.DIRECTOR,
    ROLES.HOD
  ),
  getStudentAcademicRecord
);

export default router;