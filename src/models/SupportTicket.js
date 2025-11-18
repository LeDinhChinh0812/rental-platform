const { getConnection, sql } = require('../config/database');

class SupportTicket {
  // Tạo ticket
  static async create(data) {
    const pool = await getConnection();
    const result = await pool.request()
      .input('userId', sql.Int, data.userId)
      .input('subject', sql.NVarChar, data.subject)
      .input('description', sql.NVarChar, data.description)
      .input('category', sql.VarChar, data.category) // 'Technical', 'Payment', 'Contract', 'Other'
      .input('priority', sql.VarChar, data.priority || 'Medium') // 'Low', 'Medium', 'High'
      .input('status', sql.VarChar, 'Open')
      .query(`
        INSERT INTO SupportTickets (UserID, Subject, Description, Category, Priority, Status, CreatedAt)
        VALUES (@userId, @subject, @description, @category, @priority, @status, GETDATE());
        SELECT SCOPE_IDENTITY() AS id;
      `);
    return result.recordset[0];
  }

  // Lấy tất cả tickets
  static async getAll() {
    const pool = await getConnection();
    const result = await pool.request()
      .query(`
        SELECT t.*, u.Name as UserName, u.Email as UserEmail, u.Role
        FROM SupportTickets t
        JOIN Users u ON t.UserID = u.UserID
        ORDER BY 
          CASE t.Priority 
            WHEN 'High' THEN 1 
            WHEN 'Medium' THEN 2 
            WHEN 'Low' THEN 3 
          END,
          t.CreatedAt DESC
      `);
    return result.recordset;
  }

  // Lấy ticket theo ID
  static async getById(id) {
    const pool = await getConnection();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT t.*, u.Name as UserName, u.Email as UserEmail, u.Role, u.Phone
        FROM SupportTickets t
        JOIN Users u ON t.UserID = u.UserID
        WHERE t.TicketID = @id
      `);
    return result.recordset[0];
  }

  // Lấy tickets của user
  static async getByUser(userId) {
    const pool = await getConnection();
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT * FROM SupportTickets
        WHERE UserID = @userId
        ORDER BY CreatedAt DESC
      `);
    return result.recordset;
  }

  // Update status
  static async updateStatus(id, status, response) {
    const pool = await getConnection();
    const request = pool.request()
      .input('id', sql.Int, id)
      .input('status', sql.VarChar, status);

    let query = 'UPDATE SupportTickets SET Status = @status';

    if (response) {
      query += ', Response = @response, ResolvedAt = GETDATE()';
      request.input('response', sql.NVarChar, response);
    }

    query += ' WHERE TicketID = @id';

    await request.query(query);
    return true;
  }

  // Lấy tickets theo status
  static async getByStatus(status) {
    const pool = await getConnection();
    const result = await pool.request()
      .input('status', sql.VarChar, status)
      .query(`
        SELECT t.*, u.Name as UserName, u.Email as UserEmail
        FROM SupportTickets t
        JOIN Users u ON t.UserID = u.UserID
        WHERE t.Status = @status
        ORDER BY t.CreatedAt DESC
      `);
    return result.recordset;
  }

  // Đếm tickets theo status
  static async countByStatus() {
    const pool = await getConnection();
    const result = await pool.request()
      .query(`
        SELECT 
          Status,
          COUNT(*) as Count
        FROM SupportTickets
        GROUP BY Status
      `);
    return result.recordset;
  }
}

module.exports = SupportTicket;
