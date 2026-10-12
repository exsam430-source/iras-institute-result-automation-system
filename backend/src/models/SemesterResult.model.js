import mongoose from 'mongoose';

const courseResultSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    courseCode: { type: String },
    courseName: { type: String },
    creditHours: { type: Number },
    marks: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Marks',
    },
    midTermMarks: { type: Number, default: null },
    internalMarks: { type: Number, default: null },
    finalTermMarks: { type: Number, default: null },
    totalMarks: { type: Number, default: null },
    percentage: { type: Number, default: null },
    grade: { type: String, default: null },
    gradePoints: { type: Number, default: null },
    qualityPoints: { type: Number, default: null },
    isPassed: { type: Boolean, default: null },
    isRepeated: { type: Boolean, default: false },
    attemptNumber: { type: Number, default: 1 },
  },
  { _id: true }
);

const semesterResultSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudentProfile',
      required: [true, 'Student is required'],
    },
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      required: [true, 'Session is required'],
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    program: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Program',
      required: true,
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required'],
      min: 1,
    },
    academicYear: {
      type: String,
      default: () => new Date().getFullYear().toString(),
    },
    // Course results
    courses: {
      type: [courseResultSchema],
      default: [],
    },
    // Aggregate data
    totalCreditHoursAttempted: {
      type: Number,
      default: 0,
    },
    totalCreditHoursEarned: {
      type: Number,
      default: 0,
    },
    totalQualityPoints: {
      type: Number,
      default: 0,
    },
    semesterGPA: {
      type: Number,
      default: 0,
      min: 0,
      max: 4.0,
    },
    cumulativeGPA: {
      type: Number,
      default: 0,
      min: 0,
      max: 4.0,
    },
    // Course counts
    totalCoursesAttempted: {
      type: Number,
      default: 0,
    },
    totalCoursesPassed: {
      type: Number,
      default: 0,
    },
    totalCoursesFailed: {
      type: Number,
      default: 0,
    },
    // Publication status
    isPublished: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    publishedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    // Status
    status: {
      type: String,
      enum: ['in-progress', 'completed', 'promoted'],
      default: 'in-progress',
    },
    promotedAt: {
      type: Date,
      default: null,
    },
    calculatedAt: {
      type: Date,
      default: null,
    },
    calculatedBy: {
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

// ─── INDEXES ──────────────────────────────────────────────────
semesterResultSchema.index(
  { student: 1, semester: 1, session: 1 },
  { unique: true }
);
semesterResultSchema.index({ student: 1, isPublished: 1 });
semesterResultSchema.index({ department: 1, semester: 1, session: 1 });
semesterResultSchema.index({ status: 1, isPublished: 1 });

// ─── VIRTUALS ─────────────────────────────────────────────────
semesterResultSchema.virtual('passRate').get(function () {
  if (!this.totalCoursesAttempted) return 0;
  return Math.round((this.totalCoursesPassed / this.totalCoursesAttempted) * 100);
});

semesterResultSchema.virtual('hasAllPassed').get(function () {
  return this.totalCoursesFailed === 0;
});

// ─── STATIC METHODS ───────────────────────────────────────────
semesterResultSchema.statics.findStudentResults = function (studentId) {
  return this.find({ student: studentId, isPublished: true })
    .sort({ semester: 1 })
    .populate('session', 'name startYear endYear');
};

semesterResultSchema.statics.findCurrentSemesterResult = function (
  studentId,
  semester,
  sessionId
) {
  return this.findOne({
    student: studentId,
    semester,
    session: sessionId,
  });
};

const SemesterResult = mongoose.model('SemesterResult', semesterResultSchema);
export default SemesterResult;