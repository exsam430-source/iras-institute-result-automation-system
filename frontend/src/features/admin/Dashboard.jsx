import { useState, useEffect } from 'react';
import {
  HiOutlineBuildingLibrary,
  HiOutlineBuildingOffice2,
  HiOutlineAcademicCap,
  HiOutlineUsers,
  HiOutlineUserGroup,
  HiOutlineBookOpen,
  HiOutlineDocumentCheck,
  HiOutlineClipboardDocumentCheck,
} from 'react-icons/hi2';
import api from '../../utils/axios';
import StatsCard from '../../components/ui/StatsCard';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import { formatDate, getFullName, timeAgo } from '../../utils/helpers';
import { ROLE_LABELS, ROLE_COLORS } from '../../utils/constants';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';

const PIE_COLORS = ['#1E3A5F', '#2D5F8B', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/analytics/admin/overview');
        setAnalytics(res.data.data.analytics);
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton.Card key={i} />
          ))}
        </div>
      </div>
    );
  }

  const overview = analytics?.overview || {};
  const usersByRole = (analytics?.usersByRole || []).map((r) => ({
    name: ROLE_LABELS[r.role] || r.role,
    value: r.count,
  }));
  const institutesBreakdown = analytics?.institutesBreakdown || [];
  const recentUsers = analytics?.recentUsers || [];
  const monthlyRegistrations = analytics?.monthlyRegistrations || [];

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyData = monthlyRegistrations.map((m) => ({
    name: `${monthNames[m.month - 1]} ${m.year}`,
    total: m.count,
    students: m.students,
    teachers: m.teachers,
  }));

  return (
    <div className="space-y-6 animate-[fade-in_0.3s_ease-out]">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          System overview and analytics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Institutes" value={overview.totalInstitutes || 0} icon={HiOutlineBuildingLibrary} color="primary" />
        <StatsCard title="Departments" value={overview.totalDepartments || 0} icon={HiOutlineBuildingOffice2} color="info" />
        <StatsCard title="Programs" value={overview.totalPrograms || 0} icon={HiOutlineAcademicCap} color="purple" />
        <StatsCard title="Courses" value={overview.totalCourses || 0} icon={HiOutlineBookOpen} color="gold" />
        <StatsCard title="Total Users" value={overview.totalUsers || 0} icon={HiOutlineUsers} color="primary" subtitle={`${overview.activeStudents || 0} active students`} />
        <StatsCard title="Teachers" value={overview.totalTeachers || 0} icon={HiOutlineUserGroup} color="success" />
        <StatsCard title="Approved Results" value={overview.approvedResults || 0} icon={HiOutlineDocumentCheck} color="success" />
        <StatsCard title="Pending Results" value={overview.pendingResults || 0} icon={HiOutlineClipboardDocumentCheck} color="warning" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Registrations Chart */}
        <Card className="lg:col-span-2">
          <Card.Header>
            <Card.Title>Monthly Registrations</Card.Title>
            <Card.Description>User registrations over the last 12 months</Card.Description>
          </Card.Header>
          {monthlyData.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" className="dark:opacity-20" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #E5E7EB',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      fontSize: '13px',
                    }}
                  />
                  <Bar dataKey="students" fill="#2D5F8B" radius={[4, 4, 0, 0]} name="Students" />
                  <Bar dataKey="teachers" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Teachers" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center text-gray-400 text-sm">
              No registration data available
            </div>
          )}
        </Card>

        {/* Users by Role Pie Chart */}
        <Card>
          <Card.Header>
            <Card.Title>Users by Role</Card.Title>
          </Card.Header>
          {usersByRole.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={usersByRole}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {usersByRole.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #E5E7EB',
                      fontSize: '13px',
                    }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center text-gray-400 text-sm">
              No user data available
            </div>
          )}
        </Card>
      </div>

      {/* Institute Breakdown + Recent Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Institute Breakdown */}
        <Card>
          <Card.Header>
            <Card.Title>Institute Overview</Card.Title>
            <Card.Description>Departments, students, and teachers per institute</Card.Description>
          </Card.Header>
          <div className="space-y-3">
            {institutesBreakdown.length > 0 ? (
              institutesBreakdown.map((inst) => (
                <div
                  key={inst._id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-dark-card"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {inst.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{inst.code}</p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-center">
                      <p className="text-sm font-bold text-primary-600 dark:text-primary-400">
                        {inst.totalDepartments}
                      </p>
                      <p className="text-[10px] text-gray-400">Depts</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {inst.totalStudents}
                      </p>
                      <p className="text-[10px] text-gray-400">Students</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-amber-600 dark:text-amber-400">
                        {inst.totalTeachers}
                      </p>
                      <p className="text-[10px] text-gray-400">Teachers</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400 text-center py-6">No institutes found</p>
            )}
          </div>
        </Card>

        {/* Recent Users */}
        <Card>
          <Card.Header>
            <Card.Title>Recent Registrations</Card.Title>
            <Card.Description>Latest users added to the system</Card.Description>
          </Card.Header>
          <div className="space-y-3">
            {recentUsers.length > 0 ? (
              recentUsers.map((u) => (
                <div
                  key={u._id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-dark-card"
                >
                  <Avatar src={u.avatar} name={getFullName(u)} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {getFullName(u)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {u.email}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge variant={u.role === 'student' ? 'info' : u.role === 'teacher' ? 'warning' : 'primary'} size="xs">
                      {ROLE_LABELS[u.role]}
                    </Badge>
                    <p className="text-[10px] text-gray-400 mt-1">{timeAgo(u.createdAt)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400 text-center py-6">No recent users</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;