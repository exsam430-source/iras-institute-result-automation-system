import { useState, useEffect, useCallback } from 'react';
import {
  HiOutlineBell,
  HiOutlineCheckCircle,
  HiOutlineTrash,
  HiOutlineCheck,
} from 'react-icons/hi2';
import api from '../../utils/axios';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import Spinner from '../../components/ui/Spinner';
import { timeAgo, cn } from '../../utils/helpers';
import { MARKS_PHASE_COLORS } from '../../utils/constants';
import toast from 'react-hot-toast';

const typeIcons = {
  'midterm-marks-entered': '📊',
  'finals-marks-entered': '🎯',
  'result-submitted-to-hod': '📤',
  'result-approved': '✅',
  'result-rejected': '↩️',
  'course-assigned': '📋',
  'semester-promoted': '🎓',
  announcement: '📢',
  system: '⚙️',
  'award-list-ready': '📝',
};

const typeBadge = {
  'midterm-marks-entered': 'info',
  'finals-marks-entered': 'warning',
  'result-submitted-to-hod': 'purple',
  'result-approved': 'success',
  'result-rejected': 'danger',
  'course-assigned': 'primary',
  'semester-promoted': 'success',
  announcement: 'warning',
  system: 'default',
};

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications', {
        params: { page, limit: 15 },
      });
      setNotifications(res.data.data.notifications || []);
      setUnreadCount(res.data.data.unreadCount || 0);
      setPagination(res.data.data.pagination || {});
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === id ? { ...n, isRead: true, readAt: new Date() } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      toast.error('Failed');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All marked as read');
    } catch {
      toast.error('Failed');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      toast.success('Deleted');
    } catch {
      toast.error('Failed');
    }
  };

  if (loading && page === 1) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-[fade-in_0.3s_ease-out]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Notifications
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {unreadCount > 0
              ? `${unreadCount} unread notification(s)`
              : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="secondary"
            size="sm"
            icon={HiOutlineCheckCircle}
            onClick={handleMarkAllRead}
          >
            Mark All Read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={HiOutlineBell}
          title="No Notifications"
          description="You're all caught up! New notifications will appear here."
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => (
            <Card
              key={notif._id}
              padding={false}
              className={cn(
                'transition-all duration-200',
                !notif.isRead && 'border-l-4 border-l-primary-500'
              )}
            >
              <div className="flex items-start gap-4 p-4">
                {/* Icon */}
                <div className="text-2xl shrink-0 mt-0.5">
                  {typeIcons[notif.type] || '🔔'}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p
                        className={cn(
                          'text-sm truncate',
                          notif.isRead
                            ? 'font-medium text-gray-700 dark:text-gray-300'
                            : 'font-bold text-gray-900 dark:text-white'
                        )}
                      >
                        {notif.title}
                      </p>
                      <Badge
                        variant={typeBadge[notif.type] || 'default'}
                        size="xs"
                        className="mt-1"
                      >
                        {notif.type?.replace(/-/g, ' ')}
                      </Badge>
                    </div>
                    <span className="text-[11px] text-gray-400 shrink-0 whitespace-nowrap">
                      {timeAgo(notif.createdAt)}
                    </span>
                  </div>

                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
                    {notif.message}
                  </p>

                  {/* Marks data if available */}
                  {notif.data?.grade && (
                    <div className="flex items-center gap-3 mt-2 text-xs">
                      {notif.data.totalMarks && (
                        <span className="text-gray-500">
                          Marks: <strong>{notif.data.totalMarks}/100</strong>
                        </span>
                      )}
                      <span
                        className={cn(
                          'font-bold px-2 py-0.5 rounded',
                          notif.data.grade === 'F'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-emerald-100 text-emerald-700'
                        )}
                      >
                        {notif.data.grade}
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-3">
                    {!notif.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(notif._id)}
                        className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-medium flex items-center gap-1"
                      >
                        <HiOutlineCheck className="w-3.5 h-3.5" /> Mark read
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notif._id)}
                      className="text-xs text-red-500 hover:underline font-medium flex items-center gap-1"
                    >
                      <HiOutlineTrash className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          <Pagination
            page={pagination.page || page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={15}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;