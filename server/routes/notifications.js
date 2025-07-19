const express = require('express');
const { body } = require('express-validator');
const notificationController = require('../controllers/notificationController');
const auth = require('../middleware/auth');
const { authorizeAdmin, authorizeTPOOrCompany, authorizeStudent, authorizeTPOOrAdmin } = require('../middleware/role');

const router = express.Router();

// @route   GET /api/notifications
// @desc    Get user notifications
// @access  Private
router.get('/', auth, notificationController.getUserNotifications);

// @route   GET /api/notifications/count
// @desc    Get unread notification count
// @access  Private
router.get('/count', auth, notificationController.getNotificationCount);

// @route   PATCH /api/notifications/read
// @desc    Mark notifications as read
// @access  Private
router.patch('/read', [
  auth,
  body('notificationIds').optional().isArray().withMessage('Notification IDs must be an array')
], notificationController.markAsRead);

// @route   PATCH /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.patch('/read-all', auth, notificationController.markAllAsRead);

// @route   PATCH /api/notifications/:id/read
// @desc    Mark single notification as read
// @access  Private
router.patch('/:id/read', auth, notificationController.markSingleAsRead);

// @route   DELETE /api/notifications
// @desc    Delete notifications
// @access  Private
router.delete('/', [
  auth,
  body('notificationIds').optional().isArray().withMessage('Notification IDs must be an array')
], notificationController.deleteNotifications);

// @route   DELETE /api/notifications/:id
// @desc    Delete single notification
// @access  Private
router.delete('/:id', auth, notificationController.deleteSingleNotification);

// @route   POST /api/notifications/system
// @desc    Create system notification (Admin/TPO only)
// @access  Private (Admin/TPO)
router.post('/system', [
  auth,
  authorizeTPOOrAdmin,
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('message').trim().notEmpty().withMessage('Message is required'),
  body('type').optional().isIn(['info', 'success', 'warning', 'error']).withMessage('Invalid notification type'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority level'),
  body('actionUrl').optional().isURL().withMessage('Invalid action URL'),
  body('users').optional().isArray().withMessage('Users must be an array'),
  body('roles').optional().isArray().withMessage('Roles must be an array')
], notificationController.createSystemNotification);

// @route   POST /api/notifications/application
// @desc    Create application notification (Company/TPO only)
// @access  Private (Company/TPO)
router.post('/application', [
  auth,
  authorizeTPOOrCompany,
  body('applicationId').notEmpty().withMessage('Application ID is required'),
  body('type').isIn(['application_submitted', 'application_shortlisted', 'application_selected', 'application_rejected', 'interview_scheduled']).withMessage('Invalid notification type')
], notificationController.createApplicationNotification);

// @route   POST /api/notifications/drive
// @desc    Create drive notification (Company/TPO only)
// @access  Private (Company/TPO)
router.post('/drive', [
  auth,
  authorizeTPOOrCompany,
  body('driveId').notEmpty().withMessage('Drive ID is required'),
  body('type').isIn(['new_drive']).withMessage('Invalid notification type')
], notificationController.createDriveNotification);

module.exports = router; 