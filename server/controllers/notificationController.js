const Notification = require('../models/Notification');
const User = require('../models/User');
const Application = require('../models/Application');
const Drive = require('../models/Drive');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getUserNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, read, priority, type } = req.query;
    
    const result = await Notification.getUserNotifications(req.user.userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      read: read === 'true' ? true : read === 'false' ? false : null,
      priority,
      type
    });

    res.json(result);
  } catch (error) {
    console.error('Get user notifications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Mark notifications as read
// @route   PATCH /api/notifications/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const { notificationIds } = req.body;
    
    const result = await Notification.markAsRead(req.user.userId, notificationIds);
    
    res.json({
      message: 'Notifications marked as read successfully',
      updatedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Mark single notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
const markSingleAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await notification.markAsRead();
    
    res.json({
      message: 'Notification marked as read successfully',
      notification
    });
  } catch (error) {
    console.error('Mark single as read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete notifications
// @route   DELETE /api/notifications
// @access  Private
const deleteNotifications = async (req, res) => {
  try {
    const { notificationIds } = req.body;
    
    const result = await Notification.deleteNotifications(req.user.userId, notificationIds);
    
    res.json({
      message: 'Notifications deleted successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Delete notifications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete single notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteSingleNotification = async (req, res) => {
  try {
    const result = await Notification.deleteOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json({
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete single notification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get notification count
// @route   GET /api/notifications/count
// @access  Private
const getNotificationCount = async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({
      user: req.user.userId,
      read: false
    });

    res.json({ unreadCount });
  } catch (error) {
    console.error('Get notification count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create system notification (Admin/TPO only)
// @route   POST /api/notifications/system
// @access  Private (Admin/TPO)
const createSystemNotification = async (req, res) => {
  try {
    const { title, message, type, priority, actionUrl, users, roles } = req.body;

    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }

    const notificationData = {
      title,
      message,
      type: type || 'info',
      priority: priority || 'low',
      actionUrl,
      metadata: req.body.metadata || {}
    };

    if (users) {
      notificationData.users = users;
    } else if (roles) {
      notificationData.roles = roles;
    }

    const result = await Notification.createSystemNotification(notificationData);
    
    res.status(201).json({
      message: 'System notification created successfully',
      createdCount: result.length
    });
  } catch (error) {
    console.error('Create system notification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create application notification
// @route   POST /api/notifications/application
// @access  Private (Company/TPO)
const createApplicationNotification = async (req, res) => {
  try {
    const { applicationId, type, data } = req.body;

    if (!applicationId || !type) {
      return res.status(400).json({ message: 'Application ID and type are required' });
    }

    const notification = await Notification.createApplicationNotification(applicationId, type, data);
    
    if (!notification) {
      return res.status(404).json({ message: 'Application not found' });
    }

    res.status(201).json({
      message: 'Application notification created successfully',
      notification
    });
  } catch (error) {
    console.error('Create application notification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create drive notification
// @route   POST /api/notifications/drive
// @access  Private (Company/TPO)
const createDriveNotification = async (req, res) => {
  try {
    const { driveId, type, data } = req.body;

    if (!driveId || !type) {
      return res.status(400).json({ message: 'Drive ID and type are required' });
    }

    const result = await Notification.createDriveNotification(driveId, type, data);
    
    if (!result) {
      return res.status(404).json({ message: 'Drive not found' });
    }

    res.status(201).json({
      message: 'Drive notification created successfully',
      createdCount: result.length
    });
  } catch (error) {
    console.error('Create drive notification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private
const markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.markAsRead(req.user.userId);
    
    res.json({
      message: 'All notifications marked as read successfully',
      updatedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getUserNotifications,
  markAsRead,
  markSingleAsRead,
  deleteNotifications,
  deleteSingleNotification,
  getNotificationCount,
  createSystemNotification,
  createApplicationNotification,
  createDriveNotification,
  markAllAsRead
}; 