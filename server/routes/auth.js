const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// Login
router.post('/login', authController.login);

// Get current user
router.get('/me', auth, authController.getMe);

// Change password (protected)
router.post('/change-password', auth, authController.changePassword);

// Logout
router.post('/logout', authController.logout);

module.exports = router;