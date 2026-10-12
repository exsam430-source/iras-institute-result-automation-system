// User Roles
export const ROLES = {
  SUPER_ADMIN: 'superadmin',
  ADMIN: 'admin',
  DIRECTOR: 'director',
  HOD: 'hod',
  TEACHER: 'teacher',
  STUDENT: 'student',
};

// Marks Phase
export const MARKS_PHASE = {
  NOT_STARTED: 'not-started',
  MIDTERM_ENTERED: 'midterm-entered',
  FINALS_ENTERED: 'finals-entered',
  SUBMITTED: 'submitted-to-hod',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

// Course Assignment Status
export const ASSIGNMENT_STATUS = {
  ASSIGNED: 'assigned',
  AWARD_LIST_READY: 'award-list-ready',
  MIDTERM_SAVED: 'midterm-saved',
  FINALS_SAVED: 'finals-saved',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

// Notification Types
export const NOTIFICATION_TYPES = {
  MIDTERM_MARKS_ENTERED: 'midterm-marks-entered',
  FINALS_MARKS_ENTERED: 'finals-marks-entered',
  RESULT_SUBMITTED_TO_HOD: 'result-submitted-to-hod',
  RESULT_APPROVED: 'result-approved',
  RESULT_REJECTED: 'result-rejected',
  COURSE_ASSIGNED: 'course-assigned',
  SEMESTER_PROMOTED: 'semester-promoted',
  ANNOUNCEMENT: 'announcement',
  SYSTEM: 'system',
  AWARD_LIST_READY: 'award-list-ready',
};

// Grading Scale (University of Swat)
export const GRADING_SCALE = [
  { grade: 'A', minPercentage: 85, maxPercentage: 100, gradePoints: 4.0, description: 'Excellent' },
  { grade: 'A-', minPercentage: 80, maxPercentage: 84, gradePoints: 3.7, description: 'Very Good' },
  { grade: 'B+', minPercentage: 75, maxPercentage: 79, gradePoints: 3.3, description: 'Good' },
  { grade: 'B', minPercentage: 70, maxPercentage: 74, gradePoints: 3.0, description: 'Good' },
  { grade: 'B-', minPercentage: 65, maxPercentage: 69, gradePoints: 2.7, description: 'Above Average' },
  { grade: 'C+', minPercentage: 60, maxPercentage: 64, gradePoints: 2.3, description: 'Average' },
  { grade: 'C', minPercentage: 55, maxPercentage: 59, gradePoints: 2.0, description: 'Average' },
  { grade: 'C-', minPercentage: 50, maxPercentage: 54, gradePoints: 1.7, description: 'Below Average' },
  { grade: 'D', minPercentage: 45, maxPercentage: 49, gradePoints: 1.0, description: 'Poor' },
  { grade: 'F', minPercentage: 0, maxPercentage: 44, gradePoints: 0.0, description: 'Fail' },
];

export const PASSING_GRADE = 'D';
export const PASSING_PERCENTAGE = 45;

// Marks Distribution
export const MARKS_DISTRIBUTION = {
  MID_TERM: 20,
  INTERNAL: 20,
  FINAL_TERM: 60,
  TOTAL: 100,
};

// Enrollment Status
export const ENROLLMENT_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  GRADUATED: 'graduated',
  DROPPED: 'dropped',
  AWAITING_GRADUATION: 'awaiting-graduation',
};

// Degree Types
export const DEGREE_TYPES = ['BS', 'MS', 'PhD', 'MPhil', 'Associate', 'BBA', 'MBA'];

// Course Types
export const COURSE_TYPES = ['theory', 'lab', 'theory+lab'];

// Course Categories
export const COURSE_CATEGORIES = ['core', 'elective', 'general'];

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
};

// Cookie Options
export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// File Upload Limits
export const FILE_LIMITS = {
  AVATAR_SIZE: 5 * 1024 * 1024, // 5MB
  DOCUMENT_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
  ],
};

export const MAX_SEMESTERS = 8;