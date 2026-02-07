const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    company: {
        type: String, // Or ObjectId if rigorous company linking needed, String acceptable for flexibility
        required: true
    },
    job: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        required: false // Optional, if they got placed off-campus or unlinked
    },
    package: {
        type: String, // e.g. "12 LPA"
        required: true
    },
    fileUrl: {
        type: String, // Cloudinary URL
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Verified', 'Rejected'],
        default: 'Pending'
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    },
    remarks: {
        type: String // TPO rejection reason
    }
});

module.exports = mongoose.model('Offer', offerSchema);
