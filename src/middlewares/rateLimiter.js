/**
 * Middleware: rateLimiter.js
 * Chức năng: Giới hạn số lượng request từ mỗi IP
 * Chống spam, brute force, và DDoS attacks
 */

const rateLimit = require('express-rate-limit');

/**
 * General API Rate Limiter
 * Giới hạn: 100 requests / 15 phút
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100, // Tối đa 100 requests
  message: {
    error: 'Quá nhiều request từ IP này. Vui lòng thử lại sau 15 phút.'
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
  // Skip successful requests
  skipSuccessfulRequests: false,
  // Skip failed requests
  skipFailedRequests: false
});

/**
 * Auth Rate Limiter (stricter)
 * Giới hạn: 5 login attempts / 15 phút
 * Chống brute force attack
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 5, // Tối đa 5 login attempts
  message: {
    error: 'Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 15 phút.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Chỉ count failed requests
  skipSuccessfulRequests: true
});

/**
 * Registration Rate Limiter
 * Giới hạn: 3 registrations / 1 giờ
 */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 giờ
  max: 3, // Tối đa 3 đăng ký
  message: {
    error: 'Quá nhiều tài khoản được tạo từ IP này. Vui lòng thử lại sau 1 giờ.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Password Reset Limiter
 * Giới hạn: 3 requests / 1 giờ
 */
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 giờ
  max: 3,
  message: {
    error: 'Quá nhiều yêu cầu đặt lại mật khẩu. Vui lòng thử lại sau 1 giờ.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Payment Limiter
 * Giới hạn: 10 payments / 1 phút
 */
const paymentLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 phút
  max: 10,
  message: {
    error: 'Quá nhiều giao dịch thanh toán. Vui lòng thử lại sau 1 phút.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Export Limiter
 * Giới hạn: 5 exports / 5 phút
 */
const exportLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 phút
  max: 5,
  message: {
    error: 'Quá nhiều yêu cầu export. Vui lòng thử lại sau 5 phút.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Search Limiter
 * Giới hạn: 30 searches / 1 phút
 */
const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 phút
  max: 30,
  message: {
    error: 'Quá nhiều tìm kiếm. Vui lòng thử lại sau 1 phút.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  generalLimiter,
  authLimiter,
  registerLimiter,
  passwordResetLimiter,
  paymentLimiter,
  exportLimiter,
  searchLimiter
};
