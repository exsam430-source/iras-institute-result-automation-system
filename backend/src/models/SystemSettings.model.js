import mongoose from 'mongoose';
import { GRADING_SCALE } from '../utils/constants.js';

const gradingScaleItemSchema = new mongoose.Schema(
  {
    grade: {
      type: String,
      required: true,
      trim: true,
    },
    minPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    maxPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    gradePoints: {
      type: Number,
      required: true,
      min: 0,
      max: 4.0,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const transcriptSettingsSchema = new mongoose.Schema(
  {
    headerText: {
      type: String,
      trim: true,
      default: 'OFFICIAL TRANSCRIPT OF ACADEMIC RECORD',
    },
    footerText: {
      type: String,
      trim: true,
      default:
        'This transcript is not valid without the official seal of the University.',
    },
    controllerExamName: {
      type: String,
      trim: true,
      default: 'Controller of Examinations',
    },
    registrarName: {
      type: String,
      trim: true,
      default: 'Registrar',
    },
    showGradingScale: {
      type: Boolean,
      default: true,
    },
    showCGPA: {
      type: Boolean,
      default: true,
    },
    watermarkText: {
      type: String,
      trim: true,
      default: 'UNIVERSITY OF SWAT',
    },
  },
  { _id: false }
);

const marksSettingsSchema = new mongoose.Schema(
  {
    midTermTotal: { type: Number, default: 20 },
    internalTotal: { type: Number, default: 20 },
    finalTermTotal: { type: Number, default: 60 },
    passingPercentage: { type: Number, default: 45 },
    passingGrade: { type: String, default: 'D' },
  },
  { _id: false }
);

const systemSettingsSchema = new mongoose.Schema(
  {
    // University information
    universityName: {
      type: String,
      default: 'University of Swat',
      trim: true,
    },
    universityShortName: {
      type: String,
      default: 'UoS',
      trim: true,
    },
    universityLogo: {
      type: String,
      default: null,
    },
    universityLogoPublicId: {
      type: String,
      default: null,
      select: false,
    },
    universityAddress: {
      type: String,
      default: 'Mingora, Swat, Khyber Pakhtunkhwa, Pakistan',
      trim: true,
    },
    universityPhone: {
      type: String,
      default: '+92-946-710487',
      trim: true,
    },
    universityEmail: {
      type: String,
      default: 'info@uswat.edu.pk',
      trim: true,
    },
    universityWebsite: {
      type: String,
      default: 'https://www.uswat.edu.pk',
      trim: true,
    },
    universityEstablishedYear: {
      type: Number,
      default: 2001,
    },
    // Current academic year
    currentAcademicYear: {
      type: String,
      default: () => new Date().getFullYear().toString(),
      trim: true,
    },
    // Grading scale
    gradingScale: {
      type: [gradingScaleItemSchema],
      default: GRADING_SCALE,
    },
    // Marks settings
    marksSettings: {
      type: marksSettingsSchema,
      default: () => ({}),
    },
    // Transcript settings
    transcriptSettings: {
      type: transcriptSettingsSchema,
      default: () => ({}),
    },
    // System settings
    allowStudentResultView: {
      type: Boolean,
      default: true,
    },
    allowTranscriptDownload: {
      type: Boolean,
      default: true,
    },
    emailNotificationsEnabled: {
      type: Boolean,
      default: true,
    },
    smsNotificationsEnabled: {
      type: Boolean,
      default: false,
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    maintenanceMessage: {
      type: String,
      trim: true,
      default: 'System is under maintenance. Please try again later.',
    },
    // Who last updated settings
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── ENSURE SINGLE DOCUMENT ───────────────────────────────────
systemSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

// ✅ FIXED: Replaced manual Object.assign + save with findOneAndUpdate (upsert)
//           Uses 'new: true' (Mongoose option) instead of 'returnDocument' (MongoDB driver option)
systemSettingsSchema.statics.updateSettings = async function (updateData, userId) {
  const settings = await this.findOneAndUpdate(
    {},
    { ...updateData, updatedBy: userId },
    {
      new: true,            // ✅ Return the updated document
      upsert: true,         // ✅ Create if doesn't exist
      runValidators: false, // ✅ Skip validation for partial updates
    }
  );
  return settings;
};

systemSettingsSchema.statics.getGradingScale = async function () {
  const settings = await this.getSettings();
  return settings.gradingScale;
};

const SystemSettings = mongoose.model('SystemSettings', systemSettingsSchema);
export default SystemSettings;