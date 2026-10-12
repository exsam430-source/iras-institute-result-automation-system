import { useState, useEffect } from 'react';
import { HiOutlineUsers } from 'react-icons/hi2';
import api from '../../../utils/axios';
import useAuth from '../../../hooks/useAuth';
import Card from '../../../components/ui/Card';
import Avatar from '../../../components/ui/Avatar';
import Badge from '../../../components/ui/Badge';
import Spinner from '../../../components/ui/Spinner';
import EmptyState from '../../../components/ui/EmptyState';
import { getFullName } from '../../../utils/helpers';
import toast from 'react-hot-toast';

const HoDTeachers = () => {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get(`/departments/${user?.department?._id}/teachers?limit=50`);
        setTeachers(res.data.data.teachers || []);
      } catch { toast.error('Failed'); }
      finally { setLoading(false); }
    };
    if (user?.department?._id) fetch();
  }, [user]);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6 animate-[fade-in_0.3s_ease-out]">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Department Teachers</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{teachers.length} teachers in your department</p>
      </div>
      {teachers.length === 0 ? <EmptyState icon={HiOutlineUsers} title="No Teachers" /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teachers.map((t) => (
            <Card key={t._id} className="flex items-center gap-4">
              <Avatar src={t.avatar} name={getFullName(t)} size="lg" />
              <div className="min-w-0">
                <p className="font-bold text-gray-900 dark:text-white truncate">{getFullName(t)}</p>
                <p className="text-sm text-gray-500 truncate">{t.email}</p>
                {t.phone && <p className="text-xs text-gray-400 mt-1">{t.phone}</p>}
                <Badge variant={t.gender === 'female' ? 'purple' : 'info'} size="xs" className="mt-1">{t.gender || 'N/A'}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default HoDTeachers;