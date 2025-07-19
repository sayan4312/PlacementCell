const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { email, password, role } = req.body;

    console.log('[LOGIN] Attempt:', { email, role });
    // Always find user by email and role
    const user = await User.findOne({ email, role });
    
    console.log('[LOGIN] User found:', user ? user.email : null, user ? user.role : null);

    if (!user) {
      console.log('[LOGIN] No user found for email/role');
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    console.log('[LOGIN] Password valid:', isPasswordValid);
    if (!isPasswordValid) {
      console.log('[LOGIN] Invalid password');
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    // Check if user is approved (except for students who are auto-approved)
    if (!user.isApproved && role !== 'student') {
      console.log('[LOGIN] Not approved');
      return res.status(403).json({ 
        success: false,
        message: 'Account pending approval. Please contact administrator.' 
      });
    }

    // Check if user is active
    if (!user.isActive) {
      console.log('[LOGIN] Not active');
      return res.status(403).json({ 
        success: false,
        message: 'Account has been deactivated. Please contact administrator.' 
      });
    }

    // Update last active
    user.updateLastActive();

    const token = generateToken(user._id);

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      message: 'Login successful',
      user: userResponse,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during login' 
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    res.json({ 
      success: true,
      user 
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    // Update last active time
    await User.findByIdAndUpdate(req.user.userId, { lastActive: new Date() });
    
    res.json({ 
      success: true,
      message: 'Logout successful' 
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during logout' 
    });
  }
};

// @desc    Change user password
// @route   POST /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // For first-time password change (students and TPOs), skip current password check
    if ((user.role === 'student' || user.role === 'tpo') && user.requiresPasswordChange) {
      // Update password and mark as changed
      user.password = newPassword;
      user.requiresPasswordChange = false;
      await user.save();

      res.json({ 
        success: true,
        message: 'Password set successfully' 
      });
    } else {
      // Regular password change - verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ 
          success: false,
          message: 'Current password is incorrect' 
        });
      }

      // Update password
      user.password = newPassword;
      await user.save();

      res.json({ 
        success: true,
        message: 'Password changed successfully' 
      });
    }
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during password change' 
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { name, ...updateData } = req.body;
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Update allowed fields
    if (name) user.name = name;
    
    // Role-specific updates
    if (user.role === 'student') {
      if (updateData.studentId) user.studentId = updateData.studentId;
      if (updateData.branch) user.branch = updateData.branch;
      if (updateData.year) user.year = updateData.year;
    }
    
    if (user.role === 'company') {
      if (updateData.companyName) user.companyName = updateData.companyName;
      if (updateData.industry) user.industry = updateData.industry;
      if (updateData.website) user.website = updateData.website;
    }

    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during profile update' 
    });
  }
};

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Private
const refreshToken = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during token refresh' 
    });
  }
};

module.exports = {
  login,
  getMe,
  logout,
  changePassword,
  updateProfile,
  refreshToken
}; 