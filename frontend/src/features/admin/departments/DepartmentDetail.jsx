import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  HiOutlineArrowLeft,
  HiOutlinePencilSquare,
  HiOutlineUsers,
  HiOutlineUserGroup,
  HiOutlineAcademicCap,
  HiOutlineBookOpen,
} from 'react-icons/hi2';
import api from '../../../utils/axios';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import StatsCard from '../../../components/ui/StatsCard';
import Avatar from '../../../components/ui/Avatar';
import Spinner from '../../../components/ui/Spinner';
import { getFullName } from '../../../utils/helpers';
import toast from 'react-hot-toast';

const DepartmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get(`/departments/${id}`);
        setDepartment(res.data.data.department);
      } catch {
        toast.error('Failed to load department');
        navigate('/admin/departments');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id, navigate]);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!department) return null;

  const stats = department.stats || {};
  const teachers = department.teachers || [];
  const programs = department.programs || [];
  const semesterBreakdown = stats.semesterBreakdown || [];

  return (
    <div className="space-y-6 animate-[fade-in_0.3s_ease-out]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/departments')} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card text-gray-500 transition-colors">
            <HiOutlineArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{department.name}</h1>
              <Badge variant={department.isActive ? 'success' : 'danger'} size="sm" dot>{department.isActive ? 'Active' : 'Inactive'}</Badge>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Code: {department.code} • {department.institute?.name}
            </p>
          </div>
        </div>
        <Button icon={HiOutlinePencilSquare} variant="secondary" onClick={() => navigate(`/admin/departments/${id}/edit`)}>Edit</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard title="Teachers" value={stats.totalTeachers || 0} icon={HiOutlineUsers} color="primary" />
        <StatsCard title="Students" value={stats.totalStudents || 0} icon={HiOutlineUserGroup} color="success" />
        <StatsCard title="Programs" value={stats.totalPrograms || 0} icon={HiOutlineAcademicCap} color="purple" />
        <StatsCard title="Courses" value={programs.reduce((sum, p) => sum + (p.totalCourses || 0), 0)} icon={HiOutlineBookOpen} color="gold" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Info */}
        <Card>
          <Card.Header><Card.Title>Department Info</Card.Title></Card.Header>
          <div className="space-y-3 text-sm">
            {department.description && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Description</p>
                <p className="text-gray-700 dark:text-gray-300">{department.description}</p>
              </div>
            )}
            {department.hod && (
              <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-dark-border">
                <span className="text-gray-500">HoD</span>
                <div className="flex items-center gap-2">
                  <Avatar src={department.hod.avatar} name={getFullName(department.hod)} size="xs" />
                  <span className="font-medium text-gray-900 dark:text-white">{getFullName(department.hod)}</span>
                </div>
              </div>
            )}
            {department.contactEmail && (
              <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="font-medium text-gray-900 dark:text-white">{department.contactEmail}</span></div>
            )}
            {department.contactPhone && (
              <div className="flex justify-between"><span className="text-gray-500">Phone</span><span className="font-medium text-gray-900 dark:text-white">{department.contactPhone}</span></div>
            )}
          </div>

          {/* Semester Breakdown */}
          {semesterBreakdown.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-dark-border">
              <p className="text-xs font-medium text-gray-500 mb-2">Students by Semester</p>
              <div className="space-y-1.5">
                {semesterBreakdown.map((sb) => (
                  <div key={sb.semester} className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Semester {sb.semester}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-100 dark:bg-dark-card rounded-full overflow-hidden">
                        <div className="h-full bg-primary-500 rounded-full" style={{ width: `${Math.min(100, (sb.count / (stats.totalStudents || 1)) * 100)}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-gray-900 dark:text-white w-6 text-right">{sb.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Teachers */}
        <Card>
          <Card.Header><Card.Title>Teachers ({teachers.length})</Card.Title></Card.Header>
          {teachers.length > 0 ? (
            <div className="space-y-2">
              {teachers.map((t) => (
                <div key={t._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-card transition-colors">
                  <Avatar src={t.avatar} name={getFullName(t)} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{getFullName(t)}</p>
                    <p className="text-xs text-gray-400 truncate">{t.email}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-gray-400 text-center py-4">No teachers</p>}
        </Card>

        {/* Programs */}
        <Card>
          <Card.Header><Card.Title>Programs ({programs.length})</Card.Title></Card.Header>
          {programs.length > 0 ? (
            <div className="space-y-2">
              {programs.map((p) => (
                <div key={p._id} className="p-3 rounded-lg bg-gray-50 dark:bg-dark-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.code} • {p.degreeType}</p>
                    </div>
                    <Badge variant="info" size="xs">{p.totalSemesters} Sem</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-gray-400 text-center py-4">No programs</p>}
        </Card>
      </div>
    </div>
  );
};

export default DepartmentDetail;