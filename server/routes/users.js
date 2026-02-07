const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const { authorizeAdmin, authorizeTPOOrCompany, authorizeStudent } = require('../middleware/role');
const upload = require('../middleware/upload');
const { parse } = require('csv-parse');
const fs = require('fs');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const router = express.Router();

// @route   GET /api/users/me
// @desc    Get logged-in user info
// @access  Private
router.get('/me', auth, userController.getMe);

// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private (Admin)
router.get('/', auth, authorizeAdmin, userController.getAllUsers);

// @route   GET /api/users/role/:role
// @desc    Get users by role
// @access  Private (Admin/TPO)
router.get('/role/:role', auth, authorizeTPOOrCompany, userController.getUsersByRole);

// @route   PATCH /api/users/:id/approve
// @desc    Approve/block user (Admin only)
// @access  Private (Admin)
router.patch('/:id/approve', auth, authorizeAdmin, userController.approveUser);

// @route   POST /api/users/tpo
// @desc    Create TPO account (Admin only)
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
], userController.createTPO);

// @route   PUT /api/users/:id
// @desc    Update user profile
// @access  Private
router.put('/:id', auth, userController.updateProfile);

// @route   POST /api/users/resume
// @desc    Upload resume (Student only)
// @access  Private (Student)
router.post('/resume', [
  auth,
  authorizeStudent,
  upload.single('resume')
], userController.uploadResume);

// @route   DELETE /api/users/resume
// @desc    Delete resume (Student only)
// @access  Private (Student)
router.delete('/resume', [
  auth,
  authorizeStudent
], userController.deleteResume);

// @route   POST /api/users/student
// @desc    Create Student account (TPO only)
// @access  Private (TPO)
router.post('/student', [
  auth,
  authorizeTPOOrCompany,
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('studentId').notEmpty().withMessage('Student ID is required'),
  body('branch').notEmpty().withMessage('Branch/Department is required'),
  body('year').notEmpty().withMessage('Year is required'),
  body('cgpa').optional().isNumeric().withMessage('CGPA must be a number'),
  body('backlogs').optional().isNumeric().withMessage('Backlogs must be a number'),
  body('phone').optional().isString(),
  body('address').optional().isString()
], userController.createStudentByTPO);

// @route   GET /api/users/eligible/:driveId
// @desc    Get eligible students for drive
// @access  Private (TPO/Company)
router.get('/eligible/:driveId', auth, authorizeTPOOrCompany, userController.getEligibleStudents);

// @route   GET /api/users/stats
// @desc    Get user statistics
// @access  Private (Admin)
router.get('/stats', auth, authorizeAdmin, userController.getUserStats);

// @route   POST /api/users/skills
// @desc    Add skill to user profile (Student only)
// @access  Private (Student)
router.post('/skills', [
  auth,
  authorizeStudent,
  body('skill').trim().notEmpty().withMessage('Skill is required')
], userController.addSkill);

// @route   DELETE /api/users/skills/:skill
// @desc    Remove skill from user profile (Student only)
// @access  Private (Student)
router.delete('/skills/:skill', [
  auth,
  authorizeStudent
], userController.removeSkill);

// @route   POST /api/users/projects
// @desc    Add project to user profile (Student only)
// @access  Private (Student)
router.post('/projects', [
  auth,
  authorizeStudent,
  body('name').trim().notEmpty().withMessage('Project name is required'),
  body('tech').trim().notEmpty().withMessage('Technologies are required'),
  body('description').trim().notEmpty().withMessage('Project description is required'),
  body('github').optional().isURL().withMessage('Invalid GitHub URL')
], userController.addProject);

// @route   PUT /api/users/projects/:id
// @desc    Update project in user profile (Student only)
// @access  Private (Student)
router.put('/projects/:id', [
  auth,
  authorizeStudent,
  body('name').trim().notEmpty().withMessage('Project name is required'),
  body('tech').trim().notEmpty().withMessage('Technologies are required'),
  body('description').trim().notEmpty().withMessage('Project description is required'),
  body('github').optional().isURL().withMessage('Invalid GitHub URL')
], userController.updateProject);

// @route   DELETE /api/users/projects/:id
// @desc    Remove project from user profile (Student only)
// @access  Private (Student)
router.delete('/projects/:id', [
  auth,
  authorizeStudent
], userController.removeProject);

// Bulk import students from CSV/Excel
router.post('/import-students', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const students = [];
    const parser = fs.createReadStream(req.file.path).pipe(parse({ columns: true, trim: true }));
    for await (const record of parser) {
      // Expected columns: name, email, studentId, branch, year, cgpa, backlogs, phone, address
      if (!record.email) continue;
      const existing = await User.findOne({ email: record.email });
      if (existing) continue;
      const hashedPassword = await bcrypt.hash('student123', 10);
      students.push({
        name: record.name,
        email: record.email,
        studentId: record.studentId,
        branch: record.branch,
        year: record.year,
        cgpa: record.cgpa,
        backlogs: record.backlogs,
        phone: record.phone,
        address: record.address,
        role: 'student',
        password: hashedPassword,
        requiresPasswordChange: true,
        isApproved: true,
        isActive: true
      });
    }
    if (students.length > 0) await User.insertMany(students);
    fs.unlinkSync(req.file.path);
    res.json({ message: `Imported ${students.length} students.` });
  } catch (err) {
    res.status(500).json({ message: 'Failed to import students', error: err.message });
  }
});

module.exports = router;