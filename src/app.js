/**
 * app.js - Main Express Application
 * Rental Platform API v1.0.0
 */

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const routes = require('./routes');

// Import middleware mới
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');
const { generalLimiter } = require('./middlewares/rateLimiter');

const app = express();

// ========================================
// MIDDLEWARES
// ========================================

// 1. CORS - Allow cross-origin requests
app.use(cors());

// 2. Morgan - HTTP request logger (development)
app.use(morgan('dev'));

// 3. Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. Rate Limiter - Giới hạn request (100 req/15 phút)
app.use(generalLimiter);

// ========================================
// ROUTES
// ========================================

// Home route - API info
app.get('/', (req, res) => {
  res.json({
    message: 'Rental Platform API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      properties: '/api/properties',
      rooms: '/api/rooms',
      contracts: '/api/contracts',
      payments: '/api/payments',
      transactions: '/api/transactions',
      utilityBills: '/api/utility-bills',
      notifications: '/api/notifications',
      messages: '/api/messages',
      supportTickets: '/api/support-tickets',
      exports: '/api/exports'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api', routes);

// ========================================
// ERROR HANDLING
// ========================================

// 404 Not Found Handler (phải đặt sau tất cả routes)
app.use(notFoundHandler);

// Global Error Handler (phải đặt cuối cùng)
app.use(errorHandler);

// ========================================
// EXPORT
// ========================================

module.exports = app;
