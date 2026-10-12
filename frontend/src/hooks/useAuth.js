import { useSelector } from 'react-redux';
import { ROLES } from '../utils/constants';

const useAuth = () => {
  const { user, isAuthenticated, isLoading, isCheckingAuth, studentProfile } =
    useSelector((state) => state.auth);

  const role = user?.role || null;

  const isSuperAdmin = role === ROLES.SUPER_ADMIN;
  const isAdmin = role === ROLES.ADMIN || isSuperAdmin;
  const isDirector = role === ROLES.DIRECTOR;
  const isHoD = role === ROLES.HOD;
  const isTeacher = role === ROLES.TEACHER;
  const isStudent = role === ROLES.STUDENT;
  const isStaff = isSuperAdmin || isAdmin || isDirector || isHoD || isTeacher;

  const hasRole = (...roles) => roles.includes(role);

  return {
    user,
    role,
    isAuthenticated,
    isLoading,
    isCheckingAuth,
    studentProfile,
    isSuperAdmin,
    isAdmin,
    isDirector,
    isHoD,
    isTeacher,
    isStudent,
    isStaff,
    hasRole,
  };
};

export default useAuth;