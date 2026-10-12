import { useState, useEffect } from 'react';
import {
  HiOutlineDocumentArrowDown,
  HiOutlineChartBar,
  HiOutlineUserGroup,
  HiOutlineAcademicCap,
  HiOutlineDocumentText,
} from 'react-icons/hi2';
import api from '../../../utils/axios';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import Spinner from '../../../components/ui/Spinner';
import toast from 'react-hot-toast';

const REPORT_TYPES = [
  {
    id: 'students',
    title: 'Students Report',
    description: 'Complete list of all students with academic info',
    icon: HiOutlineUserGroup,
    color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30',
  },
  {
    id: 'results',
    title: 'Semester Results Report',
    description: 'GPA/CGPA summary for all students in a semester',
    icon: HiOutlineAcademicCap,
    color: 'text-primary-600 bg-primary-100 dark:bg-primary-900/30',
  },
  {
    id: 'analytics',
    title: 'Analytics Summary',
    description: 'System-wide stats, grade distribution & trends',
    icon: HiOutlineChartBar,
    color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30',
  },
  {
    id: 'audit',
    title: 'Audit Log Report',
    description: 'System activity log for selected period',
    icon: HiOutlineDocumentText,
    color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30',
  },
];

const SEMESTER_OPTIONS = Array.from({ length: 8 }, (_, i) => ({
  value: String(i + 1),
  label: `Semester ${i + 1}`,
}));

const ReportsPage = () => {
  const [departments, setDepartments] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedSession, setSelectedSession] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [generating, setGenerating] = useState('');

  useEffect(() => {
    api.get('/departments?limit=100&isActive=true').then((r) => {
      setDepartments((r.data.data.departments || []).map((d) => ({
        value: d._id,
        label: `${d.name} (${d.code})`,
      })));
    }).catch(() => {});

    api.get('/sessions?limit=100&isActive=true').then((r) => {
      setSessions((r.data.data.sessions || []).map((s) => ({
        value: s._id,
        label: s.name,
      })));
    }).catch(() => {});
  }, []);

  const generateStudentsReport = async () => {
    setGenerating('students');
    try {
      const params = {};
      if (selectedDept) params.department = selectedDept;
      if (selectedSemester) params.semester = selectedSemester;

      const res = await api.get('/students', { params: { ...params, limit: 1000 } });
      const students = res.data.data.students || [];

      if (students.length === 0) {
        toast.error('No students found with selected filters');
        return;
      }

      // Generate CSV
      const headers = ['Roll Number', 'Registration No', 'Name', 'Father Name', 'Program', 'Department', 'Semester', 'CGPA', 'Status', 'Email'];
      const rows = students.map((s) => [
        s.rollNumber,
        s.registrationNumber,
        `${s.user?.firstName || ''} ${s.user?.lastName || ''}`.trim(),
        s.fatherName,
        s.program?.code || '',
        s.department?.name || '',
        s.currentSemester,
        (s.cumulativeGPA || 0).toFixed(2),
        s.enrollmentStatus,
        s.user?.email || '',
      ]);

      downloadCSV('students_report.csv', headers, rows);
      toast.success('Students report downloaded');
    } catch {
      toast.error('Failed to generate report');
    } finally {
      setGenerating('');
    }
  };

  const generateResultsReport = async () => {
    if (!selectedDept || !selectedSemester) {
      toast.error('Please select department and semester');
      return;
    }
    setGenerating('results');
    try {
      const params = {
        departmentId: selectedDept,
        semester: selectedSemester,
        limit: 1000,
      };
      if (selectedSession) params.sessionId = selectedSession;

      const res = await api.get('/semester-results/department', { params });
      const results = res.data.data.results || [];

      if (results.length === 0) {
        toast.error('No results found');
        return;
      }

      const headers = ['Roll Number', 'Student Name', 'Semester', 'Semester GPA', 'CGPA', 'Passed', 'Failed', 'Credits Earned', 'Status'];
      const rows = results.map((r) => [
        r.student?.rollNumber || '',
        r.student?.user ? `${r.student.user.firstName} ${r.student.user.lastName}` : '',
        r.semester,
        (r.semesterGPA || 0).toFixed(2),
        (r.cumulativeGPA || 0).toFixed(2),
        r.totalCoursesPassed,
        r.totalCoursesFailed,
        r.totalCreditHoursEarned,
        r.isPublished ? 'Published' : 'Calculated',
      ]);

      downloadCSV('semester_results_report.csv', headers, rows);
      toast.success('Results report downloaded');
    } catch {
      toast.error('Failed to generate report');
    } finally {
      setGenerating('');
    }
  };

  const generateAnalyticsReport = async () => {
    setGenerating('analytics');
    try {
      const res = await api.get('/analytics/admin/overview');
      const data = res.data.data.analytics;

      const headers = ['Metric', 'Value'];
      const rows = [
        ['Total Institutes', data.overview?.totalInstitutes || 0],
        ['Total Departments', data.overview?.totalDepartments || 0],
        ['Total Programs', data.overview?.totalPrograms || 0],
        ['Total Courses', data.overview?.totalCourses || 0],
        ['Total Users', data.overview?.totalUsers || 0],
        ['Total Students', data.overview?.totalStudents || 0],
        ['Active Students', data.overview?.activeStudents || 0],
        ['Total Teachers', data.overview?.totalTeachers || 0],
        ['Total HoDs', data.overview?.totalHoDs || 0],
        ['Total Assignments', data.overview?.totalAssignments || 0],
        ['Approved Results', data.overview?.approvedResults || 0],
        ['Pending Results', data.overview?.pendingResults || 0],
      ];

      downloadCSV('analytics_report.csv', headers, rows);
      toast.success('Analytics report downloaded');
    } catch {
      toast.error('Failed to generate report');
    } finally {
      setGenerating('');
    }
  };

  const generateAuditReport = async () => {
    setGenerating('audit');
    try {
      const res = await api.get('/audit-logs?limit=500');
      const logs = res.data.data.logs || [];

      if (logs.length === 0) {
        toast.error('No audit logs found');
        return;
      }

      const headers = ['Date', 'User', 'Role', 'Action', 'Resource', 'Description', 'IP Address'];
      const rows = logs.map((l) => [
        new Date(l.createdAt).toLocaleString(),
        l.user ? `${l.user.firstName} ${l.user.lastName}` : 'System',
        l.user?.role || '',
        l.action,
        l.resource,
        l.description || '',
        l.ipAddress || '',
      ]);

      downloadCSV('audit_log_report.csv', headers, rows);
      toast.success('Audit report downloaded');
    } catch {
      toast.error('Failed to generate report');
    } finally {
      setGenerating('');
    }
  };

  const downloadCSV = (filename, headers, rows) => {
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const reportActions = {
    students: generateStudentsReport,
    results: generateResultsReport,
    analytics: generateAnalyticsReport,
    audit: generateAuditReport,
  };

  return (
    <div className="space-y-6 animate-[fade-in_0.3s_ease-out]">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Generate and download system reports as CSV
        </p>
      </div>

      {/* Filters */}
      <Card>
        <Card.Header>
          <Card.Title>Report Filters</Card.Title>
          <Card.Description>Apply filters before generating reports</Card.Description>
        </Card.Header>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select
            label="Department"
            options={departments}
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            placeholder="All Departments"
          />
          <Select
            label="Session"
            options={sessions}
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            placeholder="All Sessions"
          />
          <Select
            label="Semester"
            options={SEMESTER_OPTIONS}
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            placeholder="All Semesters"
          />
        </div>
      </Card>

      {/* Report Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {REPORT_TYPES.map((report) => (
          <Card key={report.id}>
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${report.color}`}>
                <report.icon className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 dark:text-white">{report.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{report.description}</p>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={HiOutlineDocumentArrowDown}
                  className="mt-3"
                  isLoading={generating === report.id}
                  onClick={reportActions[report.id]}
                >
                  Download CSV
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Info */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 rounded-xl text-sm text-blue-700 dark:text-blue-300">
        📋 Reports are generated in CSV format. Open with Microsoft Excel or Google Sheets.
      </div>
    </div>
  );
};

export default ReportsPage;