import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import Notification from '../models/Notification.model.js';
import StudentProfile from '../models/StudentProfile.model.js';
import { CLIENT_EVENTS, SERVER_EVENTS, ROOMS } from './socket.events.js';
import { ROLES } from '../utils/constants.js';

// ─── CONNECTED USERS STORE ────────────────────────────────────
const connectedUsers = new Map(); // userId → { socketId, role, rooms }
const socketToUser = new Map(); // socketId → userId

// ─── AUTHENTICATE SOCKET ──────────────────────────────────────
const authenticateSocket = async (socket) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '') ||
      socket.handshake.query?.token;

    if (!token) {
      throw new Error('No authentication token provided');
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    const user = await User.findById(decoded.id)
      .select('firstName lastName email role department institute isActive avatar')
      .populate('department', '_id name code')
      .populate('institute', '_id name code')
      .lean();

    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    return user;
  } catch (error) {
    throw new Error(`Authentication failed: ${error.message}`);
  }
};

// ─── GET ROLE-BASED AUTO ROOMS ────────────────────────────────
const getRoleBasedRooms = (user) => {
  const rooms = [ROOMS.userRoom(user._id.toString())];

  switch (user.role) {
    case ROLES.SUPER_ADMIN:
    case ROLES.ADMIN:
      rooms.push(ROOMS.adminRoom());
      if (user.institute?._id) {
        rooms.push(ROOMS.instituteRoom(user.institute._id.toString()));
      }
      break;

    case ROLES.DIRECTOR:
      if (user.institute?._id) {
        rooms.push(ROOMS.instituteRoom(user.institute._id.toString()));
      }
      break;

    case ROLES.HOD:
      if (user.department?._id) {
        rooms.push(ROOMS.hodRoom(user.department._id.toString()));
        rooms.push(
          ROOMS.departmentRoom(user.department._id.toString())
        );
      }
      if (user.institute?._id) {
        rooms.push(ROOMS.instituteRoom(user.institute._id.toString()));
      }
      break;

    case ROLES.TEACHER:
      if (user.department?._id) {
        rooms.push(
          ROOMS.teacherRoom(user.department._id.toString())
        );
        rooms.push(
          ROOMS.departmentRoom(user.department._id.toString())
        );
      }
      break;

    case ROLES.STUDENT:
      if (user.department?._id) {
        rooms.push(
          ROOMS.departmentRoom(user.department._id.toString())
        );
      }
      break;

    default:
      break;
  }

  return rooms;
};

// ─── MAIN SOCKET HANDLER ──────────────────────────────────────
export const initSocketHandler = (io) => {
  // ─── AUTHENTICATION MIDDLEWARE ────────────────────────────
  io.use(async (socket, next) => {
    try {
      const user = await authenticateSocket(socket);
      socket.user = user;
      next();
    } catch (error) {
      next(new Error(error.message));
    }
  });

  // ─── CONNECTION EVENT ─────────────────────────────────────
  io.on('connection', async (socket) => {
    const user = socket.user;
    const userId = user._id.toString();

    // ✅ FIXED: Only log connections in development to reduce noise
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `🔌 ${user.firstName} ${user.lastName} (${user.role}) connected`
      );
    }

    // ─── STORE CONNECTION ─────────────────────────────────
    connectedUsers.set(userId, {
      socketId: socket.id,
      role: user.role,
      rooms: [],
      connectedAt: new Date(),
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
      },
    });
    socketToUser.set(socket.id, userId);

    // ─── JOIN ROLE-BASED ROOMS ────────────────────────────
    const autoRooms = getRoleBasedRooms(user);
    for (const room of autoRooms) {
      socket.join(room);
    }
    connectedUsers.get(userId).rooms = autoRooms;

    // ─── SEND WELCOME MESSAGE ─────────────────────────────
    socket.emit(SERVER_EVENTS.CONNECTED, {
      message: `Welcome, ${user.firstName}!`,
      userId,
      role: user.role,
      rooms: autoRooms,
      timestamp: new Date(),
    });

    // ─── SEND UNREAD NOTIFICATION COUNT ──────────────────
    try {
      const unreadCount = await Notification.getUnreadCount(user._id);
      socket.emit(SERVER_EVENTS.NOTIFICATION_COUNT, { count: unreadCount });
    } catch (_err) {}

    // ─── BROADCAST ONLINE COUNT (Admin only) ─────────────
    try {
      io.to(ROOMS.adminRoom()).emit(SERVER_EVENTS.ONLINE_COUNT, {
        count: connectedUsers.size,
      });
    } catch (_err) {}

    // ─── EVENT: JOIN CUSTOM ROOM ──────────────────────────
    socket.on(CLIENT_EVENTS.ROOM_JOIN, (roomId) => {
      if (roomId && typeof roomId === 'string') {
        socket.join(roomId);
        const userConn = connectedUsers.get(userId);
        if (userConn && !userConn.rooms.includes(roomId)) {
          userConn.rooms.push(roomId);
        }
      }
    });

    // ─── EVENT: LEAVE CUSTOM ROOM ─────────────────────────
    socket.on(CLIENT_EVENTS.ROOM_LEAVE, (roomId) => {
      if (roomId && typeof roomId === 'string') {
        socket.leave(roomId);
        const userConn = connectedUsers.get(userId);
        if (userConn) {
          userConn.rooms = userConn.rooms.filter((r) => r !== roomId);
        }
      }
    });

    // ─── EVENT: MARKS TYPING INDICATOR ───────────────────
    socket.on(CLIENT_EVENTS.MARKS_TYPING, ({ assignmentId }) => {
      if (assignmentId && user.role === ROLES.TEACHER) {
        socket
          .to(ROOMS.assignmentRoom(assignmentId))
          .emit('marks:teacher-typing', {
            teacherName: `${user.firstName} ${user.lastName}`,
            assignmentId,
          });
      }
    });

    // ─── EVENT: NOTIFICATION MARKED AS READ ──────────────
    socket.on(CLIENT_EVENTS.NOTIFICATION_READ, async ({ notificationId }) => {
      try {
        await Notification.findOneAndUpdate(
          { _id: notificationId, recipient: user._id },
          { isRead: true, readAt: new Date() }
        );

        const unreadCount = await Notification.getUnreadCount(user._id);
        socket.emit(SERVER_EVENTS.NOTIFICATION_COUNT, {
          count: unreadCount,
        });
      } catch (_err) {}
    });

    // ─── EVENT: ALL NOTIFICATIONS READ ───────────────────
    socket.on(CLIENT_EVENTS.NOTIFICATION_READ_ALL, async () => {
      try {
        await Notification.markAllAsRead(user._id);
        socket.emit(SERVER_EVENTS.NOTIFICATION_COUNT, { count: 0 });
      } catch (_err) {}
    });

    // ─── EVENT: PING / PONG ───────────────────────────────
    socket.on(CLIENT_EVENTS.PING, () => {
      socket.emit(SERVER_EVENTS.PONG, { timestamp: Date.now() });
    });

    // ─── EVENT: DISCONNECT ────────────────────────────────
    socket.on('disconnect', async (reason) => {
      // ✅ FIXED: Only log unexpected disconnects to reduce noise
      // 'transport close' = browser tab closed (normal)
      // 'client namespace disconnect' = client called socket.disconnect() (normal)
      if (
        reason !== 'transport close' &&
        reason !== 'client namespace disconnect'
      ) {
        console.log(
          `🔌 ${user.firstName} ${user.lastName} disconnected: ${reason}`
        );
      }

      // Cleanup
      connectedUsers.delete(userId);
      socketToUser.delete(socket.id);

      // Update online count for admins
      try {
        io.to(ROOMS.adminRoom()).emit(SERVER_EVENTS.ONLINE_COUNT, {
          count: connectedUsers.size,
        });
      } catch {}
    });

    // ─── ERROR HANDLING ───────────────────────────────────
    socket.on('error', (error) => {
      console.error(`Socket error for ${user.email}:`, error);
      socket.emit(SERVER_EVENTS.ERROR, {
        message: 'Socket error occurred',
        error: error.message,
      });
    });
  });

  console.log('✅ Socket.IO handler initialized');
};

// ─── UTILITY: Get connected user info ─────────────────────────
export const getConnectedUser = (userId) => {
  return connectedUsers.get(userId?.toString());
};

// ─── UTILITY: Check if user is online ─────────────────────────
export const isUserOnline = (userId) => {
  return connectedUsers.has(userId?.toString());
};

// ─── UTILITY: Get all online users count ──────────────────────
export const getOnlineCount = () => {
  return connectedUsers.size;
};

// ─── UTILITY: Get online users by role ────────────────────────
export const getOnlineUsersByRole = (role) => {
  const users = [];
  for (const [userId, data] of connectedUsers.entries()) {
    if (data.role === role) {
      users.push({ userId, ...data.user });
    }
  }
  return users;
};

// ─── EMIT TO SPECIFIC USER ────────────────────────────────────
export const emitToUser = (io, userId, event, data) => {
  const room = ROOMS.userRoom(userId.toString());
  io.to(room).emit(event, {
    ...data,
    timestamp: new Date(),
  });
};

// ─── EMIT TO DEPARTMENT ───────────────────────────────────────
export const emitToDepartment = (io, deptId, event, data) => {
  const room = ROOMS.departmentRoom(deptId.toString());
  io.to(room).emit(event, {
    ...data,
    timestamp: new Date(),
  });
};

// ─── EMIT TO ALL ADMINS ───────────────────────────────────────
export const emitToAdmins = (io, event, data) => {
  io.to(ROOMS.adminRoom()).emit(event, {
    ...data,
    timestamp: new Date(),
  });
};

// ─── EMIT TO HOD OF DEPARTMENT ────────────────────────────────
export const emitToHoD = (io, deptId, event, data) => {
  const room = ROOMS.hodRoom(deptId.toString());
  io.to(room).emit(event, {
    ...data,
    timestamp: new Date(),
  });
};