import SystemSettings from '../models/SystemSettings.model.js';
import AuditLog from '../models/AuditLog.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../middleware/asyncHandler.middleware.js';
import { HTTP_STATUS } from '../utils/constants.js';
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from '../config/cloudinary.js';

// ─── GET SETTINGS ─────────────────────────────────────────────
export const getSettings = asyncHandler(async (req, res, next) => {
  const settings = await SystemSettings.getSettings();

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      { settings },
      'Settings fetched successfully'
    )
  );
});

// ─── UPDATE SETTINGS ──────────────────────────────────────────
export const updateSettings = asyncHandler(async (req, res, next) => {
  const allowedFields = [
    'universityName',
    'universityShortName',
    'universityAddress',
    'universityPhone',
    'universityEmail',
    'universityWebsite',
    'currentAcademicYear',
    'allowStudentResultView',
    'allowTranscriptDownload',
    'emailNotificationsEnabled',
    'maintenanceMode',
    'maintenanceMessage',
  ];

  const updateData = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  });

  const settings = await SystemSettings.updateSettings(updateData, req.user._id);

  await AuditLog.log({
    user: req.user._id,
    userSnapshot: {
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      role: req.user.role,
    },
    action: 'SETTINGS_UPDATED',
    resource: 'systemSettings',
    newData: updateData,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      { settings },
      'Settings updated successfully'
    )
  );
});

// ─── UPDATE GRADING SCALE ─────────────────────────────────────
export const updateGradingScale = asyncHandler(async (req, res, next) => {
  const { gradingScale } = req.body;

  if (!Array.isArray(gradingScale) || gradingScale.length === 0) {
    return next(
      new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Grading scale must be a non-empty array'
      )
    );
  }

  const settings = await SystemSettings.updateSettings(
    { gradingScale },
    req.user._id
  );

  await AuditLog.log({
    user: req.user._id,
    userSnapshot: {
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      role: req.user.role,
    },
    action: 'GRADING_SCALE_UPDATED',
    resource: 'systemSettings',
    newData: { gradingScale },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      { gradingScale: settings.gradingScale },
      'Grading scale updated successfully'
    )
  );
});

// ─── UPDATE TRANSCRIPT SETTINGS ───────────────────────────────
export const updateTranscriptSettings = asyncHandler(async (req, res, next) => {
  const { transcriptSettings } = req.body;

  if (!transcriptSettings || typeof transcriptSettings !== 'object') {
    return next(
      new ApiError(HTTP_STATUS.BAD_REQUEST, 'Transcript settings object is required')
    );
  }

  const settings = await SystemSettings.updateSettings(
    { transcriptSettings },
    req.user._id
  );

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      { transcriptSettings: settings.transcriptSettings },
      'Transcript settings updated successfully'
    )
  );
});

// ─── UPLOAD UNIVERSITY LOGO ───────────────────────────────────
export const uploadUniversityLogo = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(
      new ApiError(HTTP_STATUS.BAD_REQUEST, 'Please upload an image')
    );
  }

  const settings = await SystemSettings.getSettings();

  if (settings.universityLogoPublicId) {
    await deleteFromCloudinary(settings.universityLogoPublicId).catch(() => {});
  }

  const result = await uploadToCloudinary(req.file.buffer, {
    folder: 'iras/university',
    transformation: [
      { width: 300, height: 300, crop: 'fit' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
  });

  await SystemSettings.updateSettings(
    {
      universityLogo: result.secure_url,
      universityLogoPublicId: result.public_id,
    },
    req.user._id
  );

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      { logo: result.secure_url },
      'University logo uploaded successfully'
    )
  );
});