const Transaction = require('../models/Transaction');
const { getConnection, sql } = require('../config/database');

// Lấy tất cả transactions (AppOwner)
exports.getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.getAll();
    res.json({ transactions });
  } catch (error) {
    console.error('Get all transactions error:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách giao dịch' });
  }
};

// Lấy transaction theo ID
exports.getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await Transaction.getById(id);

    if (!transaction) {
      return res.status(404).json({ error: 'Không tìm thấy giao dịch' });
    }

    res.json({ transaction });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ error: 'Lỗi khi lấy thông tin giao dịch' });
  }
};

// ⭐ 5.1 Thống kê doanh thu (AppOwner)
exports.getTotalRevenue = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const revenue = await Transaction.getTotalRevenue(
      startDate || null, 
      endDate || null
    );

    res.json({ revenue });
  } catch (error) {
    console.error('Get total revenue error:', error);
    res.status(500).json({ error: 'Lỗi khi lấy doanh thu' });
  }
};

// ⭐ 5.3 Biểu đồ doanh thu theo tháng (AppOwner)
exports.getRevenueByMonth = async (req, res) => {
  try {
    const { year } = req.query;
    const currentYear = year || new Date().getFullYear();

    const monthlyRevenue = await Transaction.getRevenueByMonth(currentYear);

    res.json({ 
      year: currentYear,
      monthlyRevenue 
    });
  } catch (error) {
    console.error('Get revenue by month error:', error);
    res.status(500).json({ error: 'Lỗi khi lấy doanh thu theo tháng' });
  }
};

// ⭐ 5.2 Báo cáo tỷ lệ lấp đầy phòng (AppOwner)
exports.getRoomOccupancyRate = async (req, res) => {
  try {
    const pool = await getConnection();
    
    const result = await pool.request().query(`
      SELECT 
        COUNT(*) as TotalRooms,
        SUM(CASE WHEN Status = 'Rented' THEN 1 ELSE 0 END) as RentedRooms,
        SUM(CASE WHEN Status = 'Available' THEN 1 ELSE 0 END) as AvailableRooms,
        CAST(SUM(CASE WHEN Status = 'Rented' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) AS DECIMAL(5,2)) as OccupancyRate
      FROM Rooms
    `);

    res.json({ occupancy: result.recordset[0] });
  } catch (error) {
    console.error('Get room occupancy rate error:', error);
    res.status(500).json({ error: 'Lỗi khi lấy tỷ lệ lấp đầy phòng' });
  }
};

// ⭐ Báo cáo số lượng hợp đồng theo tháng (AppOwner)
exports.getContractsByMonth = async (req, res) => {
  try {
    const { year } = req.query;
    const currentYear = year || new Date().getFullYear();

    const pool = await getConnection();
    
    const result = await pool.request()
      .input('year', sql.Int, currentYear)
      .query(`
        SELECT 
          MONTH(CreatedAt) as Month,
          COUNT(*) as ContractCount,
          SUM(CASE WHEN Status = 'Active' THEN 1 ELSE 0 END) as ActiveContracts,
          SUM(CASE WHEN Status = 'Pending' THEN 1 ELSE 0 END) as PendingContracts,
          SUM(CASE WHEN Status = 'Terminated' THEN 1 ELSE 0 END) as TerminatedContracts
        FROM Contracts
        WHERE YEAR(CreatedAt) = @year
        GROUP BY MONTH(CreatedAt)
        ORDER BY Month
      `);

    res.json({ 
      year: currentYear,
      monthlyContracts: result.recordset 
    });
  } catch (error) {
    console.error('Get contracts by month error:', error);
    res.status(500).json({ error: 'Lỗi khi lấy báo cáo hợp đồng theo tháng' });
  }
};

// ⭐ Dashboard overview (AppOwner)
exports.getDashboardStats = async (req, res) => {
  try {
    const pool = await getConnection();
    
    // Tổng doanh thu
    const revenueResult = await pool.request().query(`
      SELECT SUM(Amount) as TotalRevenue FROM Transactions
    `);

    // Tổng số phòng và tỷ lệ lấp đầy
    const roomResult = await pool.request().query(`
      SELECT 
        COUNT(*) as TotalRooms,
        SUM(CASE WHEN Status = 'Rented' THEN 1 ELSE 0 END) as RentedRooms,
        CAST(SUM(CASE WHEN Status = 'Rented' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) AS DECIMAL(5,2)) as OccupancyRate
      FROM Rooms
    `);

    // Tổng số hợp đồng
    const contractResult = await pool.request().query(`
      SELECT 
        COUNT(*) as TotalContracts,
        SUM(CASE WHEN Status = 'Active' THEN 1 ELSE 0 END) as ActiveContracts
      FROM Contracts
    `);

    // Tổng số users
    const userResult = await pool.request().query(`
      SELECT 
        COUNT(*) as TotalUsers,
        SUM(CASE WHEN Role = 'Landlord' THEN 1 ELSE 0 END) as Landlords,
        SUM(CASE WHEN Role = 'Tenant' THEN 1 ELSE 0 END) as Tenants
      FROM Users
    `);

    res.json({
      revenue: revenueResult.recordset[0],
      rooms: roomResult.recordset[0],
      contracts: contractResult.recordset[0],
      users: userResult.recordset[0]
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Lỗi khi lấy thống kê dashboard' });
  }
};

// Lấy transactions theo date range
exports.getTransactionsByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: 'StartDate và EndDate là bắt buộc' 
      });
    }

    const transactions = await Transaction.getByDateRange(startDate, endDate);

    res.json({ transactions });
  } catch (error) {
    console.error('Get transactions by date range error:', error);
    res.status(500).json({ error: 'Lỗi khi lấy giao dịch theo khoảng thời gian' });
  }
};
