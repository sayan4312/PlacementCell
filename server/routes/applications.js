const express = require('express');
const { body } = require('express-validator');
const Application = require('../models/Application');
const Drive = require('../models/Drive');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { authorizeStudent, authorizeTPOOrCompany } = require('../middleware/role');
const { adminAuth, allowAdminOrTPO } = require('../middleware/adminAuth');
const applicationController = require('../controllers/applicationController');
const multer = require('multer');
const upload = multer();

const router = express.Router();

// @desc    Get student's applications
// @route   GET /api/applications/mine
// @access  Private (Student)
const getMyApplications = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    // Convert string ID to ObjectId
    const mongoose = require('mongoose');
    const studentId = new mongoose.Types.ObjectId(req.user.userId);
    
    const query = { student: studentId };
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const applications = await Application.find(query)
      .populate('drive', 'title companyName position ctc deadline status')
      .populate('company', 'companyName industry')
      .sort({ appliedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Application.countDocuments(query);

    res.json({
      applications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalApplications: total,
        hasNext: skip + applications.length < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get my applications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get application by ID
// @route   GET /api/applications/:id
// @access  Private
const getApplicationById = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('student', 'name email rollNumber branch cgpa skills projects')
      .populate('drive', 'title companyName position ctc deadline eligibility')
      .populate('company', 'companyName industry website');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if user has permission to view this application
    const user = await User.findById(req.user.userId);
    if (user.role === 'student' && application.student._id.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if ((user.role === 'company' || user.role === 'tpo') && application.company._id.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ application });
  } catch (error) {
    console.error('Get application by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update application status
// @route   PATCH /api/applications/:id/status
// @access  Private (TPO/Company)
const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, feedback, notes } = req.body;

    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if user has permission to update this application
    const user = await User.findById(req.user.userId);
    if ((user.role === 'company' || user.role === 'tpo') && application.company.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const oldStatus = application.status;
    application.status = status;
    if (feedback) application.feedback = feedback;
    if (notes) application.notes = notes;
    application.updatedBy = req.user.userId;

    await application.save();

    // Update timeline based on status
    if (status === 'shortlisted') {
      await application.updateTimelineStep('Resume Screening', true, 'Shortlisted for next round');
    } else if (status === 'selected') {
      await application.updateTimelineStep('Final Result', true, 'Selected for the position');
    } else if (status === 'rejected') {
      await application.updateTimelineStep('Final Result', true, 'Application rejected');
    }

    // Create notification for status change
    if (oldStatus !== status) {
      const Notification = require('../models/Notification');
      let notificationType = '';
      
      switch (status) {
        case 'shortlisted':
          notificationType = 'application_shortlisted';
          break;
        case 'selected':
          notificationType = 'application_selected';
          break;
        case 'rejected':
          notificationType = 'application_rejected';
          break;
        default:
          notificationType = 'application_submitted';
      }

      try {
        await Notification.createApplicationNotification(application._id, notificationType, {
          feedback,
          notes
        });
      } catch (notificationError) {
        console.error('Failed to create notification:', notificationError);
        // Don't fail the request if notification fails
      }
    }

    res.json({
      message: 'Application status updated successfully',
      application
    });
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Schedule interview
// @route   POST /api/applications/:id/interview
// @access  Private (TPO/Company)
const scheduleInterview = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, time, venue, type, link, instructions } = req.body;

    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if user has permission to schedule interview
    const user = await User.findById(req.user.userId);
    if ((user.role === 'company' || user.role === 'tpo') && application.company.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await application.scheduleInterview({
      date,
      time,
      venue,
      type,
      link,
      instructions
    });

    // Create notification for interview scheduling
    const Notification = require('../models/Notification');
    try {
      await Notification.createApplicationNotification(application._id, 'interview_scheduled', {
        date,
        time,
        venue,
        type,
        link,
        instructions
      });
    } catch (notificationError) {
      console.error('Failed to create interview notification:', notificationError);
      // Don't fail the request if notification fails
    }

    res.json({
      message: 'Interview scheduled successfully',
      application
    });
  } catch (error) {
    console.error('Schedule interview error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get application statistics
// @route   GET /api/applications/stats
// @access  Private (Student)
const getApplicationStats = async (req, res) => {
  try {
    // Convert string ID to ObjectId
    const mongoose = require('mongoose');
    const studentId = new mongoose.Types.ObjectId(req.user.userId);

    const stats = await Application.aggregate([
      { $match: { student: studentId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalApplications = await Application.countDocuments({ student: studentId });
    const recentApplications = await Application.find({ student: studentId })
      .populate('drive', 'title companyName')
      .sort({ appliedAt: -1 })
      .limit(5);

    res.json({
      stats,
      totalApplications,
      recentApplications
    });
  } catch (error) {
    console.error('Get application stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Withdraw application
// @route   DELETE /api/applications/:id
// @access  Private (Student)
const withdrawApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if user owns this application
    if (application.student.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if application can be withdrawn
    if (application.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot withdraw application at this stage' });
    }

    application.status = 'withdrawn';
    await application.save();

    // Remove from drive's applicants
    const drive = await Drive.findById(application.drive);
    if (drive) {
      drive.applicants = drive.applicants.filter(app => 
        app.student.toString() !== req.user.userId
      );
      await drive.save();
    }

    res.json({
      message: 'Application withdrawn successfully',
      application
    });
  } catch (error) {
    console.error('Withdraw application error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Routes
router.get('/mine', auth, authorizeStudent, getMyApplications);
router.get('/stats', auth, applicationController.getStudentApplicationStats);
router.get('/', auth, allowAdminOrTPO, applicationController.getAllApplications);
router.get('/:id', auth, getApplicationById);
router.patch('/:id/status', [
  auth,
  authorizeTPOOrCompany,
  body('status').isIn(['pending', 'shortlisted', 'rejected', 'selected']).withMessage('Invalid status'),
  body('feedback').optional().isString().withMessage('Feedback must be a string'),
  body('notes').optional().isString().withMessage('Notes must be a string')
], updateApplicationStatus);
router.post('/:id/interview', [
  auth,
  authorizeTPOOrCompany,
  body('date').isISO8601().withMessage('Valid date is required'),
  body('time').isString().withMessage('Time is required'),
  body('venue').isString().withMessage('Venue is required'),
  body('type').isIn(['online', 'offline']).withMessage('Type must be online or offline'),
  body('link').optional().isURL().withMessage('Link must be a valid URL'),
  body('instructions').optional().isString().withMessage('Instructions must be a string')
], scheduleInterview);
router.post('/import-shortlist', auth, authorizeTPOOrCompany, upload.single('file'), applicationController.importShortlist);
router.get('/stats', auth, authorizeStudent, getApplicationStats);
router.delete('/:id', auth, authorizeStudent, withdrawApplication);

module.exports = router; 