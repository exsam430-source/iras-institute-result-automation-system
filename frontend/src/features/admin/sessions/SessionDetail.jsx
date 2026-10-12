import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlinePencilSquare, HiOutlineUserGroup, HiOutlineCalendarDays } from 'react-icons/hi2';
import api from '../../../utils/axios';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import StatsCard from '../../../components/ui/StatsCard';
import Spinner from '../../../components/ui/Spinner';
import { formatDate, getFullName, formatGPA } from '../../../utils/helpers';
import toast from 'react-hot-toast';

const SessionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/sessions/${id}`)
      .then((res) => setSession(res.data.data.session))
      .catch(() => { toast.error('Failed to load session'); navigate('/admin/sessions'); })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!session) return null;

  const stats = session.stats || {};
  const semBreakdown = stats.semesterBreakdown || [];

  return (
    <div className="space-y-6 animate-[fade-in_0.3s_ease-out]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/sessions')} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card text-gray-500">
            <HiOutlineArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{session.name}</h1>
              {session.isCurrent && <Badge variant="success" size="sm" dot>Current</Badge>}
              <Badge variant={session.isActive ? 'success' : 'danger'} size="sm">{session.isActive ? 'Active' : 'Inactive'}</Badge>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              {session.program?.name} ({session.program?.code}) • {session.department?.name}
            </p>
          </div>
        </div>
        <Button icon={HiOutlinePencilSquare} variant="secondary" onClick={() => navigate(`/admin/sessions/${id}/edit`)}>Edit</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard title="Total Students" value={stats.totalStudents || 0} icon={HiOutlineUserGroup} color="primary" />
        <StatsCard title="Current Semester" value={session.currentSemester || 1} icon={HiOutlineCalendarDays} color="info" />
        <StatsCard title="Start Year" value={session.startYear} color="gold" />
        <StatsCard title="End Year" value={session.endYear} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <Card.Header><Card.Title>Session Information</Card.Title></Card.Header>
          <div className="space-y-3 text-sm">
            {[
              ['Program', `${session.program?.degreeType || ''} ${session.program?.name || ''}`],
              ['Department', session.department?.name],
              ['Institute', session.institute?.name],
              ['Start Year', session.startYear],
              ['End Year', session.endYear],
              ['Current Semester', `Semester ${session.currentSemester || 1}`],
              ['Admission Date', session.admissionDate ? formatDate(session.admissionDate) : 'N/A'],
              ['Status', session.isActive ? 'Active' : 'Inactive'],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{label}</span>
                <span className="font-medium text-gray-900 dark:text-white text-right max-w-[60%] truncate">
                  {value || 'N/A'}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <Card.Header><Card.Title>Students by Semester</Card.Title></Card.Header>
          {semBreakdown.length > 0 ? (
            <div className="space-y-3">
              {semBreakdown.map((sb) => (
                <div key={sb.semester} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Semester {sb.semester}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-gray-100 dark:bg-dark-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full"
                        style={{ width: `${Math.min(100, (sb.count / (stats.totalStudents || 1)) * 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white w-8 text-right">
                      {sb.count}
                    </span>
                    <span className="text-xs text-gray-400 w-16">
                      ({sb.active} active)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">No students enrolled yet</p>
          )}
        </Card>
      </div>
    </div>
  );
};

export default SessionDetail;