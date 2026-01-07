const SupportTicket = require('../models/SupportTicket');
const Notification = require('../models/Notification');

// Tạo support ticket
exports.createTicket = async (req, res) => {
  try {
    const { subject, description, category, priority } = req.body;
    const userId = req.user.userId;

    if (!subject || !description || !category) {
      return res.status(400).json({ 
        error: 'Subject, Description và Category là bắt buộc' 
      });
    }

    const ticket = await SupportTicket.create({
      userId,
      subject,
      description,
      category,
      priority: priority || 'Medium'
    });

    res.status(201).json({
      message: 'Tạo yêu cầu hỗ trợ thành công',
      ticketId: ticket.id
    });
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ error: 'Lỗi khi tạo yêu cầu hỗ trợ' });
  }
};

// Lấy tất cả tickets (AppOwner)
exports.getAllTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.getAll();
    res.json({ tickets });
  } catch (error) {
    console.error('Get all tickets error:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách yêu cầu' });
  }
};

// Lấy ticket theo ID
exports.getTicketById = async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await SupportTicket.getById(id);

    if (!ticket) {
      return res.status(404).json({ error: 'Không tìm thấy yêu cầu' });
    }

    res.json({ ticket });
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ error: 'Lỗi khi lấy thông tin yêu cầu' });
  }
};

// Lấy tickets của user
exports.getMyTickets = async (req, res) => {
  try {
    const userId = req.user.userId;
    const tickets = await SupportTicket.getByUser(userId);
    res.json({ tickets });
  } catch (error) {
    console.error('Get my tickets error:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách yêu cầu của bạn' });
  }
};

// Xử lý ticket (AppOwner)
exports.resolveTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { response } = req.body;

    if (!response) {
      return res.status(400).json({ error: 'Response là bắt buộc' });
    }

    const ticket = await SupportTicket.getById(id);
    if (!ticket) {
      return res.status(404).json({ error: 'Không tìm thấy yêu cầu' });
    }

    await SupportTicket.updateStatus(id, 'Resolved', response);

    // Gửi notification cho user
    await Notification.create({
      userId: ticket.UserID,
      title: 'Yêu cầu hỗ trợ đã được xử lý',
      message: `Yêu cầu "${ticket.Subject}" của bạn đã được xử lý. Phản hồi: ${response}`,
      type: 'System',
      relatedId: id
    });

    res.json({ message: 'Xử lý yêu cầu thành công' });
  } catch (error) {
    console.error('Resolve ticket error:', error);
    res.status(500).json({ error: 'Lỗi khi xử lý yêu cầu' });
  }
};

// Lấy tickets theo status
exports.getTicketsByStatus = async (req, res) => {
  try {
    const { status } = req.query;

    if (!status) {
      return res.status(400).json({ error: 'Status là bắt buộc' });
    }

    const tickets = await SupportTicket.getByStatus(status);
    res.json({ tickets });
  } catch (error) {
    console.error('Get tickets by status error:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách yêu cầu' });
  }
};

// Thống kê tickets
exports.getTicketStats = async (req, res) => {
  try {
    const stats = await SupportTicket.countByStatus();
    res.json({ stats });
  } catch (error) {
    console.error('Get ticket stats error:', error);
    res.status(500).json({ error: 'Lỗi khi lấy thống kê' });
  }
};
