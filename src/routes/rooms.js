const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');

// Public routes
router.get('/', roomController.getAllRooms);
router.get('/available', roomController.getAvailableRooms);
router.get('/search', roomController.searchRooms);
router.get('/:id', roomController.getRoomById);
router.get('/property/:propertyId', roomController.getRoomsByProperty);

// Protected routes - Landlord only
router.post('/', authenticate, authorize('Landlord'), roomController.createRoom);
router.put('/:id', authenticate, authorize('Landlord'), roomController.updateRoom);
router.delete('/:id', authenticate, authorize('Landlord'), roomController.deleteRoom);

module.exports = router;
