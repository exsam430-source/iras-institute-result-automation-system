import AuditLog from '../models/AuditLog.model.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../middleware/asyncHandler.middleware.js';
import { HTTP_STATUS } from '../utils/constants.js';
import { getPaginationMeta, parseSortString } from '../utils/helpers.js';

// ─── GET ALL AUDIT LOGS ───────────────────────────────────────
export const getAllAuditLogs = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    limit = 50,
    userId,
    action,
    resource,
    sort = '-createdAt',
    startDate,
    endDate,
  } = req.query;

  const filter = {};
  if (userId) filter.user = userId;
  if (action) filter.action = action;
  if (resource) filter.resource = resource;

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .populate('user', 'firstName lastName email role avatar')
      .sort(parseSortString(sort))
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    AuditLog.countDocuments(filter),
  ]);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        logs,
        pagination: getPaginationMeta(total, page, limit),
      },
      'Audit logs fetched successfully'
    )
  );
});

// ─── GET AUDIT LOGS BY USER ───────────────────────────────────
export const getAuditLogsByUser = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 50 } = req.query;

  const [logs, total] = await Promise.all([
    AuditLog.findByUser(req.params.userId, {
      page: parseInt(page),
      limit: parseInt(limit),
    }),
    AuditLog.countDocuments({ user: req.params.userId }),
  ]);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        logs,
        pagination: getPaginationMeta(total, page, limit),
      },
      'User audit logs fetched successfully'
    )
  );
});