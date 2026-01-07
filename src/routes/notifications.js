const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');

// User routes
router.get('/my', authenticate, notificationController.getMyNotifications);
router.get('/unread', authenticate, notificationController.getUnreadNotifications);
router.put('/:id/read', authenticate, notificationController.markAsRead);
router.put('/read-all', authenticate, notificationController.markAllAsRead);
router.delete('/:id', authenticate, notificationController.deleteNotification);

// System/Admin routes
router.post('/', authenticate, authorize('AppOwner'), notificationController.sendNotification);

module.exports = router;
