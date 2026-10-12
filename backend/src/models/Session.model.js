import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Session name is required'],
      trim: true,
      unique: true,
      match: [
        /^\d{4}-\d{4}$/,
        'Session name must be in format YYYY-YYYY (e.g., 2023-2027)',
      ],
    },
    startYear: {
      type: Number,
      required: [true, 'Start year is required'],
      min: [2000, 'Start year cannot be before 2000'],
    },
    endYear: {
      type: Number,
      required: [true, 'End year is required'],
      validate: {
        validator: function (v) {
          return v > this.startYear;
        },
        message: 'End year must be greater than start year',
      },
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
    currentSemester: {
      type: Number,
      default: 1,
      min: [1, 'Semester must be at least 1'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isCurrent: {
      type: Boolean,
      default: false,
    },
    admissionDate: {
      type: Date,
      default: null,
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
// sessionSchema.index({ name: 1 });
sessionSchema.index({ program: 1, isActive: 1 });
sessionSchema.index({ department: 1, institute: 1 });
sessionSchema.index({ startYear: -1 });

// ─── VIRTUALS ─────────────────────────────────────────────────
sessionSchema.virtual('totalStudents', {
  ref: 'StudentProfile',
  localField: '_id',
  foreignField: 'session',
  count: true,
  match: { enrollmentStatus: 'active' },
});

// ─── PRE SAVE HOOK ────────────────────────────────────────────
sessionSchema.pre('save', function () {
  if (!this.name) {
    this.name = `${this.startYear}-${this.endYear}`;
  }
});

// ─── STATIC METHODS ───────────────────────────────────────────
sessionSchema.statics.findByProgram = function (programId) {
  return this.find({ program: programId }).sort({ startYear: -1 });
};

sessionSchema.statics.findCurrentSessions = function () {
  return this.find({ isActive: true, isCurrent: true });
};

const Session = mongoose.model('Session', sessionSchema);
export default Session;