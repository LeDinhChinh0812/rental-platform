const { getConnection, sql } = require('../config/database');

class Room {
  // Tạo phòng mới
  static async create(data) {
    const pool = await getConnection();
    const result = await pool.request()
      .input('propertyId', sql.Int, data.propertyId)
      .input('roomNumber', sql.VarChar, data.roomNumber)
      .input('price', sql.Decimal(18, 2), data.price)
      .input('area', sql.Decimal(10, 2), data.area)
      .input('status', sql.VarChar, data.status || 'Available')
      .query(`
        INSERT INTO Rooms (PropertyID, RoomNumber, Price, Area, Status)
        VALUES (@propertyId, @roomNumber, @price, @area, @status);
        SELECT SCOPE_IDENTITY() AS id;
      `);
    return result.recordset[0];
  }

  // Lấy tất cả phòng
  static async getAll() {
    const pool = await getConnection();
    const result = await pool.request()
      .query(`
        SELECT r.*, p.Name as PropertyName, p.Address as PropertyAddress
        FROM Rooms r
        JOIN Properties p ON r.PropertyID = p.PropertyID
        ORDER BY r.CreatedAt DESC
      `);
    return result.recordset;
  }

  // Lấy phòng theo ID
  static async getById(id) {
    const pool = await getConnection();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT r.*, p.Name as PropertyName, p.Address as PropertyAddress, 
               p.Description as PropertyDescription, p.LandlordID
        FROM Rooms r
        JOIN Properties p ON r.PropertyID = p.PropertyID
        WHERE r.RoomID = @id
      `);
    return result.recordset[0];
  }

  // Lấy phòng Available
  static async getAvailable() {
    const pool = await getConnection();
    const result = await pool.request()
      .query(`
        SELECT r.*, p.Name as PropertyName, p.Address as PropertyAddress
        FROM Rooms r
        JOIN Properties p ON r.PropertyID = p.PropertyID
        WHERE r.Status = 'Available'
        ORDER BY r.Price ASC
      `);
    return result.recordset;
  }

  // Lấy phòng theo Property
  static async getByProperty(propertyId) {
    const pool = await getConnection();
    const result = await pool.request()
      .input('propertyId', sql.Int, propertyId)
      .query('SELECT * FROM Rooms WHERE PropertyID = @propertyId');
    return result.recordset;
  }

  // Cập nhật thông tin phòng
  static async update(id, data) {
    const pool = await getConnection();
    await pool.request()
      .input('id', sql.Int, id)
      .input('roomNumber', sql.VarChar, data.roomNumber)
      .input('price', sql.Decimal(18, 2), data.price)
      .input('area', sql.Decimal(10, 2), data.area)
      .input('status', sql.VarChar, data.status)
      .query(`
        UPDATE Rooms 
        SET RoomNumber = @roomNumber, Price = @price, Area = @area, Status = @status
        WHERE RoomID = @id
      `);
    return true;
  }

  // ⭐ QUAN TRỌNG: Update status phòng (dùng cho Contract)
  static async updateStatus(roomId, status) {
    const pool = await getConnection();
    await pool.request()
      .input('roomId', sql.Int, roomId)
      .input('status', sql.VarChar, status)
      .query('UPDATE Rooms SET Status = @status WHERE RoomID = @roomId');
    return true;
  }

  // Xóa phòng
  static async delete(id) {
    const pool = await getConnection();
    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Rooms WHERE RoomID = @id');
    return true;
  }

  // Check room number có trùng trong property không
  static async isDuplicate(propertyId, roomNumber, excludeRoomId = null) {
    const pool = await getConnection();
    let query = 'SELECT COUNT(*) as count FROM Rooms WHERE PropertyID = @propertyId AND RoomNumber = @roomNumber';
    
    const request = pool.request()
      .input('propertyId', sql.Int, propertyId)
      .input('roomNumber', sql.VarChar, roomNumber);

    if (excludeRoomId) {
      query += ' AND RoomID != @excludeRoomId';
      request.input('excludeRoomId', sql.Int, excludeRoomId);
    }

    const result = await request.query(query);
    return result.recordset[0].count > 0;
  }

  // Search rooms với filters
  static async search(filters) {
    const pool = await getConnection();
    let query = `
      SELECT r.*, p.Name as PropertyName, p.Address as PropertyAddress
      FROM Rooms r
      JOIN Properties p ON r.PropertyID = p.PropertyID
      WHERE 1=1
    `;

    const request = pool.request();

    if (filters.minPrice) {
      query += ' AND r.Price >= @minPrice';
      request.input('minPrice', sql.Decimal(18, 2), filters.minPrice);
    }

    if (filters.maxPrice) {
      query += ' AND r.Price <= @maxPrice';
      request.input('maxPrice', sql.Decimal(18, 2), filters.maxPrice);
    }

    if (filters.status) {
      query += ' AND r.Status = @status';
      request.input('status', sql.VarChar, filters.status);
    }

    if (filters.propertyId) {
      query += ' AND r.PropertyID = @propertyId';
      request.input('propertyId', sql.Int, filters.propertyId);
    }

    query += ' ORDER BY r.Price ASC';

    const result = await request.query(query);
    return result.recordset;
  }
}

module.exports = Room;
