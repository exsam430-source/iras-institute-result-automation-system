import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from './asyncHandler.middleware.js';
import { HTTP_STATUS } from '../utils/constants.js';

// ─── PROTECT ROUTE MIDDLEWARE ─────────────────────────────────
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Extract token from Authorization header or cookie
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return next(
      new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        'Access denied. Please login to continue.'
      )
    );
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // Find user
    const user = await User.findById(decoded.id)
      .select('+loginAttempts +lockUntil +refreshTokens')
      .populate('institute', 'name code')
      .populate('department', 'name code');

    if (!user) {
      return next(
        new ApiError(HTTP_STATUS.UNAUTHORIZED, 'User no longer exists.')
      );
    }

    // Check if account is active
    if (!user.isActive) {
      return next(
        new ApiError(
          HTTP_STATUS.UNAUTHORIZED,
          'Your account has been deactivated. Please contact the administrator.'
        )
      );
    }

    // Check if account is locked
    if (user.isLocked) {
      const lockTimeRemaining = Math.ceil(
        (user.lockUntil - Date.now()) / 1000 / 60
      );
      return next(
        new ApiError(
          HTTP_STATUS.UNAUTHORIZED,
          `Account is temporarily locked. Please try again in ${lockTimeRemaining} minutes.`
        )
      );
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(
        new ApiError(
          HTTP_STATUS.UNAUTHORIZED,
          'Session expired. Please login again.'
        )
      );
    }
    if (error.name === 'JsonWebTokenError') {
      return next(
        new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid token. Please login again.')
      );
    }
    return next(
      new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Authentication failed.')
    );
  }
});