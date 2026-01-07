/**
 * Middleware: validate.js
 * Chức năng: Validate input data trước khi đến controller
 * Tránh SQL injection, XSS, và dữ liệu không hợp lệ
 */

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number (Việt Nam: 10 số, bắt đầu 0)
const isValidPhone = (phone) => {
  const phoneRegex = /^0\d{9}$/;
  return phoneRegex.test(phone);
};

// Validate password (tối thiểu 6 ký tự)
const isValidPassword = (password) => {
  return password && password.length >= 6;
};

// Validate role
const isValidRole = (role) => {
  const validRoles = ['Tenant', 'Landlord', 'AppOwner'];
  return validRoles.includes(role);
};

// Validate positive number
const isPositiveNumber = (value) => {
  return !isNaN(value) && parseFloat(value) > 0;
};

// Validate date format (YYYY-MM-DD)
const isValidDate = (dateString) => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

// Sanitize string (xóa ký tự đặc biệt nguy hiểm)
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str.replace(/[<>\"']/g, ''); // Xóa <, >, ", '
};

/**
 * Middleware: Validate User Registration
 */
const validateUserRegistration = (req, res, next) => {
  const { name, email, password, phone, role } = req.body;

  // Kiểm tra required fields
  if (!name || !email || !password || !role) {
    return res.status(400).json({
      error: 'Thiếu thông tin bắt buộc',
      required: ['name', 'email', 'password', 'role']
    });
  }

  // Validate email
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Email không hợp lệ' });
  }

  // Validate password
  if (!isValidPassword(password)) {
    return res.status(400).json({ error: 'Password phải có ít nhất 6 ký tự' });
  }

  // Validate role
  if (!isValidRole(role)) {
    return res.status(400).json({ 
      error: 'Role không hợp lệ',
      allowedRoles: ['Tenant', 'Landlord', 'AppOwner']
    });
  }

  // Validate phone (optional)
  if (phone && !isValidPhone(phone)) {
    return res.status(400).json({ error: 'Số điện thoại không hợp lệ (10 số, bắt đầu 0)' });
  }

  // Sanitize inputs
  req.body.name = sanitizeString(name);
  req.body.email = email.trim().toLowerCase();

  next();
};

/**
 * Middleware: Validate Contract Creation
 */
const validateContractCreation = (req, res, next) => {
  const { roomId, tenantId, startDate, endDate, monthlyRent } = req.body;

  // Required fields
  if (!roomId || !tenantId || !startDate || !endDate || !monthlyRent) {
    return res.status(400).json({
      error: 'Thiếu thông tin bắt buộc',
      required: ['roomId', 'tenantId', 'startDate', 'endDate', 'monthlyRent']
    });
  }

  // Validate IDs
  if (!Number.isInteger(roomId) || roomId <= 0) {
    return res.status(400).json({ error: 'roomId phải là số nguyên dương' });
  }

  if (!Number.isInteger(tenantId) || tenantId <= 0) {
    return res.status(400).json({ error: 'tenantId phải là số nguyên dương' });
  }

  // Validate dates
  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    return res.status(400).json({ error: 'Ngày không hợp lệ (định dạng: YYYY-MM-DD)' });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (end <= start) {
    return res.status(400).json({ error: 'Ngày kết thúc phải sau ngày bắt đầu' });
  }

  // Validate monthly rent
  if (!isPositiveNumber(monthlyRent)) {
    return res.status(400).json({ error: 'monthlyRent phải là số dương' });
  }

  next();
};

/**
 * Middleware: Validate Payment Creation
 */
const validatePaymentCreation = (req, res, next) => {
  const { contractId, amount, paymentMethod } = req.body;

  // Required fields
  if (!contractId || !amount || !paymentMethod) {
    return res.status(400).json({
      error: 'Thiếu thông tin bắt buộc',
      required: ['contractId', 'amount', 'paymentMethod']
    });
  }

  // Validate contractId
  if (!Number.isInteger(contractId) || contractId <= 0) {
    return res.status(400).json({ error: 'contractId phải là số nguyên dương' });
  }

  // Validate amount
  if (!isPositiveNumber(amount)) {
    return res.status(400).json({ error: 'amount phải là số dương' });
  }

  // Validate payment method
  const validMethods = ['Cash', 'BankTransfer', 'Momo', 'ZaloPay', 'VNPay'];
  if (!validMethods.includes(paymentMethod)) {
    return res.status(400).json({ 
      error: 'Phương thức thanh toán không hợp lệ',
      validMethods
    });
  }

  next();
};

/**
 * Middleware: Validate Property Creation
 */
const validatePropertyCreation = (req, res, next) => {
  const { name, address } = req.body;

  if (!name || !address) {
    return res.status(400).json({
      error: 'Thiếu thông tin bắt buộc',
      required: ['name', 'address']
    });
  }

  // Sanitize
  req.body.name = sanitizeString(name);
  req.body.address = sanitizeString(address);

  next();
};

/**
 * Middleware: Validate Room Creation
 */
const validateRoomCreation = (req, res, next) => {
  const { propertyId, roomNumber, price, area } = req.body;

  if (!propertyId || !roomNumber || !price) {
    return res.status(400).json({
      error: 'Thiếu thông tin bắt buộc',
      required: ['propertyId', 'roomNumber', 'price']
    });
  }

  if (!Number.isInteger(propertyId) || propertyId <= 0) {
    return res.status(400).json({ error: 'propertyId phải là số nguyên dương' });
  }

  if (!isPositiveNumber(price)) {
    return res.status(400).json({ error: 'price phải là số dương' });
  }

  if (area && !isPositiveNumber(area)) {
    return res.status(400).json({ error: 'area phải là số dương' });
  }

  next();
};

module.exports = {
  validateUserRegistration,
  validateContractCreation,
  validatePaymentCreation,
  validatePropertyCreation,
  validateRoomCreation,
  
  // Export các helper functions
  isValidEmail,
  isValidPhone,
  isValidPassword,
  isValidRole,
  isPositiveNumber,
  sanitizeString
};
