const Property = require('../models/Property');
const Room = require('../models/Room');

// Tạo property mới
exports.createProperty = async (req, res) => {
  try {
    const { name, address, description } = req.body;
    const userId = req.user.userId;

    // Validate input
    if (!name || !address) {
      return res.status(400).json({ error: 'Tên và địa chỉ là bắt buộc' });
    }

    // Lấy LandlordID từ UserID
    const landlordId = await Property.getLandlordIdByUserId(userId);
    
    if (!landlordId) {
      return res.status(403).json({ error: 'Bạn không phải là Landlord' });
    }

    const property = await Property.create({
      landlordId,
      name,
      address,
      description: description || ''
    });

    res.status(201).json({
      message: 'Tạo nhà cho thuê thành công',
      propertyId: property.id
    });
  } catch (error) {
    console.error('Create property error:', error);
    res.status(500).json({ error: 'Lỗi khi tạo nhà cho thuê' });
  }
};

// Lấy tất cả properties
exports.getAllProperties = async (req, res) => {
  try {
    const properties = await Property.getAll();
    res.json({ properties });
  } catch (error) {
    console.error('Get all properties error:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách nhà' });
  }
};

// Lấy property theo ID
exports.getPropertyById = async (req, res) => {
  try {
    const { id } = req.params;
    const property = await Property.getById(id);

    if (!property) {
      return res.status(404).json({ error: 'Không tìm thấy nhà' });
    }

    // Lấy danh sách rooms của property
    const rooms = await Room.getByProperty(id);
    
    res.json({ 
      property,
      rooms 
    });
  } catch (error) {
    console.error('Get property error:', error);
    res.status(500).json({ error: 'Lỗi khi lấy thông tin nhà' });
  }
};

// Lấy properties của Landlord
exports.getMyProperties = async (req, res) => {
  try {
    const userId = req.user.userId;
    const landlordId = await Property.getLandlordIdByUserId(userId);

    if (!landlordId) {
      return res.status(403).json({ error: 'Bạn không phải là Landlord' });
    }

    const properties = await Property.getByLandlord(landlordId);
    res.json({ properties });
  } catch (error) {
    console.error('Get my properties error:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách nhà của bạn' });
  }
};

// Cập nhật property
exports.updateProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, description } = req.body;
    const userId = req.user.userId;

    // Kiểm tra property có tồn tại không
    const property = await Property.getById(id);
    if (!property) {
      return res.status(404).json({ error: 'Không tìm thấy nhà' });
    }

    // Kiểm tra quyền sở hữu
    const landlordId = await Property.getLandlordIdByUserId(userId);
    if (property.LandlordID !== landlordId) {
      return res.status(403).json({ error: 'Bạn không có quyền cập nhật nhà này' });
    }

    // Validate input
    if (!name || !address) {
      return res.status(400).json({ error: 'Tên và địa chỉ là bắt buộc' });
    }

    await Property.update(id, { name, address, description: description || '' });

    res.json({ message: 'Cập nhật thành công' });
  } catch (error) {
    console.error('Update property error:', error);
    res.status(500).json({ error: 'Lỗi khi cập nhật' });
  }
};

// Xóa property
exports.deleteProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Kiểm tra property có tồn tại không
    const property = await Property.getById(id);
    if (!property) {
      return res.status(404).json({ error: 'Không tìm thấy nhà' });
    }

    // Kiểm tra quyền sở hữu
    const landlordId = await Property.getLandlordIdByUserId(userId);
    if (property.LandlordID !== landlordId) {
      return res.status(403).json({ error: 'Bạn không có quyền xóa nhà này' });
    }

    // ⭐ BUSINESS LOGIC: Check có rooms không
    const hasRooms = await Property.hasRooms(id);
    if (hasRooms) {
      return res.status(400).json({ 
        error: 'Không thể xóa nhà đang có phòng. Vui lòng xóa hết phòng trước.' 
      });
    }

    await Property.delete(id);

    res.json({ message: 'Xóa thành công' });
  } catch (error) {
    console.error('Delete property error:', error);
    res.status(500).json({ error: 'Lỗi khi xóa' });
  }
};

// Tìm kiếm properties
exports.searchProperties = async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword) {
      return res.status(400).json({ error: 'Vui lòng nhập từ khóa tìm kiếm' });
    }

    const properties = await Property.search(keyword);

    res.json({ properties });
  } catch (error) {
    console.error('Search properties error:', error);
    res.status(500).json({ error: 'Lỗi khi tìm kiếm' });
  }
};
