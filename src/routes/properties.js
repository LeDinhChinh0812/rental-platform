const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');

// Public routes
router.get('/', propertyController.getAllProperties);
router.get('/search', propertyController.searchProperties);
router.get('/:id', propertyController.getPropertyById);

// Protected routes - Landlord only
router.post('/', authenticate, authorize('Landlord'), propertyController.createProperty);
router.get('/my/list', authenticate, authorize('Landlord'), propertyController.getMyProperties);
router.put('/:id', authenticate, authorize('Landlord'), propertyController.updateProperty);
router.delete('/:id', authenticate, authorize('Landlord'), propertyController.deleteProperty);

module.exports = router;
