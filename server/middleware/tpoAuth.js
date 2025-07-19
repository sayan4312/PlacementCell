const User = require('../models/User');

const tpoAuth = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user || user.role !== 'tpo') {
      return res.status(403).json({ message: 'Access denied. TPO privileges required.' });
    }

    if (!user.isApproved) {
      return res.status(403).json({ message: 'TPO account pending approval.' });
    }

    next();
  } catch (error) {
    console.error('TPO auth middleware error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = tpoAuth;