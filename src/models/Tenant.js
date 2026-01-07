const { getConnection, sql } = require('../config/database');

class Tenant {
  // Tạo Tenant mới từ UserID
  static async create(userId) {
    const pool = await getConnection();
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        INSERT INTO Tenants (UserID) 
        VALUES (@userId);
        SELECT SCOPE_IDENTITY() AS id;
      `);
    return result.recordset[0];
  }

  // ⭐ QUAN TRỌNG: Lấy TenantID từ UserID (FIX Contract.js)
  static async getTenantIdByUserId(userId) {
    const pool = await getConnection();
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT TenantID FROM Tenants 
        WHERE UserID = @userId
      `);
    return result.recordset[0]?.TenantID;
  }

  // Lấy UserID từ TenantID
  static async getUserIdByTenantId(tenantId) {
    const pool = await getConnection();
    const result = await pool.request()
      .input('tenantId', sql.Int, tenantId)
      .query(`
        SELECT UserID FROM Tenants 
        WHERE TenantID = @tenantId
      `);
    return result.recordset[0]?.UserID;
  }

  // Lấy tất cả tenants
  static async getAll() {
    const pool = await getConnection();
    const result = await pool.request()
      .query(`
        SELECT t.*, u.Name, u.Email, u.Phone 
        FROM Tenants t
        JOIN Users u ON t.UserID = u.UserID
        ORDER BY t.CreatedAt DESC
      `);
    return result.recordset;
  }

  // Lấy tenant theo ID
  static async getById(tenantId) {
    const pool = await getConnection();
    const result = await pool.request()
      .input('tenantId', sql.Int, tenantId)
      .query(`
        SELECT t.*, u.Name, u.Email, u.Phone 
        FROM Tenants t
        JOIN Users u ON t.UserID = u.UserID
        WHERE t.TenantID = @tenantId
      `);
    return result.recordset[0];
  }
}

module.exports = Tenant;
