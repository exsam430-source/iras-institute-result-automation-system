import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineChartBarSquare,
  HiOutlineBuildingLibrary,
  HiOutlineBuildingOffice2,
  HiOutlineAcademicCap,
  HiOutlineCalendarDays,
  HiOutlineBookOpen,
  HiOutlineUsers,
  HiOutlineCog6Tooth,
  HiOutlineClipboardDocumentList,
  HiOutlineClipboardDocumentCheck,
  HiOutlineDocumentCheck,
  HiOutlineUserGroup,
  HiOutlineArrowUpCircle,
  HiOutlineDocumentText,
  HiOutlineArrowRightOnRectangle,
  HiOutlineChevronDoubleLeft,
  HiOutlineChevronDoubleRight,
  HiOutlineAcademicCap as HiOutlineGraduate,
   HiOutlineClock,
    HiOutlineDocumentArrowDown,
} from 'react-icons/hi2';
import { logout } from '../../features/auth/authSlice';
import useAuth from '../../hooks/useAuth';
import Avatar from '../ui/Avatar';
import { cn, getFullName } from '../../utils/helpers';
import { SIDEBAR_NAV, ROLE_LABELS } from '../../utils/constants';
import { storage } from '../../utils/helpers';

const iconMap = {
  HiOutlineChartBarSquare,
  HiOutlineBuildingLibrary,
  HiOutlineBuildingOffice2,
  HiOutlineAcademicCap,
  HiOutlineCalendarDays,
  HiOutlineBookOpen,
  HiOutlineUsers,
  HiOutlineCog6Tooth,
  HiOutlineClipboardDocumentList,
  HiOutlineClipboardDocumentCheck,
  HiOutlineDocumentCheck,
  HiOutlineUserGroup,
  HiOutlineArrowUpCircle,
  HiOutlineDocumentText,
  HiOutlineClock,
  HiOutlineDocumentArrowDown,
};

const Sidebar = ({ isOpen, onClose, isCollapsed, onToggleCollapse }) => {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const navItems = SIDEBAR_NAV[user?.role] || [];

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login', { replace: true });
  };

  const NavItem = ({ item }) => {
    const Icon = iconMap[item.icon] || HiOutlineChartBarSquare;

    return (
      <NavLink
        to={item.path}
        onClick={() => onClose?.()}
        className={({ isActive }) =>
          cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative',
            isCollapsed && 'justify-center px-2',
            isActive
              ? 'bg-primary-600 text-white shadow-sm shadow-primary-600/20'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-card hover:text-gray-900 dark:hover:text-white'
          )
        }
      >
        {({ isActive }) => (
          <>
            <Icon className="w-5 h-5 shrink-0" />
            {!isCollapsed && (
              <span className="truncate">{item.label}</span>
            )}
            {/* Tooltip when collapsed */}
            {isCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                {item.label}
              </div>
            )}
          </>
        )}
      </NavLink>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* ─── LOGO / HEADER ───────────────────────────────── */}
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-5 border-b border-gray-100 dark:border-dark-border shrink-0',
          isCollapsed && 'justify-center px-2'
        )}
      >
        <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
          <HiOutlineAcademicCap className="w-5 h-5 text-white" />
        </div>
        {!isCollapsed && (
          <div className="min-w-0">
            <h1 className="font-bold text-gray-900 dark:text-white text-sm leading-tight">
              IRAS
            </h1>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
              University of Swat
            </p>
          </div>
        )}
      </div>

      {/* ─── NAVIGATION ──────────────────────────────────── */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto no-scrollbar">
        {navItems.map((item) => (
          <NavItem key={item.path} item={item} />
        ))}
      </nav>

      {/* ─── BOTTOM SECTION ──────────────────────────────── */}
      <div className="border-t border-gray-100 dark:border-dark-border p-3 space-y-2 shrink-0">
        {/* Collapse toggle - Desktop only */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex items-center justify-center w-full py-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-card transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <HiOutlineChevronDoubleRight className="w-4 h-4" />
          ) : (
            <HiOutlineChevronDoubleLeft className="w-4 h-4" />
          )}
        </button>

        {/* User Info */}
        <div
          className={cn(
            'flex items-center gap-3 px-2 py-2 rounded-xl bg-gray-50 dark:bg-dark-card',
            isCollapsed && 'justify-center px-1'
          )}
        >
          <Avatar
            src={user?.avatar}
            name={getFullName(user)}
            size="sm"
            className="shrink-0"
          />
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate leading-tight">
                {getFullName(user)}
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                {ROLE_LABELS[user?.role]}
              </p>
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium',
            'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors',
            isCollapsed && 'justify-center px-2'
          )}
          title="Logout"
        >
          <HiOutlineArrowRightOnRectangle className="w-5 h-5 shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ─── MOBILE OVERLAY ──────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* ─── MOBILE SIDEBAR ──────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-y-0 left-0 z-50 w-[280px] bg-white dark:bg-dark-surface border-r border-gray-100 dark:border-dark-border lg:hidden shadow-xl"
          >
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ─── DESKTOP SIDEBAR ─────────────────────────────── */}
      <aside
        className={cn(
          'hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:z-30',
          'bg-white dark:bg-dark-surface border-r border-gray-100 dark:border-dark-border',
          'transition-all duration-300 ease-in-out',
          isCollapsed ? 'lg:w-[72px]' : 'lg:w-[260px]'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
};

export default Sidebar;