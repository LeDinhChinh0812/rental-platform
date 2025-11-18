const express = require('express');
const router = express.Router();
const supportTicketController = require('../controllers/supportTicketController');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');

// User routes
router.post('/', authenticate, supportTicketController.createTicket);
router.get('/my', authenticate, supportTicketController.getMyTickets);
router.get('/:id', authenticate, supportTicketController.getTicketById);

// AppOwner routes
router.get('/', authenticate, authorize('AppOwner'), supportTicketController.getAllTickets);
router.put('/:id/resolve', authenticate, authorize('AppOwner'), supportTicketController.resolveTicket);
router.get('/status/filter', authenticate, authorize('AppOwner'), supportTicketController.getTicketsByStatus);
router.get('/stats/count', authenticate, authorize('AppOwner'), supportTicketController.getTicketStats);

module.exports = router;
