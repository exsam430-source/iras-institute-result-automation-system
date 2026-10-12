import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlinePencilSquare, HiOutlineEnvelope, HiOutlinePhone, HiOutlineIdentification } from 'react-icons/hi2';
import api from '../../../utils/axios';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Avatar from '../../../components/ui/Avatar';
import Spinner from '../../../components/ui/Spinner';
import { getFullName, formatDate } from '../../../utils/helpers';
import { ROLE_LABELS, ROLE_COLORS } from '../../../utils/constants';
import toast from 'react-hot-toast';

const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get(`/users/${id}`);
        setUser(res.data.data.user);
        setStudentProfile(res.data.data.studentProfile);
      } catch {
        toast.error('Failed to load user');
        navigate('/admin/users');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id, navigate]);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!user) return null;

  return (
    <div className="space-y-6 animate-[fade-in_0.3s_ease-out]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/users')} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card text-gray-500">
            <HiOutlineArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{getFullName(user)}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={ROLE_COLORS[user.role]} size="sm">{ROLE_LABELS[user.role]}</Badge>
              <Badge variant={user.isActive ? 'success' : 'danger'} size="xs" dot>{user.isActive ? 'Active' : 'Inactive'}</Badge>
            </div>
          </div>
        </div>
        <Button icon={HiOutlinePencilSquare} variant="secondary" onClick={() => navigate(`/admin/users/${id}/edit`)}>Edit User</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <div className="text-center">
            <Avatar src={user.avatar} name={getFullName(user)} size="2xl" className="mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{getFullName(user)}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{ROLE_LABELS[user.role]}</p>
          </div>

          <div className="mt-6 space-y-3 text-sm">
            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
              <HiOutlineEnvelope className="w-4 h-4 shrink-0" />
              <span className="truncate">{user.email}</span>
            </div>
            {user.phone && (
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                <HiOutlinePhone className="w-4 h-4 shrink-0" />
                <span>{user.phone}</span>
              </div>
            )}
            {user.cnic && (
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                <HiOutlineIdentification className="w-4 h-4 shrink-0" />
                <span>{user.cnic}</span>
              </div>
            )}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <Card.Header><Card.Title>Details</Card.Title></Card.Header>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-sm">
            {[
              ['Gender', user.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1) : 'N/A'],
              ['Date of Birth', user.dateOfBirth ? formatDate(user.dateOfBirth) : 'N/A'],
              ['Institute', user.institute?.name || 'N/A'],
              ['Department', user.department?.name || 'N/A'],
              ['Email Verified', user.isEmailVerified ? 'Yes' : 'No'],
              ['Last Login', user.lastLogin ? formatDate(user.lastLogin) : 'Never'],
              ['Created', formatDate(user.createdAt)],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-gray-500 dark:text-gray-400 text-xs font-medium mb-0.5">{label}</p>
                <p className="text-gray-900 dark:text-white font-medium">{value}</p>
              </div>
            ))}
          </div>

          {user.address && (user.address.city || user.address.district) && (
            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-dark-border">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Address</p>
              <p className="text-sm text-gray-900 dark:text-white">
                {[user.address.street, user.address.city, user.address.district, user.address.province, user.address.country].filter(Boolean).join(', ')}
              </p>
            </div>
          )}

          {studentProfile && (
            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-dark-border">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">Student Profile</p>
              <div className="grid grid-cols-2 gap-y-3 gap-x-8 text-sm">
                <div><p className="text-gray-400 text-xs">Roll Number</p><p className="font-semibold text-gray-900 dark:text-white">{studentProfile.rollNumber}</p></div>
                <div><p className="text-gray-400 text-xs">Reg Number</p><p className="font-semibold text-gray-900 dark:text-white">{studentProfile.registrationNumber}</p></div>
                <div><p className="text-gray-400 text-xs">Program</p><p className="font-medium">{studentProfile.program?.name}</p></div>
                <div><p className="text-gray-400 text-xs">Session</p><p className="font-medium">{studentProfile.session?.name}</p></div>
                <div><p className="text-gray-400 text-xs">Semester</p><p className="font-medium">Semester {studentProfile.currentSemester}</p></div>
                <div><p className="text-gray-400 text-xs">CGPA</p><p className="font-bold text-primary-600">{studentProfile.cumulativeGPA?.toFixed(2) || '0.00'}</p></div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default UserDetail;