import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    userSnapshot: {
      firstName: String,
      lastName: String,
      email: String,
      role: String,
    },
    action: {
      type: String,
      required: [true, 'Action is required'],
      uppercase: true,
      trim: true,
      enum: [
        'USER_LOGIN', 'USER_LOGOUT', 'PASSWORD_CHANGED', 'PASSWORD_RESET',
        'ACCOUNT_LOCKED', 'EMAIL_VERIFIED', 'USER_CREATED', 'USER_UPDATED',
        'USER_DELETED', 'USER_ACTIVATED', 'USER_DEACTIVATED', 'AVATAR_UPDATED',
        'INSTITUTE_CREATED', 'INSTITUTE_UPDATED', 'INSTITUTE_DELETED',
        'DEPARTMENT_CREATED', 'DEPARTMENT_UPDATED', 'DEPARTMENT_DELETED',
        'HOD_ASSIGNED', 'PROGRAM_CREATED', 'PROGRAM_UPDATED',
        'COURSE_CREATED', 'COURSE_UPDATED', 'COURSE_DELETED',
        'SESSION_CREATED', 'SESSION_UPDATED',
        'COURSE_ASSIGNED', 'COURSE_REASSIGNED', 'STUDENTS_ENROLLED',
        'MIDTERM_MARKS_SAVED', 'FINALS_MARKS_SAVED', 'RESULT_SUBMITTED',
        'RESULT_APPROVED', 'RESULT_REJECTED', 'MARKS_IMPORTED',
        'SEMESTER_RESULT_CALCULATED', 'SEMESTER_PROMOTION_TRIGGERED',
        'SEMESTER_PROMOTION_COMPLETED', 'SETTINGS_UPDATED',
        'GRADING_SCALE_UPDATED', 'TRANSCRIPT_GENERATED',
        'NOTIFICATION_SENT', 'STUDENT_PROFILE_CREATED', 'STUDENT_PROFILE_UPDATED',
      ],
    },
    resource: {
      type: String,
      required: [true, 'Resource is required'],
      trim: true,
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    previousData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
      select: false,
    },
    newData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
      select: false,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
      select: false,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: null,
    },
    isSuccessful: {
      type: Boolean,
      default: true,
    },
    errorMessage: {
      type: String,
      default: null,
      select: false,
    },
  },
  {
    // ✅ FIXED: Single timestamps option only
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// ─── INDEXES ──────────────────────────────────────────────────
auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ resource: 1, resourceId: 1 });
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 365 * 24 * 60 * 60 }
);

// ─── STATIC METHODS ───────────────────────────────────────────
auditLogSchema.statics.log = async function (data) {
  try {
    return await this.create(data);
  } catch (error) {
    console.error('Audit log error:', error.message);
    return null;
  }
};

auditLogSchema.statics.findByUser = function (userId, options = {}) {
  const { page = 1, limit = 50, action } = options;
  const query = { user: userId };
  if (action) query.action = action;
  return this.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('user', 'firstName lastName email role');
};

auditLogSchema.statics.findByResource = function (resource, resourceId) {
  return this.find({ resource, resourceId })
    .sort({ createdAt: -1 })
    .populate('user', 'firstName lastName email role');
};

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;