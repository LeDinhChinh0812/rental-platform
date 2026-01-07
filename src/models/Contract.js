const { getConnection, sql } = require('../config/database');

class Contract {
  // Tạo hợp đồng thuê
  static async create(data) {
    const pool = await getConnection();
    const result = await pool.request()
      .input('roomId', sql.Int, data.roomId)
      .input('tenantId', sql.Int, data.tenantId)
      .input('startDate', sql.Date, data.startDate)
      .input('endDate', sql.Date, data.endDate)
      .input('monthlyRent', sql.Decimal(18, 2), data.monthlyRent)
      .input('deposit', sql.Decimal(18, 2), data.deposit)
      .input('status', sql.VarChar, data.status || 'Pending')
      .query(`
        INSERT INTO Contracts (RoomID, TenantID, StartDate, EndDate, MonthlyRent, Deposit, Status)
        VALUES (@roomId, @tenantId, @startDate, @endDate, @monthlyRent, @deposit, @status);
        SELECT SCOPE_IDENTITY() AS id;
      `);
    return result.recordset[0];
  }

  // Lấy tất cả contracts
  static async getAll() {
    const pool = await getConnection();
    const result = await pool.request()
      .query(`
        SELECT c.*, 
               r.RoomNumber, p.Name as PropertyName, p.Address as PropertyAddress,
               u.Name as TenantName, u.Email as TenantEmail, u.Phone as TenantPhone
        FROM Contracts c
        JOIN Rooms r ON c.RoomID = r.RoomID
        JOIN Properties p ON r.PropertyID = p.PropertyID
        JOIN Tenants t ON c.TenantID = t.TenantID
        JOIN Users u ON t.UserID = u.UserID
        ORDER BY c.CreatedAt DESC
      `);
    return result.recordset;
  }

  // Lấy contract theo ID
  static async getById(id) {
    const pool = await getConnection();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT c.*, 
               r.RoomNumber, r.Price, r.Area, r.PropertyID,
               p.Name as PropertyName, p.Address as PropertyAddress, p.LandlordID,
               u.Name as TenantName, u.Email as TenantEmail, u.Phone as TenantPhone
        FROM Contracts c
        JOIN Rooms r ON c.RoomID = r.RoomID
        JOIN Properties p ON r.PropertyID = p.PropertyID
        JOIN Tenants t ON c.TenantID = t.TenantID
        JOIN Users u ON t.UserID = u.UserID
        WHERE c.ContractID = @id
      `);
    return result.recordset[0];
  }

  // Lấy contracts của Tenant
  static async getByTenant(tenantId) {
    const pool = await getConnection();
    const result = await pool.request()
      .input('tenantId', sql.Int, tenantId)
      .query(`
        SELECT c.*, r.RoomNumber, p.Name as PropertyName, p.Address as PropertyAddress
        FROM Contracts c
        JOIN Rooms r ON c.RoomID = r.RoomID
        JOIN Properties p ON r.PropertyID = p.PropertyID
        WHERE c.TenantID = @tenantId
        ORDER BY c.CreatedAt DESC
      `);
    return result.recordset;
  }

  // Lấy contracts theo Property (cho Landlord)
  static async getByProperty(propertyId) {
    const pool = await getConnection();
    const result = await pool.request()
      .input('propertyId', sql.Int, propertyId)
      .query(`
        SELECT c.*, r.RoomNumber, u.Name as TenantName, u.Phone as TenantPhone
        FROM Contracts c
        JOIN Rooms r ON c.RoomID = r.RoomID
        JOIN Tenants t ON c.TenantID = t.TenantID
        JOIN Users u ON t.UserID = u.UserID
        WHERE r.PropertyID = @propertyId
        ORDER BY c.CreatedAt DESC
      `);
    return result.recordset;
  }

  // Lấy contracts của Landlord (tất cả properties)
  static async getByLandlord(landlordId) {
    const pool = await getConnection();
    const result = await pool.request()
      .input('landlordId', sql.Int, landlordId)
      .query(`
        SELECT c.*, r.RoomNumber, p.Name as PropertyName, 
               u.Name as TenantName, u.Phone as TenantPhone
        FROM Contracts c
        JOIN Rooms r ON c.RoomID = r.RoomID
        JOIN Properties p ON r.PropertyID = p.PropertyID
        JOIN Tenants t ON c.TenantID = t.TenantID
        JOIN Users u ON t.UserID = u.UserID
        WHERE p.LandlordID = @landlordId
        ORDER BY c.CreatedAt DESC
      `);
    return result.recordset;
  }

  // Duyệt hợp đồng
  static async approve(id) {
    const pool = await getConnection();
    await pool.request()
      .input('id', sql.Int, id)
      .query("UPDATE Contracts SET Status = 'Active' WHERE ContractID = @id");
    return true;
  }

  // Gia hạn hợp đồng
  static async extend(id, newEndDate) {
    const pool = await getConnection();
    await pool.request()
      .input('id', sql.Int, id)
      .input('newEndDate', sql.Date, newEndDate)
      .query('UPDATE Contracts SET EndDate = @newEndDate WHERE ContractID = @id');
    return true;
  }

  // Chấm dứt hợp đồng
  static async terminate(id) {
    const pool = await getConnection();
    await pool.request()
      .input('id', sql.Int, id)
      .query("UPDATE Contracts SET Status = 'Terminated' WHERE ContractID = @id");
    return true;
  }

  // Update contract status
  static async updateStatus(id, status) {
    const pool = await getConnection();
    await pool.request()
      .input('id', sql.Int, id)
      .input('status', sql.VarChar, status)
      .query('UPDATE Contracts SET Status = @status WHERE ContractID = @id');
    return true;
  }

  // Helper: Get TenantID from UserID
  static async getTenantIdByUserId(userId) {
    const pool = await getConnection();
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query('SELECT TenantID FROM Tenants WHERE UserID = @userId');
    return result.recordset[0]?.TenantID;
  }

  static async getUserIdByTenantId(tenantId) {
    const pool = await getConnection();
    const result = await pool.request()
      .input('tenantId', sql.Int, tenantId)
      .query('SELECT UserID FROM Tenants WHERE TenantID = @tenantId');
    return result.recordset[0]?.UserID;
  }
}

module.exports = Contract;
