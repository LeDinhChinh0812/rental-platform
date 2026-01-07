  const { getConnection, sql } = require('../config/database');

  class Payment {
    // Tạo payment mới
    static async create(data) {
      const pool = await getConnection();
      const result = await pool.request()
        .input('contractId', sql.Int, data.contractId)
        .input('amount', sql.Decimal(18, 2), data.amount)
        .input('paymentMethod', sql.VarChar, data.paymentMethod)
        .input('status', sql.VarChar, data.status || 'Completed')
        .query(`
          INSERT INTO Payments (ContractID, Amount, PaymentMethod, Status, PaymentDate)
          VALUES (@contractId, @amount, @paymentMethod, @status, GETDATE());
          SELECT SCOPE_IDENTITY() AS id;
        `);
      return result.recordset[0];
    }

    // Lấy tất cả payments
    static async getAll() {
      const pool = await getConnection();
      const result = await pool.request()
        .query(`
          SELECT p.*, c.MonthlyRent, c.StartDate, c.EndDate,
                r.RoomNumber, prop.Name as PropertyName,
                u.Name as TenantName
          FROM Payments p
          JOIN Contracts c ON p.ContractID = c.ContractID
          JOIN Rooms r ON c.RoomID = r.RoomID
          JOIN Properties prop ON r.PropertyID = prop.PropertyID
          JOIN Tenants t ON c.TenantID = t.TenantID
          JOIN Users u ON t.UserID = u.UserID
          ORDER BY p.PaymentDate DESC
        `);
      return result.recordset;
    }

    // Lấy payment theo ID
    static async getById(id) {
      const pool = await getConnection();
      const result = await pool.request()
        .input('id', sql.Int, id)
        .query(`
          SELECT p.*, c.MonthlyRent, c.ContractID,
                r.RoomNumber, prop.Name as PropertyName, prop.LandlordID,
                u.Name as TenantName, t.TenantID
          FROM Payments p
          JOIN Contracts c ON p.ContractID = c.ContractID
          JOIN Rooms r ON c.RoomID = r.RoomID
          JOIN Properties prop ON r.PropertyID = prop.PropertyID
          JOIN Tenants t ON c.TenantID = t.TenantID
          JOIN Users u ON t.UserID = u.UserID
          WHERE p.PaymentID = @id
        `);
      return result.recordset[0];
    }

    // Lấy payments theo Contract
    static async getByContract(contractId) {
      const pool = await getConnection();
      const result = await pool.request()
        .input('contractId', sql.Int, contractId)
        .query(`
          SELECT * FROM Payments
          WHERE ContractID = @contractId
          ORDER BY PaymentDate DESC
        `);
      return result.recordset;
    }

    // Lấy payment history của Tenant
    static async getByTenant(tenantId) {
      const pool = await getConnection();
      const result = await pool.request()
        .input('tenantId', sql.Int, tenantId)
        .query(`
          SELECT p.*, r.RoomNumber, prop.Name as PropertyName
          FROM Payments p
          JOIN Contracts c ON p.ContractID = c.ContractID
          JOIN Rooms r ON c.RoomID = r.RoomID
          JOIN Properties prop ON r.PropertyID = prop.PropertyID
          WHERE c.TenantID = @tenantId
          ORDER BY p.PaymentDate DESC
        `);
      return result.recordset;
    }

    // Lấy payments của Landlord
    static async getByLandlord(landlordId) {
      const pool = await getConnection();
      const result = await pool.request()
        .input('landlordId', sql.Int, landlordId)
        .query(`
          SELECT p.*, r.RoomNumber, prop.Name as PropertyName,
                u.Name as TenantName
          FROM Payments p
          JOIN Contracts c ON p.ContractID = c.ContractID
          JOIN Rooms r ON c.RoomID = r.RoomID
          JOIN Properties prop ON r.PropertyID = prop.PropertyID
          JOIN Tenants t ON c.TenantID = t.TenantID
          JOIN Users u ON t.UserID = u.UserID
          WHERE prop.LandlordID = @landlordId
          ORDER BY p.PaymentDate DESC
        `);
      return result.recordset;
    }

    // Lấy payments quá hạn (overdue)
    static async getOverdue() {
      const pool = await getConnection();
      const result = await pool.request()
        .query(`
          SELECT c.ContractID, c.MonthlyRent, c.StartDate,
                r.RoomNumber, prop.Name as PropertyName,
                u.Name as TenantName, u.Email as TenantEmail,
                DATEDIFF(day, DATEADD(month, 1, p.PaymentDate), GETDATE()) as DaysOverdue
          FROM Contracts c
          JOIN Rooms r ON c.RoomID = r.RoomID
          JOIN Properties prop ON r.PropertyID = prop.PropertyID
          JOIN Tenants t ON c.TenantID = t.TenantID
          JOIN Users u ON t.UserID = u.UserID
          LEFT JOIN (
            SELECT ContractID, MAX(PaymentDate) as PaymentDate
            FROM Payments
            GROUP BY ContractID
          ) p ON c.ContractID = p.ContractID
          WHERE c.Status = 'Active'
            AND DATEDIFF(day, COALESCE(DATEADD(month, 1, p.PaymentDate), c.StartDate), GETDATE()) > 5
          ORDER BY DaysOverdue DESC
        `);
      return result.recordset;
    }

    // Lấy tổng thu nhập của Landlord
    static async getTotalByLandlord(landlordId, startDate, endDate) {
      const pool = await getConnection();
      const request = pool.request()
        .input('landlordId', sql.Int, landlordId);

      let query = `
        SELECT SUM(p.Amount) as TotalAmount, COUNT(*) as PaymentCount
        FROM Payments p
        JOIN Contracts c ON p.ContractID = c.ContractID
        JOIN Rooms r ON c.RoomID = r.RoomID
        JOIN Properties prop ON r.PropertyID = prop.PropertyID
        WHERE prop.LandlordID = @landlordId
      `;

      if (startDate) {
        query += ' AND p.PaymentDate >= @startDate';
        request.input('startDate', sql.Date, startDate);
      }

      if (endDate) {
        query += ' AND p.PaymentDate <= @endDate';
        request.input('endDate', sql.Date, endDate);
      }

      const result = await request.query(query);
      return result.recordset[0];
    }
  }

  module.exports = Payment;
