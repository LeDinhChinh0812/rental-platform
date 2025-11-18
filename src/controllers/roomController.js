const Room = require('../models/Room');
const Property = require('../models/Property');

// Tạo room mới
exports.createRoom = async (req, res) => {
  try {
    const { propertyId, roomNumber, price, area } = req.body;
    const userId = req.user.userId;

    // Validate input
    if (!propertyId || !roomNumber || !price || !area) {
      return res.status(400).json({ 
        error: 'PropertyID, RoomNumber, Price và Area là bắt buộc' 
      });
    }

    // ⭐ BUSINESS LOGIC 1: Check property có tồn tại không
    const property = await Property.getById(propertyId);
    if (!property) {
      return res.status(404).json({ error: 'Không tìm thấy nhà' });
    }

    // ⭐ BUSINESS LOGIC 2: Check landlord có sở hữu property không
    const landlordId = await Property.getLandlordIdByUserId(userId);
    if (property.LandlordID !== landlordId) {
      return res.status(403).json({ 
        error: 'Bạn không có quyền thêm phòng vào nhà này' 
      });
    }

    // ⭐ BUSINESS LOGIC 3: Check room number có trùng không
    const isDuplicate = await Room.isDuplicate(propertyId, roomNumber);
    if (isDuplicate) {
      return res.status(400).json({ 
        error: `Số phòng ${roomNumber} đã tồn tại trong nhà này` 
      });
    }

    const room = await Room.create({
      propertyId,
      roomNumber,
      price,
      area,
      status: 'Available'
    });

    res.status(201).json({
      message: 'Tạo phòng thành công',
      roomId: room.id
    });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ error: 'Lỗi khi tạo phòng' });
  }
};

// Lấy tất cả rooms
exports.getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.getAll();
    res.json({ rooms });
  } catch (error) {
    console.error('Get all rooms error:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách phòng' });
  }
};

// Lấy room theo ID
exports.getRoomById = async (req, res) => {
  try {
    const { id } = req.params;
    const room = await Room.getById(id);

    if (!room) {
      return res.status(404).json({ error: 'Không tìm thấy phòng' });
    }

    res.json({ room });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ error: 'Lỗi khi lấy thông tin phòng' });
  }
};

// Lấy phòng Available (Public route)
exports.getAvailableRooms = async (req, res) => {
  try {
    const rooms = await Room.getAvailable();
    res.json({ rooms });
  } catch (error) {
    console.error('Get available rooms error:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách phòng trống' });
  }
};

// Lấy rooms theo Property
exports.getRoomsByProperty = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const rooms = await Room.getByProperty(propertyId);
    res.json({ rooms });
  } catch (error) {
    console.error('Get rooms by property error:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách phòng' });
  }
};

// Cập nhật room
exports.updateRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const { roomNumber, price, area, status } = req.body;
    const userId = req.user.userId;

    // Kiểm tra room có tồn tại không
    const room = await Room.getById(id);
    if (!room) {
      return res.status(404).json({ error: 'Không tìm thấy phòng' });
    }

    // Kiểm tra quyền sở hữu
    const landlordId = await Property.getLandlordIdByUserId(userId);
    if (room.LandlordID !== landlordId) {
      return res.status(403).json({ 
        error: 'Bạn không có quyền cập nhật phòng này' 
      });
    }

    // Validate input
    if (!roomNumber || !price || !area || !status) {
      return res.status(400).json({ 
        error: 'RoomNumber, Price, Area và Status là bắt buộc' 
      });
    }

    // Check room number trùng (nếu đổi số phòng)
    if (roomNumber !== room.RoomNumber) {
      const isDuplicate = await Room.isDuplicate(room.PropertyID, roomNumber, id);
      if (isDuplicate) {
        return res.status(400).json({ 
          error: `Số phòng ${roomNumber} đã tồn tại trong nhà này` 
        });
      }
    }

    await Room.update(id, { roomNumber, price, area, status });

    res.json({ message: 'Cập nhật phòng thành công' });
  } catch (error) {
    console.error('Update room error:', error);
    res.status(500).json({ error: 'Lỗi khi cập nhật phòng' });
  }
};

// Xóa room
exports.deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Kiểm tra room có tồn tại không
    const room = await Room.getById(id);
    if (!room) {
      return res.status(404).json({ error: 'Không tìm thấy phòng' });
    }

    // Kiểm tra quyền sở hữu
    const landlordId = await Property.getLandlordIdByUserId(userId);
    if (room.LandlordID !== landlordId) {
      return res.status(403).json({ 
        error: 'Bạn không có quyền xóa phòng này' 
      });
    }

    // ⭐ BUSINESS LOGIC: Check phòng có đang trong contract không
    if (room.Status === 'Rented') {
      return res.status(400).json({ 
        error: 'Không thể xóa phòng đang được thuê' 
      });
    }

    await Room.delete(id);

    res.json({ message: 'Xóa phòng thành công' });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({ error: 'Lỗi khi xóa phòng' });
  }
};

// Search rooms với filters
exports.searchRooms = async (req, res) => {
  try {
    const { minPrice, maxPrice, status, propertyId } = req.query;

    const filters = {};
    if (minPrice) filters.minPrice = parseFloat(minPrice);
    if (maxPrice) filters.maxPrice = parseFloat(maxPrice);
    if (status) filters.status = status;
    if (propertyId) filters.propertyId = parseInt(propertyId);

    const rooms = await Room.search(filters);

    res.json({ rooms });
  } catch (error) {
    console.error('Search rooms error:', error);
    res.status(500).json({ error: 'Lỗi khi tìm kiếm phòng' });
  }
};
