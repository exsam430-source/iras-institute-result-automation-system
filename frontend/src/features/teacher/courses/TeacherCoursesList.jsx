import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineBookOpen, HiOutlineEye } from 'react-icons/hi2';
import api from '../../../utils/axios';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Spinner from '../../../components/ui/Spinner';
import EmptyState from '../../../components/ui/EmptyState';
import { ASSIGNMENT_STATUS_LABELS } from '../../../utils/constants';
import toast from 'react-hot-toast';

const statusVariant = (s) => {
  const m = { assigned: 'default', 'award-list-ready': 'info', 'midterm-saved': 'info', 'finals-saved': 'warning', submitted: 'purple', approved: 'success', rejected: 'danger' };
  return m[s] || 'default';
};

const TeacherCoursesList = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/course-assignments?limit=50');
        setAssignments(res.data.data.assignments || []);
      } catch { toast.error('Failed to load courses'); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6 animate-[fade-in_0.3s_ease-out]">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Courses</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">All courses assigned to you</p>
      </div>

      {assignments.length === 0 ? (
        <EmptyState icon={HiOutlineBookOpen} title="No Courses Assigned" description="No courses have been assigned to you yet. Contact your HoD." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {assignments.map((a) => (
            <Card key={a._id} hover onClick={() => navigate(`/teacher/courses/${a._id}`)}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center shrink-0">
                  <HiOutlineBookOpen className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <Badge variant={statusVariant(a.status)} size="xs">{ASSIGNMENT_STATUS_LABELS[a.status]}</Badge>
              </div>

              <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1">{a.course?.name}</h3>
              <p className="text-sm text-gray-500">{a.course?.code} • {a.course?.creditHours} Credit Hours</p>

              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-dark-border grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{a.semester}</p>
                  <p className="text-[10px] text-gray-400 uppercase">Semester</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-emerald-600">{a.totalEnrolled || a.enrolledStudents?.filter((s) => s.isActive).length || 0}</p>
                  <p className="text-[10px] text-gray-400 uppercase">Students</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-primary-600">{a.session?.name?.split('-')[0] || '—'}</p>
                  <p className="text-[10px] text-gray-400 uppercase">Session</p>
                </div>
              </div>

              <button className="mt-4 w-full py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/10 rounded-lg transition-colors flex items-center justify-center gap-1.5">
                <HiOutlineEye className="w-4 h-4" /> Open Award List
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeacherCoursesList;