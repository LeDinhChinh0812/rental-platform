const Contract = require('../models/Contract');
const Room = require('../models/Room');
const Notification = require('../models/Notification');
const Transaction = require('../models/Transaction');

// Tạo hợp đồng mới
exports.createContract = async (req, res) => {
  try {
    const { roomId, tenantId, startDate, endDate, monthlyRent, deposit } = req.body;

    // Validate input
    if (!roomId || !tenantId || !startDate || !endDate || !monthlyRent) {
      return res.status(400).json({ 
        error: 'RoomID, TenantID, StartDate, EndDate và MonthlyRent là bắt buộc' 
      });
    }

    // Check room availability
    const room = await Room.getById(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Không tìm thấy phòng' });
    }
    if (room.Status !== 'Available') {
      return res.status(400).json({ error: 'Phòng không còn trống' });
    }

    // Create contract
    const contract = await Contract.create({
      roomId,
      tenantId,
      startDate,
      endDate,
      monthlyRent,
      deposit: deposit || 0,
      status: 'Pending'
    });

    // Update room status
    await Room.updateStatus(roomId, 'Rented');

    // Create transaction for deposit (platform fee 10%)
    if (deposit && deposit > 0) {
      const feeAmount = deposit * 0.1; // 10% platform fee
      await Transaction.create({
        contractId: contract.id,
        paymentId: null,
        type: 'Deposit',
        amount: deposit,
        feePercentage: 10.00,
        description: `Deposit for contract ${contract.id}`
      });
    }

    // Send notification to tenant
    const Contract = require('../models/Contract');
    const tenantUserId = await Contract.getTenantIdByUserId(tenantId); // Lấy UserID

    await Notification.create({
    userId: tenantUserId,  
    title: 'Hợp đồng mới được tạo',
    message: `Hợp đồng thuê phòng ${room.RoomNumber} đã được tạo. Vui lòng xem xét và ký.`,
    type: 'Contract',
    relatedId: contract.id
});

    res.status(201).json({
      message: 'Tạo hợp đồng thành công',
      contractId: contract.id
    });
  } catch (error) {
    console.error('Create contract error:', error);
    res.status(500).json({ error: 'Lỗi khi tạo hợp đồng' });
  }
};

// Lấy tất cả hợp đồng
exports.getAllContracts = async (req, res) => {
  try {
    const contracts = await Contract.getAll();
    res.json({ contracts });
  } catch (error) {
    console.error('Get all contracts error:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách hợp đồng' });
  }
};

// Lấy hợp đồng theo ID
exports.getContractById = async (req, res) => {
  try {
    const { id } = req.params;
    const contract = await Contract.getById(id);

    if (!contract) {
      return res.status(404).json({ error: 'Không tìm thấy hợp đồng' });
    }

    res.json({ contract });
  } catch (error) {
    console.error('Get contract error:', error);
    res.status(500).json({ error: 'Lỗi khi lấy thông tin hợp đồng' });
  }
};

// Lấy hợp đồng của user (Tenant hoặc Landlord)
exports.getMyContracts = async (req, res) => {
  try {
    const userId = req.user.userId;
    const role = req.user.role;
    let contracts;
      if (role === 'Tenant') {
      const tenantId = await Contract.getTenantIdByUserId(userId);
      if (!tenantId) {
        return res.status(404).json({ error: 'Không tìm thấy thông tin Tenant' });
      }
      contracts = await Contract.getByTenant(tenantId);
    } else if (role === 'Landlord') {
      
      const Property = require('../models/Property');
      const landlordId = await Property.getLandlordIdByUserId(userId);
      if (!landlordId) {
        return res.status(404).json({ error: 'Không tìm thấy thông tin Landlord' });
      }
      contracts = await Contract.getByLandlord(landlordId);
    } else {
      return res.status(403).json({ error: 'Không có quyền truy cập' });
    }

    res.json({ contracts });
  } catch (error) {
    console.error('Get my contracts error:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách hợp đồng' });
  }
};

// Cập nhật trạng thái hợp đồng
exports.updateContractStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status là bắt buộc' });
    }

    await Contract.updateStatus(id, status);

    // If contract is terminated, update room status
    if (status === 'Terminated' || status === 'Expired') {
      const contract = await Contract.getById(id);
      if (contract) {
        await Room.updateStatus(contract.RoomID, 'Available');
      }
    }

    res.json({ message: 'Cập nhật trạng thái hợp đồng thành công' });
  } catch (error) {
    console.error('Update contract status error:', error);
    res.status(500).json({ error: 'Lỗi khi cập nhật trạng thái' });
  }
};

// Chấm dứt hợp đồng
exports.terminateContract = async (req, res) => {
  try {
    const { id } = req.params;

    const contract = await Contract.getById(id);
    if (!contract) {
      return res.status(404).json({ error: 'Không tìm thấy hợp đồng' });
    }

    await Contract.updateStatus(id, 'Terminated');
    await Room.updateStatus(contract.RoomID, 'Available');

    res.json({ message: 'Chấm dứt hợp đồng thành công' });
  } catch (error) {
    console.error('Terminate contract error:', error);
    res.status(500).json({ error: 'Lỗi khi chấm dứt hợp đồng' });
  }
};
