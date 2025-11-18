const { getConnection, sql } = require('../config/database');

class UtilityBill {
  // Tạo hóa đơn điện/nước
  static async create(data) {
    const pool = await getConnection();
    const result = await pool.request()
      .input('contractId', sql.Int, data.contractId)
      .input('billType', sql.VarChar, data.billType) // 'Electric' hoặc 'Water'
      .input('previousReading', sql.Decimal(10, 2), data.previousReading)
      .input('currentReading', sql.Decimal(10, 2), data.currentReading)
      .input('unitPrice', sql.Decimal(10, 2), data.unitPrice)
      .input('totalAmount', sql.Decimal(18, 2), data.totalAmount)
      .input('billMonth', sql.Date, data.billMonth)
      .input('status', sql.VarChar, data.status || 'Pending')
      .query(`
        INSERT INTO UtilityBills (ContractID, BillType, PreviousReading, CurrentReading, 
                                  UnitPrice, TotalAmount, BillMonth, Status)
        VALUES (@contractId, @billType, @previousReading, @currentReading, 
                @unitPrice, @totalAmount, @billMonth, @status);
        SELECT SCOPE_IDENTITY() AS id;
      `);
    return result.recordset[0];
  }

  // Lấy tất cả utility bills
  static async getAll() {
    const pool = await getConnection();
    const result = await pool.request()
      .query(`
        SELECT ub.*, c.ContractID, r.RoomNumber, p.Name as PropertyName,
               u.Name as TenantName
        FROM UtilityBills ub
        JOIN Contracts c ON ub.ContractID = c.ContractID
        JOIN Rooms r ON c.RoomID = r.RoomID
        JOIN Properties p ON r.PropertyID = p.PropertyID
        JOIN Tenants t ON c.TenantID = t.TenantID
        JOIN Users u ON t.UserID = u.UserID
        ORDER BY ub.BillMonth DESC
      `);
    return result.recordset;
  }

  // Lấy utility bill theo ID
  static async getById(id) {
    const pool = await getConnection();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT ub.*, c.ContractID, r.RoomNumber, p.Name as PropertyName,
               u.Name as TenantName, u.Email as TenantEmail
        FROM UtilityBills ub
        JOIN Contracts c ON ub.ContractID = c.ContractID
        JOIN Rooms r ON c.RoomID = r.RoomID
        JOIN Properties p ON r.PropertyID = p.PropertyID
        JOIN Tenants t ON c.TenantID = t.TenantID
        JOIN Users u ON t.UserID = u.UserID
        WHERE ub.BillID = @id
      `);
    return result.recordset[0];
  }

  // Lấy utility bills theo Contract
  static async getByContract(contractId) {
    const pool = await getConnection();
    const result = await pool.request()
      .input('contractId', sql.Int, contractId)
      .query(`
        SELECT * FROM UtilityBills
        WHERE ContractID = @contractId
        ORDER BY BillMonth DESC
      `);
    return result.recordset;
  }

  // Lấy utility bills chưa thanh toán
  static async getUnpaid(contractId) {
    const pool = await getConnection();
    const result = await pool.request()
      .input('contractId', sql.Int, contractId)
      .query(`
        SELECT * FROM UtilityBills
        WHERE ContractID = @contractId AND Status = 'Pending'
        ORDER BY BillMonth ASC
      `);
    return result.recordset;
  }

  // Update status
  static async updateStatus(id, status) {
    const pool = await getConnection();
    await pool.request()
      .input('id', sql.Int, id)
      .input('status', sql.VarChar, status)
      .query('UPDATE UtilityBills SET Status = @status WHERE BillID = @id');
    return true;
  }

  // Xóa utility bill
  static async delete(id) {
    const pool = await getConnection();
    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM UtilityBills WHERE BillID = @id');
    return true;
  }
}

module.exports = UtilityBill;
