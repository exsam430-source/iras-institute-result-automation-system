import mongoose from 'mongoose';
import { MARKS_PHASE, GRADING_SCALE } from '../utils/constants.js';

const markComponentSchema = new mongoose.Schema(
  {
    obtained: {
      type: Number,
      default: null,
      min: [0, 'Marks cannot be negative'],
    },
    total: { type: Number, required: true },
    isEntered: { type: Boolean, default: false },
    enteredAt: { type: Date, default: null },
    notifiedAt: { type: Date, default: null },
  },
  { _id: false }
);

const marksSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudentProfile',
      required: [true, 'Student is required'],
    },
    courseAssignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CourseAssignment',
      required: [true, 'Course assignment is required'],
    },
    // Denormalized for performance
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    semester: {
      type: Number,
      required: true,
      min: 1,
    },
    // ─── PROGRESSIVE MARKS ────────────────────────────────
    midTerm: {
      type: markComponentSchema,
      default: () => ({ total: 20, isEntered: false }),
    },
    internal: {
      type: markComponentSchema,
      default: () => ({ total: 20, isEntered: false }),
    },
    finalTerm: {
      type: markComponentSchema,
      default: () => ({ total: 60, isEntered: false }),
    },
    // ─── CALCULATED FIELDS ────────────────────────────────
    totalObtained: {
      type: Number,
      default: null,
    },
    totalMarks: {
      type: Number,
      default: 100,
    },
    percentage: {
      type: Number,
      default: null,
    },
    grade: {
      type: String,
      default: null,
    },
    gradePoints: {
      type: Number,
      default: null,
    },
    qualityPoints: {
      type: Number,
      default: null,
    },
    isPassed: {
      type: Boolean,
      default: null,
    },
    // ─── PHASE TRACKING ───────────────────────────────────
    marksPhase: {
      type: String,
      enum: {
        values: Object.values(MARKS_PHASE),
        message: '{VALUE} is not a valid marks phase',
      },
      default: MARKS_PHASE.NOT_STARTED,
    },
    // ─── REPEAT TRACKING ──────────────────────────────────
    isRepeated: {
      type: Boolean,
      default: false,
    },
    attemptNumber: {
      type: Number,
      default: 1,
      min: 1,
    },
    // ─── REMARKS ─────────────────────────────────────────
    remarks: {
      type: String,
      trim: true,
      maxlength: [200, 'Remarks cannot exceed 200 characters'],
      default: null,
    },
    // ─── AUDIT ───────────────────────────────────────────
    enteredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    midTermEnteredAt: { type: Date, default: null },
    finalsEnteredAt: { type: Date, default: null },
    submittedAt: { type: Date, default: null },
    approvedAt: { type: Date, default: null },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    rejectedAt: { type: Date, default: null },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Rejection reason cannot exceed 500 characters'],
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── COMPOUND UNIQUE INDEX ───────────────────────────────────
marksSchema.index(
  { student: 1, courseAssignment: 1 },
  { unique: true }
);
marksSchema.index({ courseAssignment: 1, marksPhase: 1 });
marksSchema.index({ student: 1, semester: 1, session: 1 });
marksSchema.index({ student: 1, marksPhase: 1 });
marksSchema.index({ teacher: 1, session: 1 });
marksSchema.index({ department: 1, semester: 1, session: 1 });

// ─── VIRTUALS ─────────────────────────────────────────────────
marksSchema.virtual('passFailStatus').get(function () {
  if (this.isPassed === null) return 'Pending';
  return this.isPassed ? 'Pass' : 'Fail';
});

marksSchema.virtual('isApproved').get(function () {
  return this.marksPhase === MARKS_PHASE.APPROVED;
});

// ─── PRE SAVE HOOK ────────────────────────────────────────────
// ✅ FIXED: Single async pre-save, no next() calls
// ─── SINGLE FIXED PRE SAVE HOOK ───────────────────────────────
marksSchema.pre('save', async function () {
  const midTermEntered = this.midTerm?.isEntered && this.midTerm?.obtained !== null;
  const internalEntered = this.internal?.isEntered && this.internal?.obtained !== null;
  const finalTermEntered = this.finalTerm?.isEntered && this.finalTerm?.obtained !== null;

  if (midTermEntered && internalEntered && finalTermEntered) {
    const total =
      (this.midTerm.obtained || 0) +
      (this.internal.obtained || 0) +
      (this.finalTerm.obtained || 0);

    this.totalObtained = total;
    this.percentage = Math.round((total / this.totalMarks) * 100 * 100) / 100;

    // Calculate grade from grading scale
    let gradeInfo = { grade: 'F', gradePoints: 0.0 };
    for (const scale of GRADING_SCALE) {
      if (
        this.percentage >= scale.minPercentage &&
        this.percentage <= scale.maxPercentage
      ) {
        gradeInfo = scale;
        break;
      }
    }

    this.grade = gradeInfo.grade;
    this.gradePoints = gradeInfo.gradePoints;
    this.isPassed = this.percentage >= 45;

    // Calculate quality points using mongoose model (avoids circular import)
    if (this.gradePoints !== null && this.course) {
      try {
        const CourseModel = mongoose.model('Course');
        const course = await CourseModel.findById(this.course).select('creditHours');
        if (course) {
          this.qualityPoints =
            Math.round(this.gradePoints * course.creditHours * 100) / 100;
        }
      } catch {
        // Non-blocking if course not found
      }
    }
  } else if (midTermEntered && !internalEntered && !finalTermEntered) {
    // Only mid-term entered
    this.totalObtained = null;
    this.percentage = null;
    this.grade = null;
    this.gradePoints = null;
    this.isPassed = null;
    this.qualityPoints = null;
  }
});

// ─── POST SAVE HOOK ───────────────────────────────────────────
// Update quality points after grade is set
marksSchema.pre('save', async function (next) {
  if (this.gradePoints !== null && this.gradePoints !== undefined) {
    try {
      const Course = (await import('./Course.model.js')).default;
      const course = await Course.findById(this.course).select('creditHours');
      if (course) {
        this.qualityPoints =
          Math.round(this.gradePoints * course.creditHours * 100) / 100;
      }
    } catch (error) {
      // Non-blocking
    }
  }
  next();
});

// ─── INSTANCE METHODS ─────────────────────────────────────────
marksSchema.methods.canEdit = function () {
  return [
    MARKS_PHASE.NOT_STARTED,
    MARKS_PHASE.MIDTERM_ENTERED,
    MARKS_PHASE.FINALS_ENTERED,
    MARKS_PHASE.REJECTED,
  ].includes(this.marksPhase);
};

marksSchema.methods.canSubmit = function () {
  return this.marksPhase === MARKS_PHASE.FINALS_ENTERED;
};

// ─── STATIC METHODS ───────────────────────────────────────────
marksSchema.statics.findByAssignment = function (courseAssignmentId) {
  return this.find({ courseAssignment: courseAssignmentId })
    .populate({
      path: 'student',
      populate: {
        path: 'user',
        select: 'firstName lastName email',
      },
    })
    .sort({ 'student.rollNumber': 1 });
};

marksSchema.statics.findStudentSemesterMarks = function (
  studentId,
  semester,
  sessionId
) {
  const query = { student: studentId, semester };
  if (sessionId) query.session = sessionId;
  return this.find(query)
    .populate('course', 'name code creditHours')
    .sort({ createdAt: 1 });
};

const Marks = mongoose.model('Marks', marksSchema);
export default Marks;