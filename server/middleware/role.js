const User = require('../models/User');

// Role-based authorization middleware
const authorizeRole = (...roles) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user.userId);
      
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      if (!user.isActive) {
        return res.status(403).json({ message: 'Account has been deactivated' });
      }

      if (!roles.includes(user.role)) {
        return res.status(403).json({ 
          message: `Access denied. Required roles: ${roles.join(', ')}` 
        });
      }

      // Additional role-specific checks
      if (user.role === 'student' && !user.isApproved) {
        return res.status(403).json({ message: 'Student account pending approval' });
      }

      if ((user.role === 'company' || user.role === 'tpo') && !user.isApproved) {
        return res.status(403).json({ message: 'Account pending approval' });
      }

      req.currentUser = user;
      next();
    } catch (error) {
      console.error('Role authorization error:', error);
      res.status(500).json({ message: 'Server error during authorization' });
    }
  };
};

// Specific role middlewares
const authorizeAdmin = authorizeRole('admin');
const authorizeTPO = authorizeRole('tpo');
const authorizeCompany = authorizeRole('company');
const authorizeStudent = authorizeRole('student');
async function authorizeTPOOrCompany(req, res, next) {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account has been deactivated' });
    }

    if (user.role !== 'tpo' && user.role !== 'company') {
      return res.status(403).json({ message: 'Access denied. Required roles: tpo or company' });
    }

    if (!user.isApproved) {
      return res.status(403).json({ message: 'Account pending approval' });
    }

    req.currentUser = user;
    next();
  } catch (error) {
    console.error('TPO/Company authorization error:', error);
    res.status(500).json({ message: 'Server error during authorization' });
  }
}
const authorizeTPOOrAdmin = authorizeRole('tpo', 'admin');

module.exports = {
  authorizeRole,
  authorizeAdmin,
  authorizeTPO,
  authorizeCompany,
  authorizeStudent,
  authorizeTPOOrCompany,
  authorizeTPOOrAdmin,
  // Aliases for compatibility
  adminAuth: authorizeAdmin,
  tpoAuth: authorizeTPO
}; 