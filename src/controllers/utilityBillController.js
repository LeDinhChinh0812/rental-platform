const UtilityBill = require('../models/UtilityBill');
const Contract = require('../models/Contract');

// Tạo utility bill (Landlord)
exports.createUtilityBill = async (req, res) => {
  try {
    const { contractId, billType, previousReading, currentReading, unitPrice, billMonth } = req.body;
    const userId = req.user.userId;

    // Validate input
    if (!contractId || !billType || !currentReading || !unitPrice || !billMonth) {
      return res.status(400).json({ 
        error: 'ContractID, BillType, CurrentReading, UnitPrice và BillMonth là bắt buộc' 
      });
    }

    // Check contract exists
    const contract = await Contract.getById(contractId);
    if (!contract) {
      return res.status(404).json({ error: 'Không tìm thấy hợp đồng' });
    }

    // Check ownership
    const Property = require('../models/Property');
    const Room = require('../models/Room');
    const room = await Room.getById(contract.RoomID);
    if (!room) {
    return res.status(404).json({ error: 'Không tìm thấy phòng' });
}

    const property = await Property.getById(room.PropertyID);
    if (!property) {
    return res.status(404).json({ error: 'Không tìm thấy nhà' });
}

    const landlordId = await Property.getLandlordIdByUserId(userId);
    if (property.LandlordID !== landlordId) {
    return res.status(403).json({
    error: 'Bạn không có quyền tạo hóa đơn cho hợp đồng này'
  });
}

    // Tính total amount
    const usage = currentReading - (previousReading || 0);
    const totalAmount = usage * unitPrice;

    const bill = await UtilityBill.create({
      contractId,
      billType,
      previousReading: previousReading || 0,
      currentReading,
      unitPrice,
      totalAmount,
      billMonth,
      status: 'Pending'
    });

    res.status(201).json({
      message: 'Tạo hóa đơn thành công',
      billId: bill.id,
      usage,
      totalAmount
    });
  } catch (error) {
    console.error('Create utility bill error:', error);
    res.status(500).json({ error: 'Lỗi khi tạo hóa đơn' });
  }
};

// Lấy tất cả utility bills (AppOwner)
exports.getAllUtilityBills = async (req, res) => {
  try {
    const bills = await UtilityBill.getAll();
    res.json({ utilityBills: bills });
  } catch (error) {
    console.error('Get all utility bills error:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách hóa đơn' });
  }
};

// Lấy utility bill theo ID
exports.getUtilityBillById = async (req, res) => {
  try {
    const { id } = req.params;
    const bill = await UtilityBill.getById(id);

    if (!bill) {
      return res.status(404).json({ error: 'Không tìm thấy hóa đơn' });
    }

    res.json({ utilityBill: bill });
  } catch (error) {
    console.error('Get utility bill error:', error);
    res.status(500).json({ error: 'Lỗi khi lấy thông tin hóa đơn' });
  }
};

// Lấy utility bills theo Contract
exports.getUtilityBillsByContract = async (req, res) => {
  try {
    const { contractId } = req.params;
    const bills = await UtilityBill.getByContract(contractId);
    res.json({ utilityBills: bills });
  } catch (error) {
    console.error('Get utility bills by contract error:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách hóa đơn' });
  }
};

// Lấy utility bills chưa thanh toán
exports.getUnpaidUtilityBills = async (req, res) => {
  try {
    const { contractId } = req.query;
    
    if (!contractId) {
      return res.status(400).json({ error: 'ContractID là bắt buộc' });
    }

    const bills = await UtilityBill.getUnpaid(contractId);
    res.json({ unpaidBills: bills });
  } catch (error) {
    console.error('Get unpaid utility bills error:', error);
    res.status(500).json({ error: 'Lỗi khi lấy hóa đơn chưa thanh toán' });
  }
};

// Thanh toán utility bill (Tenant)
exports.payUtilityBill = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const bill = await UtilityBill.getById(id);
    if (!bill) {
      return res.status(404).json({ error: 'Không tìm thấy hóa đơn' });
    }

    // Check tenant có quyền không
    const tenantId = await Contract.getTenantIdByUserId(userId);
    const contract = await Contract.getById(bill.ContractID);
    
    if (contract.TenantID !== tenantId) {
      return res.status(403).json({ 
        error: 'Bạn không có quyền thanh toán hóa đơn này' 
      });
    }

    if (bill.Status === 'Paid') {
      return res.status(400).json({ error: 'Hóa đơn đã được thanh toán' });
    }

    await UtilityBill.updateStatus(id, 'Paid');

    res.json({ message: 'Thanh toán hóa đơn thành công' });
  } catch (error) {
    console.error('Pay utility bill error:', error);
    res.status(500).json({ error: 'Lỗi khi thanh toán hóa đơn' });
  }
};

// Xóa utility bill (Landlord)
exports.deleteUtilityBill = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const bill = await UtilityBill.getById(id);
    if (!bill) {
      return res.status(404).json({ error: 'Không tìm thấy hóa đơn' });
    }

    // Check ownership
    const Room = require('../models/Room');
    const Property = require('../models/Property');
    const contract = await Contract.getById(bill.ContractID);

    const room = await Room.getById(contract.RoomID);
    if (!room) {
    return res.status(404).json({ error: 'Không tìm thấy phòng' });
}

    const property = await Property.getById(room.PropertyID);
    if (!property) {
    return res.status(404).json({ error: 'Không tìm thấy nhà' });
}

    const landlordId = await Property.getLandlordIdByUserId(userId);
    if (property.LandlordID !== landlordId) {
    return res.status(403).json({
    error: 'Bạn không có quyền xóa hóa đơn này'
  });
}

    await UtilityBill.delete(id);

    res.json({ message: 'Xóa hóa đơn thành công' });
  } catch (error) {
    console.error('Delete utility bill error:', error);
    res.status(500).json({ error: 'Lỗi khi xóa hóa đơn' });
  }
};
