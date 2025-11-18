const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');

// Protected routes - Tenant
router.post('/', authenticate, authorize('Tenant'), paymentController.createPayment);

// Protected routes - Tenant or Landlord
router.get('/history', authenticate, paymentController.getPaymentHistory);
router.get('/contract/:contractId', authenticate, paymentController.getPaymentsByContract);

// Landlord only
router.get('/overdue', authenticate, authorize('Landlord'), paymentController.getOverduePayments);
router.get('/revenue', authenticate, authorize('Landlord'), paymentController.getLandlordRevenue);

// AppOwner only
router.get('/', authenticate, authorize('AppOwner'), paymentController.getAllPayments);
router.get('/:id', authenticate, authorize('AppOwner'), paymentController.getPaymentById);

module.exports = router;
