import { Router } from 'express';
import {
  getAllPrograms,
  getProgramById,
  createProgram,
  updateProgram,
  deleteProgram,
  getProgramCourses,
} from '../controllers/program.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { restrictTo } from '../middleware/role.middleware.js';
import validate from '../middleware/validate.middleware.js';
import {
  createProgramValidator,
  updateProgramValidator,
} from '../utils/validators/program.validator.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

router.use(protect);

router.get('/', getAllPrograms);
router.get('/:id', getProgramById);
router.get('/:id/courses', getProgramCourses);

router.post(
  '/',
  restrictTo(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DIRECTOR),
  validate(createProgramValidator),
  createProgram
);

router.patch(
  '/:id',
  restrictTo(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DIRECTOR),
  validate(updateProgramValidator),
  updateProgram
);

router.delete(
  '/:id',
  restrictTo(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  deleteProgram
);

export default router;