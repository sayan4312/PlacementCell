const User = require('../models/User');

const adminAuth = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// New middleware: allowAdminOrTPO
const allowAdminOrTPO = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || (user.role !== 'admin' && user.role !== 'tpo')) {
      return res.status(403).json({ message: 'Access denied: Insufficient permissions' });
    }
    next();
  } catch (error) {
    console.error('Admin/TPO auth middleware error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { adminAuth, allowAdminOrTPO };