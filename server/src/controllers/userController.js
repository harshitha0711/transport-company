const User = require('../models/User');

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Manager/Admin)
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .select('-passwordHash')
      .populate('branch', 'name city code')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new user
// @route   POST /api/users
// @access  Private (Manager/Admin)
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, branch, phone } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists',
      });
    }

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: role || 'STAFF',
      branch: branch || null,
      phone,
    });

    const populated = await User.findById(user._id)
      .select('-passwordHash')
      .populate('branch', 'name city code');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Manager/Admin)
const updateUser = async (req, res, next) => {
  try {
    const updates = { ...req.body };
    if (updates.password) {
      updates.passwordHash = await User.hashPassword(updates.password);
      delete updates.password;
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    })
      .select('-passwordHash')
      .populate('branch', 'name city code');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin)
const deleteUser = async (req, res, next) => {
  try {
    if (req.user.id === req.params.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account',
      });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
};
