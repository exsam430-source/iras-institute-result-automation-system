import StudentProfile from '../models/StudentProfile.model.js';
import SemesterResult from '../models/SemesterResult.model.js';
import Marks from '../models/Marks.model.js';
import SystemSettings from '../models/SystemSettings.model.js';
import { MARKS_PHASE } from '../utils/constants.js';

// ─── GATHER TRANSCRIPT DATA ───────────────────────────────────
export const gatherTranscriptData = async ({
  studentProfileId,
  semester = null,
  semesterRange = null,
}) => {
  // Fetch student with all references
  const studentProfile = await StudentProfile.findById(studentProfileId)
    .populate('user', 'firstName lastName email phone gender dateOfBirth cnic')
    .populate('institute', 'name code logo')
    .populate('department', 'name code')
    .populate('program', 'name code degreeType totalSemesters totalCreditHours')
    .populate('session', 'name startYear endYear')
    .lean({ virtuals: true });

  if (!studentProfile) {
    throw new Error('Student profile not found');
  }

  // Build semester filter
  const resultFilter = {
    student: studentProfileId,
    isPublished: true,
  };

  if (semester) {
    resultFilter.semester = parseInt(semester);
  } else if (semesterRange) {
    resultFilter.semester = {
      $gte: semesterRange.from,
      $lte: semesterRange.to,
    };
  }

  // Fetch semester results
  const semesterResults = await SemesterResult.find(resultFilter)
    .populate('session', 'name startYear endYear')
    .populate('courses.course', 'name code creditHours type category')
    .sort({ semester: 1 })
    .lean();

  // Get system settings for transcript header
  const settings = await SystemSettings.getSettings();

  // Build complete transcript data
  const transcriptData = {
    // University info
    university: {
      name: settings.universityName || 'University of Swat',
      shortName: settings.universityShortName || 'UoS',
      logo: settings.universityLogo,
      address: settings.universityAddress || 'Mingora, Swat, KPK, Pakistan',
      phone: settings.universityPhone,
      email: settings.universityEmail,
      website: settings.universityWebsite,
      establishedYear: settings.universityEstablishedYear,
    },

    // Student info
    student: {
      fullName: `${studentProfile.user?.firstName} ${studentProfile.user?.lastName}`,
      fatherName: studentProfile.fatherName,
      rollNumber: studentProfile.rollNumber,
      registrationNumber: studentProfile.registrationNumber,
      cnic: studentProfile.user?.cnic,
      gender: studentProfile.user?.gender,
      dateOfBirth: studentProfile.user?.dateOfBirth,
      admissionDate: studentProfile.admissionDate,
      admissionType: studentProfile.admissionType,
      enrollmentStatus: studentProfile.enrollmentStatus,
    },

    // Academic info
    academic: {
      institute: studentProfile.institute?.name,
      department: studentProfile.department?.name,
      program: studentProfile.program?.name,
      programCode: studentProfile.program?.code,
      degreeType: studentProfile.program?.degreeType,
      session: studentProfile.session?.name,
      currentSemester: studentProfile.currentSemester,
      totalSemesters: studentProfile.program?.totalSemesters,
      cumulativeGPA: studentProfile.cumulativeGPA,
      totalCreditHoursAttempted: studentProfile.totalCreditHoursAttempted,
      totalCreditHoursEarned: studentProfile.totalCreditHoursEarned,
    },

    // Semester-wise results
    semesters: semesterResults.map((result) => ({
      semester: result.semester,
      session: result.session?.name,
      academicYear: result.academicYear,
      courses: result.courses.map((c) => ({
        code: c.courseCode || c.course?.code,
        name: c.courseName || c.course?.name,
        creditHours: c.creditHours || c.course?.creditHours,
        grade: c.grade,
        gradePoints: c.gradePoints,
        qualityPoints: c.qualityPoints,
        isPassed: c.isPassed,
        isRepeated: c.isRepeated,
        type: c.course?.type,
      })),
      totalCreditHoursAttempted: result.totalCreditHoursAttempted,
      totalCreditHoursEarned: result.totalCreditHoursEarned,
      totalQualityPoints: result.totalQualityPoints,
      semesterGPA: result.semesterGPA,
      cumulativeGPA: result.cumulativeGPA,
      totalCoursesAttempted: result.totalCoursesAttempted,
      totalCoursesPassed: result.totalCoursesPassed,
      totalCoursesFailed: result.totalCoursesFailed,
    })),

    // Grading scale
    gradingScale: settings.gradingScale,

    // Transcript settings
    transcriptSettings: settings.transcriptSettings,

    // Metadata
    issuedAt: new Date(),
    transcriptType: semester ? 'semester' : 'complete',
    transcriptNumber: generateTranscriptNumber(
      studentProfile.rollNumber,
      semester
    ),
  };

  return transcriptData;
};

// ─── GENERATE TRANSCRIPT NUMBER ───────────────────────────────
const generateTranscriptNumber = (rollNumber, semester) => {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const day = String(new Date().getDate()).padStart(2, '0');
  const time = Date.now().toString().slice(-6);
  const semPart = semester ? `-S${semester}` : '-COMP';
  return `UOS-TR-${year}${month}${day}-${time}${semPart}`;
};