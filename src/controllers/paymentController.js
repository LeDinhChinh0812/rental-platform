const Payment = require('../models/Payment');
const Contract = require('../models/Contract');
const Transaction = require('../models/Transaction');

// ⭐ Tạo payment mới (CORE BUSINESS LOGIC)
exports.createPayment = async (req, res) => {
  try {
    const { contractId, amount, paymentMethod } = req.body;
    const userId = req.user.userId;

    // Validate input
    if (!contractId || !amount || !paymentMethod) {
      return res.status(400).json({ 
        error: 'ContractID, Amount và PaymentMethod là bắt buộc' 
      });
    }

    // ⭐ LOGIC 1: Check contract có tồn tại không
    const contract = await Contract.getById(contractId);
    if (!contract) {
      return res.status(404).json({ error: 'Không tìm thấy hợp đồng' });
    }

    // ⭐ LOGIC 2: Check contract có active không
    if (contract.Status !== 'Active') {
      return res.status(400).json({ 
        error: 'Hợp đồng chưa được kích hoạt hoặc đã kết thúc' 
      });
    }

    // ⭐ LOGIC 3: Check tenant có quyền thanh toán không
    const tenantId = await Contract.getTenantIdByUserId(userId);
    if (contract.TenantID !== tenantId) {
      return res.status(403).json({ 
        error: 'Bạn không có quyền thanh toán cho hợp đồng này' 
      });
    }

    // ⭐ LOGIC 4: Tạo Payment
    const payment = await Payment.create({
      contractId,
      amount,
      paymentMethod,
      status: 'Completed'
    });

    // ⭐ LOGIC 5: Tính platform fee (10% theo .env)
    const platformFeePercentage = parseFloat(process.env.PLATFORM_FEE_PERCENT || 10) / 100;
    const platformFeeAmount = amount * platformFeePercentage;
    const landlordReceives = amount - platformFeeAmount;

    // ⭐ LOGIC 6: Tạo Transaction ghi nhận phí
    const platformFeeId = 1; // Hoặc query từ PlatformFees table
    await Transaction.create({
      contractId,
      platformFeeId,
      amount: platformFeeAmount,
      type: 'Payment'
    });

    res.status(201).json({
      message: 'Thanh toán thành công',
      paymentId: payment.id,
      breakdown: {
        totalAmount: amount,
        platformFee: platformFeeAmount,
        landlordReceives: landlordReceives
      }
    });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ error: 'Lỗi khi thanh toán' });
  }
};

// Lấy tất cả payments (AppOwner)
exports.getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.getAll();
    res.json({ payments });
  } catch (error) {
    console.error('Get all payments error:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách thanh toán' });
  }
};

// Lấy payment theo ID
exports.getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await Payment.getById(id);

    if (!payment) {
      return res.status(404).json({ error: 'Không tìm thấy thanh toán' });
    }

    res.json({ payment });
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({ error: 'Lỗi khi lấy thông tin thanh toán' });
  }
};

// Lấy payment history của Tenant
exports.getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const role = req.user.role;

    let payments;

    if (role === 'Tenant') {
      const tenantId = await Contract.getTenantIdByUserId(userId);
      payments = await Payment.getByTenant(tenantId);
    } else if (role === 'Landlord') {
      const Property = require('../models/Property');
      const landlordId = await Property.getLandlordIdByUserId(userId);
      payments = await Payment.getByLandlord(landlordId);
    } else {
      return res.status(403).json({ error: 'Không có quyền truy cập' });
    }

    res.json({ payments });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ error: 'Lỗi khi lấy lịch sử thanh toán' });
  }
};

// Lấy payments theo Contract
exports.getPaymentsByContract = async (req, res) => {
  try {
    const { contractId } = req.params;
    const payments = await Payment.getByContract(contractId);
    res.json({ payments });
  } catch (error) {
    console.error('Get payments by contract error:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách thanh toán' });
  }
};

// Lấy payments quá hạn (Landlord)
exports.getOverduePayments = async (req, res) => {
  try {
    const payments = await Payment.getOverdue();
    res.json({ overduePayments: payments });
  } catch (error) {
    console.error('Get overdue payments error:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách thanh toán quá hạn' });
  }
};

// Lấy tổng thu nhập của Landlord
exports.getLandlordRevenue = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { startDate, endDate } = req.query;

    const Property = require('../models/Property');
    const landlordId = await Property.getLandlordIdByUserId(userId);

    if (!landlordId) {
      return res.status(403).json({ error: 'Bạn không phải là Landlord' });
    }

    const revenue = await Payment.getTotalByLandlord(
      landlordId, 
      startDate || null, 
      endDate || null
    );

    res.json({ revenue });
  } catch (error) {
    console.error('Get landlord revenue error:', error);
    res.status(500).json({ error: 'Lỗi khi lấy doanh thu' });
  }
};
  