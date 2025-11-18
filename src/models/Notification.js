const { getConnection, sql } = require('../config/database');

class Notification {
  // Tạo notification
  static async create(data) {
    const pool = await getConnection();
    const result = await pool.request()
      .input('userId', sql.Int, data.userId)
      .input('title', sql.NVarChar, data.title)
      .input('message', sql.NVarChar, data.message)
      .input('type', sql.VarChar, data.type) // 'Payment', 'Contract', 'System', 'Message'
      .input('isRead', sql.Bit, data.isRead || 0)
      .input('relatedId', sql.Int, data.relatedId || null) // ContractID, PaymentID, etc.
      .query(`
        INSERT INTO Notifications (UserID, Title, Message, Type, IsRead, RelatedID, CreatedAt)
        VALUES (@userId, @title, @message, @type, @isRead, @relatedId, GETDATE());
        SELECT SCOPE_IDENTITY() AS id;
      `);
    return result.recordset[0];
  }

  // Lấy notifications của user
  static async getByUser(userId, limit = 50) {
    const pool = await getConnection();
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .input('limit', sql.Int, limit)
      .query(`
        SELECT TOP(@limit) *
        FROM Notifications
        WHERE UserID = @userId
        ORDER BY CreatedAt DESC
      `);
    return result.recordset;
  }

  // Lấy unread notifications
  static async getUnreadByUser(userId) {
    const pool = await getConnection();
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT *
        FROM Notifications
        WHERE UserID = @userId AND IsRead = 0
        ORDER BY CreatedAt DESC
      `);
    return result.recordset;
  }

  // Đánh dấu đã đọc
  static async markAsRead(id) {
    const pool = await getConnection();
    await pool.request()
      .input('id', sql.Int, id)
      .query('UPDATE Notifications SET IsRead = 1 WHERE NotificationID = @id');
    return true;
  }

  // Đánh dấu tất cả đã đọc
  static async markAllAsRead(userId) {
    const pool = await getConnection();
    await pool.request()
      .input('userId', sql.Int, userId)
      .query('UPDATE Notifications SET IsRead = 1 WHERE UserID = @userId AND IsRead = 0');
    return true;
  }

  // Xóa notification
  static async delete(id) {
    const pool = await getConnection();
    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Notifications WHERE NotificationID = @id');
    return true;
  }

  // Đếm unread
  static async countUnread(userId) {
    const pool = await getConnection();
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query('SELECT COUNT(*) as count FROM Notifications WHERE UserID = @userId AND IsRead = 0');
    return result.recordset[0].count;
  }
}

module.exports = Notification;
