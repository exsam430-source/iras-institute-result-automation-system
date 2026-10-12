import rateLimit from 'express-rate-limit';
import { HTTP_STATUS } from '../utils/constants.js';

export const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
    message: 'Too many requests from this IP, please try again after 15 minutes',
    timestamp: new Date().toISOString(),
  },
  handler: (req, res, _next, options) => {
    res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json(options.message);
  },
  skip: (req) => req.path === '/health',
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
    message: 'Too many login attempts, please try again after 15 minutes',
    timestamp: new Date().toISOString(),
  },
  handler: (req, res, _next, options) => {
    res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json(options.message);
  },
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: {
    success: false,
    statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
    message: 'Too many upload requests, please try again after 1 hour',
    timestamp: new Date().toISOString(),
  },
  handler: (req, res, _next, options) => {
    res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json(options.message);
  },
});