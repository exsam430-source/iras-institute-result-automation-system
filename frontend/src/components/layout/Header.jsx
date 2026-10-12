import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineBars3,
  HiOutlineBell,
  HiOutlineMagnifyingGlass,
  HiOutlineUser,
  HiOutlineCog6Tooth,
  HiOutlineArrowRightOnRectangle,
  HiOutlineLockClosed,
} from 'react-icons/hi2';
import { logout } from '../../features/auth/authSlice';
import useAuth from '../../hooks/useAuth';
import ThemeToggle from '../ui/ThemeToggle';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import { cn, getFullName, timeAgo } from '../../utils/helpers';
import { ROLE_LABELS } from '../../utils/constants';
import api from '../../utils/axios';

const Header = ({ onMenuClick, title }) => {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  // ─── CLOSE DROPDOWNS ON OUTSIDE CLICK ────────────────────
  useEffect(() => {
    const handleClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfile(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ─── FETCH UNREAD COUNT ───────────────────────────────────
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await api.get('/notifications/unread-count');
        setUnreadCount(res.data.data.count || 0);
      } catch {
        // silent fail
      }
    };

    fetchUnread();

    // Listen for real-time notification count updates
    const handleCount = (e) => {
      setUnreadCount(e.detail?.count || 0);
    };

    // Listen for new notifications
    const handleNew = () => {
      setUnreadCount((prev) => prev + 1);
    };

    window.addEventListener('notification:count', handleCount);
    window.addEventListener('notification:new', handleNew);

    // Poll every 60 seconds as fallback
    const interval = setInterval(fetchUnread, 60000);

    return () => {
      window.removeEventListener('notification:count', handleCount);
      window.removeEventListener('notification:new', handleNew);
      clearInterval(interval);
    };
  }, []);

  // ─── FETCH RECENT NOTIFICATIONS ──────────────────────────
  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications?limit=5');
      setNotifications(res.data.data.notifications || []);
    } catch {
      // silent
    }
  };

  // ─── LOGOUT ───────────────────────────────────────────────
  const handleLogout = async () => {
    setShowProfile(false);
    await dispatch(logout());
    navigate('/login', { replace: true });
  };

  // ─── MARK ALL READ ────────────────────────────────────────
  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setUnreadCount(0);
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );
    } catch {
      // silent
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-white/80 dark:bg-dark-surface/80 backdrop-blur-xl border-b border-gray-100 dark:border-dark-border">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">

        {/* ─── LEFT ───────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card text-gray-500 transition-colors"
          >
            <HiOutlineBars3 className="w-5 h-5" />
          </button>

          {title && (
            <h1 className="text-lg font-bold text-gray-900 dark:text-white hidden sm:block">
              {title}
            </h1>
          )}
        </div>

        {/* ─── RIGHT ──────────────────────────────────────── */}
        <div className="flex items-center gap-1">

          {/* Search (Desktop) */}
          <button className="hidden md:flex p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card text-gray-500 dark:text-gray-400 transition-colors">
            <HiOutlineMagnifyingGlass className="w-5 h-5" />
          </button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications) fetchNotifications();
                setShowProfile(false);
              }}
              className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card text-gray-500 dark:text-gray-400 transition-colors"
            >
              <HiOutlineBell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-dark-surface rounded-xl shadow-modal border border-gray-100 dark:border-dark-border overflow-hidden"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-dark-border">
                    <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
                      Notifications
                    </h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-medium"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center">
                        <HiOutlineBell className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-400 dark:text-gray-500">
                          No notifications yet
                        </p>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif._id}
                          className={cn(
                            'px-4 py-3 border-b border-gray-50 dark:border-dark-border/50 hover:bg-gray-50 dark:hover:bg-dark-card transition-colors cursor-pointer',
                            !notif.isRead && 'bg-primary-50/50 dark:bg-primary-900/10'
                          )}
                        >
                          <div className="flex items-start gap-3">
                            {!notif.isRead && (
                              <span className="w-2 h-2 bg-primary-500 rounded-full mt-1.5 shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {notif.title}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                                {notif.message}
                              </p>
                              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                                {timeAgo(notif.createdAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setShowNotifications(false);
                      navigate('/notifications');
                    }}
                    className="w-full px-4 py-2.5 text-xs font-medium text-primary-600 dark:text-primary-400 hover:bg-gray-50 dark:hover:bg-dark-card transition-colors border-t border-gray-100 dark:border-dark-border"
                  >
                    View All Notifications
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-gray-200 dark:bg-dark-border mx-1 hidden sm:block" />

          {/* Profile Dropdown */}
          <div ref={profileRef} className="relative">
            <button
              onClick={() => {
                setShowProfile(!showProfile);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-card transition-colors"
            >
              <Avatar
                src={user?.avatar}
                name={getFullName(user)}
                size="sm"
              />
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
                  {getFullName(user)}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  {ROLE_LABELS[user?.role]}
                </p>
              </div>
            </button>

            {/* Profile Dropdown Menu */}
            <AnimatePresence>
              {showProfile && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-dark-surface rounded-xl shadow-modal border border-gray-100 dark:border-dark-border overflow-hidden"
                >
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-dark-border">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {getFullName(user)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                      {user?.email}
                    </p>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    <button
                      onClick={() => { setShowProfile(false); navigate('/profile'); }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-card transition-colors"
                    >
                      <HiOutlineUser className="w-4 h-4 text-gray-400" />
                      My Profile
                    </button>

                    <button
                      onClick={() => { setShowProfile(false); navigate('/change-password'); }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-card transition-colors"
                    >
                      <HiOutlineLockClosed className="w-4 h-4 text-gray-400" />
                      Change Password
                    </button>

                    <button
                      onClick={() => { setShowProfile(false); navigate('/notifications'); }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-card transition-colors"
                    >
                      <HiOutlineBell className="w-4 h-4 text-gray-400" />
                      Notifications
                    </button>

                    <button
                      onClick={() => { setShowProfile(false); navigate('/notifications/preferences'); }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-card transition-colors"
                    >
                      <HiOutlineCog6Tooth className="w-4 h-4 text-gray-400" />
                      Notification Preferences
                    </button>
                  </div>

                  {/* Logout */}
                  <div className="border-t border-gray-100 dark:border-dark-border py-1">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                    >
                      <HiOutlineArrowRightOnRectangle className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;