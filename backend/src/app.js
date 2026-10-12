import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import hpp from 'hpp';

import { generalLimiter } from './middleware/rateLimiter.middleware.js';
import errorHandler from './middleware/errorHandler.middleware.js';
import ApiError from './utils/ApiError.js';
import { HTTP_STATUS } from './utils/constants.js';
import routes from './routes/index.js';

const app = express();

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

// ─── SECURITY MIDDLEWARE ──────────────────────────────────────
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
  })
);

// ─── CORS ─────────────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// ─── RATE LIMITING ────────────────────────────────────────────
app.use('/api', generalLimiter);

// ─── BODY PARSING ─────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ─── COMPRESSION ─────────────────────────────────────────────
app.use(compression());

// ─── MANUAL NOSQL INJECTION SANITIZATION ─────────────────────
// Replaces express-mongo-sanitize (incompatible with Express 5)
const sanitizeValue = (value) => {
  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      if (key.startsWith('$') || key.includes('.')) {
        delete value[key];
      } else {
        sanitizeValue(value[key]);
      }
    }
  }
  return value;
};

app.use((req, _res, next) => {
  if (req.body) sanitizeValue(req.body);
  if (req.params) sanitizeValue(req.params);
  next();
});

// ─── HPP ──────────────────────────────────────────────────────
app.use(
  hpp({
    whitelist: ['sort', 'fields', 'page', 'limit', 'semester', 'role'],
  })
);

// ─── LOGGING ─────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ─── HEALTH CHECK ────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: '🎓 IRAS Backend is running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
    version: '1.0.0',
  });
});

// ─── API ROUTES ───────────────────────────────────────────────
app.use('/api/v1', routes);

// ─── 404 HANDLER ─────────────────────────────────────────────
app.all('/{*path}', (req, _res, next) => {
  next(
    new ApiError(
      HTTP_STATUS.NOT_FOUND,
      `Route ${req.originalUrl} not found on this server`
    )
  );
});

// ─── GLOBAL ERROR HANDLER ────────────────────────────────────
app.use(errorHandler);

export default app;