import { Router } from 'express';
import {
  checkEligibility,
  getPromotionPreview,
  initiatePromotion,
  getPromotionHistory,
} from '../controllers/promotion.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { restrictTo } from '../middleware/role.middleware.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

router.use(protect);

router.get(
  '/check-eligibility',
  restrictTo(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HOD),
  checkEligibility
);

router.get(
  '/preview',
  restrictTo(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HOD),
  getPromotionPreview
);

router.post(
  '/initiate',
  restrictTo(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HOD),
  initiatePromotion
);

router.get(
  '/history',
  restrictTo(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DIRECTOR, ROLES.HOD),
  getPromotionHistory
);

export default router;