import { Router } from 'express';
import {
  getSettings,
  updateSettings,
  updateGradingScale,
  updateTranscriptSettings,
  uploadUniversityLogo,
} from '../controllers/settings.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { restrictTo } from '../middleware/role.middleware.js';
import { uploadLimiter } from '../middleware/rateLimiter.middleware.js';
import { uploadLogo } from '../middleware/upload.middleware.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

router.use(protect);

router.get('/', getSettings);

router.patch(
  '/',
  restrictTo(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  updateSettings
);

router.patch(
  '/grading-scale',
  restrictTo(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  updateGradingScale
);

router.patch(
  '/transcript',
  restrictTo(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  updateTranscriptSettings
);

router.patch(
  '/logo',
  restrictTo(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  uploadLimiter,
  uploadLogo,
  uploadUniversityLogo
);

export default router;