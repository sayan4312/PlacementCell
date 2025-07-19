const express = require('express');
const { body } = require('express-validator');
const internshipController = require('../controllers/internshipController');
const auth = require('../middleware/auth');
const { authorizeTPO, authorizeStudent } = require('../middleware/role');

const router = express.Router();

// @route   POST /api/internships
// @desc    Create a new internship
// @access  Private (TPO)
router.post('/', [
  auth,
  authorizeTPO,
  body('title').trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
  body('company').trim().isLength({ min: 2 }).withMessage('Company name must be at least 2 characters'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('externalLink').isURL().withMessage('External link must be a valid URL')
], internshipController.createInternship);

// @route   GET /api/internships
// @desc    Get all internships
// @access  Public
router.get('/', internshipController.getAllInternships);

// @route   GET /api/internships/available
// @desc    Get available internships for students
// @access  Private (Student)
router.get('/available', auth, authorizeStudent, internshipController.getAvailableInternships);

// @route   GET /api/internships/my
// @desc    Get internships by TPO
// @access  Private (TPO)
router.get('/my', auth, authorizeTPO, internshipController.getMyInternships);

// @route   GET /api/internships/stats
// @desc    Get internship statistics
// @access  Private (TPO)
router.get('/stats', auth, authorizeTPO, internshipController.getInternshipStats);

// @route   GET /api/internships/:id/interested
// @desc    Get interested students for internship
// @access  Private (TPO - creator only)
router.get('/:id/interested', auth, authorizeTPO, internshipController.getInterestedStudents);

// @route   GET /api/internships/:id
// @desc    Get internship by ID
// @access  Public
router.get('/:id', internshipController.getInternshipById);

// @route   PUT /api/internships/:id
// @desc    Update internship
// @access  Private (TPO - creator only)
router.put('/:id', [
  auth,
  authorizeTPO,
  body('title').optional().trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
  body('company').optional().trim().isLength({ min: 2 }).withMessage('Company name must be at least 2 characters'),
  body('description').optional().trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('externalLink').optional().isURL().withMessage('External link must be a valid URL')
], internshipController.updateInternship);

// @route   DELETE /api/internships/:id
// @desc    Delete internship
// @access  Private (TPO - creator only)
router.delete('/:id', auth, authorizeTPO, internshipController.deleteInternship);

// @route   POST /api/internships/:id/interest
// @desc    Show interest in internship
// @access  Private (Student)
router.post('/:id/interest', auth, authorizeStudent, internshipController.showInterest);

// @route   DELETE /api/internships/:id/interest
// @desc    Remove interest from internship
// @access  Private (Student)
router.delete('/:id/interest', auth, authorizeStudent, internshipController.removeInterest);

module.exports = router; 