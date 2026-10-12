import mongoose from 'mongoose';
import { ENROLLMENT_STATUS } from '../utils/constants.js';

// Sub-schemas
const failedCourseSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    courseCode: { type: String },
    courseName: { type: String },
    semester: { type: Number, required: true },
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
    grade: { type: String, default: 'F' },
    marksObtained: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    attemptNumber: { type: Number, default: 1 },
    isCleared: { type: Boolean, default: false },
    clearedInSemester: { type: Number, default: null },
    clearedGrade: { type: String, default: null },
    clearedAt: { type: Date, default: null },
  },
  { _id: true }
);

const semesterRecordSchema = new mongoose.Schema(
  {
    semester: { type: Number, required: true },
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
    },
    academicYear: { type: String },
    totalCreditHoursAttempted: { type: Number, default: 0 },
    totalCreditHoursEarned: { type: Number, default: 0 },
    totalQualityPoints: { type: Number, default: 0 },
    semesterGPA: { type: Number, default: 0 },
    cumulativeGPA: { type: Number, default: 0 },
    coursesAttempted: { type: Number, default: 0 },
    coursesPassed: { type: Number, default: 0 },
    coursesFailed: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['in-progress', 'completed', 'promoted'],
      default: 'in-progress',
    },
    promotedAt: { type: Date, default: null },
    promotedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { _id: true }
);

const studentProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      unique: true,
    },
    rollNumber: {
      type: String,
      required: [true, 'Roll number is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    registrationNumber: {
      type: String,
      required: [true, 'Registration number is required'],
      unique: true,
      uppercase: true,
      trim: true,
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
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      required: [true, 'Session is required'],
    },
    currentSemester: {
      type: Number,
      default: 1,
      min: [1, 'Semester must be at least 1'],
    },
    fatherName: {
      type: String,
      required: [true, 'Father name is required'],
      trim: true,
      minlength: [2, 'Father name must be at least 2 characters'],
      maxlength: [100, 'Father name cannot exceed 100 characters'],
    },
    fatherCnic: {
      type: String,
      trim: true,
      match: [/^\d{5}-\d{7}-\d{1}$/, 'Father CNIC must be in format XXXXX-XXXXXXX-X'],
      default: null,
    },
    guardianPhone: {
      type: String,
      trim: true,
      default: null,
    },
    bloodGroup: {
  type: String,
  enum: {
    values: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],  // ✅ Remove null
    message: '{VALUE} is not a valid blood group',
  },
  default: null,  // ✅ Default can be null, but null shouldn't be in enum
},
    admissionDate: {
      type: Date,
      default: Date.now,
    },
    enrollmentStatus: {
      type: String,
      enum: {
        values: Object.values(ENROLLMENT_STATUS),
        message: '{VALUE} is not a valid enrollment status',
      },
      default: ENROLLMENT_STATUS.ACTIVE,
    },
    // Academic tracking
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
    cumulativeGPA: {
      type: Number,
      default: 0,
      min: [0, 'CGPA cannot be negative'],
      max: [4.0, 'CGPA cannot exceed 4.0'],
    },
    // Failed courses tracking
    failedCourses: {
      type: [failedCourseSchema],
      default: [],
    },
    // Semester-by-semester records
    semesterRecords: {
      type: [semesterRecordSchema],
      default: [],
    },
    // Additional info
    admissionType: {
      type: String,
      enum: ['regular', 'lateral', 'transfer'],
      default: 'regular',
    },
    scholarship: {
      type: Boolean,
      default: false,
    },
    scholarshipDetails: {
      type: String,
      trim: true,
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
// studentProfileSchema.index({ rollNumber: 1 });
// studentProfileSchema.index({ registrationNumber: 1 });
// studentProfileSchema.index({ user: 1 });
studentProfileSchema.index({ program: 1, currentSemester: 1 });
studentProfileSchema.index({ department: 1, enrollmentStatus: 1 });
studentProfileSchema.index({ session: 1, currentSemester: 1 });
studentProfileSchema.index({ institute: 1, department: 1, currentSemester: 1 });

// ─── VIRTUALS ─────────────────────────────────────────────────
studentProfileSchema.virtual('hasFailedCourses').get(function () {
  return this.failedCourses && this.failedCourses.some((fc) => !fc.isCleared);
});

studentProfileSchema.virtual('activeFailedCoursesCount').get(function () {
  return this.failedCourses
    ? this.failedCourses.filter((fc) => !fc.isCleared).length
    : 0;
});

studentProfileSchema.virtual('currentSemesterRecord').get(function () {
  if (!this.semesterRecords || this.semesterRecords.length === 0) return null;
  return this.semesterRecords.find(
    (r) => r.semester === this.currentSemester
  ) || null;
});

// ─── INSTANCE METHODS ─────────────────────────────────────────
studentProfileSchema.methods.updateCGPA = function (newQualityPoints, newCreditHours) {
  this.totalQualityPoints += newQualityPoints;
  this.totalCreditHoursAttempted += newCreditHours;
  if (this.totalCreditHoursAttempted > 0) {
    this.cumulativeGPA = Math.round(
      (this.totalQualityPoints / this.totalCreditHoursAttempted) * 100
    ) / 100;
  }
};

studentProfileSchema.methods.addFailedCourse = function (courseData) {
  const existing = this.failedCourses.findIndex(
    (fc) => fc.course.toString() === courseData.course.toString() && !fc.isCleared
  );

  if (existing >= 0) {
    this.failedCourses[existing].attemptNumber += 1;
    this.failedCourses[existing].grade = courseData.grade;
    this.failedCourses[existing].marksObtained = courseData.marksObtained;
    this.failedCourses[existing].percentage = courseData.percentage;
  } else {
    this.failedCourses.push({
      ...courseData,
      attemptNumber: 1,
      isCleared: false,
    });
  }
};

// ─── STATIC METHODS ───────────────────────────────────────────
studentProfileSchema.statics.findByRollNumber = function (rollNumber) {
  return this.findOne({ rollNumber: rollNumber.toUpperCase() });
};

studentProfileSchema.statics.findActiveBySemester = function (
  departmentId,
  sessionId,
  semester
) {
  return this.find({
    department: departmentId,
    session: sessionId,
    currentSemester: semester,
    enrollmentStatus: 'active',
  });
};

studentProfileSchema.statics.findByDepartmentAndSemester = function (
  departmentId,
  semester
) {
  return this.find({
    department: departmentId,
    currentSemester: semester,
    enrollmentStatus: 'active',
  }).populate('user', 'firstName lastName email');
};

const StudentProfile = mongoose.model('StudentProfile', studentProfileSchema);
export default StudentProfile;