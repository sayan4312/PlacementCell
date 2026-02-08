const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const experienceController = require('../controllers/experienceController');

// Public routes (still need auth for voting/commenting)
router.get('/', protect, experienceController.getAllExperiences);
router.get('/insights', protect, experienceController.getInsights);
router.get('/leaderboard', protect, experienceController.getLeaderboard);
router.get('/companies', protect, experienceController.getCompanies);
router.get('/saved', protect, experienceController.getSavedExperiences);
router.get('/my-posts', protect, experienceController.getMyPosts);
router.get('/company/:companyName', protect, experienceController.getCompanyCommunity);
router.get('/user/:userId/profile', protect, experienceController.getUserProfile);
router.get('/:id', protect, experienceController.getExperienceById);

// Write operations
router.post('/', protect, experienceController.createExperience);
router.put('/:id', protect, experienceController.updateExperience);
router.delete('/:id', protect, experienceController.deleteExperience);

// Interactions
router.patch('/:id/vote', protect, experienceController.toggleVote);
router.post('/:id/comments', protect, experienceController.addComment);
router.patch('/:id/comments/:commentId/vote', protect, experienceController.voteComment);
router.patch('/:id/save', protect, experienceController.toggleSave);
router.patch('/:id/report', protect, experienceController.reportPost);
router.patch('/:id/verify', protect, experienceController.verifyPost);
router.post('/upload', protect, upload.single('postAttachment'), experienceController.uploadAttachment);

module.exports = router;
