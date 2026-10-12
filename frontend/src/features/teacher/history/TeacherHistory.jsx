import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineClock, HiOutlineEye, HiOutlineAcademicCap } from 'react-icons/hi2';
import api from '../../../utils/axios';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Select from '../../../components/ui/Select';
import EmptyState from '../../../components/ui/EmptyState';
import Spinner from '../../../components/ui/Spinner';
import { ASSIGNMENT_STATUS_LABELS } from '../../../utils/constants';
import toast from 'react-hot-toast';

const SESSION_FILTER = [
  { value: 'approved', label: 'Approved Results' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'rejected', label: 'Rejected' },
];

const statusVariant = (s) => {
  const m = {
    approved: 'success',
    submitted: 'purple',
    rejected: 'danger',
    'finals-saved': 'warning',
    'midterm-saved': 'info',
    'award-list-ready': 'info',
    assigned: 'default',
  };
  return m[s] || 'default';
};

const TeacherHistory = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('approved');

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const params = { limit: 50 };
        if (filterStatus) params.status = filterStatus;
        const res = await api.get('/course-assignments', { params });
        setAssignments(res.data.data.assignments || []);
      } catch {
        toast.error('Failed to load history');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [filterStatus]);

  // Group by session
  const grouped = assignments.reduce((acc, a) => {
    const sessionName = a.session?.name || 'Unknown';
    if (!acc[sessionName]) acc[sessionName] = [];
    acc[sessionName].push(a);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-[fade-in_0.3s_ease-out]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Course History
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            All your past and current course assignments
          </p>
        </div>
        <Select
          options={SESSION_FILTER}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          containerClassName="sm:w-48"
        />
      </div>

      {assignments.length === 0 ? (
        <EmptyState
          icon={HiOutlineClock}
          title="No Course History"
          description="Your course history will appear here once you have completed assignments."
        />
      ) : (
        Object.entries(grouped).map(([sessionName, items]) => (
          <div key={sessionName}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                <HiOutlineAcademicCap className="w-4 h-4 text-primary-600 dark:text-primary-400" />
              </div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Session {sessionName}
              </h2>
              <span className="text-xs text-gray-400">({items.length} courses)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {items.map((a) => (
                <Card key={a._id} hover onClick={() => navigate(`/teacher/courses/${a._id}`)}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 dark:text-white truncate">
                        {a.course?.name}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {a.course?.code} • {a.course?.creditHours} Cr.H
                      </p>
                    </div>
                    <Badge variant={statusVariant(a.status)} size="xs">
                      {ASSIGNMENT_STATUS_LABELS[a.status]}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center pt-3 border-t border-gray-100 dark:border-dark-border">
                    <div>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {a.semester}
                      </p>
                      <p className="text-[10px] text-gray-400 uppercase">Semester</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-emerald-600">
                        {a.statistics?.totalStudents || a.totalEnrolled || 0}
                      </p>
                      <p className="text-[10px] text-gray-400 uppercase">Students</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-primary-600">
                        {a.statistics?.passRate || 0}%
                      </p>
                      <p className="text-[10px] text-gray-400 uppercase">Pass Rate</p>
                    </div>
                  </div>

                  <button className="mt-3 w-full py-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/10 rounded-lg transition-colors flex items-center justify-center gap-1">
                    <HiOutlineEye className="w-3.5 h-3.5" /> View Details
                  </button>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default TeacherHistory;