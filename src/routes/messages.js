const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const authenticate = require('../middlewares/authenticate');

// All authenticated users can use messaging
router.post('/', authenticate, messageController.sendMessage);
router.get('/conversations', authenticate, messageController.getConversationList);
router.get('/conversation/:otherUserId', authenticate, messageController.getConversation);
router.get('/unread-count', authenticate, messageController.getUnreadCount);

module.exports = router;
