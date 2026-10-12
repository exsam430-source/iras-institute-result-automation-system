import Notification from '../models/Notification.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../middleware/asyncHandler.middleware.js';
import { HTTP_STATUS, NOTIFICATION_TYPES } from '../utils/constants.js';
import { getPaginationMeta } from '../utils/helpers.js';
import { createNotification } from '../services/notification.service.js';

// ─── GET USER NOTIFICATIONS ───────────────────────────────────
export const getUserNotifications = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 20, type, isRead } = req.query;

  const filter = { recipient: req.user._id };
  if (type) filter.type = type;
  if (isRead !== undefined) filter.isRead = isRead === 'true';

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .populate('sender', 'firstName lastName avatar role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Notification.countDocuments(filter),
    Notification.getUnreadCount(req.user._id),
  ]);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        notifications,
        unreadCount,
        pagination: getPaginationMeta(total, page, limit),
      },
      'Notifications fetched successfully'
    )
  );
});

// ─── GET UNREAD COUNT ─────────────────────────────────────────
export const getUnreadCount = asyncHandler(async (req, res, next) => {
  const count = await Notification.getUnreadCount(req.user._id);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, { count }, 'Unread count fetched successfully')
  );
});

// ─── MARK SINGLE AS READ ──────────────────────────────────────
export const markAsRead = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    recipient: req.user._id,
  });

  if (!notification) {
    return next(
      new ApiError(HTTP_STATUS.NOT_FOUND, 'Notification not found')
    );
  }

  await notification.markAsRead();

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, null, 'Notification marked as read')
  );
});

// ─── MARK ALL AS READ ─────────────────────────────────────────
export const markAllAsRead = asyncHandler(async (req, res, next) => {
  await Notification.markAllAsRead(req.user._id);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, null, 'All notifications marked as read')
  );
});

// ─── DELETE NOTIFICATION ──────────────────────────────────────
export const deleteNotification = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    recipient: req.user._id,
  });

  if (!notification) {
    return next(
      new ApiError(HTTP_STATUS.NOT_FOUND, 'Notification not found')
    );
  }

  await notification.softDelete();

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, null, 'Notification deleted successfully')
  );
});

// ─── SEND ANNOUNCEMENT ───────────────────────────────────────
export const sendAnnouncement = asyncHandler(async (req, res, next) => {
  const { title, message, recipientIds, priority } = req.body;

  if (!title || !message || !recipientIds?.length) {
    return next(
      new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Title, message, and recipient IDs are required'
      )
    );
  }

  const results = await Promise.allSettled(
    recipientIds.map((recipientId) =>
      createNotification({
        recipientId,
        senderId: req.user._id,
        type: NOTIFICATION_TYPES.ANNOUNCEMENT,
        title,
        message,
        priority: priority || 'medium',
      })
    )
  );

  const sent = results.filter((r) => r.status === 'fulfilled').length;

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      { sent, total: recipientIds.length },
      `Announcement sent to ${sent} recipient(s)`
    )
  );
});