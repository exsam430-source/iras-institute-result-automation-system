import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineAcademicCap,
  HiOutlineBookOpen,
  HiOutlineDocumentCheck,
  HiOutlineChartBar,
  HiOutlineExclamationTriangle,
  HiOutlineTrophy,
  HiOutlineBell,
} from 'react-icons/hi2';
import api from '../../utils/axios';
import useAuth from '../../hooks/useAuth';
import StatsCard from '../../components/ui/StatsCard';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import { formatGPA, getFullName } from '../../utils/helpers';
import { GRADE_COLORS, MARKS_PHASE_LABELS, MARKS_PHASE_COLORS } from '../../utils/constants';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area,
} from 'recharts';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/analytics/student/overview');
        setAnalytics(res.data.data.analytics);
      } catch (err) {
        console.error('Failed to fetch student analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton.Card key={i} />)}
        </div>
      </div>
    );
  }

  const overview = analytics?.overview || {};
  const currentMarks = analytics?.currentSemesterMarks || [];
  const gpaProgression = (analytics?.gpaProgression || []).map((g) => ({
    name: `Sem ${g.semester}`,
    gpa: g.semesterGPA,
    cgpa: g.cumulativeGPA,
  }));
  const gradeDistribution = analytics?.gradeDistribution || [];
  const academicInfo = analytics?.academicInfo || {};

  return (
    <div className="space-y-6 animate-[fade-in_0.3s_ease-out]">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
        <div className="absolute bottom-0 right-8 w-24 h-24 bg-gold-500/10 rounded-full blur-xl" />
        <div className="relative z-10">
          <h1 className="text-2xl font-bold mb-1">Welcome back, {user?.firstName}! 👋</h1>
          <p className="text-primary-100 text-sm mb-4">{academicInfo.program} • Semester {overview.currentSemester} • {academicInfo.session}</p>
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-3xl font-extrabold">{formatGPA(overview.cumulativeGPA)}</p>
              <p className="text-xs text-primary-200 mt-0.5">Cumulative GPA</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold">{overview.totalCreditHoursEarned || 0}</p>
              <p className="text-xs text-primary-200 mt-0.5">Credits Earned</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold">{overview.completionPercentage || 0}%</p>
              <p className="text-xs text-primary-200 mt-0.5">Degree Progress</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatsCard title="Semester" value={overview.currentSemester || 1} icon={HiOutlineAcademicCap} color="primary" />
        <StatsCard title="CGPA" value={formatGPA(overview.cumulativeGPA)} icon={HiOutlineTrophy} color="gold" />
        <StatsCard title="Courses Passed" value={overview.totalPassedCourses || 0} icon={HiOutlineDocumentCheck} color="success" />
        <StatsCard title="Courses Failed" value={overview.totalFailedCourses || 0} icon={HiOutlineExclamationTriangle} color="danger" />
        <StatsCard title="Credits Earned" value={overview.totalCreditHoursEarned || 0} icon={HiOutlineBookOpen} color="info" />
        <StatsCard title="Notifications" value={overview.unreadNotifications || 0} icon={HiOutlineBell} color="warning" onClick={() => navigate('/notifications')} />
      </div>

      {/* Current Semester Marks + GPA Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Semester Courses */}
        <Card className="lg:col-span-2">
          <Card.Header action={<button onClick={() => navigate('/student/results')} className="text-xs text-primary-600 dark:text-primary-400 font-medium hover:underline">View All Results</button>}>
            <Card.Title>Current Semester - Marks Status</Card.Title>
            <Card.Description>Semester {overview.currentSemester} courses</Card.Description>
          </Card.Header>

          {currentMarks.length > 0 ? (
            <div className="space-y-3">
              {currentMarks.map((mark) => (
                <CourseMarkCard key={mark._id || mark.course?._id} mark={mark} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <HiOutlineBookOpen className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No courses found for current semester</p>
            </div>
          )}
        </Card>

        {/* GPA Progression */}
        <Card>
          <Card.Header><Card.Title>GPA Progression</Card.Title></Card.Header>
          {gpaProgression.length > 0 ? (
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={gpaProgression}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" className="dark:opacity-20" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 4]} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '13px' }} />
                  <Area type="monotone" dataKey="cgpa" stroke="#1E3A5F" fill="#1E3A5F" fillOpacity={0.1} strokeWidth={2} name="CGPA" />
                  <Area type="monotone" dataKey="gpa" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.1} strokeWidth={2} name="Semester GPA" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-60 flex items-center justify-center text-gray-400 text-sm">No data yet</div>
          )}

          {/* Grade Summary */}
          {gradeDistribution.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-dark-border">
              <p className="text-xs font-medium text-gray-500 mb-2">Grade Distribution (All Semesters)</p>
              <div className="flex flex-wrap gap-2">
                {gradeDistribution.map((g) => (
                  <span key={g.grade} className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold ${GRADE_COLORS[g.grade] || 'bg-gray-100 text-gray-600'}`}>
                    {g.grade}: {g.count}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Academic Info */}
      <Card>
        <Card.Header><Card.Title>Academic Information</Card.Title></Card.Header>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          {[
            ['Program', academicInfo.programCode || academicInfo.program],
            ['Department', academicInfo.department],
            ['Institute', academicInfo.institute],
            ['Session', academicInfo.session],
            ['Total Semesters', overview.totalSemesters],
            ['Credits Attempted', overview.totalCreditHoursAttempted || 0],
            ['Credits Earned', overview.totalCreditHoursEarned || 0],
            ['Status', overview.enrollmentStatus?.toUpperCase()],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</p>
              <p className="font-semibold text-gray-900 dark:text-white mt-0.5">{value || 'N/A'}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// Course Mark Card Sub-component
const CourseMarkCard = ({ mark }) => {
  const phase = mark.marksPhase;
  const course = mark.course;

  return (
    <div className="p-4 rounded-xl border border-gray-100 dark:border-dark-border bg-gray-50/50 dark:bg-dark-card/30">
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 dark:text-white truncate">{course?.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">{course?.code} • {course?.creditHours} Credit Hours</p>
        </div>
        <Badge className={MARKS_PHASE_COLORS[phase] || ''} size="xs">
          {MARKS_PHASE_LABELS[phase] || phase}
        </Badge>
      </div>

      {/* Progressive Marks Display */}
      <div className="grid grid-cols-4 gap-3">
        <MarkBox label="Mid-Term" obtained={mark.midTerm?.obtained} total={mark.midTerm?.total || 20} entered={mark.midTerm?.isEntered} />
        <MarkBox label="Internal" obtained={mark.internal?.obtained} total={mark.internal?.total || 20} entered={mark.internal?.isEntered} />
        <MarkBox label="Final" obtained={mark.finalTerm?.obtained} total={mark.finalTerm?.total || 60} entered={mark.finalTerm?.isEntered} />
        <div className="text-center">
          <p className="text-[10px] text-gray-400 uppercase mb-1">Grade</p>
          {mark.grade ? (
            <span className={`inline-flex px-2.5 py-1 rounded-lg text-sm font-bold ${GRADE_COLORS[mark.grade] || ''}`}>
              {mark.grade}
            </span>
          ) : (
            <span className="text-gray-300 dark:text-gray-600 text-sm">—</span>
          )}
        </div>
      </div>

      {/* Total bar */}
      {mark.totalObtained != null && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-dark-border flex items-center justify-between text-sm">
          <span className="text-gray-500">Total: <strong className="text-gray-900 dark:text-white">{mark.totalObtained}/{mark.totalMarks || 100}</strong></span>
          <span className="text-gray-500">Percentage: <strong className={mark.isPassed ? 'text-emerald-600' : 'text-red-600'}>{mark.percentage}%</strong></span>
          <span className={`font-bold ${mark.isPassed ? 'text-emerald-600' : 'text-red-600'}`}>
            {mark.isPassed ? '✓ Pass' : '✗ Fail'}
          </span>
        </div>
      )}
    </div>
  );
};

const MarkBox = ({ label, obtained, total, entered }) => (
  <div className="text-center">
    <p className="text-[10px] text-gray-400 uppercase mb-1">{label}</p>
    {entered ? (
      <p className="text-lg font-bold text-gray-900 dark:text-white">
        {obtained}<span className="text-xs text-gray-400 font-normal">/{total}</span>
      </p>
    ) : (
      <p className="text-sm text-gray-300 dark:text-gray-600">Pending</p>
    )}
  </div>
);

export default StudentDashboard;