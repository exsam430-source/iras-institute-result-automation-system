import ApiError from '../utils/ApiError.js';
import { HTTP_STATUS } from '../utils/constants.js';

const errorHandler = (err, req, res, _next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Error:', {
      message: err.message,
      stack: err.stack,
      statusCode: error.statusCode,
    });
  }

  // MongoDB CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    const message = `Resource not found with id: ${err.value}`;
    error = new ApiError(HTTP_STATUS.NOT_FOUND, message);
  }

  // MongoDB Duplicate Key Error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `${field.charAt(0).toUpperCase() + field.slice(1)} '${value}' already exists`;
    error = new ApiError(HTTP_STATUS.CONFLICT, message);
  }

  // MongoDB Validation Error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    const message = 'Validation failed';
    error = new ApiError(HTTP_STATUS.BAD_REQUEST, message, errors);
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    error = new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid token. Please login again.');
  }

  if (err.name === 'TokenExpiredError') {
    error = new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Token expired. Please login again.');
  }

  // Multer Errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      error = new ApiError(HTTP_STATUS.BAD_REQUEST, 'File size is too large');
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      error = new ApiError(HTTP_STATUS.BAD_REQUEST, 'Unexpected file field');
    } else {
      error = new ApiError(HTTP_STATUS.BAD_REQUEST, err.message);
    }
  }

  res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    success: false,
    statusCode: error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR,
    message: error.message || 'Internal Server Error',
    errors: error.errors || [],
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    timestamp: new Date().toISOString(),
  });
};

export default errorHandler;