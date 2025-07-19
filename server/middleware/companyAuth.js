const User = require('../models/User');

const companyAuth = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user || user.role !== 'company') {
      return res.status(403).json({ message: 'Access denied. Company privileges required.' });
    }

    if (!user.isApproved) {
      return res.status(403).json({ message: 'Company account pending approval.' });
    }

    next();
  } catch (error) {
    console.error('Company auth middleware error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = companyAuth;