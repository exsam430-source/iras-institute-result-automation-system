import { Router } from 'express';
import {
  getAllCourses,
  getCourseById,
  createCourse,
  bulkCreateCourses,
  updateCourse,
  deleteCourse,
  getCoursesBySemester,
} from '../controllers/course.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { restrictTo } from '../middleware/role.middleware.js';
import validate from '../middleware/validate.middleware.js';
import {
  createCourseValidator,
  updateCourseValidator,
  bulkCreateCoursesValidator,
} from '../utils/validators/course.validator.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

router.use(protect);

// Accessible to all authenticated users
router.get('/', getAllCourses);
router.get('/semester/:semester', getCoursesBySemester);
router.get('/:id', getCourseById);

// Admin, Director, HoD can create/manage courses
router.post(
  '/',
  restrictTo(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DIRECTOR, ROLES.HOD),
  validate(createCourseValidator),
  createCourse
);

router.post(
  '/bulk',
  restrictTo(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DIRECTOR),
  validate(bulkCreateCoursesValidator),
  bulkCreateCourses
);

router.patch(
  '/:id',
  restrictTo(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DIRECTOR, ROLES.HOD),
  validate(updateCourseValidator),
  updateCourse
);

router.delete(
  '/:id',
  restrictTo(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DIRECTOR),
  deleteCourse
);

export default router;