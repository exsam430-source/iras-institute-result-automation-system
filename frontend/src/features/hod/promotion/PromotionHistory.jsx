import { useState, useEffect } from 'react';
import { HiOutlineArrowUpCircle } from 'react-icons/hi2';
import api from '../../../utils/axios';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Avatar from '../../../components/ui/Avatar';
import EmptyState from '../../../components/ui/EmptyState';
import Spinner from '../../../components/ui/Spinner';
import { getFullName, formatDateTime } from '../../../utils/helpers';
import toast from 'react-hot-toast';

const PromotionHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/promotion/history');
        setHistory(res.data.data.history || []);
      } catch {
        toast.error('Failed to load promotion history');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-[fade-in_0.3s_ease-out]">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Promotion History
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Log of all semester promotions
        </p>
      </div>

      {history.length === 0 ? (
        <EmptyState
          icon={HiOutlineArrowUpCircle}
          title="No Promotion History"
          description="Semester promotions will appear here after they are executed."
        />
      ) : (
        <div className="space-y-4">
          {history.map((h) => (
            <Card key={h._id}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center shrink-0">
                    <HiOutlineArrowUpCircle className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">
                      Semester {h.newData?.semester} Promotion
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      {formatDateTime(h.createdAt)}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {h.description}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-center">
                  <div>
                    <p className="text-xl font-bold text-emerald-600">
                      {h.newData?.promoted || 0}
                    </p>
                    <p className="text-xs text-gray-400">Promoted</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-purple-600">
                      {h.newData?.graduated || 0}
                    </p>
                    <p className="text-xs text-gray-400">Graduated</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-red-500">
                      {h.newData?.failed || 0}
                    </p>
                    <p className="text-xs text-gray-400">Errors</p>
                  </div>
                </div>
              </div>

              {h.user && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-dark-border flex items-center gap-2 text-sm text-gray-500">
                  <Avatar src={h.user.avatar} name={getFullName(h.user)} size="xs" />
                  <span>Initiated by <strong className="text-gray-900 dark:text-white">{getFullName(h.user)}</strong></span>
                  <Badge variant="info" size="xs">{h.user.role}</Badge>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PromotionHistory;