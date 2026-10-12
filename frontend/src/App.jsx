import { useEffect, lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import useAuth from "./hooks/useAuth";
import { getMe, setCheckingAuth } from "./features/auth/authSlice";
import { storage } from "./utils/helpers";
import { ROLE_DASHBOARD, ROLES } from "./utils/constants";
import useSocket from "./hooks/useSocket";
import Spinner from "./components/ui/Spinner";
import MainLayout from "./components/layout/MainLayout";
import ProtectedRoute from "./components/common/ProtectedRoute";

// ─── LAZY IMPORTS ─────────────────────────────────────────────
// Auth
const Login = lazy(() => import("./features/auth/Login"));
const ForgotPassword = lazy(() => import("./features/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./features/auth/ResetPassword"));
const VerifyEmail = lazy(() => import("./features/auth/VerifyEmail"));

// Admin
const AdminDashboard = lazy(() => import("./features/admin/Dashboard"));
const InstitutesList = lazy(() => import("./features/admin/institutes/InstitutesList"));
const InstituteForm = lazy(() => import("./features/admin/institutes/InstituteForm"));
const InstituteDetail = lazy(() => import("./features/admin/institutes/InstituteDetail"));
const DepartmentsList = lazy(() => import("./features/admin/departments/DepartmentsList"));
const DepartmentForm = lazy(() => import("./features/admin/departments/DepartmentForm"));
const DepartmentDetail = lazy(() => import("./features/admin/departments/DepartmentDetail"));
const ProgramsList = lazy(() => import("./features/admin/programs/ProgramsList"));
const ProgramForm = lazy(() => import("./features/admin/programs/ProgramForm"));
const ProgramDetail = lazy(() => import("./features/admin/programs/ProgramDetail"));
const SessionsList = lazy(() => import("./features/admin/sessions/SessionsList"));
const SessionForm = lazy(() => import("./features/admin/sessions/SessionForm"));
const SessionDetail = lazy(() => import("./features/admin/sessions/SessionDetail"));
const CoursesList = lazy(() => import("./features/admin/courses/CoursesList"));
const CourseForm = lazy(() => import("./features/admin/courses/CourseForm"));
const UsersList = lazy(() => import("./features/admin/users/UsersList"));
const UserForm = lazy(() => import("./features/admin/users/UserForm"));
const UserDetail = lazy(() => import("./features/admin/users/UserDetail"));
const StudentsList = lazy(() => import("./features/admin/students/StudentsList"));
const StudentForm = lazy(() => import("./features/admin/students/StudentForm"));
const StudentDetail = lazy(() => import("./features/admin/students/StudentDetail"));
const SettingsPage = lazy(() => import("./features/admin/settings/SettingsPage"));
const AuditLogsPage = lazy(() => import("./features/admin/auditLogs/AuditLogsPage"));

// HoD
const HoDDashboard = lazy(() => import("./features/hod/Dashboard"));
const AssignmentsList = lazy(() => import("./features/hod/courseAssignments/AssignmentsList"));
const AssignmentForm = lazy(() => import("./features/hod/courseAssignments/AssignmentForm"));
const ResultsList = lazy(() => import("./features/hod/results/ResultsList"));
const ResultReview = lazy(() => import("./features/hod/results/ResultReview"));
const SemesterResultsManager = lazy(() => import("./features/hod/results/SemesterResultsManager"));
const HoDStudents = lazy(() => import("./features/hod/students/HoDStudents"));
const HoDTeachers = lazy(() => import("./features/hod/teachers/HoDTeachers"));
const PromotionPage = lazy(() => import("./features/hod/promotion/PromotionPage"));
const PromotionHistory = lazy(() => import("./features/hod/promotion/PromotionHistory"));

// Teacher
const TeacherDashboard = lazy(() => import("./features/teacher/Dashboard"));
const TeacherCoursesList = lazy(() => import("./features/teacher/courses/TeacherCoursesList"));
const TeacherCourseDetail = lazy(() => import("./features/teacher/courses/TeacherCourseDetail"));
const TeacherHistory = lazy(() => import("./features/teacher/history/TeacherHistory"));

// Student
const StudentDashboard = lazy(() => import("./features/student/Dashboard"));
const StudentResults = lazy(() => import("./features/student/results/StudentResults"));
const SemesterDetail = lazy(() => import("./features/student/results/SemesterDetail"));
const StudentCourses = lazy(() => import("./features/student/courses/StudentCourses"));
const TranscriptPage = lazy(() => import("./features/student/transcript/TranscriptPage"));

// Common
const Profile = lazy(() => import("./features/profile/Profile"));
const ChangePassword = lazy(() => import("./features/profile/ChangePassword"));
const NotificationsPage = lazy(() => import("./features/notifications/NotificationsPage"));

// ─── PAGE LOADER ──────────────────────────────────────────────
const PageLoader = () => (
  <div className="flex items-center justify-center py-20">
    <div className="text-center">
      <Spinner size="lg" />
      <p className="mt-3 text-sm text-gray-400 dark:text-gray-500">Loading page...</p>
    </div>
  </div>
);

// ─── ERROR PAGE ───────────────────────────────────────────────
const ErrorPage = ({ code, title, message }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg p-4">
    <div className="text-center">
      <h1 className={`text-8xl font-black mb-4 ${
        code === "403" ? "text-red-200 dark:text-red-900/50" : "text-gray-200 dark:text-gray-800"
      }`}>{code}</h1>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title}</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">{message}</p>
      <button onClick={() => window.history.back()} className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium">
        Go Back
      </button>
    </div>
  </div>
);

// ─── APP ──────────────────────────────────────────────────────
function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, isCheckingAuth, user } = useAuth();
  useSocket(isAuthenticated);

  useEffect(() => {
    const token = storage.get("accessToken");
    if (token) {
      dispatch(getMe());
    } else {
      dispatch(setCheckingAuth(false));
    }
  }, [dispatch]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading IRAS...</p>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* ── PUBLIC ──────────────────────────────────────── */}
        <Route path="/login" element={isAuthenticated ? <Navigate to={ROLE_DASHBOARD[user?.role] || "/"} replace /> : <Login />} />
        <Route path="/forgot-password" element={isAuthenticated ? <Navigate to="/" replace /> : <ForgotPassword />} />
        <Route path="/reset-password/:token" element={isAuthenticated ? <Navigate to="/" replace /> : <ResetPassword />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />

        {/* ── ADMIN ──────────────────────────────────────── */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DIRECTOR]}><MainLayout /></ProtectedRoute>}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="institutes" element={<InstitutesList />} />
          <Route path="institutes/create" element={<InstituteForm />} />
          <Route path="institutes/:id" element={<InstituteDetail />} />
          <Route path="institutes/:id/edit" element={<InstituteForm />} />
          <Route path="departments" element={<DepartmentsList />} />
          <Route path="departments/create" element={<DepartmentForm />} />
          <Route path="departments/:id" element={<DepartmentDetail />} />
          <Route path="departments/:id/edit" element={<DepartmentForm />} />
          <Route path="programs" element={<ProgramsList />} />
          <Route path="programs/create" element={<ProgramForm />} />
          <Route path="programs/:id" element={<ProgramDetail />} />
          <Route path="programs/:id/edit" element={<ProgramForm />} />
          <Route path="sessions" element={<SessionsList />} />
          <Route path="sessions/create" element={<SessionForm />} />
          <Route path="sessions/:id" element={<SessionDetail />} />
          <Route path="sessions/:id/edit" element={<SessionForm />} />
          <Route path="courses" element={<CoursesList />} />
          <Route path="courses/create" element={<CourseForm />} />
          <Route path="courses/:id/edit" element={<CourseForm />} />
          <Route path="users" element={<UsersList />} />
          <Route path="users/create" element={<UserForm />} />
          <Route path="users/:id" element={<UserDetail />} />
          <Route path="users/:id/edit" element={<UserForm />} />
          <Route path="students" element={<StudentsList />} />
          <Route path="students/create" element={<StudentForm />} />
          <Route path="students/:id" element={<StudentDetail />} />
          <Route path="semester-results" element={<SemesterResultsManager />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="audit-logs" element={<AuditLogsPage />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* ── HOD ────────────────────────────────────────── */}
        <Route path="/hod" element={<ProtectedRoute allowedRoles={[ROLES.HOD]}><MainLayout /></ProtectedRoute>}>
          <Route path="dashboard" element={<HoDDashboard />} />
          <Route path="course-assignments" element={<AssignmentsList />} />
          <Route path="course-assignments/create" element={<AssignmentForm />} />
          <Route path="course-assignments/:id" element={<ResultReview />} />
          <Route path="results" element={<ResultsList />} />
          <Route path="results/:id/review" element={<ResultReview />} />
          <Route path="semester-results" element={<SemesterResultsManager />} />
          <Route path="students" element={<HoDStudents />} />
          <Route path="teachers" element={<HoDTeachers />} />
          <Route path="promotion" element={<PromotionPage />} />
          <Route path="promotion/history" element={<PromotionHistory />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* ── TEACHER ─────────────────────────────────────── */}
        <Route path="/teacher" element={<ProtectedRoute allowedRoles={[ROLES.TEACHER]}><MainLayout /></ProtectedRoute>}>
          <Route path="dashboard" element={<TeacherDashboard />} />
          <Route path="courses" element={<TeacherCoursesList />} />
          <Route path="courses/:id" element={<TeacherCourseDetail />} />
          <Route path="history" element={<TeacherHistory />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* ── STUDENT ─────────────────────────────────────── */}
        <Route path="/student" element={<ProtectedRoute allowedRoles={[ROLES.STUDENT]}><MainLayout /></ProtectedRoute>}>
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="results" element={<StudentResults />} />
          <Route path="results/:semester" element={<SemesterDetail />} />
          <Route path="courses" element={<StudentCourses />} />
          <Route path="transcript" element={<TranscriptPage />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* ── COMMON ──────────────────────────────────────── */}
        <Route path="/profile" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route index element={<Profile />} />
        </Route>
        <Route path="/change-password" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route index element={<ChangePassword />} />
        </Route>
        <Route path="/notifications" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route index element={<NotificationsPage />} />
        </Route>

        {/* ── ROOT & ERRORS ───────────────────────────────── */}
        <Route path="/" element={isAuthenticated ? <Navigate to={ROLE_DASHBOARD[user?.role] || "/login"} replace /> : <Navigate to="/login" replace />} />
        <Route path="/unauthorized" element={<ErrorPage code="403" title="Access Denied" message="You don't have permission to access this page." />} />
        <Route path="*" element={<ErrorPage code="404" title="Page Not Found" message="The page you're looking for doesn't exist." />} />
      </Routes>
    </Suspense>
  );
}

export default App;