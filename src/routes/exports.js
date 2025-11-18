const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');

// PDF Exports
router.get('/contract/:id/pdf', authenticate, exportController.exportContractPDF);
router.get('/payment/:id/pdf', authenticate, exportController.exportPaymentPDF);

// Excel Exports
router.get('/payments/excel', authenticate, exportController.exportPaymentsExcel);

// AppOwner only
router.get('/transactions/excel', authenticate, authorize('AppOwner'), exportController.exportTransactionsExcel);
router.get('/revenue/pdf', authenticate, authorize('AppOwner'), exportController.exportRevenueReportPDF);
router.get('/revenue/excel', authenticate, authorize('AppOwner'), exportController.exportRevenueReportExcel);

module.exports = router;
