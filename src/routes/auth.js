const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// ⭐ THÊM 2 DÒNG NÀY (optional)
const { validateUserRegistration } = require('../middlewares/validate');
const { registerLimiter, authLimiter } = require('../middlewares/rateLimiter');

// Register với validation và rate limiting
router.post('/register', 
  registerLimiter,              
  validateUserRegistration,     
  authController.register
);

// Login với rate limiting
router.post('/login', 
  authLimiter,                  
  authController.login
);

module.exports = router;
