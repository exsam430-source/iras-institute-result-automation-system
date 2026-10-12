import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineBookOpen, HiOutlineClipboardDocumentCheck, HiOutlineDocumentCheck, HiOutlineClock, HiOutlineXCircle, HiOutlineEye } from 'react-icons/hi2';
import api from '../../utils/axios';
import StatsCard from '../../components/ui/StatsCard';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import { ASSIGNMENT_STATUS_LABELS } from '../../utils/constants';
import toast from 'react-hot-toast';

const statusVariant = (s) => {
  const m = { assigned: 'default', 'award-list-ready': 'info', 'midterm-saved': 'info', 'finals-saved': 'warning', submitted: 'purple', approved: 'success', rejected: 'danger' };
  return m[s] || 'default';
};

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/course-assignments/teacher-dashboard');
        setData(res.data.data);
      } catch { console.error('Failed to load teacher dashboard'); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton.Card key={i} />)}
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const recent = data?.recentAssignments || [];

  return (
    <div className="space-y-6 animate-[fade-in_0.3s_ease-out]">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Teacher Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Overview of your course assignments</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard title="Total Courses" value={stats.totalAssignments || 0} icon={HiOutlineBookOpen} color="primary" />
        <StatsCard title="Pending Entry" value={stats.pendingSubmission || 0} icon={HiOutlineClock} color="warning" />
        <StatsCard title="Submitted" value={stats.submitted || 0} icon={HiOutlineClipboardDocumentCheck} color="purple" />
        <StatsCard title="Approved" value={stats.approved || 0} icon={HiOutlineDocumentCheck} color="success" />
        <StatsCard title="Rejected" value={stats.rejected || 0} icon={HiOutlineXCircle} color="danger" />
      </div>

      {/* Recent Assignments */}
      <Card>
        <Card.Header action={<button onClick={() => navigate('/teacher/courses')} className="text-xs text-primary-600 dark:text-primary-400 font-medium hover:underline">View All</button>}>
          <Card.Title>My Courses</Card.Title>
          <Card.Description>Recent course assignments</Card.Description>
        </Card.Header>

        {recent.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recent.map((a) => (
              <div key={a._id} onClick={() => navigate(`/teacher/courses/${a._id}`)} className="p-4 rounded-xl border border-gray-100 dark:border-dark-border bg-gray-50/50 dark:bg-dark-card/50 hover:shadow-card-hover hover:-translate-y-0.5 transition-all cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">{a.course?.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{a.course?.code} • {a.course?.creditHours} Cr.H</p>
                  </div>
                  <Badge variant={statusVariant(a.status)} size="xs">{ASSIGNMENT_STATUS_LABELS[a.status]}</Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Semester {a.semester}</span>
                  <span>{a.session?.name}</span>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-dark-border">
                  <span className="text-xs text-gray-500">Students: <span className="font-semibold text-gray-900 dark:text-white">{a.totalEnrolled || 0}</span></span>
                  <button className="text-xs text-primary-600 dark:text-primary-400 font-medium hover:underline flex items-center gap-1">
                    <HiOutlineEye className="w-3.5 h-3.5" /> View
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-8">No courses assigned yet</p>
        )}
      </Card>
    </div>
  );
};

export default TeacherDashboard;