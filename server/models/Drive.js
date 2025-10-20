const mongoose = require('mongoose');

const driveSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  companyName: {
    type: String,
    required: true
  },
  position: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  requirements: [String],
  responsibilities: [String],
  ctc: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  workMode: {
    type: String,
    enum: ['On-site', 'Remote', 'Hybrid'],
    default: 'On-site'
  },
  jobType: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Internship', 'Contract'],
    default: 'Full-time'
  },
  experience: {
    type: String,
    default: 'Fresher'
  },
  deadline: {
    type: Date,
    required: true
  },
  externalApplicationUrl: {
    type: String,
    required: false,
    validate: {
      validator: function(v) {
        if (!v) return true; // Allow empty/null values
        return /^https?:\/\/.+/.test(v); // Must be a valid URL if provided
      },
      message: 'External application URL must be a valid HTTP/HTTPS URL'
    }
  },
  eligibility: {
    minCGPA: {
      type: Number,
      required: true,
      min: 0,
      max: 10
    },
    allowedBranches: [{
      type: String,
      enum: ['CSE', 'IT', 'ECE', 'EEE', 'ME', 'CE', 'DS', 'AIML', 'All']
    }],
    maxBacklogs: {
      type: Number,
      default: 0,
      min: 0
    },
    minYear: {
      type: Number,
      default: 3,
      min: 1,
      max: 4
    }
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'closed', 'cancelled'],
    default: 'active'
  },
  applicants: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    appliedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'shortlisted', 'rejected', 'selected'],
      default: 'pending'
    }
  }],
  shortlistedCount: {
    type: Number,
    default: 0
  },
  selectedCount: {
    type: Number,
    default: 0
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isVisible: {
    type: Boolean,
    default: true
  },
  tags: [String],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
driveSchema.index({ company: 1 });
driveSchema.index({ status: 1 });
driveSchema.index({ deadline: 1 });
driveSchema.index({ 'eligibility.allowedBranches': 1 });
driveSchema.index({ createdAt: -1 });

// Virtual for application count
driveSchema.virtual('applicationCount').get(function() {
  return this.applicants.length;
});

// Virtual for eligible students count (calculated dynamically)
driveSchema.virtual('eligibleCount').get(function() {
  // This would be calculated based on current student database
  return 0; // Placeholder
});

// Method to check if student is eligible
driveSchema.methods.isStudentEligible = function(student) {
  if (student.role !== 'student') return false;
  
  // Check CGPA
  if (student.cgpa < this.eligibility.minCGPA) return false;
  
  // Check backlogs
  if (student.backlogs > this.eligibility.maxBacklogs) return false;
  
  // Check year - convert string to number if needed
  let studentYear = student.year;
  if (typeof studentYear === 'string') {
    const yearMatch = studentYear.match(/(\d+)/);
    if (yearMatch) {
      studentYear = parseInt(yearMatch[1]);
    } else {
      studentYear = 4; // Default
    }
  }
  if (studentYear < this.eligibility.minYear) return false;
  
  // Check branch
  if (!this.eligibility.allowedBranches.includes('All') && 
      !this.eligibility.allowedBranches.includes(student.branch)) {
    return false;
  }
  
  // Check if already applied
  const hasApplied = this.applicants.some(app => 
    app.student.toString() === student._id.toString()
  );
  if (hasApplied) return false;
  
  // Check if drive is active and not expired
  if (this.status !== 'active' || new Date() > this.deadline) return false;
  
  return true;
};

// Method to check eligibility with detailed reasons
driveSchema.methods.checkEligibility = function(student) {
  const reasons = [];
  
  if (student.role !== 'student') {
    reasons.push('Only students can apply to drives');
    return { eligible: false, reasons };
  }
  
  // Check CGPA
  if (student.cgpa < this.eligibility.minCGPA) {
    reasons.push(`CGPA requirement not met. Required: ${this.eligibility.minCGPA}, Your CGPA: ${student.cgpa}`);
  }
  
  // Check backlogs
  if (student.backlogs > this.eligibility.maxBacklogs) {
    reasons.push(`Too many backlogs. Maximum allowed: ${this.eligibility.maxBacklogs}, Your backlogs: ${student.backlogs}`);
  }
  
  // Check year
  let studentYear = student.year;
  if (typeof studentYear === 'string') {
    const yearMatch = studentYear.match(/(\d+)/);
    if (yearMatch) {
      studentYear = parseInt(yearMatch[1]);
    } else {
      studentYear = 4; // Default
    }
  }
  if (studentYear < this.eligibility.minYear) {
    reasons.push(`Year requirement not met. Minimum year: ${this.eligibility.minYear}, Your year: ${studentYear}`);
  }
  
  // Check branch
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
  if (!this.eligibility.allowedBranches.includes('All') && 
      !this.eligibility.allowedBranches.includes(studentBranch)) {
    reasons.push(`Branch not eligible. Allowed branches: ${this.eligibility.allowedBranches.join(', ')}, Your branch: ${studentBranch}`);
  }
  
  // Check if already applied
  const hasApplied = this.applicants.some(app => 
    app.student.toString() === student._id.toString()
  );
  if (hasApplied) {
    reasons.push('You have already applied to this drive');
  }
  
  // Check if drive is active and not expired
  if (this.status !== 'active') {
    reasons.push('Drive is not active');
  }
  if (new Date() > this.deadline) {
    reasons.push('Application deadline has passed');
  }
  
  return {
    eligible: reasons.length === 0,
    reasons
  };
};

// Method to add applicant
driveSchema.methods.addApplicant = function(studentId) {
  const existingApplication = this.applicants.find(app => 
    app.student.toString() === studentId.toString()
  );
  
  if (existingApplication) {
    throw new Error('Student has already applied for this drive');
  }
  
  this.applicants.push({
    student: studentId,
    appliedAt: new Date(),
    status: 'pending'
  });
  
  return this.save();
};

// Method to update application status
driveSchema.methods.updateApplicationStatus = function(studentId, status) {
  const application = this.applicants.find(app => 
    app.student.toString() === studentId.toString()
  );
  
  if (!application) {
    throw new Error('Application not found');
  }
  
  const oldStatus = application.status;
  application.status = status;
  
  // Update counters
  if (oldStatus === 'shortlisted' && status !== 'shortlisted') {
    this.shortlistedCount = Math.max(0, this.shortlistedCount - 1);
  } else if (oldStatus !== 'shortlisted' && status === 'shortlisted') {
    this.shortlistedCount += 1;
  }
  
  if (oldStatus === 'selected' && status !== 'selected') {
    this.selectedCount = Math.max(0, this.selectedCount - 1);
  } else if (oldStatus !== 'selected' && status === 'selected') {
    this.selectedCount += 1;
  }
  
  return this.save();
};

// Static method to get drives for student
driveSchema.statics.getEligibleDrives = function(student) {
  const branchMapping = {
    'Computer Science': 'CSE',
    'Information Technology': 'IT',
    'Electronics and Communication': 'ECE',
    'Electrical Engineering': 'EEE',
    'Mechanical Engineering': 'ME',
    'Civil Engineering': 'CE',
    'Chemical Engineering': 'CHE',
    'Biotechnology': 'BT'
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
  
  return this.find({
    status: 'active',
    deadline: { $gt: new Date() },
    isVisible: true,
    'eligibility.minCGPA': { $lte: student.cgpa },
    'eligibility.maxBacklogs': { $gte: student.backlogs },
    'eligibility.minYear': { $lte: studentYear },
    $or: [
      { 'eligibility.allowedBranches': 'All' },
      { 'eligibility.allowedBranches': studentBranch }
    ],
    'applicants.student': { $ne: student._id }
  }).populate('company', 'companyName industry website')
    .sort({ priority: -1, createdAt: -1 });
};

module.exports = mongoose.model('Drive', driveSchema);