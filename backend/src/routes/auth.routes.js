import { Router } from 'express';
import {
  login,
  logout,
  logoutAll,
  refreshToken,
  getMe,
  forgotPassword,
  resetPassword,
  changePassword,
  sendEmailVerification,
  verifyEmail,
  updateMyProfile,
  uploadAvatar,
} from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.middleware.js';
import { authLimiter, uploadLimiter } from '../middleware/rateLimiter.middleware.js';
import { uploadAvatar as uploadAvatarMiddleware } from '../middleware/upload.middleware.js';
import {
  loginValidator,
  changePasswordValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  updateProfileValidator,
} from '../utils/validators/auth.validator.js';

const router = Router();

// ─── PUBLIC ROUTES ────────────────────────────────────────────
// Login
router.post(
  '/login',
  authLimiter,
  validate(loginValidator),
  login
);

// Refresh token
router.post('/refresh-token', refreshToken);

// Forgot password
router.post(
  '/forgot-password',
  authLimiter,
  validate(forgotPasswordValidator),
  forgotPassword
);

// Reset password
router.patch(
  '/reset-password/:token',
  authLimiter,
  validate(resetPasswordValidator),
  resetPassword
);

// Verify email
router.get('/verify-email/:token', verifyEmail);

// ─── PROTECTED ROUTES (Login required) ───────────────────────
router.use(protect);

// Get current user
router.get('/me', getMe);

// Logout
router.post('/logout', logout);

// Logout from all devices
router.post('/logout-all', logoutAll);

// Change password
router.patch(
  '/change-password',
  validate(changePasswordValidator),
  changePassword
);

// Send email verification
router.post('/send-verification', sendEmailVerification);

// Update profile
router.patch(
  '/update-profile',
  validate(updateProfileValidator),
  updateMyProfile
);

// Upload avatar
router.patch(
  '/upload-avatar',
  uploadLimiter,
  uploadAvatarMiddleware,
  uploadAvatar
);

export default router;