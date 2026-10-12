import { Router } from 'express';
import {
  getAllAuditLogs,
  getAuditLogsByUser,
} from '../controllers/auditLog.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { restrictTo } from '../middleware/role.middleware.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

router.use(protect);
router.use(restrictTo(ROLES.SUPER_ADMIN, ROLES.ADMIN));

router.get('/', getAllAuditLogs);
router.get('/user/:userId', getAuditLogsByUser);

export default router;