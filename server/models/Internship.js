const mongoose = require('mongoose');

const internshipSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  duration: {
    type: String,
    required: false
  },
  stipend: {
    type: String,
    required: false
  },
  location: {
    type: String,
    required: false
  },
  workMode: {
    type: String,
    enum: ['On-site', 'Remote', 'Hybrid'],
    default: 'On-site'
  },
  deadline: {
    type: Date,
    required: false
  },
  externalLink: {
    type: String,
    required: true
  },
  requirements: [String],
  eligibility: {
    type: String,
    required: false
  },
  notes: String,
  tags: [String],
  logo: String,
  
  // Tracking
  interestedStudents: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    interestedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Posted by TPO
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  status: {
    type: String,
    enum: ['active', 'expired', 'closed'],
    default: 'active'
  },
  
  isVisible: {
    type: Boolean,
    default: true
  },
  
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  }
}, {
  timestamps: true
});

// Indexes
internshipSchema.index({ deadline: 1 });
internshipSchema.index({ status: 1 });
internshipSchema.index({ postedBy: 1 });
internshipSchema.index({ createdAt: -1 });

// Virtual for interested count
internshipSchema.virtual('interestedCount').get(function() {
  return this.interestedStudents.length;
});

// Method to add interested student
internshipSchema.methods.addInterestedStudent = function(studentId) {
  const alreadyInterested = this.interestedStudents.some(interested => 
    interested.student.toString() === studentId.toString()
  );
  
  if (alreadyInterested) {
    throw new Error('Student has already shown interest in this internship');
  }
  
  this.interestedStudents.push({
    student: studentId,
    interestedAt: new Date()
  });
  
  return this.save();
};

// Method to remove interested student
internshipSchema.methods.removeInterestedStudent = function(studentId) {
  this.interestedStudents = this.interestedStudents.filter(interested => 
    interested.student.toString() !== studentId.toString()
  );
  
  return this.save();
};

// Static method to get active internships
internshipSchema.statics.getActiveInternships = function() {
  return this.find({
    status: 'active',
    deadline: { $gt: new Date() },
    isVisible: true
  }).populate('postedBy', 'name department')
    .sort({ priority: -1, createdAt: -1 });
};

// Method to check if internship is expired
internshipSchema.methods.checkExpiry = function() {
  if (new Date() > this.deadline && this.status === 'active') {
    this.status = 'expired';
    return this.save();
  }
  return Promise.resolve(this);
};

// Pre-save middleware to auto-expire internships
internshipSchema.pre('save', function(next) {
  if (new Date() > this.deadline && this.status === 'active') {
    this.status = 'expired';
  }
  next();
});

module.exports = mongoose.model('Internship', internshipSchema);