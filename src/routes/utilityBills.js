const express = require('express');
const router = express.Router();
const utilityBillController = require('../controllers/utilityBillController');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');

// Landlord routes
router.post('/', authenticate, authorize('Landlord'), utilityBillController.createUtilityBill);
router.delete('/:id', authenticate, authorize('Landlord'), utilityBillController.deleteUtilityBill);

// Tenant routes
router.put('/:id/pay', authenticate, authorize('Tenant'), utilityBillController.payUtilityBill);

// Shared routes
router.get('/contract/:contractId', authenticate, utilityBillController.getUtilityBillsByContract);
router.get('/unpaid', authenticate, utilityBillController.getUnpaidUtilityBills);
router.get('/:id', authenticate, utilityBillController.getUtilityBillById);

// AppOwner routes
router.get('/', authenticate, authorize('AppOwner'), utilityBillController.getAllUtilityBills);

module.exports = router;
