import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineUsers,
  HiOutlineUserGroup,
  HiOutlineBookOpen,
  HiOutlineClipboardDocumentCheck,
  HiOutlineDocumentCheck,
  HiOutlineClock,
  HiOutlineAcademicCap,
} from 'react-icons/hi2';
import api from '../../utils/axios';
import StatsCard from '../../components/ui/StatsCard';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Skeleton from '../../components/ui/Skeleton';
import { getFullName, formatGPA, timeAgo } from '../../utils/helpers';
import { ASSIGNMENT_STATUS_LABELS, MARKS_PHASE_COLORS } from '../../utils/constants';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

const PIE_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6', '#F97316', '#64748B'];

const HoDDashboard = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/analytics/hod/overview');
        setAnalytics(res.data.data.analytics);
      } catch (err) {
        console.error('Failed to fetch HoD analytics:', err);
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
          {Array.from({ length: 8 }).map((_, i) => <Skeleton.Card key={i} />)}
        </div>
      </div>
    );
  }

  const overview = analytics?.overview || {};
  const semesterBreakdown = (analytics?.semesterBreakdown || []).map((s) => ({ name: `Sem ${s.semester}`, students: s.count }));
  const gradeDistribution = (analytics?.gradeDistribution || []).map((g) => ({ name: g.grade, count: g.count }));
  const recentSubmissions = analytics?.recentSubmissions || [];
  const topPerformers = analytics?.topPerformers || [];

  return (
    <div className="space-y-6 animate-[fade-in_0.3s_ease-out]">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Department Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Overview of your department</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Teachers" value={overview.totalTeachers || 0} icon={HiOutlineUsers} color="primary" />
        <StatsCard title="Students" value={overview.totalStudents || 0} icon={HiOutlineUserGroup} color="success" />
        <StatsCard title="Programs" value={overview.totalPrograms || 0} icon={HiOutlineAcademicCap} color="purple" />
        <StatsCard title="Courses" value={overview.totalCourses || 0} icon={HiOutlineBookOpen} color="gold" />
        <StatsCard title="Assignments" value={overview.totalAssignments || 0} icon={HiOutlineClipboardDocumentCheck} color="info" />
        <StatsCard title="Approved" value={overview.approvedResults || 0} icon={HiOutlineDocumentCheck} color="success" />
        <StatsCard title="Pending Approval" value={overview.pendingApproval || 0} icon={HiOutlineClock} color="warning" onClick={() => navigate('/hod/results')} />
        <StatsCard title="Total Courses" value={overview.totalCourses || 0} icon={HiOutlineBookOpen} color="info" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Students by Semester */}
        <Card>
          <Card.Header><Card.Title>Students by Semester</Card.Title></Card.Header>
          {semesterBreakdown.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={semesterBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" className="dark:opacity-20" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '13px' }} />
                  <Bar dataKey="students" fill="#2D5F8B" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400 text-sm">No data</div>
          )}
        </Card>

        {/* Grade Distribution */}
        <Card>
          <Card.Header><Card.Title>Grade Distribution</Card.Title></Card.Header>
          {gradeDistribution.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={gradeDistribution} cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={2} dataKey="count" label={({ name, count }) => `${name}: ${count}`}>
                    {gradeDistribution.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '13px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400 text-sm">No grade data</div>
          )}
        </Card>
      </div>

      {/* Recent + Top */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Submissions */}
        <Card>
          <Card.Header action={<button onClick={() => navigate('/hod/results')} className="text-xs text-primary-600 dark:text-primary-400 font-medium hover:underline">View All</button>}>
            <Card.Title>Recent Submissions</Card.Title>
          </Card.Header>
          <div className="space-y-2">
            {recentSubmissions.length > 0 ? recentSubmissions.map((sub) => (
              <div key={sub._id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-dark-card">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar src={sub.teacher?.avatar} name={getFullName(sub.teacher)} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{sub.course?.name}</p>
                    <p className="text-xs text-gray-500 truncate">{getFullName(sub.teacher)} • Sem {sub.semester}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-400">{timeAgo(sub.submittedAt)}</p>
                  <p className="text-xs font-medium text-emerald-600">{sub.statistics?.passRate || 0}% pass</p>
                </div>
              </div>
            )) : <p className="text-sm text-gray-400 text-center py-4">No pending submissions</p>}
          </div>
        </Card>

        {/* Top Performers */}
        <Card>
          <Card.Header><Card.Title>Top Performers</Card.Title></Card.Header>
          <div className="space-y-2">
            {topPerformers.length > 0 ? topPerformers.map((stu, i) => (
              <div key={stu._id || i} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-dark-card">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-xs font-bold text-primary-600">
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{stu.studentName}</p>
                    <p className="text-xs text-gray-500">{stu.rollNumber}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-primary-600">{formatGPA(stu.cumulativeGPA)}</p>
                  <p className="text-[10px] text-gray-400">CGPA</p>
                </div>
              </div>
            )) : <p className="text-sm text-gray-400 text-center py-4">No data yet</p>}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default HoDDashboard;