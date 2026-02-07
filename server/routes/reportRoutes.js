const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const auth = require('../middleware/auth');
const { adminAuth } = require('../middleware/adminAuth');

// All report routes should be protected, likely Admin only
router.get('/stats', auth, adminAuth, reportController.getPlacementStats);
router.get('/company-stats', auth, adminAuth, reportController.getCompanyStats);
router.get('/export-students', auth, adminAuth, reportController.getStudentReportData);

module.exports = router;
