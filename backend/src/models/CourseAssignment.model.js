import mongoose from 'mongoose';
import { ASSIGNMENT_STATUS } from '../utils/constants.js';

const enrolledStudentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudentProfile',
      required: true,
    },
    enrolledAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
  },
  { _id: false }
);

const gradeDistributionSchema = new mongoose.Schema(
  {
    A: { type: Number, default: 0 },
    'A-': { type: Number, default: 0 },
    'B+': { type: Number, default: 0 },
    B: { type: Number, default: 0 },
    'B-': { type: Number, default: 0 },
    'C+': { type: Number, default: 0 },
    C: { type: Number, default: 0 },
    'C-': { type: Number, default: 0 },
    D: { type: Number, default: 0 },
    F: { type: Number, default: 0 },
  },
  { _id: false }
);

const statisticsSchema = new mongoose.Schema(
  {
    totalStudents: { type: Number, default: 0 },
    passedStudents: { type: Number, default: 0 },
    failedStudents: { type: Number, default: 0 },
    averageMarks: { type: Number, default: 0 },
    highestMarks: { type: Number, default: 0 },
    lowestMarks: { type: Number, default: 0 },
    passRate: { type: Number, default: 0 },
    gradeDistribution: { type: gradeDistributionSchema, default: () => ({}) },
  },
  { _id: false }
);

const courseAssignmentSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course is required'],
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Teacher is required'],
    },
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      required: [true, 'Session is required'],
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required'],
      min: [1, 'Semester must be at least 1'],
    },
    institute: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institute',
      required: [true, 'Institute is required'],
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required'],
    },
    program: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Program',
      required: [true, 'Program is required'],
    },
    academicYear: {
      type: String,
      trim: true,
      default: () => new Date().getFullYear().toString(),
    },
    section: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: [5, 'Section cannot exceed 5 characters'],
      default: null,
    },
    // Auto-enrolled students
    enrolledStudents: {
      type: [enrolledStudentSchema],
      default: [],
    },
    // Award list status
    awardListGenerated: {
      type: Boolean,
      default: false,
    },
    awardListGeneratedAt: {
      type: Date,
      default: null,
    },
    // Progressive marks phases timestamps
    midTermSavedAt: { type: Date, default: null },
    midTermNotificationSentAt: { type: Date, default: null },
    finalsSavedAt: { type: Date, default: null },
    finalsNotificationSentAt: { type: Date, default: null },
    // Status tracking
    status: {
      type: String,
      enum: {
        values: Object.values(ASSIGNMENT_STATUS),
        message: '{VALUE} is not a valid status',
      },
      default: ASSIGNMENT_STATUS.ASSIGNED,
    },
    // HoD actions
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Rejection reason cannot exceed 500 characters'],
      default: null,
    },
    // Statistics (cached after submission)
    statistics: {
      type: statisticsSchema,
      default: () => ({}),
    },
    // Audit fields
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date, default: null },
    approvedAt: { type: Date, default: null },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    rejectedAt: { type: Date, default: null },
    rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── INDEXES ──────────────────────────────────────────────────
courseAssignmentSchema.index(
  { course: 1, session: 1, section: 1 },
  { unique: true, sparse: true }
);
courseAssignmentSchema.index({ teacher: 1, session: 1, semester: 1 });
courseAssignmentSchema.index({ department: 1, semester: 1, status: 1 });
courseAssignmentSchema.index({ institute: 1, session: 1 });
courseAssignmentSchema.index({ status: 1, createdAt: -1 });

// ─── VIRTUALS ─────────────────────────────────────────────────
courseAssignmentSchema.virtual('totalEnrolled').get(function () {
  return this.enrolledStudents
    ? this.enrolledStudents.filter((s) => s.isActive).length
    : 0;
});

courseAssignmentSchema.virtual('canSubmit').get(function () {
  return this.status === ASSIGNMENT_STATUS.FINALS_SAVED;
});

courseAssignmentSchema.virtual('marks', {
  ref: 'Marks',
  localField: '_id',
  foreignField: 'courseAssignment',
});

// ─── INSTANCE METHODS ─────────────────────────────────────────
courseAssignmentSchema.methods.isTeacher = function (userId) {
  return this.teacher.toString() === userId.toString();
};

courseAssignmentSchema.methods.isStudentEnrolled = function (studentProfileId) {
  return this.enrolledStudents.some(
    (s) =>
      s.student.toString() === studentProfileId.toString() && s.isActive
  );
};

// ─── STATIC METHODS ───────────────────────────────────────────
courseAssignmentSchema.statics.findByTeacher = function (teacherId, sessionId) {
  const query = { teacher: teacherId };
  if (sessionId) query.session = sessionId;
  return this.find(query)
    .populate('course', 'name code creditHours semester')
    .sort({ createdAt: -1 });
};

courseAssignmentSchema.statics.findPendingApproval = function (departmentId) {
  return this.find({
    department: departmentId,
    status: ASSIGNMENT_STATUS.SUBMITTED,
  })
    .populate('course', 'name code')
    .populate('teacher', 'firstName lastName email')
    .sort({ submittedAt: -1 });
};

const CourseAssignment = mongoose.model('CourseAssignment', courseAssignmentSchema);
export default CourseAssignment;