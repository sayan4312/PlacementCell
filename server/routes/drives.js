const express = require('express');
const { body } = require('express-validator');
const driveController = require('../controllers/driveController');
const auth = require('../middleware/auth');
const { authorizeTPOOrCompany, authorizeStudent } = require('../middleware/role');

const router = express.Router();

// @route   POST /api/drives
// @desc    Create a new drive
// @access  Private (TPO/Company)
router.post('/', [
  auth,
  authorizeTPOOrCompany,
  body('title').trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
  body('position').trim().isLength({ min: 2 }).withMessage('Position must be at least 2 characters'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('ctc').isString().withMessage('CTC must be a string'),
  body('location').isString().withMessage('Location must be a string'),
  body('deadline').custom((value) => {
    if (!value) return false;
    const date = new Date(value);
    return !isNaN(date.getTime());
  }).withMessage('Deadline must be a valid date'),
  body('eligibility.minCGPA').isFloat({ min: 0, max: 10 }).withMessage('Min CGPA must be between 0 and 10'),
  body('eligibility.allowedBranches').isArray().withMessage('Allowed branches must be an array'),
  body('eligibility.maxBacklogs').isInt({ min: 0 }).withMessage('Max backlogs must be a non-negative integer'),
  body('eligibility.minYear').isInt({ min: 1, max: 4 }).withMessage('Min year must be between 1 and 4'),
  body('externalApplicationUrl').optional().isURL().withMessage('External application URL must be a valid URL')
], driveController.createDrive);

// @route   GET /api/drives
// @desc    Get all drives
// @access  Public
router.get('/', driveController.getAllDrives);

// @route   GET /api/drives/eligible
// @desc    Get eligible drives for student
// @access  Private (Student)
router.get('/eligible', auth, authorizeStudent, driveController.getEligibleDrives);

// @route   POST /api/drives/:id/apply
// @desc    Apply to drive
// @access  Private (Student)
router.post('/:id/apply', auth, authorizeStudent, driveController.applyToDrive);

// @route   GET /api/drives/:id
// @desc    Get drive by ID
// @access  Public
router.get('/:id', driveController.getDriveById);

// @route   PUT /api/drives/:id
// @desc    Update drive
// @access  Private (TPO/Company - creator only)
router.put('/:id', [
  auth,
  authorizeTPOOrCompany,
  body('title').optional().trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
  body('position').optional().trim().isLength({ min: 2 }).withMessage('Position must be at least 2 characters'),
  body('description').optional().trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('ctc').optional().isString().withMessage('CTC must be a string'),
  body('location').optional().isString().withMessage('Location must be a string'),
  body('deadline').optional().custom((value) => {
    if (!value) return true; // Optional field
    const date = new Date(value);
    return !isNaN(date.getTime());
  }).withMessage('Deadline must be a valid date'),
  body('eligibility.minCGPA').optional().isFloat({ min: 0, max: 10 }).withMessage('Min CGPA must be between 0 and 10'),
  body('eligibility.allowedBranches').optional().isArray().withMessage('Allowed branches must be an array'),
  body('eligibility.maxBacklogs').optional().isInt({ min: 0 }).withMessage('Max backlogs must be a non-negative integer'),
  body('eligibility.minYear').optional().isInt({ min: 1, max: 4 }).withMessage('Min year must be between 1 and 4')
], driveController.updateDrive);

// @route   DELETE /api/drives/:id
// @desc    Delete drive
// @access  Private (TPO/Company - creator only)
router.delete('/:id', auth, authorizeTPOOrCompany, driveController.deleteDrive);

// @route   GET /api/drives/:id/applications
// @desc    Get drive applications
// @access  Private (TPO/Company - creator only)
router.get('/:id/applications', auth, authorizeTPOOrCompany, driveController.getDriveApplications);

module.exports = router; 