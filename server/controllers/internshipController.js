const { validationResult } = require('express-validator');
const Internship = require('../models/Internship');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Create a new internship
// @route   POST /api/internships
// @access  Private (TPO)
const createInternship = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const internshipData = {
      ...req.body,
      postedBy: req.user.userId
    };

    const internship = new Internship(internshipData);
    await internship.save();

    // Notify all TPOs and Admins
    const tpos = await User.find({ role: 'tpo', isActive: true, isApproved: true }).select('_id');
    const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
    const recipients = [...tpos, ...admins];
    const notifications = recipients.map(user => ({
      user: user._id,
      title: 'New Internship Created',
      message: `A new internship "${internship.title}" has been posted.`,
      actionUrl: `/internships/${internship._id}`
    }));
    if (notifications.length > 0) await Notification.insertMany(notifications);

    res.status(201).json({
      message: 'Internship posted successfully',
      internship
    });
  } catch (error) {
    console.error('Create internship error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all internships
// @route   GET /api/internships
// @access  Public
const getAllInternships = async (req, res) => {
  try {
    const { 
      status, 
      company, 
      workMode, 
      page = 1, 
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = { isVisible: true };
    if (status) query.status = status;
    if (company) query.company = { $regex: company, $options: 'i' };
    if (workMode) query.workMode = workMode;

    // If TPO, only show internships posted by this TPO
    if (req.currentUser && req.currentUser.role === 'tpo') {
      query.postedBy = req.user.userId;
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    const internships = await Internship.find(query)
      .populate('postedBy', 'name department')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Internship.countDocuments(query);

    res.json({
      internships,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalInternships: total,
        hasNext: skip + internships.length < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get all internships error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get available internships for students
// @route   GET /api/internships/available
// @access  Private (Student)
const getAvailableInternships = async (req, res) => {
  try {
    const { 
      company, 
      page = 1, 
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Only show active internships that haven't expired
    const query = { 
      status: 'active',
      isVisible: true 
    };
    
    if (company) query.company = { $regex: company, $options: 'i' };

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    const internships = await Internship.find(query)
      .select('title company description externalLink postedBy createdAt')
      .populate('postedBy', 'name department')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Internship.countDocuments(query);

    res.json({
      internships,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalInternships: total,
        hasNext: skip + internships.length < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get available internships error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get internship by ID
// @route   GET /api/internships/:id
// @access  Public
const getInternshipById = async (req, res) => {
  try {
    const internship = await Internship.findById(req.params.id)
      .populate('postedBy', 'name department')
      .populate('interestedStudents.student', 'name email rollNumber branch');

    if (!internship) {
      return res.status(404).json({ message: 'Internship not found' });
    }

    res.json({ internship });
  } catch (error) {
    console.error('Get internship by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update internship
// @route   PUT /api/internships/:id
// @access  Private (TPO - creator only)
const updateInternship = async (req, res) => {
  try {
    const { id } = req.params;
    const internship = await Internship.findById(id);

    if (!internship) {
      return res.status(404).json({ message: 'Internship not found' });
    }

    // Check if user can update this internship
    if (internship.postedBy.toString() !== req.user.userId && req.currentUser.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updatedInternship = await Internship.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    ).populate('postedBy', 'name department');

    res.json({
      message: 'Internship updated successfully',
      internship: updatedInternship
    });
  } catch (error) {
    console.error('Update internship error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete internship
// @route   DELETE /api/internships/:id
// @access  Private (TPO - creator only)
const deleteInternship = async (req, res) => {
  try {
    const { id } = req.params;
    const internship = await Internship.findById(id);

    if (!internship) {
      return res.status(404).json({ message: 'Internship not found' });
    }

    // Check if user can delete this internship
    if (internship.postedBy.toString() !== req.user.userId && req.currentUser.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Internship.findByIdAndDelete(id);

    res.json({ message: 'Internship deleted successfully' });
  } catch (error) {
    console.error('Delete internship error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Show interest in internship
// @route   POST /api/internships/:id/interest
// @access  Private (Student)
const showInterest = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await User.findById(req.user.userId);

    if (!student || student.role !== 'student') {
      return res.status(403).json({ message: 'Only students can show interest in internships' });
    }

    const internship = await Internship.findById(id);
    if (!internship) {
      return res.status(404).json({ message: 'Internship not found' });
    }

    if (internship.status !== 'active') {
      return res.status(400).json({ message: 'This internship is not active' });
    }

    await internship.addInterestedStudent(student._id);

    res.json({
      message: 'Interest shown successfully',
      internship: {
        id: internship._id,
        title: internship.title,
        company: internship.company,
        interestedCount: internship.interestedStudents.length
      }
    });
  } catch (error) {
    console.error('Show interest error:', error);
    if (error.message === 'Student has already shown interest in this internship') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Remove interest from internship
// @route   DELETE /api/internships/:id/interest
// @access  Private (Student)
const removeInterest = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await User.findById(req.user.userId);

    if (!student || student.role !== 'student') {
      return res.status(403).json({ message: 'Only students can remove interest from internships' });
    }

    const internship = await Internship.findById(id);
    if (!internship) {
      return res.status(404).json({ message: 'Internship not found' });
    }

    await internship.removeInterestedStudent(student._id);

    res.json({
      message: 'Interest removed successfully',
      internship: {
        id: internship._id,
        title: internship.title,
        company: internship.company,
        interestedCount: internship.interestedStudents.length
      }
    });
  } catch (error) {
    console.error('Remove interest error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get internships by TPO
// @route   GET /api/internships/my
// @access  Private (TPO)
const getMyInternships = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = { postedBy: req.user.userId };
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const internships = await Internship.find(query)
      .populate('interestedStudents.student', 'name email rollNumber branch')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Internship.countDocuments(query);

    res.json({
      internships,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalInternships: total,
        hasNext: skip + internships.length < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get my internships error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get interested students for internship
// @route   GET /api/internships/:id/interested
// @access  Private (TPO - creator only)
const getInterestedStudents = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const internship = await Internship.findById(id)
      .populate('interestedStudents.student', 'name email rollNumber branch cgpa')
      .populate('postedBy', 'name');

    if (!internship) {
      return res.status(404).json({ message: 'Internship not found' });
    }

    // Check if user can view interested students
    if (internship.postedBy._id.toString() !== req.user.userId && req.currentUser.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const skip = (page - 1) * limit;
    const interestedStudents = internship.interestedStudents.slice(skip, skip + parseInt(limit));

    res.json({
      interestedStudents,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(internship.interestedStudents.length / limit),
        totalStudents: internship.interestedStudents.length,
        hasNext: skip + interestedStudents.length < internship.interestedStudents.length,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get interested students error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get internship statistics
// @route   GET /api/internships/stats
// @access  Private (TPO)
const getInternshipStats = async (req, res) => {
  try {
    const stats = await Internship.aggregate([
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
      stats,
      totalInternships,
      activeInternships,
      totalInterested: totalInterested[0]?.count || 0
    });
  } catch (error) {
    console.error('Get internship stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createInternship,
  getAllInternships,
  getAvailableInternships,
  getInternshipById,
  updateInternship,
  deleteInternship,
  showInterest,
  removeInterest,
  getMyInternships,
  getInterestedStudents,
  getInternshipStats
}; 