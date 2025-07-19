const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { adminAuth, allowAdminOrTPO } = require('../middleware/adminAuth');
const User = require('../models/User');
const Application = require('../models/Application');
const mongoose = require('mongoose');

// Placement analytics (return array for chart)
router.get('/placement', auth, adminAuth, async (req, res) => {
  try {
    // For demo, return a single data point (could be extended to monthly trend)
    const totalStudents = await User.countDocuments({ role: 'student' });
    const placedStudents = await Application.distinct('student', { status: 'selected' });
    const placed = placedStudents.length;
    const unplaced = totalStudents - placed;
    const placementRate = totalStudents > 0 ? Math.round((placed / totalStudents) * 100) : 0;
    // For charting, return as array
    res.json({
      placementData: [
        {
          label: 'Current',
          placements: placed,
          applications: totalStudents,
          unplaced,
          placementRate
        }
      ]
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching placement analytics', error: err.message });
  }
});

// Role distribution analytics (return array for chart)
router.get('/role-distribution', auth, adminAuth, async (req, res) => {
  try {
    const roles = [
      { name: 'Admin', key: 'admin', color: '#6366F1' },
      { name: 'TPO', key: 'tpo', color: '#10B981' },
      { name: 'Student', key: 'student', color: '#3B82F6' },
      { name: 'Company', key: 'company', color: '#F59E42' }
    ];
    const counts = await Promise.all(
      roles.map(role => User.countDocuments({ role: role.key }))
    );
    const roleDistribution = roles.map((role, i) => ({
      name: role.name,
      value: counts[i],
      color: role.color
    }));
    res.json({ roleDistribution });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching role distribution', error: err.message });
  }
});

// Branch-wise analytics (return array for mapping)
router.get('/branch-wise', auth, adminAuth, async (req, res) => {
  try {
    // Get all branches
    const branches = await User.distinct('branch', { role: 'student' });
    const branchWiseData = await Promise.all(branches.map(async (branch) => {
      const students = await User.countDocuments({ role: 'student', branch });
      // Placed students in this branch
      const placedStudentIds = await Application.distinct('student', { status: 'selected' });
      const placed = await User.countDocuments({ role: 'student', branch, _id: { $in: placedStudentIds } });
      const percentage = students > 0 ? Math.round((placed / students) * 100) : 0;
      return { branch, students, placed, percentage };
    }));
    res.json({ branchWiseData });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching branch-wise analytics', error: err.message });
  }
});

// Monthly Active Users
router.get('/monthly-active-users', auth, adminAuth, async (req, res) => {
  try {
    // Count unique users active in each of the last 6 months
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const count = await User.countDocuments({ lastActive: { $gte: start, $lt: end } });
      months.push({
        month: start.toLocaleString('default', { month: 'short', year: '2-digit' }),
        users: count
      });
    }
    res.json({ monthlyActiveUsers: months });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching monthly active users', error: err.message });
  }
});

// Monthly Job Applications
router.get('/monthly-job-applications', auth, adminAuth, async (req, res) => {
  try {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const count = await Application.countDocuments({ appliedAt: { $gte: start, $lt: end } });
      months.push({
        month: start.toLocaleString('default', { month: 'short', year: '2-digit' }),
        applications: count
      });
    }
    res.json({ monthlyJobApplications: months });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching monthly job applications', error: err.message });
  }
});

// Monthly Placement Success Rate
router.get('/monthly-success-rate', auth, adminAuth, async (req, res) => {
  try {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const total = await Application.countDocuments({ appliedAt: { $gte: start, $lt: end } });
      const placed = await Application.countDocuments({ appliedAt: { $gte: start, $lt: end }, status: 'selected' });
      const rate = total > 0 ? Math.round((placed / total) * 1000) / 10 : 0;
      months.push({
        month: start.toLocaleString('default', { month: 'short', year: '2-digit' }),
        successRate: rate
      });
    }
    res.json({ monthlySuccessRate: months });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching monthly success rate', error: err.message });
  }
});

// System Uptime (dummy, always 99.9%)
router.get('/system-uptime', auth, adminAuth, async (req, res) => {
  try {
    // In real systems, this would come from monitoring tools
    res.json({ uptime: 99.9 });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching system uptime', error: err.message });
  }
});

// Company Engagement (companies posting drives per month)
router.get('/company-engagement', auth, adminAuth, async (req, res) => {
  try {
    const Drive = require('../models/Drive');
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const companies = await Drive.distinct('company', { createdAt: { $gte: start, $lt: end } });
      months.push({
        month: start.toLocaleString('default', { month: 'short', year: '2-digit' }),
        companies: companies.length
      });
    }
    res.json({ companyEngagement: months });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching company engagement', error: err.message });
  }
});

// Placement Trends (monthly drives and placements for last 6 months)
router.get('/placement-trends', auth, allowAdminOrTPO, async (req, res) => {
  try {
    const Drive = require('../models/Drive');
    const Application = require('../models/Application');
    const User = require('../models/User');
    const user = await User.findById(req.user.userId);
    const now = new Date();
    const months = [];
    let department = null;
    let studentIds = null;
    if (user.role === 'tpo') {
      department = user.department;
      // Find all students in this department
      const students = await User.find({ role: 'student', branch: department }).select('_id');
      studentIds = students.map(s => s._id);
    }
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      let drives, placements;
      if (department && studentIds) {
        // Find all applications from these students in this month
        const applications = await Application.find({
          student: { $in: studentIds },
          appliedAt: { $gte: start, $lt: end }
        }).select('drive status');
        const driveIds = [...new Set(applications.map(a => a.drive.toString()))];
        drives = driveIds.length;
        placements = applications.filter(a => a.status === 'selected').length;
      } else {
        drives = await Drive.countDocuments({ createdAt: { $gte: start, $lt: end } });
        placements = await Application.countDocuments({ appliedAt: { $gte: start, $lt: end }, status: 'selected' });
      }
      months.push({
        month: start.toLocaleString('default', { month: 'short', year: '2-digit' }),
        drives,
        placements
      });
    }
    res.json({ trends: months });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching placement trends', error: err.message });
  }
});

// Applications by Branch (for pie chart)
router.get('/applications-by-branch', auth, allowAdminOrTPO, async (req, res) => {
  try {
    const User = require('../models/User');
    const Application = require('../models/Application');
    const user = await User.findById(req.user.userId);
    // Pie chart colors
    const colors = [
      '#3B82F6', '#10B981', '#F59E42', '#6366F1', '#F43F5E', '#F59E42', '#A21CAF', '#0EA5E9'
    ];
    let branchApplicationsRaw;
    if (user.role === 'tpo') {
      const department = user.department;
      // Find all students in this department
      const students = await User.find({ role: 'student', branch: department }).select('_id branch');
      const studentIds = students.map(s => s._id);
      // Aggregate applications from these students, group by their branch
      branchApplicationsRaw = await Application.aggregate([
        { $match: { status: { $in: ['applied', 'shortlisted', 'selected'] }, student: { $in: studentIds } } },
        {
          $lookup: {
            from: 'users',
            localField: 'student',
            foreignField: '_id',
            as: 'studentInfo'
          }
        },
        { $unwind: '$studentInfo' },
        {
          $group: {
            _id: '$studentInfo.branch',
            value: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            name: '$_id',
            value: 1
          }
        }
      ]);
    } else {
      branchApplicationsRaw = await Application.aggregate([
        {
          $match: {
            status: { $in: ['applied', 'shortlisted', 'selected'] }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'student',
            foreignField: '_id',
            as: 'studentInfo'
          }
        },
        { $unwind: '$studentInfo' },
        {
          $group: {
            _id: '$studentInfo.branch',
            value: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            name: '$_id',
            value: 1
          }
        }
      ]);
    }
    // Assign colors
    const branchApplications = branchApplicationsRaw.map((item, idx) => ({
      ...item,
      color: colors[idx % colors.length] || '#3B82F6'
    }));
    res.json({ branchApplications });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching applications by branch', error: err.message });
  }
});

// TPO Dashboard Stats (simple counts)
router.get('/tpo-dashboard-stats', auth, allowAdminOrTPO, async (req, res) => {
  try {
    const Drive = require('../models/Drive');
    const User = require('../models/User');
    const Application = require('../models/Application');
    let totalDrives, totalApplications, totalStudents;
    const user = await User.findById(req.user.userId);
    if (user.role === 'tpo') {
      const department = user.department;
      // Find all students in this department
      const students = await User.find({ role: 'student', branch: department }).select('_id');
      const studentIds = students.map(s => s._id);
      // Find all applications from these students
      const applications = await Application.find({ student: { $in: studentIds } }).select('drive');
      const driveIds = [...new Set(applications.map(a => a.drive.toString()))];
      totalDrives = driveIds.length;
      totalApplications = applications.length;
      totalStudents = students.length;
    } else {
      totalDrives = await Drive.countDocuments();
      totalApplications = await Application.countDocuments();
      totalStudents = await User.countDocuments({ role: 'student' });
    }
    res.json({
      totalDrives,
      totalApplications,
      totalStudents
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching dashboard stats', error: err.message });
  }
});

module.exports = router; 