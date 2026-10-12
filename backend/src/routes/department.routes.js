import { Router } from 'express';
import {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  assignHoD,
  getDepartmentTeachers,
  getDepartmentStudents,
  getDepartmentStatistics,
} from '../controllers/department.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { restrictTo } from '../middleware/role.middleware.js';
import validate from '../middleware/validate.middleware.js';
import {
  createDepartmentValidator,
  updateDepartmentValidator,
  assignHodValidator,
} from '../utils/validators/department.validator.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

router.use(protect);

// Accessible to authenticated staff
router.get('/', getAllDepartments);
router.get('/:id', getDepartmentById);
router.get('/:id/teachers', getDepartmentTeachers);
router.get('/:id/students', getDepartmentStudents);
router.get('/:id/statistics', getDepartmentStatistics);

// Admin only - create/delete
router.post(
  '/',
  restrictTo(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  validate(createDepartmentValidator),
  createDepartment
);

router.delete(
  '/:id',
  restrictTo(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  deleteDepartment
);

// Admin - update
router.patch(
  '/:id',
  restrictTo(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DIRECTOR),
  validate(updateDepartmentValidator),
  updateDepartment
);

// Admin & Director - assign HoD
router.patch(
  '/:id/assign-hod',
  restrictTo(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DIRECTOR),
  validate(assignHodValidator),
  assignHoD
);

export default router;