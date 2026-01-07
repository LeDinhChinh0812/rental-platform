
/**
 * Custom Error Class
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error Handler Middleware
 * Đặt ở cuối app.js, sau tất cả routes
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error ra console (development)
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Error:', {
      name: err.name,
      message: err.message,
      stack: err.stack,
      statusCode: err.statusCode
    });
  }

  // SQL Server errors
  if (err.number) {
    switch (err.number) {
      case 2601: // Duplicate key
      case 2627:
        error.message = 'Dữ liệu đã tồn tại trong hệ thống';
        error.statusCode = 409;
        break;
      
      case 547: // Foreign key constraint
        error.message = 'Không thể xóa do có dữ liệu liên quan';
        error.statusCode = 409;
        break;
      
      case 515: // Cannot insert NULL
        error.message = 'Thiếu dữ liệu bắt buộc';
        error.statusCode = 400;
        break;
      
      case 8152: // String truncation
        error.message = 'Dữ liệu quá dài';
        error.statusCode = 400;
        break;
      
      default:
        error.message = 'Lỗi database';
        error.statusCode = 500;
    }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Token không hợp lệ';
    error.statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Token đã hết hạn';
    error.statusCode = 401;
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    error.message = 'Dữ liệu không hợp lệ';
    error.statusCode = 400;
  }

  // Cast errors (invalid ID)
  if (err.name === 'CastError') {
    error.message = 'ID không hợp lệ';
    error.statusCode = 400;
  }

  // Default error
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Lỗi server nội bộ';

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      details: err 
    })
  });
};

/**
 * 404 Not Found Handler
 * Đặt trước errorHandler trong app.js
 */
const notFoundHandler = (req, res, next) => {
  const error = new AppError(
    `Không tìm thấy đường dẫn: ${req.originalUrl}`,
    404
  );
  next(error);
};

/**
 * Async Handler - Wrap async functions
 * Tự động catch errors trong async functions
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  AppError,
  errorHandler,
  notFoundHandler,
  asyncHandler
};
