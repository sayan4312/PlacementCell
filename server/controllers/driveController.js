const { validationResult } = require('express-validator');
const Drive = require('../models/Drive');
const Application = require('../models/Application');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { createGroupsForDrive, addStudentToGroup } = require('./chatController');


// @desc    Create new drive
// @route   POST /api/drives
// @access  Private (Company/TPO)
const createDrive = async (req, res) => {
  try {
    const {
      position,
      description,
      ctc,
      location,
      deadline,
      eligibility,
      requirements,
      benefits,
      companyName,
      externalApplicationUrl
    } = req.body;

    // Validate required fields
    if (!position || !description || !ctc || !location || !deadline || !eligibility || !companyName) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    // Validate external application URL if provided
    if (externalApplicationUrl) {
      const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
      if (!urlPattern.test(externalApplicationUrl)) {
        return res.status(400).json({ message: 'Please provide a valid URL' });
      }
    }

    // Check for existing active drive for this company
    const existingActiveDrive = await Drive.findOne({ companyName, status: 'active' });
    if (existingActiveDrive) {
      return res.status(400).json({ message: 'An active drive already exists for this company.' });
    }

    // Get user info (TPO or Company)
    const user = await User.findById(req.user.userId);
    if (!user || (user.role !== 'company' && user.role !== 'tpo')) {
      return res.status(403).json({ message: 'Only companies and TPOs can create drives' });
    }

    // Map frontend branch names to model enum values
    const branchMapping = {
      'Computer Science': 'CSE',
      'Information Technology': 'IT',
      'Electronics & Communication': 'ECE',
      'Electrical Engineering': 'EEE',
      'Mechanical Engineering': 'ME',
      'Civil Engineering': 'CE',
      'Data Science': 'DS',
      'AIML': 'AIML'
    };

    const mappedBranches = (eligibility.allowedBranches || []).map(branch =>
      branchMapping[branch] || branch
    );



    const driveData = {
      position,
      description,
      company: user._id, // Always set to the creator's user ID (company or TPO)
      companyName: req.body.companyName || user.companyName || '',
      postedBy: user._id,
      ctc,
      location,
      deadline: new Date(deadline),
      eligibility: {
        minCGPA: eligibility.minCGPA || 0,
        allowedBranches: mappedBranches,
        maxBacklogs: eligibility.maxBacklogs || 0,
        minYear: eligibility.minYear || 1
      },
      requirements: requirements || [],
      benefits: benefits || [],
      externalApplicationUrl: externalApplicationUrl || undefined,
      status: 'active',
      isVisible: true
    };

    const drive = new Drive(driveData);
    await drive.save();

    // Notify all TPOs and Admins
    const tpos = await User.find({ role: 'tpo', isActive: true, isApproved: true }).select('_id');
    const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
    const recipients = [...tpos, ...admins];
    const notifications = recipients.map(user => ({
      user: user._id,
      title: 'New Drive Created',
      message: `A new drive "${drive.title || drive.position}" has been created.`,
      actionUrl: `/drives/${drive._id}`
    }));
    if (notifications.length > 0) await Notification.insertMany(notifications);

    // Create notification for new drive
    try {
      await Notification.createDriveNotification(drive._id, 'new_drive', {});
    } catch (notificationError) {
      console.error('Failed to create drive notification:', notificationError);
      // Don't fail the request if notification fails
    }

    // Create chat groups for each allowed branch
    try {
      await createGroupsForDrive(drive, user._id);
      console.log(`Created chat groups for drive: ${drive.companyName} ${drive.position}`);
    } catch (chatError) {
      console.error('Failed to create chat groups:', chatError);
      // Don't fail the request if chat group creation fails
    }

    res.status(201).json({
      message: 'Drive created successfully',
      drive
    });
  } catch (error) {
    console.error('Create drive error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all drives
// @route   GET /api/drives
// @access  Public
const getAllDrives = async (req, res) => {
  try {
    const {
      status,
      company,
      branch,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = { isVisible: true };
    if (status) query.status = status;
    if (company) query.companyName = { $regex: company, $options: 'i' };
    if (branch) query['eligibility.allowedBranches'] = branch;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    const drives = await Drive.find(query)
      .populate('company', 'companyName industry website')
      .populate('postedBy', 'name')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Drive.countDocuments(query);

    res.json({
      drives,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalDrives: total,
        hasNext: skip + drives.length < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get all drives error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get eligible drives for student
// @route   GET /api/drives/eligible
// @access  Private (Student)
const getEligibleDrives = async (req, res) => {
  try {
    const student = await User.findById(req.user.userId);
    if (!student || student.role !== 'student') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Ensure student has required fields
    if (!student.cgpa || !student.branch || !student.year || student.backlogs === undefined) {
      return res.status(400).json({
        message: 'Student profile incomplete. Please update your profile with CGPA, branch, year, and backlogs.'
      });
    }

    // Map student branch to drive enum values
    const branchMapping = {
      'Computer Science': 'CSE',
      'Information Technology': 'IT',
      'Electronics & Communication': 'ECE',
      'Electrical Engineering': 'EEE',
      'Mechanical Engineering': 'ME',
      'Civil Engineering': 'CE',
      'Data Science': 'DS',
      'AIML': 'AIML'
    };

    const studentBranch = branchMapping[student.branch] || student.branch;

    // Convert student year to number if it's a string
    let studentYear = student.year;
    if (typeof studentYear === 'string') {
      // Extract number from strings like "4th Year", "3rd Year", etc.
      const yearMatch = studentYear.match(/(\d+)/);
      if (yearMatch) {
        studentYear = parseInt(yearMatch[1]);
      } else {
        // Default to 4 if we can't parse the year
        studentYear = 4;
      }
    }

    const eligibilityQuery = {
      status: 'active',
      deadline: { $gt: new Date() },
      isVisible: true,
      'eligibility.minCGPA': { $lte: student.cgpa },
      'eligibility.maxBacklogs': { $gte: student.backlogs },
      'eligibility.minYear': { $lte: studentYear },
      $or: [
        { 'eligibility.allowedBranches': 'All' },
        { 'eligibility.allowedBranches': studentBranch }
      ]
    };

    const allEligibleDrives = await Drive.find(eligibilityQuery)
      .populate('company', 'companyName industry website')
      .sort({ priority: -1, createdAt: -1 });

    // Find all applications for this student
    const applications = await Application.find({ student: student._id });
    const appliedDriveIds = new Set(applications.map(app => app.drive.toString()));

    // Add status: 'applied' or 'eligible' to each drive
    const drivesWithStatus = allEligibleDrives.map(drive => {
      const driveObj = drive.toObject();
      driveObj.status = appliedDriveIds.has(drive._id.toString()) ? 'applied' : 'eligible';
      return driveObj;
    });

    res.json({
      drives: drivesWithStatus,
      totalEligible: drivesWithStatus.length
    });
  } catch (error) {
    console.error('Get eligible drives error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get drive by ID
// @route   GET /api/drives/:id
// @access  Public
const getDriveById = async (req, res) => {
  try {
    const drive = await Drive.findById(req.params.id)
      .populate('company', 'companyName industry website description')
      .populate('postedBy', 'name')
      .populate('applicants.student', 'name email rollNumber branch cgpa');

    if (!drive) {
      return res.status(404).json({ message: 'Drive not found' });
    }

    res.json({ drive });
  } catch (error) {
    console.error('Get drive by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update drive
// @route   PUT /api/drives/:id
// @access  Private (TPO/Company - creator only)
const updateDrive = async (req, res) => {
  try {
    const { id } = req.params;
    const drive = await Drive.findById(id);

    if (!drive) {
      return res.status(404).json({ message: 'Drive not found' });
    }

    // Check if user can update this drive
    const creator = await User.findById(drive.postedBy);
    if (
      req.currentUser.role === 'admin' ||
      (req.currentUser.role === 'tpo' && creator && creator.role === 'tpo') ||
      (req.currentUser.role === 'company' && drive.postedBy.toString() === req.user.userId)
    ) {
      // allow update
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Map frontend branch names to model enum values (same as in createDrive)
    const branchMapping = {
      'Computer Science': 'CSE',
      'Information Technology': 'IT',
      'Electronics & Communication': 'ECE',
      'Electrical Engineering': 'EEE',
      'Mechanical Engineering': 'ME',
      'Civil Engineering': 'CE',
      'Data Science': 'DS',
      'AIML': 'AIML'
    };

    if (req.body.eligibility && req.body.eligibility.allowedBranches) {
      req.body.eligibility.allowedBranches = req.body.eligibility.allowedBranches.map(
        branch => branchMapping[branch] || branch
      );
    }

    const updatedDrive = await Drive.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    ).populate('company', 'companyName industry website');

    res.json({
      message: 'Drive updated successfully',
      drive: updatedDrive
    });
  } catch (error) {
    console.error('Update drive error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete drive
// @route   DELETE /api/drives/:id
// @access  Private (TPO/Company - creator only)
const deleteDrive = async (req, res) => {
  try {
    const { id } = req.params;
    const drive = await Drive.findById(id);

    if (!drive) {
      return res.status(404).json({ message: 'Drive not found' });
    }

    // Check if user can delete this drive
    const creator = await User.findById(drive.postedBy);
    if (
      req.currentUser.role === 'admin' ||
      (req.currentUser.role === 'tpo' && creator && creator.role === 'tpo') ||
      (req.currentUser.role === 'company' && drive.postedBy.toString() === req.user.userId)
    ) {
      // allow delete
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Delete all applications for this drive first
    const deletedApplications = await Application.deleteMany({ drive: id });
    console.log(`Deleted ${deletedApplications.deletedCount} applications for drive ${id}`);

    // Delete the drive
    await Drive.findByIdAndDelete(id);

    res.json({
      message: 'Drive deleted successfully',
      deletedApplications: deletedApplications.deletedCount
    });
  } catch (error) {
    console.error('Delete drive error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Apply to drive
// @route   POST /api/drives/:id/apply
// @access  Private (Student)
const applyToDrive = async (req, res) => {
  try {
    const { id } = req.params;

    const drive = await Drive.findById(id);
    if (!drive) {
      return res.status(404).json({ message: 'Drive not found' });
    }

    if (drive.status !== 'active') {
      return res.status(400).json({ message: 'Drive is not active' });
    }

    // Check if deadline has passed
    if (new Date() > new Date(drive.deadline)) {
      return res.status(400).json({ message: 'Application deadline has passed' });
    }

    // Get student info
    const student = await User.findById(req.user.userId);
    if (!student || student.role !== 'student') {
      return res.status(403).json({ message: 'Only students can apply to drives' });
    }

    // Check if already applied
    const existingApplication = await Application.findOne({
      student: student._id,
      drive: drive._id
    });

    if (existingApplication) {
      return res.status(400).json({ message: 'You have already applied to this drive' });
    }

    // Check eligibility
    const isEligible = await drive.checkEligibility(student);
    if (!isEligible.eligible) {
      return res.status(400).json({
        message: 'You are not eligible for this drive',
        reasons: isEligible.reasons
      });
    }

    // Create application
    const application = new Application({
      student: student._id,
      drive: drive._id,
      company: drive.company || undefined,
      status: 'applied'
    });

    await application.save();
    await application.initializeTimeline();

    // Add to drive's applicants
    drive.applicants.push({
      student: student._id,
      appliedAt: new Date()
    });
    await drive.save();

    // Create notification for application submission
    try {
      await Notification.createApplicationNotification(application._id, 'application_submitted');
    } catch (notificationError) {
      console.error('Failed to create application notification:', notificationError);
      // Don't fail the request if notification fails
    }

    // Auto-join student to drive's chat group
    try {
      await addStudentToGroup(drive._id, student._id, student.branch);
      console.log(`Added student ${student.studentId} to chat group for drive ${drive.companyName}`);
    } catch (chatError) {
      console.error('Failed to add student to chat group:', chatError);
      // Don't fail the request if chat join fails
    }

    res.status(201).json({
      message: 'Application submitted successfully',
      application
    });
  } catch (error) {
    console.error('Apply to drive error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Shortlist student for drive
// @route   PATCH /api/drives/:id/shortlist
// @access  Private (TPO/Company)
const shortlistStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { studentId, status } = req.body;

    const drive = await Drive.findById(id);
    if (!drive) {
      return res.status(404).json({ message: 'Drive not found' });
    }

    // Check if user can manage this drive
    if (drive.postedBy.toString() !== req.user.userId && req.currentUser.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update application status in drive
    await drive.updateApplicationStatus(studentId, status);

    // Update application record
    const app = await Application.findOneAndUpdate(
      { student: studentId, drive: id },
      { status },
      { new: true }
    );

    // If status is 'shortlisted', update timeline
    if (app && status === 'shortlisted' && Array.isArray(app.timeline)) {
      const step = app.timeline.find(s => s.step === 'Aptitude & Coding Round');
      if (step) {
        step.completed = true;
        step.date = new Date();
        await app.save();
      }
    }

    res.json({
      message: 'Student status updated successfully',
      status
    });
  } catch (error) {
    console.error('Shortlist student error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get drive applications
// @route   GET /api/drives/:id/applications
// @access  Private (TPO/Company - creator only)
const getDriveApplications = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, page = 1, limit = 10 } = req.query;

    const drive = await Drive.findById(id);
    if (!drive) {
      return res.status(404).json({ message: 'Drive not found' });
    }

    // Check if user can view applications
    if (drive.postedBy.toString() !== req.user.userId && req.currentUser.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get all approved, active students
    const allStudents = await User.find({ role: 'student', isApproved: true, isActive: true }).select('-password');

    // Find all real applications for this drive
    const realApplications = await Application.find({ drive: id })
      .populate('student', 'name email rollNumber branch cgpa')
      .populate('company', 'companyName');

    // Map: studentId -> application
    const appMap = new Map();
    realApplications.forEach(app => {
      appMap.set(app.student._id.toString(), app);
    });

    // Build merged list: if student has applied, use real app; else, create virtual app with status 'pending'
    const mergedApplications = allStudents
      .filter(student => drive.isStudentEligible(student))
      .map(student => {
        const app = appMap.get(student._id.toString());
        if (app) {
          // Use the real application's status (should be 'applied' after applying)
          return app;
        }
        // Virtual application for eligible but not applied
        return {
          _id: 'virtual-' + student._id,
          student,
          drive: id,
          company: drive.company,
          status: 'pending',
          appliedAt: null
        };
      });

    // Optionally filter by status
    const filtered = status && status !== 'all'
      ? mergedApplications.filter(app => app.status === status)
      : mergedApplications;

    // Pagination
    const paged = filtered.slice((page - 1) * limit, page * limit);

    res.json({
      applications: paged,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(filtered.length / limit),
        totalApplications: filtered.length,
        hasNext: (page * limit) < filtered.length,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get drive applications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get drive statistics
// @route   GET /api/drives/:id/stats
// @access  Private (TPO/Company - creator only)
const getDriveStats = async (req, res) => {
  try {
    const { id } = req.params;
    const drive = await Drive.findById(id);

    if (!drive) {
      return res.status(404).json({ message: 'Drive not found' });
    }

    // Check if user can view stats
    if (drive.postedBy.toString() !== req.user.userId && req.currentUser.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const stats = await Application.aggregate([
      { $match: { drive: drive._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalApplications = drive.applicants.length;
    const shortlistedCount = drive.shortlistedCount;
    const selectedCount = drive.selectedCount;

    res.json({
      stats,
      totalApplications,
      shortlistedCount,
      selectedCount,
      drive: {
        id: drive._id,
        title: drive.title,
        status: drive.status,
        deadline: drive.deadline
      }
    });
  } catch (error) {
    console.error('Get drive stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// List all companies (for TPO drive creation dropdown)
const listAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find().sort({ name: 1 });
    res.json({ companies });
  } catch (error) {
    console.error('List all companies error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createDrive,
  getAllDrives,
  getEligibleDrives,
  getDriveById,
  updateDrive,
  deleteDrive,
  applyToDrive,
  shortlistStudent,
  getDriveApplications,
  getDriveStats,
  listAllCompanies
}; 