import { Server } from 'socket.io';
import { initSocketHandler } from '../socket/socket.handler.js';

let io;

const isAllowedOrigin = (origin) => {
  if (!origin) return true;

  const allowedOrigins = [
    process.env.CLIENT_URL,
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:5175',
  ].filter(Boolean);

  if (allowedOrigins.includes(origin)) return true;

  try {
    const { hostname, port } = new URL(origin);
    return ['localhost', '127.0.0.1'].includes(hostname) && /^\d+$/.test(port);
  } catch {
    return false;
  }
};

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    maxHttpBufferSize: 1e6, // 1MB
  });

  // Initialize all socket event handlers
  initSocketHandler(io);

  console.log('✅ Socket.IO initialized with authentication middleware');
  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initSocket first.');
  }
  return io;
};

// ─── SEND TO SPECIFIC USER ────────────────────────────────────
export const sendToUser = (userId, event, data) => {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, {
    ...data,
    timestamp: new Date(),
  });
};

// ─── SEND TO ROOM ─────────────────────────────────────────────
export const sendToRoom = (roomId, event, data) => {
  if (!io) return;
  io.to(roomId).emit(event, {
    ...data,
    timestamp: new Date(),
  });
};

// ─── BROADCAST TO ALL ─────────────────────────────────────────
export const broadcast = (event, data) => {
  if (!io) return;
  io.emit(event, { ...data, timestamp: new Date() });
};

export default { initSocket, getIO, sendToUser, sendToRoom, broadcast };