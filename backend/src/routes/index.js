import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import studentProfileRoutes from './studentProfile.routes.js';
import instituteRoutes from './institute.routes.js';
import departmentRoutes from './department.routes.js';
import programRoutes from './program.routes.js';
import sessionRoutes from './session.routes.js';
import courseRoutes from './course.routes.js';
import courseAssignmentRoutes from './courseAssignment.routes.js';
import marksRoutes from './marks.routes.js';
import semesterResultRoutes from './semesterResult.routes.js';
import transcriptRoutes from './transcript.routes.js';
import promotionRoutes from './promotion.routes.js';
import notificationRoutes from './notification.routes.js';
import analyticsRoutes from './analytics.routes.js';
import auditLogRoutes from './auditLog.routes.js';
import settingsRoutes from './settings.routes.js';

const router = Router();

// API Version info
router.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'IRAS API v1 - University of Swat',
    version: '1.0.0',
    endpoints: {
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      students: '/api/v1/students',
      institutes: '/api/v1/institutes',
      departments: '/api/v1/departments',
      programs: '/api/v1/programs',
      sessions: '/api/v1/sessions',
      courses: '/api/v1/courses',
      courseAssignments: '/api/v1/course-assignments',
      marks: '/api/v1/marks',
      semesterResults: '/api/v1/semester-results',
      transcripts: '/api/v1/transcripts',
      promotion: '/api/v1/promotion',
      notifications: '/api/v1/notifications',
      analytics: '/api/v1/analytics',
      auditLogs: '/api/v1/audit-logs',
      settings: '/api/v1/settings',
    },
    timestamp: new Date().toISOString(),
  });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/students', studentProfileRoutes);
router.use('/institutes', instituteRoutes);
router.use('/departments', departmentRoutes);
router.use('/programs', programRoutes);
router.use('/sessions', sessionRoutes);
router.use('/courses', courseRoutes);
router.use('/course-assignments', courseAssignmentRoutes);
router.use('/marks', marksRoutes);
router.use('/semester-results', semesterResultRoutes);
router.use('/transcripts', transcriptRoutes);
router.use('/promotion', promotionRoutes);
router.use('/notifications', notificationRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/audit-logs', auditLogRoutes);
router.use('/settings', settingsRoutes);

export default router;