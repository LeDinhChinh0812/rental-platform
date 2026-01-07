const { getConnection, sql } = require('../config/database');

class Property {
  // Tạo property mới
  static async create(data) {
    const pool = await getConnection();
    const result = await pool.request()
      .input('landlordId', sql.Int, data.landlordId)
      .input('name', sql.NVarChar, data.name)
      .input('address', sql.NVarChar, data.address)
      .input('description', sql.NVarChar, data.description)
      .query(`
        INSERT INTO Properties (LandlordID, Name, Address, Description)
        VALUES (@landlordId, @name, @address, @description);
        SELECT SCOPE_IDENTITY() AS id;
      `);
    return result.recordset[0];
  }

  // Lấy tất cả properties
  static async getAll() {
    const pool = await getConnection();
    const result = await pool.request()
      .query(`
        SELECT p.*, u.Name as LandlordName, u.Phone as LandlordPhone
        FROM Properties p
        JOIN Landlords l ON p.LandlordID = l.LandlordID
        JOIN Users u ON l.UserID = u.UserID
        ORDER BY p.CreatedAt DESC
      `);
    return result.recordset;
  }

  // Lấy property theo ID
  static async getById(id) {
    const pool = await getConnection();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT p.*, u.Name as LandlordName, u.Phone as LandlordPhone, u.Email as LandlordEmail
        FROM Properties p
        JOIN Landlords l ON p.LandlordID = l.LandlordID
        JOIN Users u ON l.UserID = u.UserID
        WHERE p.PropertyID = @id
      `);
    return result.recordset[0];
  }

  // Lấy properties của landlord
  static async getByLandlord(landlordId) {
    const pool = await getConnection();
    const result = await pool.request()
      .input('landlordId', sql.Int, landlordId)
      .query(`
        SELECT * FROM Properties
        WHERE LandlordID = @landlordId
        ORDER BY CreatedAt DESC
      `);
    return result.recordset;
  }

  // Cập nhật property
  static async update(id, data) {
    const pool = await getConnection();
    await pool.request()
      .input('id', sql.Int, id)
      .input('name', sql.NVarChar, data.name)
      .input('address', sql.NVarChar, data.address)
      .input('description', sql.NVarChar, data.description)
      .query(`
        UPDATE Properties 
        SET Name = @name, Address = @address, Description = @description
        WHERE PropertyID = @id
      `);
    return true;
  }

  // Xóa property
  static async delete(id) {
    const pool = await getConnection();
    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Properties WHERE PropertyID = @id');
    return true;
  }

  // Tìm kiếm properties
  static async search(keyword) {
    const pool = await getConnection();
    const result = await pool.request()
      .input('keyword', sql.NVarChar, `%${keyword}%`)
      .query(`
        SELECT p.*, u.Name as LandlordName, u.Phone as LandlordPhone
        FROM Properties p
        JOIN Landlords l ON p.LandlordID = l.LandlordID
        JOIN Users u ON l.UserID = u.UserID
        WHERE p.Name LIKE @keyword OR p.Address LIKE @keyword
        ORDER BY p.CreatedAt DESC
      `);
    return result.recordset;
  }

  // Check property có rooms không
  static async hasRooms(propertyId) {
    const pool = await getConnection();
    const result = await pool.request()
      .input('propertyId', sql.Int, propertyId)
      .query('SELECT COUNT(*) as count FROM Rooms WHERE PropertyID = @propertyId');
    return result.recordset[0].count > 0;
  }

  // Helper: Lấy LandlordID từ UserID
  static async getLandlordIdByUserId(userId) {
    const pool = await getConnection();
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query('SELECT LandlordID FROM Landlords WHERE UserID = @userId');
    return result.recordset[0]?.LandlordID;
  }
}

module.exports = Property;
