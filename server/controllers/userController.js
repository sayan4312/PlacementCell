const { validationResult } = require('express-validator');
const User = require('../models/User');
const upload = require('../middleware/upload');
const { uploadToCloudinary } = require('../config/cloudinary');
const fs = require('fs');

// @desc    Get logged-in user info
// @route   GET /api/users/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private (Admin)
const getAllUsers = async (req, res) => {
  try {
    const { role, status, page = 1, limit = 10 } = req.query;
    
    const query = {};
    if (role) query.role = role;
    if (status) query.isApproved = status === 'approved';

    const skip = (page - 1) * limit;
    
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
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

// @desc    Get users by role
// @route   GET /api/users/role/:role
// @access  Private (Admin/TPO)
const getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;
    const { status, page = 1, limit = 10 } = req.query;
    
    const query = { role };
    if (status) query.isApproved = status === 'approved';

    const skip = (page - 1) * limit;
    
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
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
    console.error('Get users by role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Approve/block user (Admin only)
// @route   PATCH /api/users/:id/approve
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

// @desc    Create TPO account (Admin only)
// @route   POST /api/users/tpo
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
      isActive: true,
      requiresPasswordChange: true // Force password change on first login
    };

    const tpo = new User(tpoData);
    await tpo.save();

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

// @desc    Create Student account (TPO only)
// @route   POST /api/users/student
// @access  Private (TPO)
const createStudentByTPO = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    const { name, email, studentId, branch, year, cgpa, backlogs, phone, address } = req.body;
    // Check if student already exists
    const existingStudent = await User.findOne({
      $or: [
        { email },
        { studentId }
      ]
    });
    if (existingStudent) {
      return res.status(400).json({ message: 'Student already exists with this email or student ID' });
    }
    const studentData = {
      name,
      email,
      studentId,
      branch,
      year,
      cgpa,
      backlogs,
      phone,
      address,
      password: 'student123', // Default password
      role: 'student',
      isApproved: true,
      isActive: true,
      requiresPasswordChange: true // Force password change on first login
    };
    const student = new User(studentData);
    await student.save();
    const studentResponse = student.toObject();
    delete studentResponse.password;
    res.status(201).json({
      message: 'Student account created successfully',
      student: studentResponse,
      defaultPassword: 'student123'
    });
  } catch (error) {
    console.error('Create Student error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/:id
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Users can only update their own profile unless they're admin
    if (req.currentUser.role !== 'admin' && req.currentUser._id.toString() !== id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Remove sensitive fields that shouldn't be updated via this route
    delete updateData.password;
    delete updateData.role;
    delete updateData.isApproved;
    delete updateData.isActive;

    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Recalculate profile score for students
    if (user.role === 'student') {
      user.calculateProfileScore();
      await user.save();
    }

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Upload resume
// @route   POST /api/users/resume
// @access  Private (Student)
const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a resume file' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can upload resumes' });
    }

    // Upload to Cloudinary
    const cloudinaryResult = await uploadToCloudinary(req.file, 'resumes');

    // Delete local file after upload (promise version)
    try {
      console.log('Deleting local file:', req.file.path);
      await fs.promises.unlink(req.file.path);
    } catch (err) {
      console.error('Error deleting local resume file:', err);
    }

    user.resume = {
      filename: req.file.originalname,
      uploadDate: new Date(),
      size: `${(req.file.size / 1024 / 1024).toFixed(2)} MB`,
      url: cloudinaryResult.url,
      public_id: cloudinaryResult.public_id
    };

    // Recalculate profile score
    user.calculateProfileScore();
    await user.save();

    res.json({
      message: 'Resume uploaded successfully',
      resume: user.resume
    });
  } catch (error) {
    console.error('Upload resume error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get eligible students for drive
// @route   GET /api/users/eligible/:driveId
// @access  Private (TPO/Company)
const getEligibleStudents = async (req, res) => {
  try {
    const { driveId } = req.params;
    const Drive = require('../models/Drive');
    
    const drive = await Drive.findById(driveId);
    if (!drive) {
      return res.status(404).json({ message: 'Drive not found' });
    }

    // Get all approved students
    const students = await User.find({ 
      role: 'student', 
      isApproved: true, 
      isActive: true 
    }).select('-password');

    // Filter eligible students
    const eligibleStudents = students.filter(student => {
      return drive.isStudentEligible(student);
    });

    res.json({
      eligibleStudents,
      totalEligible: eligibleStudents.length,
      drive: {
        id: drive._id,
        title: drive.title,
        eligibility: drive.eligibility
      }
    });
  } catch (error) {
    console.error('Get eligible students error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private (Admin)
const getUserStats = async (req, res) => {
  try {
    const statsRaw = await User.aggregate([
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

    const totalUsers = await User.countDocuments();
    const pendingApprovals = await User.countDocuments({ 
      isApproved: false, 
      role: { $in: ['company', 'tpo'] } 
    });

    // Map roles to icons and colors
    const roleMeta = {
      admin: { icon: 'Shield', color: 'purple', label: 'Admins', description: 'Total admin users' },
      tpo: { icon: 'Users', color: 'blue', label: 'TPOs', description: 'Training & Placement Officers' },
      student: { icon: 'GraduationCap', color: 'green', label: 'Students', description: 'Registered students' },
      company: { icon: 'Building2', color: 'orange', label: 'Companies', description: 'Recruiting companies' }
    };

    // Build stats array for frontend
    const stats = statsRaw.map(stat => ({
      value: stat.count,
      label: roleMeta[stat._id]?.label || stat._id,
      description: roleMeta[stat._id]?.description || '',
      icon: roleMeta[stat._id]?.icon || 'Users',
      color: roleMeta[stat._id]?.color || 'gray',
      change: '', // You can add logic for change if needed
    }));

    res.json({
      stats,
      totalUsers,
      pendingApprovals
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Add skill to user profile
// @route   POST /api/users/skills
// @access  Private (Student)
const addSkill = async (req, res) => {
  try {
    const { skill } = req.body;

    if (!skill || !skill.trim()) {
      return res.status(400).json({ message: 'Skill is required' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can add skills' });
    }

    // Check if skill already exists
    if (user.skills && user.skills.includes(skill.trim())) {
      return res.status(400).json({ message: 'Skill already exists' });
    }

    if (!user.skills) {
      user.skills = [];
    }

    user.skills.push(skill.trim());
    user.calculateProfileScore();
    await user.save();

    res.json({
      message: 'Skill added successfully',
      skills: user.skills,
      profileScore: user.profileScore
    });
  } catch (error) {
    console.error('Add skill error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Remove skill from user profile
// @route   DELETE /api/users/skills/:skill
// @access  Private (Student)
const removeSkill = async (req, res) => {
  try {
    const { skill } = req.params;

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can remove skills' });
    }

    if (!user.skills || !user.skills.includes(skill)) {
      return res.status(404).json({ message: 'Skill not found' });
    }

    user.skills = user.skills.filter(s => s !== skill);
    user.calculateProfileScore();
    await user.save();

    res.json({
      message: 'Skill removed successfully',
      skills: user.skills,
      profileScore: user.profileScore
    });
  } catch (error) {
    console.error('Remove skill error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Add project to user profile
// @route   POST /api/users/projects
// @access  Private (Student)
const addProject = async (req, res) => {
  try {
    const { name, tech, description, github } = req.body;

    if (!name || !tech || !description) {
      return res.status(400).json({ message: 'Name, tech, and description are required' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can add projects' });
    }

    if (!user.projects) {
      user.projects = [];
    }

    const newProject = {
      name: name.trim(),
      tech: tech.trim(),
      description: description.trim(),
      github: github ? github.trim() : ''
    };

    user.projects.push(newProject);
    user.calculateProfileScore();
    await user.save();

    res.json({
      message: 'Project added successfully',
      projects: user.projects,
      profileScore: user.profileScore
    });
  } catch (error) {
    console.error('Add project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Remove project from user profile
// @route   DELETE /api/users/projects/:id
// @access  Private (Student)
const removeProject = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can remove projects' });
    }

    if (!user.projects || !user.projects[id]) {
      return res.status(404).json({ message: 'Project not found' });
    }

    user.projects.splice(parseInt(id), 1);
    user.calculateProfileScore();
    await user.save();

    res.json({
      message: 'Project removed successfully',
      projects: user.projects,
      profileScore: user.profileScore
    });
  } catch (error) {
    console.error('Remove project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update project in user profile
// @route   PUT /api/users/projects/:id
// @access  Private (Student)
const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, tech, description, github } = req.body;

    if (!name || !tech || !description) {
      return res.status(400).json({ message: 'Name, tech, and description are required' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can update projects' });
    }

    if (!user.projects || !user.projects[id]) {
      return res.status(404).json({ message: 'Project not found' });
    }

    user.projects[id] = {
      name: name.trim(),
      tech: tech.trim(),
      description: description.trim(),
      github: github ? github.trim() : ''
    };

    user.calculateProfileScore();
    await user.save();

    res.json({
      message: 'Project updated successfully',
      projects: user.projects,
      profileScore: user.profileScore
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getMe,
  getAllUsers,
  getUsersByRole,
  approveUser,
  createTPO,
  createStudentByTPO,
  updateProfile,
  uploadResume,
  getEligibleStudents,
  getUserStats,
  addSkill,
  removeSkill,
  addProject,
  removeProject,
  updateProject
}; 