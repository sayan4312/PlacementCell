const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['info', 'success', 'warning', 'error'],
    default: 'info'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'low'
  },
  read: {
    type: Boolean,
    default: false
  },
  actionUrl: {
    type: String,
    trim: true
  },
  relatedEntity: {
    type: {
      type: String,
      enum: ['application', 'drive', 'user', 'system']
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'relatedEntity.type'
    }
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  expiresAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for better query performance
notificationSchema.index({ user: 1, read: 1 });
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, priority: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Pre-save middleware to set default expiration (30 days)
notificationSchema.pre('save', function(next) {
  if (!this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  }
  next();
});

// Static method to create notification
notificationSchema.statics.createNotification = async function(data) {
  const notification = new this(data);
  await notification.save();
  return notification;
};

// Static method to create bulk notifications
notificationSchema.statics.createBulkNotifications = async function(notifications) {
  return await this.insertMany(notifications);
};

// Static method to get user notifications with pagination
notificationSchema.statics.getUserNotifications = async function(userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    read = null,
    priority = null,
    type = null
  } = options;

  const query = { user: userId };
  
  if (read !== null) query.read = read;
  if (priority) query.priority = priority;
  if (type) query.type = type;

  const skip = (page - 1) * limit;

  const notifications = await this.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await this.countDocuments(query);
  const unreadCount = await this.countDocuments({ user: userId, read: false });

  return {
    notifications,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalNotifications: total,
      unreadCount,
      hasNext: skip + notifications.length < total,
      hasPrev: page > 1
    }
  };
};

// Static method to mark notifications as read
notificationSchema.statics.markAsRead = async function(userId, notificationIds) {
  const query = { user: userId };
  
  if (notificationIds && notificationIds.length > 0) {
    query._id = { $in: notificationIds };
  }

  return await this.updateMany(query, { read: true });
};

// Static method to delete notifications
notificationSchema.statics.deleteNotifications = async function(userId, notificationIds) {
  const query = { user: userId };
  
  if (notificationIds && notificationIds.length > 0) {
    query._id = { $in: notificationIds };
  }

  return await this.deleteMany(query);
};

// Static method to create system notifications
notificationSchema.statics.createSystemNotification = async function(data) {
  const { title, message, type = 'info', priority = 'low', actionUrl, metadata } = data;
  
  // Get all users or specific users based on data
  let users = [];
  
  if (data.users) {
    users = data.users;
  } else if (data.roles) {
    const User = require('./User');
    users = await User.find({ role: { $in: data.roles } }).select('_id');
    users = users.map(u => u._id);
  } else {
    // Send to all users
    const User = require('./User');
    users = await User.find({}).select('_id');
    users = users.map(u => u._id);
  }

  const notifications = users.map(userId => ({
    user: userId,
    title,
    message,
    type,
    priority,
    actionUrl,
    metadata,
    relatedEntity: {
      type: 'system'
    }
  }));

  return await this.createBulkNotifications(notifications);
};

// Static method to create application-related notifications
notificationSchema.statics.createApplicationNotification = async function(applicationId, type, data) {
  const Application = require('./Application');
  const application = await Application.findById(applicationId)
    .populate('student', '_id name email')
    .populate('drive', 'title position')
    .populate('company', 'companyName');

  if (!application) return null;

  const notificationData = {
    user: application.student._id,
    relatedEntity: {
      type: 'application',
      id: applicationId
    },
    metadata: {
      applicationId,
      driveTitle: application.drive.title,
      companyName: application.company.companyName
    }
  };

  switch (type) {
    case 'application_submitted':
      notificationData.title = 'Application Submitted';
      notificationData.message = `Your application for ${application.drive.position} at ${application.company.companyName} has been submitted successfully.`;
      notificationData.type = 'success';
      notificationData.priority = 'medium';
      break;
    
    case 'application_shortlisted':
      notificationData.title = 'Application Shortlisted!';
      notificationData.message = `Congratulations! Your application for ${application.drive.position} at ${application.company.companyName} has been shortlisted.`;
      notificationData.type = 'success';
      notificationData.priority = 'high';
      break;
    
    case 'application_selected':
      notificationData.title = 'Application Selected!';
      notificationData.message = `🎉 You have been selected for ${application.drive.position} at ${application.company.companyName}!`;
      notificationData.type = 'success';
      notificationData.priority = 'high';
      break;
    
    case 'application_rejected':
      notificationData.title = 'Application Update';
      notificationData.message = `Your application for ${application.drive.position} at ${application.company.companyName} was not selected.`;
      notificationData.type = 'info';
      notificationData.priority = 'medium';
      break;
    
    case 'interview_scheduled':
      notificationData.title = 'Interview Scheduled';
      notificationData.message = `An interview has been scheduled for your application at ${application.company.companyName}. Check your application details for more information.`;
      notificationData.type = 'warning';
      notificationData.priority = 'high';
      break;
    
    default:
      return null;
  }

  return await this.createNotification(notificationData);
};

// Static method to create drive-related notifications
notificationSchema.statics.createDriveNotification = async function(driveId, type, data) {
  const Drive = require('./Drive');
  const User = require('./User');
  
  const drive = await Drive.findById(driveId).populate('company', 'companyName');
  if (!drive) return null;

  let users = [];
  
  if (type === 'new_drive') {
    // Notify all eligible students
    users = await User.find({ 
      role: 'student',
      isApproved: true,
      isActive: true
    }).select('_id');
    users = users.map(u => u._id);
  }

  const notifications = users.map(userId => ({
    user: userId,
    title: 'New Job Drive Available',
    message: `A new ${drive.position} position is available at ${drive.company.companyName}. Apply now!`,
    type: 'info',
    priority: 'medium',
    actionUrl: `/drives/${driveId}`,
    relatedEntity: {
      type: 'drive',
      id: driveId
    },
    metadata: {
      driveId,
      position: drive.position,
      companyName: drive.company.companyName
    }
  }));

  return await this.createBulkNotifications(notifications);
};

// Method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.read = true;
  return this.save();
};

// Virtual for time ago
notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diffInHours = Math.floor((now - this.createdAt) / (1000 * 60 * 60));
  
  if (diffInHours < 1) {
    return 'Just now';
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  } else {
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }
});

module.exports = mongoose.model('Notification', notificationSchema); 