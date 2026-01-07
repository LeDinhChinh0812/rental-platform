const { getConnection, sql } = require('../config/database');

class Transaction {
  // Tạo transaction mới
  static async create(data) {
    const pool = await getConnection();
    const result = await pool.request()
      .input('contractId', sql.Int, data.contractId)
      .input('platformFeeId', sql.Int, data.platformFeeId)
      .input('amount', sql.Decimal(18, 2), data.amount)
      .input('type', sql.VarChar, data.type) // 'Contract' hoặc 'Payment'
      .query(`
        INSERT INTO Transactions (ContractID, PlatformFeeID, Amount, Type, TransactionDate)
        VALUES (@contractId, @platformFeeId, @amount, @type, GETDATE());
        SELECT SCOPE_IDENTITY() AS id;
      `);
    return result.recordset[0];
  }

  // Lấy tất cả transactions
  static async getAll() {
    const pool = await getConnection();
    const result = await pool.request()
      .query(`
        SELECT t.*, c.MonthlyRent, c.ContractID,
               r.RoomNumber, p.Name as PropertyName,
               pf.FeePercentage
        FROM Transactions t
        JOIN Contracts c ON t.ContractID = c.ContractID
        JOIN Rooms r ON c.RoomID = r.RoomID
        JOIN Properties p ON r.PropertyID = p.PropertyID
        JOIN PlatformFees pf ON t.PlatformFeeID = pf.FeeID
        ORDER BY t.TransactionDate DESC
      `);
    return result.recordset;
  }

  // Lấy transaction theo ID
  static async getById(id) {
    const pool = await getConnection();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT t.*, c.MonthlyRent,
               r.RoomNumber, p.Name as PropertyName,
               pf.FeePercentage
        FROM Transactions t
        JOIN Contracts c ON t.ContractID = c.ContractID
        JOIN Rooms r ON c.RoomID = r.RoomID
        JOIN Properties p ON r.PropertyID = p.PropertyID
        JOIN PlatformFees pf ON t.PlatformFeeID = pf.FeeID
        WHERE t.TransactionID = @id
      `);
    return result.recordset[0];
  }

  // Lấy transactions theo Contract
  static async getByContract(contractId) {
    const pool = await getConnection();
    const result = await pool.request()
      .input('contractId', sql.Int, contractId)
      .query(`
        SELECT * FROM Transactions
        WHERE ContractID = @contractId
        ORDER BY TransactionDate DESC
      `);
    return result.recordset;
  }

  // Lấy tổng doanh thu (cho AppOwner)
  static async getTotalRevenue(startDate, endDate) {
    const pool = await getConnection();
    const request = pool.request();

    let query = 'SELECT SUM(Amount) as TotalRevenue, COUNT(*) as TransactionCount FROM Transactions WHERE 1=1';

    if (startDate) {
      query += ' AND TransactionDate >= @startDate';
      request.input('startDate', sql.Date, startDate);
    }

    if (endDate) {
      query += ' AND TransactionDate <= @endDate';
      request.input('endDate', sql.Date, endDate);
    }

    const result = await request.query(query);
    return result.recordset[0];
  }

  // Lấy doanh thu theo tháng (cho chart)
  static async getRevenueByMonth(year) {
    const pool = await getConnection();
    const result = await pool.request()
      .input('year', sql.Int, year)
      .query(`
        SELECT 
          MONTH(TransactionDate) as Month,
          SUM(Amount) as Revenue,
          COUNT(*) as TransactionCount
        FROM Transactions
        WHERE YEAR(TransactionDate) = @year
        GROUP BY MONTH(TransactionDate)
        ORDER BY Month
      `);
    return result.recordset;
  }

  // Lấy transactions theo date range
  static async getByDateRange(startDate, endDate) {
    const pool = await getConnection();
    const result = await pool.request()
      .input('startDate', sql.Date, startDate)
      .input('endDate', sql.Date, endDate)
      .query(`
        SELECT t.*, c.MonthlyRent,
               r.RoomNumber, p.Name as PropertyName
        FROM Transactions t
        JOIN Contracts c ON t.ContractID = c.ContractID
        JOIN Rooms r ON c.RoomID = r.RoomID
        JOIN Properties p ON r.PropertyID = p.PropertyID
        WHERE t.TransactionDate BETWEEN @startDate AND @endDate
        ORDER BY t.TransactionDate DESC
      `);
    return result.recordset;
  }
}

module.exports = Transaction;
