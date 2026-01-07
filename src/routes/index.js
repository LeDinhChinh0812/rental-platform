const express = require('express');
const router = express.Router();

// Import all route modules
const authRoutes = require('./auth');
const propertyRoutes = require('./properties');
const roomRoutes = require('./rooms');
const contractRoutes = require('./contracts');
const paymentRoutes = require('./payments');
const transactionRoutes = require('./transactions');
const utilityBillRoutes = require('./utilityBills');
const notificationRoutes = require('./notifications');
const messageRoutes = require('./messages');
const supportTicketRoutes = require('./supportTickets');
const exportRoutes = require('./exports');

// Mount routes
router.use('/auth', authRoutes);
router.use('/properties', propertyRoutes);
router.use('/rooms', roomRoutes);
router.use('/contracts', contractRoutes);
router.use('/payments', paymentRoutes);
router.use('/transactions', transactionRoutes);
router.use('/utility-bills', utilityBillRoutes);
router.use('/notifications', notificationRoutes);
router.use('/messages', messageRoutes);
router.use('/support-tickets', supportTicketRoutes);
router.use('/exports', exportRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

module.exports = router;
