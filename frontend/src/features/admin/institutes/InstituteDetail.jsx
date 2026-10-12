import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  HiOutlineArrowLeft,
  HiOutlinePencilSquare,
  HiOutlineBuildingOffice2,
  HiOutlineUsers,
  HiOutlineUserGroup,
  HiOutlineAcademicCap,
} from 'react-icons/hi2';
import api from '../../../utils/axios';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import StatsCard from '../../../components/ui/StatsCard';
import Avatar from '../../../components/ui/Avatar';
import Spinner from '../../../components/ui/Spinner';
import { formatDate, getFullName } from '../../../utils/helpers';
import toast from 'react-hot-toast';

const InstituteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [institute, setInstitute] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInstitute = async () => {
      try {
        const res = await api.get(`/institutes/${id}`);
        setInstitute(res.data.data.institute);
      } catch {
        toast.error('Failed to load institute');
        navigate('/admin/institutes');
      } finally {
        setLoading(false);
      }
    };
    fetchInstitute();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!institute) return null;

  const stats = institute.stats || {};

  return (
    <div className="space-y-6 animate-[fade-in_0.3s_ease-out]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/institutes')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card text-gray-500 transition-colors"
          >
            <HiOutlineArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{institute.name}</h1>
              <Badge variant={institute.isActive ? 'success' : 'danger'} size="sm" dot>
                {institute.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Code: {institute.code} {institute.shortName && `• ${institute.shortName}`}
            </p>
          </div>
        </div>
        <Button icon={HiOutlinePencilSquare} variant="secondary" onClick={() => navigate(`/admin/institutes/${id}/edit`)}>
          Edit Institute
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Departments" value={stats.totalDepartments || 0} icon={HiOutlineBuildingOffice2} color="primary" />
        <StatsCard title="Students" value={stats.totalStudents || 0} icon={HiOutlineUsers} color="success" />
        <StatsCard title="Teachers" value={stats.totalTeachers || 0} icon={HiOutlineUserGroup} color="warning" />
        <StatsCard title="HoDs" value={stats.totalHoDs || 0} icon={HiOutlineAcademicCap} color="purple" />
      </div>

      {/* Info + Departments Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Institute Info */}
        <Card>
          <Card.Header>
            <Card.Title>Institute Information</Card.Title>
          </Card.Header>
          <div className="space-y-3 text-sm">
            {institute.description && (
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs font-medium mb-1">Description</p>
                <p className="text-gray-700 dark:text-gray-300">{institute.description}</p>
              </div>
            )}
            {institute.vision && (
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs font-medium mb-1">Vision</p>
                <p className="text-gray-700 dark:text-gray-300">{institute.vision}</p>
              </div>
            )}
            {institute.contactEmail && (
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Email</span>
                <span className="text-gray-900 dark:text-white font-medium">{institute.contactEmail}</span>
              </div>
            )}
            {institute.contactPhone && (
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Phone</span>
                <span className="text-gray-900 dark:text-white font-medium">{institute.contactPhone}</span>
              </div>
            )}
            {institute.establishedYear && (
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Established</span>
                <span className="text-gray-900 dark:text-white font-medium">{institute.establishedYear}</span>
              </div>
            )}
            {institute.director && (
              <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-dark-border">
                <span className="text-gray-500 dark:text-gray-400">Director</span>
                <div className="flex items-center gap-2">
                  <Avatar src={institute.director?.avatar} name={getFullName(institute.director)} size="xs" />
                  <span className="text-gray-900 dark:text-white font-medium text-sm">
                    {getFullName(institute.director)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Departments List */}
        <Card className="lg:col-span-2">
          <Card.Header>
            <Card.Title>Departments ({institute.departments?.length || 0})</Card.Title>
          </Card.Header>
          <div className="space-y-2">
            {(institute.departments || []).length > 0 ? (
              institute.departments.map((dept) => (
                <div
                  key={dept._id}
                  onClick={() => navigate(`/admin/departments/${dept._id}`)}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-dark-card hover:bg-gray-100 dark:hover:bg-dark-hover transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center shrink-0">
                      <HiOutlineBuildingOffice2 className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{dept.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Code: {dept.code}
                        {dept.hod && ` • HoD: ${getFullName(dept.hod)}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    {dept.stats && (
                      <>
                        <div className="text-center hidden sm:block">
                          <p className="text-sm font-bold text-emerald-600">{dept.stats.totalStudents}</p>
                          <p className="text-[10px] text-gray-400">Students</p>
                        </div>
                        <div className="text-center hidden sm:block">
                          <p className="text-sm font-bold text-amber-600">{dept.stats.totalTeachers}</p>
                          <p className="text-[10px] text-gray-400">Teachers</p>
                        </div>
                      </>
                    )}
                    <Badge variant={dept.isActive ? 'success' : 'danger'} size="xs">
                      {dept.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400 text-center py-6">No departments found</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default InstituteDetail;