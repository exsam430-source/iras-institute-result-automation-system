import { Router } from 'express';
import {
  getCurrentSemesterTranscript,
  getCompleteTranscript,
  getSemesterTranscript,
  downloadTranscriptPDF,
} from '../controllers/transcript.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { restrictTo } from '../middleware/role.middleware.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

router.use(protect);

// Student self routes
router.get(
  '/current',
  restrictTo(ROLES.STUDENT),
  getCurrentSemesterTranscript
);

router.get(
  '/complete',
  restrictTo(ROLES.STUDENT),
  getCompleteTranscript
);

router.get(
  '/download',
  restrictTo(ROLES.STUDENT),
  downloadTranscriptPDF
);

// Admin/HoD view specific student transcript
router.get(
  '/student/:studentId/current',
  restrictTo(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HOD),
  getCurrentSemesterTranscript
);

router.get(
  '/student/:studentId/complete',
  restrictTo(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HOD),
  getCompleteTranscript
);

router.get(
  '/student/:studentId/semester/:semester',
  restrictTo(
    ROLES.SUPER_ADMIN,
    ROLES.ADMIN,
    ROLES.HOD,
    ROLES.STUDENT
  ),
  getSemesterTranscript
);

router.get(
  '/student/:studentId/download',
  restrictTo(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HOD),
  downloadTranscriptPDF
);

export default router;