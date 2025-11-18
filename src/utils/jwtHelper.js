const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Generate JWT token
 */
const generateToken = (payload) => {
  return jwt.sign(payload, SECRET_KEY, { expiresIn: '24h' });
};

/**
 * Verify JWT token
 */
const verifyToken = (token) => {
  return jwt.verify(token, SECRET_KEY);
};

module.exports = {
  generateToken,
  verifyToken
};
