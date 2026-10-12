import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { storage } from '../utils/helpers';
import { SOCKET_URL } from '../utils/constants';
import toast from 'react-hot-toast';

// ─── SINGLE GLOBAL SOCKET INSTANCE ───────────────────────────
// Keeps one connection alive across re-renders
let socketInstance = null;
let isConnecting = false;

export const getSocket = () => socketInstance;

const useSocket = (isAuthenticated) => {
  const mountedRef = useRef(false);

  const connect = useCallback(() => {
    const token = storage.get('accessToken');

    // Don't connect if: no token, not authenticated, already connecting, or already connected
    if (!token || !isAuthenticated) return;
    if (isConnecting) return;
    if (socketInstance?.connected) return;

    isConnecting = true;

    socketInstance = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
      // ✅ These prevent duplicate connections in React StrictMode
      forceNew: false,
      multiplex: true,
    });

    socketInstance.on('connect', () => {
      isConnecting = false;
      console.log('🔌 Socket connected:', socketInstance.id);
    });

    socketInstance.on('connected', (data) => {
      console.log('✅ Socket authenticated:', data.role);
    });

    // ─── NOTIFICATION EVENTS ──────────────────────────────
    socketInstance.on('notification:new', (notification) => {
      const icons = {
        'midterm-marks-entered': '📊',
        'finals-marks-entered': '🎯',
        'result-approved': '✅',
        'result-rejected': '↩️',
        'semester-promoted': '🎓',
        'course-assigned': '📋',
        'result-submitted-to-hod': '📤',
        announcement: '📢',
      };

      const icon = icons[notification.type] || '🔔';

      toast.success(`${icon} ${notification.title}`, {
        duration: 6000,
        style: { maxWidth: '380px', fontSize: '13px' },
      });

      window.dispatchEvent(
        new CustomEvent('notification:new', { detail: notification })
      );
    });

    socketInstance.on('notification:count', (data) => {
      window.dispatchEvent(
        new CustomEvent('notification:count', { detail: data })
      );
    });

    socketInstance.on('semester:promoted', (data) => {
      toast.success(
        `🎓 Promoted to Semester ${data.toSemester}! CGPA: ${data.cumulativeGPA}`,
        { duration: 8000 }
      );
    });

    socketInstance.on('marks:approved', () => {
      toast.success('✅ Your result has been officially approved!', {
        duration: 6000,
      });
    });

    socketInstance.on('marks:midterm-available', (data) => {
      toast(`📊 Mid-term marks recorded for ${data.courseName || 'a course'}`, {
        duration: 5000,
        icon: '📊',
      });
      window.dispatchEvent(new CustomEvent('notification:new', { detail: data }));
    });

    socketInstance.on('marks:finals-available', (data) => {
      toast(`🎯 Complete marks available for ${data.courseName || 'a course'}`, {
        duration: 5000,
        icon: '🎯',
      });
      window.dispatchEvent(new CustomEvent('notification:new', { detail: data }));
    });

    socketInstance.on('result:submitted', (data) => {
      toast(`📤 Result submitted: ${data.courseName || ''}`, {
        duration: 5000,
        icon: '📤',
      });
      window.dispatchEvent(new CustomEvent('notification:new', { detail: data }));
    });

    socketInstance.on('result:rejected', (data) => {
      toast.error(`↩️ Result returned for correction: ${data.courseName || ''}`, {
        duration: 7000,
      });
      window.dispatchEvent(new CustomEvent('notification:new', { detail: data }));
    });

    socketInstance.on('course:assigned', (data) => {
      toast(`📋 New course assigned: ${data.courseName || ''}`, {
        duration: 6000,
        icon: '📋',
      });
      window.dispatchEvent(new CustomEvent('notification:new', { detail: data }));
    });

    socketInstance.on('system:announcement', (data) => {
      toast(`📢 ${data.title || 'Announcement'}: ${data.message || ''}`, {
        duration: 8000,
        icon: '📢',
      });
    });

    // ─── CONNECTION EVENTS ────────────────────────────────
    socketInstance.on('disconnect', (reason) => {
      isConnecting = false;
      // Only log, don't show toast for normal disconnects
      if (reason !== 'io client disconnect' && reason !== 'io server disconnect') {
        console.log('🔌 Socket disconnected:', reason);
      }
    });

    socketInstance.on('connect_error', (err) => {
      isConnecting = false;
      console.warn('Socket connection error (will retry):', err.message);
    });

    socketInstance.on('reconnect', (attempt) => {
      console.log('🔄 Socket reconnected after', attempt, 'attempts');
    });

  }, [isAuthenticated]);

  const disconnect = useCallback(() => {
    if (socketInstance) {
      socketInstance.disconnect();
      socketInstance = null;
      isConnecting = false;
    }
  }, []);

  useEffect(() => {
    // ✅ Prevent double execution in React StrictMode
    if (mountedRef.current) return;
    mountedRef.current = true;

    if (isAuthenticated) {
      // Small delay to prevent rapid connect/disconnect on page load
      const timer = setTimeout(() => {
        connect();
      }, 500);
      return () => {
        clearTimeout(timer);
        mountedRef.current = false;
      };
    } else {
      disconnect();
      return () => {
        mountedRef.current = false;
      };
    }
  }, [isAuthenticated, connect, disconnect]);

  const emit = useCallback((event, data) => {
    if (socketInstance?.connected) {
      socketInstance.emit(event, data);
    }
  }, []);

  const on = useCallback((event, handler) => {
    if (socketInstance) {
      socketInstance.on(event, handler);
    }
  }, []);

  const off = useCallback((event, handler) => {
    if (socketInstance) {
      socketInstance.off(event, handler);
    }
  }, []);

  return { socket: socketInstance, connect, disconnect, emit, on, off };
};

export default useSocket;