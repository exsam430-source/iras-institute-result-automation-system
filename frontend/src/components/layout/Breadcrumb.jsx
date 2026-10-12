import { Link, useLocation } from 'react-router-dom';
import { HiOutlineHome, HiOutlineChevronRight } from 'react-icons/hi2';
import { cn } from '../../utils/helpers';

const labelMap = {
  admin: 'Admin',
  hod: 'HoD',
  teacher: 'Teacher',
  student: 'Student',
  dashboard: 'Dashboard',
  institutes: 'Institutes',
  departments: 'Departments',
  programs: 'Programs',
  sessions: 'Sessions',
  courses: 'Courses',
  users: 'Users',
  settings: 'Settings',
  'audit-logs': 'Audit Logs',
  'course-assignments': 'Course Assignments',
  results: 'Results',
  students: 'Students',
  teachers: 'Teachers',
  promotion: 'Promotion',
  transcript: 'Transcript',
  notifications: 'Notifications',
  profile: 'Profile',
  'change-password': 'Change Password',
  create: 'Create',
  edit: 'Edit',
  history: 'History',
};

const Breadcrumb = ({ items, className }) => {
  const location = useLocation();

  const breadcrumbs = items || generateBreadcrumbs(location.pathname);

  return (
    <nav className={cn('flex items-center gap-1 text-sm', className)}>
      <Link
        to="/"
        className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        <HiOutlineHome className="w-4 h-4" />
      </Link>

      {breadcrumbs.map((crumb, index) => (
        <div key={index} className="flex items-center gap-1">
          <HiOutlineChevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" />
          {index === breadcrumbs.length - 1 ? (
            <span className="font-medium text-gray-900 dark:text-white text-sm">
              {crumb.label}
            </span>
          ) : (
            <Link
              to={crumb.path}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors text-sm"
            >
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
};

const generateBreadcrumbs = (pathname) => {
  const segments = pathname.split('/').filter(Boolean);
  const crumbs = [];
  let currentPath = '';

  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;

    // Skip ObjectId-like segments
    if (/^[0-9a-fA-F]{24}$/.test(segment)) {
      crumbs.push({ label: 'Detail', path: currentPath });
      return;
    }

    const label = labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
    crumbs.push({ label, path: currentPath });
  });

  return crumbs;
};

export default Breadcrumb;