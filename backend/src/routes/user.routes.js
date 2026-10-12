import { Router } from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  resetUserPassword,
  bulkImportStudents,
  downloadImportTemplate,
  uploadUserAvatar,
  getUserStats,
} from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { restrictTo, selfOrAdmin } from '../middleware/role.middleware.js';
import validate from '../middleware/validate.middleware.js';
import { uploadLimiter } from '../middleware/rateLimiter.middleware.js';
import {
  uploadAvatar as uploadAvatarMiddleware,
  uploadDocument,
} from '../middleware/upload.middleware.js';
import {
  createUserValidator,
  updateUserValidator,
} from '../utils/validators/user.validator.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

// All routes require authentication
router.use(protect);

// ─── STATS ───────────────────────────────────────────────────
router.get(
  '/stats',
  restrictTo(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  getUserStats
);

// ─── IMPORT TEMPLATE ─────────────────────────────────────────
router.get(
  '/import-template',
  restrictTo(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HOD),
  downloadImportTemplate
);

// ─── BULK IMPORT ─────────────────────────────────────────────
router.post(
  '/bulk-import',
  restrictTo(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HOD),
  uploadDocument,
  bulkImportStudents
);

// ─── LIST & CREATE ────────────────────────────────────────────
router.get(
  '/',
  restrictTo(
    ROLES.SUPER_ADMIN,
    ROLES.ADMIN,
    ROLES.DIRECTOR,
    ROLES.HOD
  ),
  getAllUsers
);

router.post(
  '/',
  restrictTo(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HOD),
  validate(createUserValidator),
  createUser
);

// ─── SINGLE USER ─────────────────────────────────────────────
router.get(
  '/:id',
  restrictTo(
    ROLES.SUPER_ADMIN,
    ROLES.ADMIN,
    ROLES.DIRECTOR,
    ROLES.HOD
  ),
  getUserById
);

router.patch(
  '/:id',
  restrictTo(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HOD),
  validate(updateUserValidator),
  updateUser
);

router.delete(
  '/:id',
  restrictTo(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  deleteUser
);

// ─── STATUS TOGGLE ────────────────────────────────────────────
router.patch(
  '/:id/toggle-status',
  restrictTo(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  toggleUserStatus
);

// ─── PASSWORD RESET (Admin) ───────────────────────────────────
router.patch(
  '/:id/reset-password',
  restrictTo(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  resetUserPassword
);

// ─── AVATAR UPLOAD ────────────────────────────────────────────
router.patch(
  '/:id/avatar',
  restrictTo(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  uploadLimiter,
  uploadAvatarMiddleware,
  uploadUserAvatar
);

export default router;