const { getConnection, sql } = require('../config/database');

class Message {
  // Tạo message
  static async create(data) {
    const pool = await getConnection();
    const result = await pool.request()
      .input('senderId', sql.Int, data.senderId)
      .input('receiverId', sql.Int, data.receiverId)
      .input('contractId', sql.Int, data.contractId || null)
      .input('message', sql.NVarChar, data.message)
      .input('isRead', sql.Bit, 0)
      .query(`
        INSERT INTO Messages (SenderID, ReceiverID, ContractID, Message, IsRead, SentAt)
        VALUES (@senderId, @receiverId, @contractId, @message, @isRead, GETDATE());
        SELECT SCOPE_IDENTITY() AS id;
      `);
    return result.recordset[0];
  }

  // Lấy conversation giữa 2 users
  static async getConversation(user1Id, user2Id, limit = 100) {
    const pool = await getConnection();
    const result = await pool.request()
      .input('user1Id', sql.Int, user1Id)
      .input('user2Id', sql.Int, user2Id)
      .input('limit', sql.Int, limit)
      .query(`
        SELECT TOP(@limit) m.*, 
               s.Name as SenderName, r.Name as ReceiverName
        FROM Messages m
        JOIN Users s ON m.SenderID = s.UserID
        JOIN Users r ON m.ReceiverID = r.UserID
        WHERE (m.SenderID = @user1Id AND m.ReceiverID = @user2Id)
           OR (m.SenderID = @user2Id AND m.ReceiverID = @user1Id)
        ORDER BY m.SentAt DESC
      `);
    return result.recordset.reverse(); // Oldest first
  }

  // Lấy danh sách conversations
  static async getConversationList(userId) {
    const pool = await getConnection();
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        WITH LatestMessages AS (
          SELECT 
            CASE 
              WHEN SenderID = @userId THEN ReceiverID 
              ELSE SenderID 
            END as OtherUserID,
            MAX(SentAt) as LastMessageTime
          FROM Messages
          WHERE SenderID = @userId OR ReceiverID = @userId
          GROUP BY 
            CASE 
              WHEN SenderID = @userId THEN ReceiverID 
              ELSE SenderID 
            END
        )
        SELECT 
          lm.OtherUserID,
          u.Name as OtherUserName,
          u.Role as OtherUserRole,
          lm.LastMessageTime,
          (SELECT COUNT(*) 
           FROM Messages 
           WHERE ReceiverID = @userId 
             AND SenderID = lm.OtherUserID 
             AND IsRead = 0) as UnreadCount
        FROM LatestMessages lm
        JOIN Users u ON lm.OtherUserID = u.UserID
        ORDER BY lm.LastMessageTime DESC
      `);
    return result.recordset;
  }

  // Đánh dấu đã đọc
  static async markAsRead(senderId, receiverId) {
    const pool = await getConnection();
    await pool.request()
      .input('senderId', sql.Int, senderId)
      .input('receiverId', sql.Int, receiverId)
      .query(`
        UPDATE Messages 
        SET IsRead = 1 
        WHERE SenderID = @senderId AND ReceiverID = @receiverId AND IsRead = 0
      `);
    return true;
  }

  // Đếm unread messages
  static async countUnread(userId) {
    const pool = await getConnection();
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query('SELECT COUNT(*) as count FROM Messages WHERE ReceiverID = @userId AND IsRead = 0');
    return result.recordset[0].count;
  }
}

module.exports = Message;
