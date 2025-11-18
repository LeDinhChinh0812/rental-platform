const express = require('express');
const router = express.Router();
const contractController = require('../controllers/contractController');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');

// Public routes (với authentication)
router.post('/', authenticate, contractController.createContract);
router.get('/my', authenticate, contractController.getMyContracts);
router.get('/:id', authenticate, contractController.getContractById);
router.put('/:id/status', authenticate, contractController.updateContractStatus);
router.put('/:id/terminate', authenticate, contractController.terminateContract);

// Admin routes
router.get('/', authenticate, authorize('AppOwner'), contractController.getAllContracts);

module.exports = router;
