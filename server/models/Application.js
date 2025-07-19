const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  drive: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Drive',
    required: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'applied', 'shortlisted', 'rejected', 'selected', 'withdrawn'],
    default: 'pending'
  },
  appliedAt: {
    type: Date,
    default: Date.now
  },
  timeline: [{
    step: {
      type: String,
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    completed: {
      type: Boolean,
      default: false
    },
    notes: String
  }],
  feedback: {
    type: String,
    default: ''
  },
  interviewSchedule: {
    date: Date,
    time: String,
    venue: String,
    type: {
      type: String,
      enum: ['online', 'offline'],
      default: 'offline'
    },
    link: String,
    instructions: String
  },
  documents: [{
    name: String,
    filename: String,
    uploadDate: {
      type: Date,
      default: Date.now
    },
    size: String
  }],
  scores: {
    technical: Number,
    communication: Number,
    overall: Number
  },
  notes: String,
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate applications
applicationSchema.index({ student: 1, drive: 1 }, { unique: true });

// Other indexes for better query performance
applicationSchema.index({ student: 1, status: 1 });
applicationSchema.index({ drive: 1, status: 1 });
applicationSchema.index({ company: 1, status: 1 });
applicationSchema.index({ appliedAt: -1 });

// Pre-save middleware to update lastUpdated
applicationSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.lastUpdated = new Date();
  }
  next();
});

// Method to initialize timeline
applicationSchema.methods.initializeTimeline = function() {
  this.timeline = [
    {
      step: 'Applied',
      date: this.appliedAt,
      completed: true
    },
    {
      step: 'Resume Screening',
      date: new Date(),
      completed: false
    },
    {
      step: 'Technical Round',
      date: new Date(),
      completed: false
    },
    {
      step: 'HR Round',
      date: new Date(),
      completed: false
    },
    {
      step: 'Final Result',
      date: new Date(),
      completed: false
    }
  ];
  return this.save();
};

// Method to update timeline step
applicationSchema.methods.updateTimelineStep = function(stepName, completed = true, notes = '') {
  const step = this.timeline.find(t => t.step === stepName);
  if (step) {
    step.completed = completed;
    step.date = new Date();
    if (notes) step.notes = notes;
  }
  return this.save();
};

// Method to schedule interview
applicationSchema.methods.scheduleInterview = function(interviewData) {
  this.interviewSchedule = {
    ...interviewData,
    date: new Date(interviewData.date)
  };
  
  // Update timeline
  this.updateTimelineStep('Technical Round', false, 'Interview scheduled');
  
  return this.save();
};

// Static method to get application statistics
applicationSchema.statics.getStatistics = function(filters = {}) {
  const pipeline = [
    { $match: filters },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ];
  
  return this.aggregate(pipeline);
};

// Static method to get applications by date range
applicationSchema.statics.getApplicationsByDateRange = function(startDate, endDate, filters = {}) {
  return this.find({
    appliedAt: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    },
    ...filters
  }).populate('student', 'name email rollNumber branch cgpa')
    .populate('drive', 'title companyName position ctc')
    .populate('company', 'companyName industry')
    .sort({ appliedAt: -1 });
};

// Virtual for application age in days
applicationSchema.virtual('ageInDays').get(function() {
  return Math.floor((new Date() - this.appliedAt) / (1000 * 60 * 60 * 24));
});

// Method to check if application is stale (no update in 7 days)
applicationSchema.methods.isStale = function() {
  const daysSinceUpdate = Math.floor((new Date() - this.lastUpdated) / (1000 * 60 * 60 * 24));
  return daysSinceUpdate > 7;
};

module.exports = mongoose.model('Application', applicationSchema);