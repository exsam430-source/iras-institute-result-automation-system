import mongoose from 'mongoose';

const instituteSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Institute name is required'],
      trim: true,
      unique: true,
      minlength: [3, 'Institute name must be at least 3 characters'],
      maxlength: [100, 'Institute name cannot exceed 100 characters'],
    },
    code: {
      type: String,
      required: [true, 'Institute code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: [2, 'Code must be at least 2 characters'],
      maxlength: [10, 'Code cannot exceed 10 characters'],
      match: [/^[A-Z0-9]+$/, 'Code must contain only uppercase letters and numbers'],
    },
    shortName: {
      type: String,
      trim: true,
      maxlength: [50, 'Short name cannot exceed 50 characters'],
      default: null,
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
    logo: {
      type: String,
      default: null,
    },
    logoPublicId: {
      type: String,
      default: null,
      select: false,
    },
    director: {
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
    location: {
      building: { type: String, trim: true, default: null },
      floor: { type: String, trim: true, default: null },
      campus: { type: String, trim: true, default: 'Main Campus' },
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
    website: {
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
// instituteSchema.index({ code: 1 });
instituteSchema.index({ isActive: 1 });
instituteSchema.index({ name: 'text', code: 'text' });

// ─── VIRTUALS ─────────────────────────────────────────────────
instituteSchema.virtual('departments', {
  ref: 'Department',
  localField: '_id',
  foreignField: 'institute',
});

instituteSchema.virtual('totalDepartments', {
  ref: 'Department',
  localField: '_id',
  foreignField: 'institute',
  count: true,
});

// ─── STATIC METHODS ───────────────────────────────────────────
instituteSchema.statics.findByCode = function (code) {
  return this.findOne({ code: code.toUpperCase() });
};

instituteSchema.statics.findActive = function () {
  return this.find({ isActive: true }).sort({ name: 1 });
};

const Institute = mongoose.model('Institute', instituteSchema);
export default Institute;