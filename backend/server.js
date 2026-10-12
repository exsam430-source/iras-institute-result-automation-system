import 'dotenv/config';
import http from 'http';
import { validateEnv } from './src/utils/validateEnv.js';
import app from './src/app.js';
import connectDB from './src/config/database.js';
import { initSocket } from './src/config/socket.js';
import { verifyEmailConnection } from './src/config/email.js';

// Validate environment variables before starting
validateEnv();

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialize Socket.IO with handler
initSocket(server);

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Verify email connection (non-blocking)
    verifyEmailConnection().catch(() => {
      console.warn('⚠️  Email service not available - email notifications disabled');
    });

    // Start HTTP server
    server.listen(PORT, () => {
      console.log('\n🚀 ═══════════════════════════════════════════════════');
      console.log('🎓  IRAS Backend - University of Swat');
      console.log('═════════════════════════════════════════════════════');
      console.log(`🌍  Environment  : ${process.env.NODE_ENV}`);
      console.log(`🔗  Server URL   : http://localhost:${PORT}`);
      console.log(`📡  API Base URL : http://localhost:${PORT}/api/v1`);
      console.log(`❤️   Health Check : http://localhost:${PORT}/health`);
      console.log(`🔌  Socket.IO    : ws://localhost:${PORT}`);
      console.log('═════════════════════════════════════════════════════\n');
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
      } else {
        console.error('❌ Server error:', err);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n⚠️  ${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log('🔴 HTTP server closed');
    process.exit(0);
  });
  setTimeout(() => {
    console.error('❌ Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err.message);
  gracefulShutdown('unhandledRejection');
});
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  process.exit(1);
});

startServer();