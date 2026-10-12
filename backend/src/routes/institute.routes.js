import { Router } from 'express';
import {
  getAllInstitutes,
  getInstituteById,
  createInstitute,
  updateInstitute,
  deleteInstitute,
  assignDirector,
  getInstituteDepartments,
  getInstituteStatistics,
  uploadInstituteLogo,
} from '../controllers/institute.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { restrictTo } from '../middleware/role.middleware.js';
import validate from '../middleware/validate.middleware.js';
import { uploadLimiter } from '../middleware/rateLimiter.middleware.js';
import { uploadLogo } from '../middleware/upload.middleware.js';
import {
  createInstituteValidator,
  updateInstituteValidator,
  assignDirectorValidator,
} from '../utils/validators/institute.validator.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

router.use(protect);

// Public to all authenticated users (for dropdowns, etc.)
router.get('/', getAllInstitutes);
router.get('/:id', getInstituteById);
router.get('/:id/departments', getInstituteDepartments);
router.get('/:id/statistics', getInstituteStatistics);

// Admin only
router.post(
  '/',
  restrictTo(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  validate(createInstituteValidator),
  createInstitute
);

router.patch(
  '/:id',
  restrictTo(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  validate(updateInstituteValidator),
  updateInstitute
);

router.delete(
  '/:id',
  restrictTo(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  deleteInstitute
);

router.patch(
  '/:id/assign-director',
  restrictTo(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  validate(assignDirectorValidator),
  assignDirector
);

router.patch(
  '/:id/logo',
  restrictTo(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  uploadLimiter,
  uploadLogo,
  uploadInstituteLogo
);

export default router;