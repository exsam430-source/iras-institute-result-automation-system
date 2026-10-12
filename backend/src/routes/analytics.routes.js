import { Router } from 'express';
import {
  getAdminOverview,
  getHoDOverview,
  getTeacherOverview,
  getStudentOverview,
  getResultDistribution,
  getGPATrends,
  getStudentPerformance,
  getInstituteAnalytics,
} from '../controllers/analytics.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { restrictTo } from '../middleware/role.middleware.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

router.use(protect);

// ─── ROLE-SPECIFIC DASHBOARDS ─────────────────────────────────
router.get(
  '/admin/overview',
  restrictTo(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  getAdminOverview
);

router.get(
  '/hod/overview',
  restrictTo(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DIRECTOR, ROLES.HOD),
  getHoDOverview
);

router.get(
  '/teacher/overview',
  restrictTo(
    ROLES.SUPER_ADMIN,
    ROLES.ADMIN,
    ROLES.HOD,
    ROLES.TEACHER
  ),
  getTeacherOverview
);

router.get(
  '/student/overview',
  restrictTo(
    ROLES.SUPER_ADMIN,
    ROLES.ADMIN,
    ROLES.HOD,
    ROLES.STUDENT
  ),
  getStudentOverview
);

// ─── SHARED ANALYTICS ─────────────────────────────────────────
router.get(
  '/results/distribution',
  restrictTo(
    ROLES.SUPER_ADMIN,
    ROLES.ADMIN,
    ROLES.DIRECTOR,
    ROLES.HOD,
    ROLES.TEACHER
  ),
  getResultDistribution
);

router.get(
  '/results/gpa-trends',
  restrictTo(
    ROLES.SUPER_ADMIN,
    ROLES.ADMIN,
    ROLES.DIRECTOR,
    ROLES.HOD
  ),
  getGPATrends
);

router.get(
  '/students/performance',
  restrictTo(
    ROLES.SUPER_ADMIN,
    ROLES.ADMIN,
    ROLES.DIRECTOR,
    ROLES.HOD
  ),
  getStudentPerformance
);

router.get(
  '/institute/:instituteId',
  restrictTo(
    ROLES.SUPER_ADMIN,
    ROLES.ADMIN,
    ROLES.DIRECTOR
  ),
  getInstituteAnalytics
);

export default router;