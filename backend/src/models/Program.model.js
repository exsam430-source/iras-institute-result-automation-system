import mongoose from 'mongoose';
import { DEGREE_TYPES } from '../utils/constants.js';

const programSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Program name is required'],
      trim: true,
      minlength: [2, 'Program name must be at least 2 characters'],
      maxlength: [100, 'Program name cannot exceed 100 characters'],
    },
    code: {
      type: String,
      required: [true, 'Program code is required'],
      uppercase: true,
      trim: true,
      minlength: [2, 'Code must be at least 2 characters'],
      maxlength: [15, 'Code cannot exceed 15 characters'],
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
    degreeType: {
      type: String,
      enum: {
        values: DEGREE_TYPES,
        message: '{VALUE} is not a valid degree type',
      },
      required: [true, 'Degree type is required'],
    },
    totalSemesters: {
      type: Number,
      required: [true, 'Total semesters is required'],
      min: [1, 'Total semesters must be at least 1'],
      max: [12, 'Total semesters cannot exceed 12'],
    },
    totalCreditHours: {
      type: Number,
      required: [true, 'Total credit hours is required'],
      min: [1, 'Total credit hours must be at least 1'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: null,
    },
    eligibility: {
      type: String,
      trim: true,
      maxlength: [500, 'Eligibility cannot exceed 500 characters'],
      default: null,
    },
    duration: {
      type: String,
      trim: true,
      default: null,
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
programSchema.index({ code: 1, department: 1 }, { unique: true });
programSchema.index({ department: 1, isActive: 1 });
programSchema.index({ institute: 1 });
programSchema.index({ degreeType: 1 });

// ─── VIRTUALS ─────────────────────────────────────────────────
programSchema.virtual('courses', {
  ref: 'Course',
  localField: '_id',
  foreignField: 'program',
});

programSchema.virtual('totalStudents', {
  ref: 'StudentProfile',
  localField: '_id',
  foreignField: 'program',
  count: true,
  match: { enrollmentStatus: 'active' },
});

// ─── STATIC METHODS ───────────────────────────────────────────
programSchema.statics.findByDepartment = function (departmentId) {
  return this.find({ department: departmentId, isActive: true }).sort({ name: 1 });
};

const Program = mongoose.model('Program', programSchema);
export default Program;