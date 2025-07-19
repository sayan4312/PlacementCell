const Application = require('../models/Application');
const csv = require('csv-parse');
const User = require('../models/User');
const Drive = require('../models/Drive');
const mongoose = require('mongoose');

exports.getAllApplications = async (req, res) => {
  try {
    const { company } = req.query;
    
    let query = {};
    
    // Get user info to check if TPO and filter by department
    const user = await User.findById(req.user.userId);
    if (user.role === 'tpo') {
      // For TPOs, only show applications from students in their department
      const department = user.department;
      // Find students in this department
      const students = await User.find({ 
        role: 'student', 
        branch: department 
      }).select('_id');
      
      const studentIds = students.map(student => student._id);
      
      // Find applications from these students
      query.student = { $in: studentIds };
    } else if (company) {
      // If company filter is provided, find applications for that company's drives
      const drives = await Drive.find({ 
        companyName: { $regex: company, $options: 'i' } 
      }).select('_id');
      
      const driveIds = drives.map(drive => drive._id);
      
      // Then find applications for these drives
      query.drive = { $in: driveIds };
    }

    const applications = await Application.find(query)
      .populate('student', 'name email rollNumber branch year cgpa')
      .populate({
        path: 'drive',
        select: 'title companyName position'
      })
      .populate('company')
      .sort({ appliedAt: -1 });
      
    res.json({ applications });
  } catch (error) {
    console.error('Get all applications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Bulk import shortlist from CSV
exports.importShortlist = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  const results = [];
  const errors = [];
  const parser = csv.parse({ columns: true, trim: true });
  req.file.buffer
    .toString()
    .split('\n')
    .forEach(line => parser.write(line + '\n'));
  parser.end();
  for await (const record of parser) {
    const appId = record['Application ID'] || record['application_id'] || record['id'] || record['app_id'];
    const status = (record['Status'] || '').toLowerCase();
    if (!appId || !['shortlisted', 'rejected'].includes(status)) {
      errors.push({ appId, status, error: 'Invalid row' });
      continue;
    }
    try {
      const app = await Application.findById(appId);
      if (!app) {
        errors.push({ appId, status, error: 'Application not found' });
        continue;
      }
      app.status = status;
      await app.save();
      results.push({ appId, status });
    } catch (err) {
      errors.push({ appId, status, error: err.message });
    }
  }
  res.json({ updated: results.length, errors });
}; 

exports.getStudentApplicationStats = async (req, res) => {
  try {
    const studentId = req.user.userId;
    
    const stats = await Application.aggregate([
      { $match: { student: studentId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    // Map stats to expected keys
    const result = {
      pendingApplications: 0,
      shortlistedApplications: 0,
      selectedApplications: 0,
      rejectedApplications: 0
    };
    stats.forEach(s => {
      if (s._id === 'pending' || s._id === 'applied') result.pendingApplications += s.count;
      if (s._id === 'shortlisted') result.shortlistedApplications = s.count;
      if (s._id === 'selected') result.selectedApplications = s.count;
      if (s._id === 'rejected') result.rejectedApplications = s.count;
    });
    res.json({ stats: result });
  } catch (error) {
    
    res.status(500).json({ message: 'Server error' });
  }
}; 