const User = require('../models/User');
const { hashPassword, comparePassword } = require('../utils/passwordHelper');
const { generateToken } = require('../utils/jwtHelper');

// Register (đã có)
exports.register = async (req, res) => {
  try {
    const { email, password, name, phone, role } = req.body;

    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: 'Email, password, name và role là bắt buộc' });
    }

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email đã tồn tại' });
    }

    const hashedPassword = await hashPassword(password);

    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      phone: phone || null,
      role
    });

    res.status(201).json({
      message: 'Đăng ký thành công',
      userId: user.id
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Lỗi khi đăng ký' });
  }
};

// Login (đã có)
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email và password là bắt buộc' });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Email hoặc password không đúng' });
    }

    const isValidPassword = await comparePassword(password, user.Password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Email hoặc password không đúng' });
    }

    const token = generateToken({
    userId: user.UserID,
    email: user.Email,
    role: user.Role
  });

    res.json({
      message: 'Đăng nhập thành công',
      token,
      user: {
        userId: user.UserID,
        email: user.Email,
        name: user.Name,
        role: user.Role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Lỗi khi đăng nhập' });
  }
};

// Get Profile (đã có)
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    }

    res.json({
      user: {
        userId: user.UserID,
        email: user.Email,
        name: user.Name,
        phone: user.Phone,
        role: user.Role,
        createdAt: user.CreatedAt
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Lỗi khi lấy thông tin người dùng' });
  }
};

// ⭐ THÊM MỚI: Update Profile 
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, phone, currentPassword, newPassword } = req.body;

    // Validate input
    if (!name && !phone && !newPassword) {
      return res.status(400).json({ 
        error: 'Cần ít nhất một trường để cập nhật' 
      });
    }

    // Lấy thông tin user hiện tại
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    }

    // Nếu muốn đổi password, phải verify current password
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ 
          error: 'Cần nhập mật khẩu hiện tại để đổi mật khẩu mới' 
        });
      }

      const isValidPassword = await comparePassword(currentPassword, user.Password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Mật khẩu hiện tại không đúng' });
      }

      const hashedNewPassword = await hashPassword(newPassword);
      await User.updatePassword(userId, hashedNewPassword);
    }

    // Update name và phone
    if (name || phone) {
      await User.update(userId, {
        name: name || user.Name,
        phone: phone || user.Phone
      });
    }

    res.json({ message: 'Cập nhật thông tin thành công' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Lỗi khi cập nhật thông tin' });
  }
};
