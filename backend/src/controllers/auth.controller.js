import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import StudentProfile from '../models/StudentProfile.model.js';
import AuditLog from '../models/AuditLog.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../middleware/asyncHandler.middleware.js';
import {
  generateAccessToken,
  generateRefreshToken,
  generateEmailVerificationToken,
  generatePasswordResetToken,
  verifyToken,
} from '../utils/generateToken.js';
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from '../services/email.service.js';
import { COOKIE_OPTIONS, HTTP_STATUS, ROLES } from '../utils/constants.js';

// ─── HELPER: Send tokens as cookies + body ────────────────────
const sendTokenResponse = async (user, statusCode, res, message) => {
  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  // Save refresh token to user
  await user.addRefreshToken(refreshToken);

  // Set cookies
  res.cookie('accessToken', accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie('refreshToken', refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  // Remove sensitive fields
  const userObj = user.toObject();
  delete userObj.password;
  delete userObj.refreshTokens;
  delete userObj.loginAttempts;
  delete userObj.lockUntil;
  delete userObj.passwordHistory;
  delete userObj.emailVerificationToken;
  delete userObj.passwordResetToken;

  // Populate student profile if student
  let studentProfile = null;
  if (user.role === ROLES.STUDENT) {
    studentProfile = await StudentProfile.findOne({ user: user._id })
      .select('rollNumber registrationNumber currentSemester enrollmentStatus cumulativeGPA program session')
      .populate('program', 'name code degreeType')
      .populate('session', 'name startYear endYear')
      .lean();
  }

  res.status(statusCode).json(
    new ApiResponse(statusCode, {
      user: userObj,
      studentProfile,
      accessToken,
    }, message)
  );
};

// ─── LOGIN ────────────────────────────────────────────────────
export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Find user with password field
  const user = await User.findOne({ email: email.toLowerCase() })
    .select('+password +loginAttempts +lockUntil +refreshTokens')
    .populate('institute', 'name code')
    .populate('department', 'name code');

  if (!user) {
    return next(
      new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid email or password.')
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
        `Account is temporarily locked due to multiple failed login attempts. Please try again in ${lockTimeRemaining} minutes.`
      )
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

  // Verify password
  const isPasswordCorrect = await user.comparePassword(password);

  if (!isPasswordCorrect) {
    // Increment login attempts
    await user.incrementLoginAttempts();

    const attemptsLeft =
      (parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5) -
      (user.loginAttempts + 1);

    if (attemptsLeft <= 0) {
      // Log account lock
      await AuditLog.log({
        user: user._id,
        userSnapshot: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
        },
        action: 'ACCOUNT_LOCKED',
        resource: 'user',
        resourceId: user._id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        description: 'Account locked due to multiple failed login attempts',
      });

      return next(
        new ApiError(
          HTTP_STATUS.UNAUTHORIZED,
          'Account locked due to too many failed attempts. Please try again in 30 minutes.'
        )
      );
    }

    return next(
      new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        `Invalid email or password. ${attemptsLeft} attempt(s) remaining before account lockout.`
      )
    );
  }

  // Reset login attempts on successful login
  await user.resetLoginAttempts();

  // Update last login
  user.lastLogin = new Date();
  user.lastLoginIP = req.ip;
  await user.save({ validateBeforeSave: false });

  // Log successful login
  await AuditLog.log({
    user: user._id,
    userSnapshot: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    },
    action: 'USER_LOGIN',
    resource: 'user',
    resourceId: user._id,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    description: `User logged in successfully`,
  });

  await sendTokenResponse(user, HTTP_STATUS.OK, res, 'Login successful');
});

// ─── LOGOUT ───────────────────────────────────────────────────
export const logout = asyncHandler(async (req, res, next) => {
  const refreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (req.user) {
    // Remove the specific refresh token
    if (refreshToken) {
      await req.user.removeRefreshToken(refreshToken);
    }

    // Log logout
    await AuditLog.log({
      user: req.user._id,
      userSnapshot: {
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        email: req.user.email,
        role: req.user.role,
      },
      action: 'USER_LOGOUT',
      resource: 'user',
      resourceId: req.user._id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  // Clear cookies
  res.clearCookie('accessToken', COOKIE_OPTIONS);
  res.clearCookie('refreshToken', COOKIE_OPTIONS);

  res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, null, 'Logged out successfully'));
});

// ─── LOGOUT ALL DEVICES ───────────────────────────────────────
export const logoutAll = asyncHandler(async (req, res, next) => {
  await req.user.removeAllRefreshTokens();

  res.clearCookie('accessToken', COOKIE_OPTIONS);
  res.clearCookie('refreshToken', COOKIE_OPTIONS);

  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(
        HTTP_STATUS.OK,
        null,
        'Logged out from all devices successfully'
      )
    );
});

// ─── REFRESH TOKEN ────────────────────────────────────────────
export const refreshToken = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!token) {
    return next(
      new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Refresh token not provided.')
    );
  }

  let decoded;
  try {
    decoded = verifyToken(token, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    return next(
      new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        'Invalid or expired refresh token. Please login again.'
      )
    );
  }

  // Find user and verify token exists
  const user = await User.findById(decoded.id)
    .select('+refreshTokens +loginAttempts +lockUntil')
    .populate('institute', 'name code')
    .populate('department', 'name code');

  if (!user) {
    return next(
      new ApiError(HTTP_STATUS.UNAUTHORIZED, 'User not found.')
    );
  }

  if (!user.isActive) {
    return next(
      new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Account is deactivated.')
    );
  }

  // Check if refresh token is in user's tokens list
  if (!user.refreshTokens || !user.refreshTokens.includes(token)) {
    // Possible token reuse attack - clear all tokens
    await user.removeAllRefreshTokens();
    return next(
      new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        'Token reuse detected. Please login again.'
      )
    );
  }

  // Rotate refresh token
  await user.removeRefreshToken(token);

  // Generate new tokens
  const newAccessToken = generateAccessToken(user._id, user.role);
  const newRefreshToken = generateRefreshToken(user._id);

  await user.addRefreshToken(newRefreshToken);

  // Set new cookies
  res.cookie('accessToken', newAccessToken, {
    ...COOKIE_OPTIONS,
    maxAge: 15 * 60 * 1000,
  });

  res.cookie('refreshToken', newRefreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  const userObj = user.toObject();
  delete userObj.refreshTokens;
  delete userObj.loginAttempts;
  delete userObj.lockUntil;

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      { accessToken: newAccessToken, user: userObj },
      'Token refreshed successfully'
    )
  );
});

// ─── GET CURRENT USER ─────────────────────────────────────────
export const getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id)
    .populate('institute', 'name code logo')
    .populate('department', 'name code');

  let studentProfile = null;
  if (user.role === ROLES.STUDENT) {
    studentProfile = await StudentProfile.findOne({ user: user._id })
      .populate('program', 'name code degreeType totalSemesters')
      .populate('session', 'name startYear endYear')
      .populate('institute', 'name code')
      .populate('department', 'name code')
      .lean();
  }

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, { user, studentProfile }, 'User fetched successfully')
  );
});

// ─── FORGOT PASSWORD ──────────────────────────────────────────
export const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() });

  // Always return success to prevent email enumeration
  const successMessage =
    'If an account with that email exists, a password reset link has been sent.';

  if (!user || !user.isActive) {
    return res
      .status(HTTP_STATUS.OK)
      .json(new ApiResponse(HTTP_STATUS.OK, null, successMessage));
  }

  // Generate reset token
  const { resetToken, hashedToken, expiry } = generatePasswordResetToken();

  // Save hashed token to user
  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = new Date(expiry);
  await user.save({ validateBeforeSave: false });

  // Send email
  try {
    await sendPasswordResetEmail(user, resetToken);

    res
      .status(HTTP_STATUS.OK)
      .json(new ApiResponse(HTTP_STATUS.OK, null, successMessage));
  } catch (error) {
    // Revert token if email fails
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new ApiError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Failed to send reset email. Please try again.'
      )
    );
  }
});

// ─── RESET PASSWORD ───────────────────────────────────────────
export const resetPassword = asyncHandler(async (req, res, next) => {
  const { token } = req.params;
  const { password } = req.body;

  // Hash the token to compare with stored hash
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  // Find user with valid token
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select('+password +passwordHistory +passwordResetToken +passwordResetExpires');

  if (!user) {
    return next(
      new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Password reset link is invalid or has expired. Please request a new one.'
      )
    );
  }

  // Check password history
  const isUsedBefore = await user.isPasswordUsedBefore(password);
  if (isUsedBefore) {
    return next(
      new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'You cannot reuse a previous password. Please choose a new password.'
      )
    );
  }

  // Update password
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.loginAttempts = 0;
  user.lockUntil = undefined;
  await user.save();

  // Log password reset
  await AuditLog.log({
    user: user._id,
    userSnapshot: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    },
    action: 'PASSWORD_RESET',
    resource: 'user',
    resourceId: user._id,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    description: 'Password reset via email link',
  });

  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(
        HTTP_STATUS.OK,
        null,
        'Password reset successful. You can now login with your new password.'
      )
    );
});

// ─── CHANGE PASSWORD ──────────────────────────────────────────
export const changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  // Get user with password
  const user = await User.findById(req.user._id).select(
    '+password +passwordHistory'
  );

  // Verify current password
  const isCurrentPasswordCorrect = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordCorrect) {
    return next(
      new ApiError(HTTP_STATUS.BAD_REQUEST, 'Current password is incorrect.')
    );
  }

  // Check if new password is same as current
  const isSameAsCurrent = await user.comparePassword(newPassword);
  if (isSameAsCurrent) {
    return next(
      new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'New password cannot be the same as your current password.'
      )
    );
  }

  // Check password history
  const isUsedBefore = await user.isPasswordUsedBefore(newPassword);
  if (isUsedBefore) {
    return next(
      new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'You cannot reuse a previous password. Please choose a new password.'
      )
    );
  }

  // Update password
  user.password = newPassword;
  user.mustChangePassword = false;
  await user.save();

  // Clear all refresh tokens (force re-login on all devices)
  await user.removeAllRefreshTokens();

  // Log password change
  await AuditLog.log({
    user: user._id,
    userSnapshot: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    },
    action: 'PASSWORD_CHANGED',
    resource: 'user',
    resourceId: user._id,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    description: 'Password changed by user',
  });

  // Clear cookies
  res.clearCookie('accessToken', COOKIE_OPTIONS);
  res.clearCookie('refreshToken', COOKIE_OPTIONS);

  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(
        HTTP_STATUS.OK,
        null,
        'Password changed successfully. Please login with your new password.'
      )
    );
});

// ─── SEND EMAIL VERIFICATION ──────────────────────────────────
export const sendEmailVerification = asyncHandler(async (req, res, next) => {
  const user = req.user;

  if (user.isEmailVerified) {
    return next(
      new ApiError(HTTP_STATUS.BAD_REQUEST, 'Email is already verified.')
    );
  }

  const token = generateEmailVerificationToken(user._id);

  user.emailVerificationToken = token;
  user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  try {
    await sendVerificationEmail(user, token);

    res
      .status(HTTP_STATUS.OK)
      .json(
        new ApiResponse(
          HTTP_STATUS.OK,
          null,
          'Verification email sent successfully. Please check your inbox.'
        )
      );
  } catch (error) {
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new ApiError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Failed to send verification email. Please try again.'
      )
    );
  }
});

// ─── VERIFY EMAIL ─────────────────────────────────────────────
export const verifyEmail = asyncHandler(async (req, res, next) => {
  const { token } = req.params;

  let decoded;
  try {
    decoded = verifyToken(token, process.env.JWT_EMAIL_SECRET);
  } catch (error) {
    return next(
      new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Email verification link is invalid or has expired.'
      )
    );
  }

  const user = await User.findOne({
    _id: decoded.id,
    emailVerificationToken: token,
  }).select('+emailVerificationToken +emailVerificationExpires');

  if (!user) {
    return next(
      new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Email verification link is invalid or has already been used.'
      )
    );
  }

  if (
    user.emailVerificationExpires &&
    user.emailVerificationExpires < Date.now()
  ) {
    return next(
      new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Email verification link has expired. Please request a new one.'
      )
    );
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save({ validateBeforeSave: false });

  await AuditLog.log({
    user: user._id,
    userSnapshot: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    },
    action: 'EMAIL_VERIFIED',
    resource: 'user',
    resourceId: user._id,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(
        HTTP_STATUS.OK,
        null,
        'Email verified successfully. You can now login.'
      )
    );
});

// ─── UPDATE MY PROFILE ────────────────────────────────────────
export const updateMyProfile = asyncHandler(async (req, res, next) => {
  const {
    firstName,
    lastName,
    phone,
    gender,
    dateOfBirth,
    address,
    cnic,
  } = req.body;

  const updateData = {};
  if (firstName) updateData.firstName = firstName;
  if (lastName) updateData.lastName = lastName;
  if (phone !== undefined) updateData.phone = phone;
  if (gender !== undefined) updateData.gender = gender;
  if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;
  if (address !== undefined) updateData.address = address;
  if (cnic !== undefined) updateData.cnic = cnic;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    updateData,
    { new: true, runValidators: true }
  )
    .populate('institute', 'name code')
    .populate('department', 'name code');

  await AuditLog.log({
    user: req.user._id,
    userSnapshot: {
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      role: req.user.role,
    },
    action: 'USER_UPDATED',
    resource: 'user',
    resourceId: req.user._id,
    newData: updateData,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    description: 'User updated own profile',
  });

  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(HTTP_STATUS.OK, { user }, 'Profile updated successfully')
    );
});

// ─── UPLOAD AVATAR ────────────────────────────────────────────
export const uploadAvatar = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new ApiError(HTTP_STATUS.BAD_REQUEST, 'Please upload an image.'));
  }

  const { uploadToCloudinary, deleteFromCloudinary } = await import(
    '../config/cloudinary.js'
  );

  // Delete old avatar if exists
  if (req.user.avatarPublicId) {
    await deleteFromCloudinary(req.user.avatarPublicId).catch(() => {});
  }

  // Upload new avatar
  const result = await uploadToCloudinary(req.file.buffer, {
    folder: 'iras/avatars',
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
  });

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      avatar: result.secure_url,
      avatarPublicId: result.public_id,
    },
    { new: true }
  );

  await AuditLog.log({
    user: req.user._id,
    userSnapshot: {
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      role: req.user.role,
    },
    action: 'AVATAR_UPDATED',
    resource: 'user',
    resourceId: req.user._id,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(
        HTTP_STATUS.OK,
        { avatar: user.avatar },
        'Avatar updated successfully'
      )
    );
});