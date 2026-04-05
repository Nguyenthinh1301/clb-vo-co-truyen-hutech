/**
 * Centralized Error Handling Middleware
 * Xử lý tất cả các lỗi trong ứng dụng
 */

const logger = require('../services/loggerService');

// Custom Error Classes
class AppError extends Error {
  constructor(message, statusCode, errorCode = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Xác thực thất bại') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Không có quyền truy cập') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Không tìm thấy tài nguyên') {
    super(message, 404, 'NOT_FOUND');
  }
}

class ConflictError extends AppError {
  constructor(message = 'Dữ liệu đã tồn tại') {
    super(message, 409, 'CONFLICT_ERROR');
  }
}

class DatabaseError extends AppError {
  constructor(message = 'Lỗi cơ sở dữ liệu') {
    super(message, 500, 'DATABASE_ERROR');
  }
}

// Error Handler Middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.stack = err.stack;

  // Log error
  logger.error(`Error: ${error.message}`, {
    error: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'ID không hợp lệ';
    error = new NotFoundError(message);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Dữ liệu đã tồn tại';
    error = new ConflictError(message);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    error = new ValidationError('Dữ liệu không hợp lệ', errors);
  }

  // Rate limiting errors
  if (err.statusCode === 429 || err.message?.includes('Too many requests')) {
    const retryAfter = err.retryAfter || 900; // 15 minutes default
    res.set('Retry-After', retryAfter);
    error = new AppError('Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau.', 429, 'RATE_LIMIT_EXCEEDED');
  }

  // MySQL errors
  if (err.code === 'ER_DUP_ENTRY') {
    error = new ConflictError('Dữ liệu đã tồn tại');
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    error = new ValidationError('Tham chiếu không hợp lệ');
  }

  // MSSQL errors
  if (err.code === 'EREQUEST' && err.number) {
    if (err.number === 2627) { // Unique constraint violation
      error = new ConflictError('Dữ liệu đã tồn tại');
    } else if (err.number === 547) { // Foreign key constraint
      error = new ValidationError('Tham chiếu không hợp lệ');
    } else {
      error = new DatabaseError(`Lỗi cơ sở dữ liệu: ${err.message}`);
    }
  }

  // Connection errors
  if (err.code === 'ECONNREFUSED') {
    error = new DatabaseError('Không thể kết nối đến cơ sở dữ liệu');
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new AuthenticationError('Token không hợp lệ');
  }

  if (err.name === 'TokenExpiredError') {
    error = new AuthenticationError('Token đã hết hạn');
  }

  // Default error response
  const statusCode = error.statusCode || 500;
  const response = {
    success: false,
    error: {
      message: error.message || 'Lỗi máy chủ',
      code: error.errorCode || 'INTERNAL_SERVER_ERROR'
    }
  };

  // Add validation errors if present
  if (error.errors) {
    response.error.errors = error.errors;
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.error.stack = error.stack;
  }

  res.status(statusCode).json(response);
};

// Async handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// 404 handler
const notFound = (req, res, next) => {
  const error = new NotFoundError(`Không tìm thấy - ${req.originalUrl}`);
  next(error);
};

module.exports = {
  errorHandler,
  asyncHandler,
  notFound,
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError
};
