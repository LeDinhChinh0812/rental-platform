const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');

// AppOwner only routes
router.get('/', authenticate, authorize('AppOwner'), transactionController.getAllTransactions);
router.get('/revenue', authenticate, authorize('AppOwner'), transactionController.getTotalRevenue);
router.get('/revenue/monthly', authenticate, authorize('AppOwner'), transactionController.getRevenueByMonth);
router.get('/occupancy', authenticate, authorize('AppOwner'), transactionController.getRoomOccupancyRate);
router.get('/contracts/monthly', authenticate, authorize('AppOwner'), transactionController.getContractsByMonth);
router.get('/dashboard', authenticate, authorize('AppOwner'), transactionController.getDashboardStats);
router.get('/date-range', authenticate, authorize('AppOwner'), transactionController.getTransactionsByDateRange);
router.get('/:id', authenticate, authorize('AppOwner'), transactionController.getTransactionById);

module.exports = router;
