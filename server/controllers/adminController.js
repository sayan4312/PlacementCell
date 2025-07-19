const { validationResult } = require('express-validator');
const User = require('../models/User');
const Drive = require('../models/Drive');
const Internship = require('../models/Internship');
const Application = require('../models/Application');

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/stats
// @access  Private (Admin)
const getAdminStats = async (req, res) => {
  try {
    // User statistics
    const userStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          approved: {
            $sum: { $cond: ['$isApproved', 1, 0] }
          },
          active: {
            $sum: { $cond: ['$isActive', 1, 0] }
          }
        }
      }
    ]);

    // Drive statistics
    const driveStats = await Drive.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Internship statistics
    const internshipStats = await Internship.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Application statistics
    const applicationStats = await Application.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Recent activity
    const recentUsers = await User.find()
      .select('name email role createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentDrives = await Drive.find()
      .select('title companyName status createdAt')
      .populate('company', 'companyName')
      .sort({ createdAt: -1 })
      .limit(5);

    const pendingApprovals = await User.countDocuments({ 
      isApproved: false, 
      role: { $in: ['company', 'tpo'] } 
    });

    const totalUsers = await User.countDocuments();
    const totalDrives = await Drive.countDocuments();
    const totalInternships = await Internship.countDocuments();
    const totalApplications = await Application.countDocuments();

    res.json({
      userStats,
      driveStats,
      internshipStats,
      applicationStats,
      recentUsers,
      recentDrives,
      pendingApprovals,
      totals: {
        users: totalUsers,
        drives: totalDrives,
        internships: totalInternships,
        applications: totalApplications
      }
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create TPO account
// @route   POST /api/admin/tpo
// @access  Private (Admin)
const createTPO = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { name, email, password, department, experience, qualification, specialization } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const tpoData = {
      name,
      email,
      password,
      role: 'tpo',
      department,
      experience,
      qualification,
      specialization,
      isApproved: true,
      isActive: true
    };

    const tpo = new User(tpoData);
    await tpo.save();

    // Notify all admins
    const Notification = require('../models/Notification');
    const User = require('../models/User');
    const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
    const notifications = admins.map(admin => ({
      user: admin._id,
      title: 'New TPO Created',
      message: `A new TPO "${tpo.name}" has been created.`,
      actionUrl: '/admin/tpos'
    }));
    if (notifications.length > 0) await Notification.insertMany(notifications);

    const userResponse = tpo.toObject();
    delete userResponse.password;

    res.status(201).json({
      message: 'TPO account created successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('Create TPO error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Approve/block user
// @route   PATCH /api/admin/users/:id/approve
// @access  Private (Admin)
const approveUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { isApproved, isActive } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (isApproved !== undefined) user.isApproved = isApproved;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      message: 'User status updated successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Change user role
// @route   PATCH /api/admin/users/:id/role
// @access  Private (Admin)
const changeUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['student', 'company', 'tpo', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = role;
    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      message: 'User role updated successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('Change user role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all users with filters
// @route   GET /api/admin/users
// @access  Private (Admin)
const getAllUsers = async (req, res) => {
  try {
    const { 
      role, 
      status, 
      search, 
      page = 1, 
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    if (role) query.role = role;
    if (status === 'approved') query.isApproved = true;
    if (status === 'pending') query.isApproved = false;
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    const users = await User.find(query)
      .select('-password')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasNext: skip + users.length < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get drive statistics for admin
// @route   GET /api/admin/drives/stats
// @access  Private (Admin)
const getDriveStats = async (req, res) => {
  try {
    const driveStats = await Drive.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const applicationStats = await Application.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalDrives = await Drive.countDocuments();
    const totalApplications = await Application.countDocuments();
    const activeDrives = await Drive.countDocuments({ status: 'active' });

    res.json({
      driveStats,
      applicationStats,
      totals: {
        drives: totalDrives,
        applications: totalApplications,
        activeDrives
      }
    });
  } catch (error) {
    console.error('Get drive stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get internship statistics for admin
// @route   GET /api/admin/internships/stats
// @access  Private (Admin)
const getInternshipStats = async (req, res) => {
  try {
    const internshipStats = await Internship.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalInternships = await Internship.countDocuments();
    const activeInternships = await Internship.countDocuments({ status: 'active' });
    const totalInterested = await Internship.aggregate([
      { $unwind: '$interestedStudents' },
      { $group: { _id: null, count: { $sum: 1 } } }
    ]);

    res.json({
      internshipStats,
      totals: {
        internships: totalInternships,
        activeInternships,
        totalInterested: totalInterested[0]?.count || 0
      }
    });
  } catch (error) {
    console.error('Get internship stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Bulk approve users
// @route   POST /api/admin/users/bulk-approve
// @access  Private (Admin)
const bulkApproveUsers = async (req, res) => {
  try {
    const { userIds, isApproved } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'User IDs array is required' });
    }

    const result = await User.updateMany(
      { _id: { $in: userIds } },
      { isApproved }
    );

    res.json({
      message: `Successfully updated ${result.modifiedCount} users`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Bulk approve users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAdminStats,
  createTPO,
  approveUser,
  changeUserRole,
  getAllUsers,
  getDriveStats,
  getInternshipStats,
  bulkApproveUsers
}; 