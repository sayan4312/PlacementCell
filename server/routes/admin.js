const express = require('express');
const { body } = require('express-validator');
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');
const { authorizeAdmin } = require('../middleware/role');

const router = express.Router();

// @route   GET /api/admin/stats
// @desc    Get admin dashboard statistics
// @access  Private (Admin)
router.get('/stats', auth, authorizeAdmin, adminController.getAdminStats);

// @route   POST /api/admin/tpo
// @desc    Create TPO account
// @access  Private (Admin)
router.post('/tpo', [
  auth,
  authorizeAdmin,
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('department').optional().isString().withMessage('Department must be a string'),
  body('experience').optional().isString().withMessage('Experience must be a string'),
  body('qualification').optional().isString().withMessage('Qualification must be a string'),
  body('specialization').optional().isString().withMessage('Specialization must be a string')
], adminController.createTPO);

// @route   PATCH /api/admin/users/:id/approve
// @desc    Approve/block user
// @access  Private (Admin)
router.patch('/users/:id/approve', [
  auth,
  authorizeAdmin,
  body('isApproved').optional().isBoolean().withMessage('isApproved must be a boolean'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
], adminController.approveUser);

// @route   PATCH /api/admin/users/:id/role
// @desc    Change user role
// @access  Private (Admin)
router.patch('/users/:id/role', [
  auth,
  authorizeAdmin,
  body('role').isIn(['student', 'company', 'tpo', 'admin']).withMessage('Invalid role')
], adminController.changeUserRole);

// @route   GET /api/admin/users
// @desc    Get all users with filters
// @access  Private (Admin)
router.get('/users', auth, authorizeAdmin, adminController.getAllUsers);

// @route   POST /api/admin/users/bulk-approve
// @desc    Bulk approve users
// @access  Private (Admin)
router.post('/users/bulk-approve', [
  auth,
  authorizeAdmin,
  body('userIds').isArray().withMessage('User IDs must be an array'),
  body('isApproved').isBoolean().withMessage('isApproved must be a boolean')
], adminController.bulkApproveUsers);

// @route   GET /api/admin/drives/stats
// @desc    Get drive statistics for admin
// @access  Private (Admin)
router.get('/drives/stats', auth, authorizeAdmin, adminController.getDriveStats);

// @route   GET /api/admin/internships/stats
// @desc    Get internship statistics for admin
// @access  Private (Admin)
router.get('/internships/stats', auth, authorizeAdmin, adminController.getInternshipStats);

module.exports = router; 