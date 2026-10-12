// ─── CLIENT → SERVER EVENTS ───────────────────────────────────
export const CLIENT_EVENTS = {
  // Connection
  USER_JOIN: 'user:join',
  USER_LEAVE: 'user:leave',

  // Rooms
  ROOM_JOIN: 'room:join',
  ROOM_LEAVE: 'room:leave',

  // Marks (Teacher real-time)
  MARKS_TYPING: 'marks:typing',
  MARKS_SAVED: 'marks:saved',

  // Notifications
  NOTIFICATION_READ: 'notification:read',
  NOTIFICATION_READ_ALL: 'notification:readAll',

  // Ping
  PING: 'ping',
};

// ─── SERVER → CLIENT EVENTS ───────────────────────────────────
export const SERVER_EVENTS = {
  // Connection
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  ERROR: 'error',

  // Notifications
  NOTIFICATION_NEW: 'notification:new',
  NOTIFICATION_COUNT: 'notification:count',

  // Marks
  MIDTERM_MARKS_AVAILABLE: 'marks:midterm-available',
  FINALS_MARKS_AVAILABLE: 'marks:finals-available',
  MARKS_APPROVED: 'marks:approved',
  MARKS_REJECTED: 'marks:rejected',

  // Results
  RESULT_SUBMITTED: 'result:submitted',
  RESULT_APPROVED: 'result:approved',
  RESULT_REJECTED: 'result:rejected',

  // Course Assignment
  COURSE_ASSIGNED: 'course:assigned',
  AWARD_LIST_READY: 'award-list:ready',

  // Promotion
  SEMESTER_PROMOTED: 'semester:promoted',

  // System
  ANNOUNCEMENT: 'system:announcement',
  MAINTENANCE: 'system:maintenance',
  ONLINE_COUNT: 'system:online-count',

  // Pong
  PONG: 'pong',
};

// ─── ROOM NAMES ───────────────────────────────────────────────
export const ROOMS = {
  // User-specific room (private)
  userRoom: (userId) => `user:${userId}`,

  // Department room
  departmentRoom: (deptId) => `department:${deptId}`,

  // Institute room
  instituteRoom: (instId) => `institute:${instId}`,

  // Course assignment room (teacher + HoD)
  assignmentRoom: (assignmentId) => `assignment:${assignmentId}`,

  // Role-based rooms
  adminRoom: () => 'role:admin',
  hodRoom: (deptId) => `hod:${deptId}`,
  teacherRoom: (deptId) => `teachers:${deptId}`,
};