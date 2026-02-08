const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['student', 'company', 'tpo', 'admin'],
    required: true
  },
  isApproved: {
    type: Boolean,
    default: function () {
      return this.role === 'student';
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  requiresPasswordChange: {
    type: Boolean,
    default: false
  },
  avatar: {
    type: String,
    default: null
  },

  // Student specific fields
  studentId: {
    type: String,
    sparse: true,
    unique: true
  },
  branch: {
    type: String,
    enum: ['Computer Science', 'Information Technology', 'Electronics & Communication',
      'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Data Science', 'AIML']
  },
  year: {
    type: String,
    enum: ['1st Year', '2nd Year', '3rd Year', '4th Year']
  },
  cgpa: {
    type: Number,
    min: 0,
    max: 10
  },
  backlogs: {
    type: Number,
    default: 0,
    min: 0
  },
  phone: String,
  address: String,
  dateOfBirth: Date,
  skills: [String],
  achievements: [String],
  certifications: [String],
  projects: [{
    name: String,
    tech: String,
    description: String,
    github: String
  }],
  resume: {
    filename: String,
    uploadDate: Date,
    size: String,
    url: String,
    public_id: String
  },
  profileCompleted: {
    type: Boolean,
    default: false
  },

  // Company specific fields
  companyName: {
    type: String,
    sparse: true,
    unique: true
  },
  industry: {
    type: String,
    enum: ['Technology', 'Finance', 'Healthcare', 'Manufacturing', 'Retail',
      'Consulting', 'Education', 'Other']
  },
  website: String,
  description: String,
  employees: String,
  founded: String,
  benefits: [String],
  culture: [String],

  // TPO specific fields
  department: String,
  experience: String,
  qualification: String,
  specialization: String,

  // Common fields
  lastActive: {
    type: Date,
    default: Date.now
  },
  profileScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for dynamic year calculation
userSchema.virtual('calculatedCurrentYear').get(function () {
  if (this.role !== 'student' || !this.studentId || this.studentId.length < 2) return null;

  // Extract batch year from first 2 digits of ID (e.g., 22 -> 2022)
  const batchPrefix = this.studentId.substring(0, 2);
  const batchYear = parseInt(batchPrefix, 10);

  if (isNaN(batchYear)) return null;

  const fullBatchYear = 2000 + batchYear; // Assumption: 2000s
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-11

  let yearDiff = currentYear - fullBatchYear;

  // If current month is July (6) or later, we are in the next academic year
  // Example: Joined Aug 2022 (Batch 2022)
  // Aug 2022 (Month 7): 2022 - 2022 = 0 + 1 => 1st Year
  // Feb 2023 (Month 1): 2023 - 2022 = 1 => 1st Year
  // Aug 2023 (Month 7): 2023 - 2022 = 1 + 1 => 2nd Year
  if (currentMonth >= 6) {
    yearDiff += 1;
  }

  return yearDiff > 0 ? yearDiff : 1;
});

// Index for better query performance
userSchema.index({ role: 1 });
userSchema.index({ isApproved: 1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Calculate profile score for students
userSchema.methods.calculateProfileScore = function () {
  if (this.role !== 'student') return 0;

  let score = 0;

  // Basic info (30%)
  if (this.name) score += 5;
  if (this.email) score += 5;
  if (this.phone) score += 5;
  if (this.address) score += 5;
  if (this.dateOfBirth) score += 5;
  if (this.studentId) score += 5;

  // Academic info (25%)
  if (this.branch) score += 5;
  if (this.year) score += 5;
  if (this.cgpa) score += 10;
  if (this.backlogs !== undefined) score += 5;

  // Skills and experience (25%)
  if (this.skills && this.skills.length > 0) score += 10;
  if (this.projects && this.projects.length > 0) score += 10;
  if (this.certifications && this.certifications.length > 0) score += 5;

  // Resume and achievements (20%)
  if (this.resume && this.resume.filename) score += 10;
  if (this.achievements && this.achievements.length > 0) score += 10;

  this.profileScore = score;
  return score;
};

// Update last active timestamp
userSchema.methods.updateLastActive = function () {
  this.lastActive = new Date();
  return this.save();
};

module.exports = mongoose.model('User', userSchema);