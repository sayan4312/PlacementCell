const express = require('express');
const router = express.Router();
const offerController = require('../controllers/offerController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload'); // Assuming existing upload middleware

// Student routes
router.post('/upload', protect, authorize('student'), upload.single('offerLetter'), offerController.uploadOffer);
router.get('/my-offers', protect, authorize('student'), offerController.getMyOffers);
router.delete('/:id', protect, authorize('student'), offerController.deleteOffer);

// TPO routes (department-specific verification)
router.get('/all', protect, authorize('tpo'), offerController.getAllOffers);
router.put('/:id/verify', protect, authorize('tpo'), offerController.verifyOffer);

module.exports = router;
