import { Router } from 'express';
import {
  getAllSessions,
  getSessionById,
  createSession,
  updateSession,
  deleteSession,
  getSessionStudents,
} from '../controllers/session.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { restrictTo } from '../middleware/role.middleware.js';
import validate from '../middleware/validate.middleware.js';
import {
  createSessionValidator,
  updateSessionValidator,
} from '../utils/validators/session.validator.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

router.use(protect);

router.get('/', getAllSessions);
router.get('/:id', getSessionById);
router.get('/:id/students', getSessionStudents);

router.post(
  '/',
  restrictTo(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  validate(createSessionValidator),
  createSession
);

router.patch(
  '/:id',
  restrictTo(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HOD),
  validate(updateSessionValidator),
  updateSession
);

router.delete(
  '/:id',
  restrictTo(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  deleteSession
);

export default router;