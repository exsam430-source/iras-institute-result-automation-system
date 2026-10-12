import mongoose from 'mongoose';
import {
  COURSE_TYPES,
  COURSE_CATEGORIES,
  MARKS_DISTRIBUTION,
} from '../utils/constants.js';

const marksDistributionSchema = new mongoose.Schema(
  {
    midTerm: {
      type: Number,
      default: MARKS_DISTRIBUTION.MID_TERM,
      min: [0, 'Mid term marks cannot be negative'],
    },
    internal: {
      type: Number,
      default: MARKS_DISTRIBUTION.INTERNAL,
      min: [0, 'Internal marks cannot be negative'],
    },
    finalTerm: {
      type: Number,
      default: MARKS_DISTRIBUTION.FINAL_TERM,
      min: [0, 'Final term marks cannot be negative'],
    },
    total: {
      type: Number,
      default: MARKS_DISTRIBUTION.TOTAL,
    },
  },
  { _id: false }
);

const courseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Course name is required'],
      trim: true,
      minlength: [2, 'Course name must be at least 2 characters'],
      maxlength: [100, 'Course name cannot exceed 100 characters'],
    },
    code: {
      type: String,
      required: [true, 'Course code is required'],
      uppercase: true,
      trim: true,
      maxlength: [20, 'Course code cannot exceed 20 characters'],
    },
    creditHours: {
      type: Number,
      required: [true, 'Credit hours is required'],
      min: [1, 'Credit hours must be at least 1'],
      max: [6, 'Credit hours cannot exceed 6'],
    },
    type: {
      type: String,
      enum: {
        values: COURSE_TYPES,
        message: '{VALUE} is not a valid course type',
      },
      default: 'theory',
    },
    category: {
      type: String,
      enum: {
        values: COURSE_CATEGORIES,
        message: '{VALUE} is not a valid course category',
      },
      default: 'core',
    },
    program: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Program',
      required: [true, 'Program is required'],
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required'],
    },
    institute: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institute',
      required: [true, 'Institute is required'],
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required'],
      min: [1, 'Semester must be at least 1'],
      max: [12, 'Semester cannot exceed 12'],
    },
    prerequisites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
      },
    ],
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: null,
    },
    marksDistribution: {
      type: marksDistributionSchema,
      default: () => ({}),
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── INDEXES ──────────────────────────────────────────────────
courseSchema.index({ code: 1, program: 1 }, { unique: true });
courseSchema.index({ program: 1, semester: 1 });
courseSchema.index({ department: 1, isActive: 1 });
courseSchema.index({ semester: 1, department: 1 });
courseSchema.index({ name: 'text', code: 'text' });

// ─── PRE SAVE HOOK ────────────────────────────────────────────
courseSchema.pre('save', function () {
  if (this.marksDistribution) {
    this.marksDistribution.total =
      (this.marksDistribution.midTerm || 0) +
      (this.marksDistribution.internal || 0) +
      (this.marksDistribution.finalTerm || 0);
  }
});

// ─── STATIC METHODS ───────────────────────────────────────────
courseSchema.statics.findByProgram = function (programId) {
  return this.find({ program: programId, isActive: true }).sort({ semester: 1, name: 1 });
};

courseSchema.statics.findBySemester = function (programId, semester) {
  return this.find({ program: programId, semester, isActive: true }).sort({ name: 1 });
};

const Course = mongoose.model('Course', courseSchema);
export default Course;