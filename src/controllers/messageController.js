const Message = require('../models/Message');

// Gửi message
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, message, contractId } = req.body;
    const senderId = req.user.userId;

    if (!receiverId || !message) {
      return res.status(400).json({ 
        error: 'ReceiverID và Message là bắt buộc' 
      });
    }

    const msg = await Message.create({
      senderId,
      receiverId,
      message,
      contractId: contractId || null
    });

    res.status(201).json({
      message: 'Gửi tin nhắn thành công',
      messageId: msg.id
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Lỗi khi gửi tin nhắn' });
  }
};

// Lấy conversation
exports.getConversation = async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const userId = req.user.userId;
    const { limit } = req.query;

    const messages = await Message.getConversation(
      userId, 
      parseInt(otherUserId), 
      limit ? parseInt(limit) : 100
    );

    // Đánh dấu đã đọc
    await Message.markAsRead(parseInt(otherUserId), userId);

    res.json({ messages });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ error: 'Lỗi khi lấy tin nhắn' });
  }
};

// Lấy danh sách conversations
exports.getConversationList = async (req, res) => {
  try {
    const userId = req.user.userId;

    const conversations = await Message.getConversationList(userId);

    res.json({ conversations });
  } catch (error) {
    console.error('Get conversation list error:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách hội thoại' });
  }
};

// Đếm unread messages
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.userId;

    const count = await Message.countUnread(userId);

    res.json({ unreadCount: count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Lỗi khi đếm tin nhắn chưa đọc' });
  }
};
