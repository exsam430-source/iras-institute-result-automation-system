import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Department name is required'],
      trim: true,
      minlength: [2, 'Department name must be at least 2 characters'],
      maxlength: [100, 'Department name cannot exceed 100 characters'],
    },
    code: {
      type: String,
      required: [true, 'Department code is required'],
      uppercase: true,
      trim: true,
      minlength: [2, 'Code must be at least 2 characters'],
      maxlength: [10, 'Code cannot exceed 10 characters'],
      match: [/^[A-Z0-9]+$/, 'Code must contain only uppercase letters and numbers'],
    },
    institute: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institute',
      required: [true, 'Institute is required'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: null,
    },
    vision: {
      type: String,
      trim: true,
      maxlength: [500, 'Vision cannot exceed 500 characters'],
      default: null,
    },
    mission: {
      type: String,
      trim: true,
      maxlength: [500, 'Mission cannot exceed 500 characters'],
      default: null,
    },
    hod: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    establishedYear: {
      type: Number,
      min: [1900, 'Established year cannot be before 1900'],
      max: [new Date().getFullYear(), 'Established year cannot be in the future'],
      default: null,
    },
    contactEmail: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email'],
      default: null,
    },
    contactPhone: {
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

// ─── COMPOUND INDEXES ─────────────────────────────────────────
// Code must be unique within an institute
departmentSchema.index({ code: 1, institute: 1 }, { unique: true });
departmentSchema.index({ institute: 1, isActive: 1 });
departmentSchema.index({ hod: 1 });
departmentSchema.index({ name: 'text', code: 'text' });

// ─── VIRTUALS ─────────────────────────────────────────────────
departmentSchema.virtual('programs', {
  ref: 'Program',
  localField: '_id',
  foreignField: 'department',
});

departmentSchema.virtual('totalTeachers', {
  ref: 'User',
  localField: '_id',
  foreignField: 'department',
  count: true,
  match: { role: 'teacher', isActive: true },
});

departmentSchema.virtual('totalStudents', {
  ref: 'StudentProfile',
  localField: '_id',
  foreignField: 'department',
  count: true,
  match: { enrollmentStatus: 'active' },
});

// ─── STATIC METHODS ───────────────────────────────────────────
departmentSchema.statics.findByInstitute = function (instituteId) {
  return this.find({ institute: instituteId, isActive: true }).sort({ name: 1 });
};

departmentSchema.statics.findByCodeAndInstitute = function (code, instituteId) {
  return this.findOne({ code: code.toUpperCase(), institute: instituteId });
};

const Department = mongoose.model('Department', departmentSchema);
export default Department;