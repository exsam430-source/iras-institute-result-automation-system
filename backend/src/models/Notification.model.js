import mongoose from 'mongoose';
import { NOTIFICATION_TYPES } from '../utils/constants.js';

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient is required'],
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    type: {
      type: String,
      enum: {
        values: Object.values(NOTIFICATION_TYPES),
        message: '{VALUE} is not a valid notification type',
      },
      required: [true, 'Notification type is required'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },
    // Related data for deep linking in frontend
    data: {
      courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null },
      courseAssignmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CourseAssignment',
        default: null,
      },
      marksId: { type: mongoose.Schema.Types.ObjectId, ref: 'Marks', default: null },
      semesterResultId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SemesterResult',
        default: null,
      },
      semester: { type: Number, default: null },
      // For marks notification
      midTermMarks: { type: Number, default: null },
      internalMarks: { type: Number, default: null },
      finalTermMarks: { type: Number, default: null },
      totalMarks: { type: Number, default: null },
      percentage: { type: Number, default: null },
      grade: { type: String, default: null },
      courseName: { type: String, default: null },
      courseCode: { type: String, default: null },
    },
    // Read status
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
    // Email notification
    emailSent: {
      type: Boolean,
      default: false,
    },
    emailSentAt: {
      type: Date,
      default: null,
    },
    emailError: {
      type: String,
      default: null,
      select: false,
    },
    // Priority
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    // Soft delete
    isDeleted: {
      type: Boolean,
      default: false,
      select: false,
    },
    deletedAt: {
      type: Date,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── INDEXES ──────────────────────────────────────────────────
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, type: 1 });
notificationSchema.index({ recipient: 1, isDeleted: 1 });
notificationSchema.index({ createdAt: -1 });
// Auto-delete notifications older than 90 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// ─── PRE FIND HOOKS ───────────────────────────────────────────
notificationSchema.pre(/^find/, function () {
  this.where({ isDeleted: { $ne: true } });
});

// ─── INSTANCE METHODS ─────────────────────────────────────────
notificationSchema.methods.markAsRead = async function () {
  this.isRead = true;
  this.readAt = new Date();
  return this.save({ validateBeforeSave: false });
};

notificationSchema.methods.softDelete = async function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save({ validateBeforeSave: false });
};

// ─── STATIC METHODS ───────────────────────────────────────────
notificationSchema.statics.findUserNotifications = function (userId, options = {}) {
  const { page = 1, limit = 20, type } = options;
  const query = { recipient: userId };
  if (type) query.type = type;

  return this.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('sender', 'firstName lastName avatar role');
};

notificationSchema.statics.getUnreadCount = function (userId) {
  return this.countDocuments({ recipient: userId, isRead: false });
};

notificationSchema.statics.markAllAsRead = function (userId) {
  return this.updateMany(
    { recipient: userId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );
};

notificationSchema.statics.createBulk = function (notifications) {
  return this.insertMany(notifications, { ordered: false });
};

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;