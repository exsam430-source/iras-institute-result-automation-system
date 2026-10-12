// API Base URL
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';
export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// User Roles
export const ROLES = {
  SUPER_ADMIN: 'superadmin',
  ADMIN: 'admin',
  DIRECTOR: 'director',
  HOD: 'hod',
  TEACHER: 'teacher',
  STUDENT: 'student',
};

// Role Labels
export const ROLE_LABELS = {
  superadmin: 'Super Admin',
  admin: 'Admin',
  director: 'Director',
  hod: 'Head of Department',
  teacher: 'Teacher',
  student: 'Student',
};

// Role Colors
export const ROLE_COLORS = {
  superadmin:
    'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  admin:
    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  director:
    'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  hod: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  teacher:
    'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  student:
    'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
};

// Role Dashboard Paths
export const ROLE_DASHBOARD = {
  superadmin: '/admin/dashboard',
  admin: '/admin/dashboard',
  director: '/admin/dashboard',
  hod: '/hod/dashboard',
  teacher: '/teacher/dashboard',
  student: '/student/dashboard',
};

// Sidebar Navigation
export const SIDEBAR_NAV = {
  superadmin: [
    {
      label: 'Dashboard',
      path: '/admin/dashboard',
      icon: 'HiOutlineChartBarSquare',
    },
    {
      label: 'Institutes',
      path: '/admin/institutes',
      icon: 'HiOutlineBuildingLibrary',
    },
    {
      label: 'Departments',
      path: '/admin/departments',
      icon: 'HiOutlineBuildingOffice2',
    },
    {
      label: 'Programs',
      path: '/admin/programs',
      icon: 'HiOutlineAcademicCap',
    },
    {
      label: 'Sessions',
      path: '/admin/sessions',
      icon: 'HiOutlineCalendarDays',
    },
    {
      label: 'Courses',
      path: '/admin/courses',
      icon: 'HiOutlineBookOpen',
    },
    {
      label: 'Users',
      path: '/admin/users',
      icon: 'HiOutlineUsers',
    },
    {
      label: 'Students',
      path: '/admin/students',
      icon: 'HiOutlineUserGroup',
    },
    {
      label: 'Semester Results',
      path: '/admin/semester-results',
      icon: 'HiOutlineDocumentCheck',
    },
    {
      label: 'Settings',
      path: '/admin/settings',
      icon: 'HiOutlineCog6Tooth',
    },
    {
      label: 'Audit Logs',
      path: '/admin/audit-logs',
      icon: 'HiOutlineClipboardDocumentList',
    },
  ],
  admin: [
    {
      label: 'Dashboard',
      path: '/admin/dashboard',
      icon: 'HiOutlineChartBarSquare',
    },
    {
      label: 'Institutes',
      path: '/admin/institutes',
      icon: 'HiOutlineBuildingLibrary',
    },
    {
      label: 'Departments',
      path: '/admin/departments',
      icon: 'HiOutlineBuildingOffice2',
    },
    {
      label: 'Programs',
      path: '/admin/programs',
      icon: 'HiOutlineAcademicCap',
    },
    {
      label: 'Sessions',
      path: '/admin/sessions',
      icon: 'HiOutlineCalendarDays',
    },
    {
      label: 'Courses',
      path: '/admin/courses',
      icon: 'HiOutlineBookOpen',
    },
    {
      label: 'Users',
      path: '/admin/users',
      icon: 'HiOutlineUsers',
    },
    {
      label: 'Students',
      path: '/admin/students',
      icon: 'HiOutlineUserGroup',
    },
    {
      label: 'Semester Results',
      path: '/admin/semester-results',
      icon: 'HiOutlineDocumentCheck',
    },
    {
      label: 'Settings',
      path: '/admin/settings',
      icon: 'HiOutlineCog6Tooth',
    },
    {
      label: 'Audit Logs',
      path: '/admin/audit-logs',
      icon: 'HiOutlineClipboardDocumentList',
    },
    { 
      label: 'Reports', 
      path: '/admin/reports', 
      icon: 'HiOutlineDocumentArrowDown',
    },
  ],
  director: [
    {
      label: 'Dashboard',
      path: '/admin/dashboard',
      icon: 'HiOutlineChartBarSquare',
    },
    {
      label: 'Institutes',
      path: '/admin/institutes',
      icon: 'HiOutlineBuildingLibrary',
    },
    {
      label: 'Departments',
      path: '/admin/departments',
      icon: 'HiOutlineBuildingOffice2',
    },
    {
      label: 'Programs',
      path: '/admin/programs',
      icon: 'HiOutlineAcademicCap',
    },
    {
      label: 'Students',
      path: '/admin/students',
      icon: 'HiOutlineUserGroup',
    },
  ],
  hod: [
    {
      label: 'Dashboard',
      path: '/hod/dashboard',
      icon: 'HiOutlineChartBarSquare',
    },
    {
      label: 'Course Assignments',
      path: '/hod/course-assignments',
      icon: 'HiOutlineClipboardDocumentCheck',
    },
    {
      label: 'Results Review',
      path: '/hod/results',
      icon: 'HiOutlineDocumentCheck',
    },
    {
      label: 'Semester Results',
      path: '/hod/semester-results',
      icon: 'HiOutlineClipboardDocumentList',
    },
    {
      label: 'Students',
      path: '/hod/students',
      icon: 'HiOutlineUserGroup',
    },
    {
      label: 'Teachers',
      path: '/hod/teachers',
      icon: 'HiOutlineUsers',
    },
    {
      label: 'Promotion',
      path: '/hod/promotion',
      icon: 'HiOutlineArrowUpCircle',
    },
    // ✅ ADDED: Promotion History link for HoD
    {
      label: 'Promo History',
      path: '/hod/promotion/history',
      icon: 'HiOutlineClock',
    },
  ],
  teacher: [
    {
      label: 'Dashboard',
      path: '/teacher/dashboard',
      icon: 'HiOutlineChartBarSquare',
    },
    {
      label: 'My Courses',
      path: '/teacher/courses',
      icon: 'HiOutlineBookOpen',
    },
    // ✅ ADDED: History link for Teacher
    {
      label: 'History',
      path: '/teacher/history',
      icon: 'HiOutlineClock',
    },
  ],
  student: [
    {
      label: 'Dashboard',
      path: '/student/dashboard',
      icon: 'HiOutlineChartBarSquare',
    },
    {
      label: 'My Results',
      path: '/student/results',
      icon: 'HiOutlineDocumentCheck',
    },
    {
      label: 'My Courses',
      path: '/student/courses',
      icon: 'HiOutlineBookOpen',
    },
    {
      label: 'Transcript',
      path: '/student/transcript',
      icon: 'HiOutlineDocumentText',
    },
  ],
};

// Grade Colors
export const GRADE_COLORS = {
  A: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/30',
  'A-':
    'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/30',
  'B+':
    'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30',
  B: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30',
  'B-':
    'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30',
  'C+':
    'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/30',
  C: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/30',
  'C-':
    'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/30',
  D: 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/30',
  F: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30',
};

// Marks Phase Labels
export const MARKS_PHASE_LABELS = {
  'not-started': 'Not Started',
  'midterm-entered': 'Mid-Term Entered',
  'finals-entered': 'Finals Entered',
  'submitted-to-hod': 'Submitted to HoD',
  approved: 'Approved',
  rejected: 'Rejected',
};

// Marks Phase Colors
export const MARKS_PHASE_COLORS = {
  'not-started':
    'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  'midterm-entered':
    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  'finals-entered':
    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  'submitted-to-hod':
    'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  approved:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

// Assignment Status Labels
export const ASSIGNMENT_STATUS_LABELS = {
  assigned: 'Assigned',
  'award-list-ready': 'Award List Ready',
  'midterm-saved': 'Mid-Term Saved',
  'finals-saved': 'Finals Saved',
  submitted: 'Submitted to HoD',
  approved: 'Approved',
  rejected: 'Rejected',
};