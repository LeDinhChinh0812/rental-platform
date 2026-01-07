const Notification = require('../models/Notification');

// Gửi notification (System use)
exports.sendNotification = async (req, res) => {
  try {
    const { userId, title, message, type, relatedId } = req.body;

    if (!userId || !title || !message || !type) {
      return res.status(400).json({ 
        error: 'UserID, Title, Message và Type là bắt buộc' 
      });
    }

    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      relatedId: relatedId || null
    });

    res.status(201).json({
      message: 'Gửi thông báo thành công',
      notificationId: notification.id
    });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({ error: 'Lỗi khi gửi thông báo' });
  }
};

// Lấy notifications của user
exports.getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit } = req.query;

    const notifications = await Notification.getByUser(userId, limit ? parseInt(limit) : 50);

    res.json({ notifications });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Lỗi khi lấy thông báo' });
  }
};

// Lấy unread notifications
exports.getUnreadNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;

    const notifications = await Notification.getUnreadByUser(userId);
    const count = await Notification.countUnread(userId);

    res.json({ 
      notifications,
      unreadCount: count
    });
  } catch (error) {
    console.error('Get unread notifications error:', error);
    res.status(500).json({ error: 'Lỗi khi lấy thông báo chưa đọc' });
  }
};

// Đánh dấu đã đọc
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    await Notification.markAsRead(id);

    res.json({ message: 'Đã đánh dấu đã đọc' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Lỗi khi đánh dấu đã đọc' });
  }
};

// Đánh dấu tất cả đã đọc
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;

    await Notification.markAllAsRead(userId);

    res.json({ message: 'Đã đánh dấu tất cả đã đọc' });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ error: 'Lỗi khi đánh dấu tất cả đã đọc' });
  }
};

// Xóa notification
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    await Notification.delete(id);

    res.json({ message: 'Xóa thông báo thành công' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Lỗi khi xóa thông báo' });
  }
};

// Helper: Gửi thông báo thanh toán
exports.sendPaymentReminder = async (userId, contractId, amount, dueDate) => {
  try {
    await Notification.create({
      userId,
      title: 'Nhắc nhở thanh toán',
      message: `Bạn có khoản thanh toán ${amount.toLocaleString('vi-VN')} VNĐ đến hạn vào ${new Date(dueDate).toLocaleDateString('vi-VN')}`,
      type: 'Payment',
      relatedId: contractId
    });
  } catch (error) {
    console.error('Send payment reminder error:', error);
  }
};
