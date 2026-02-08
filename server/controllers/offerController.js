const Offer = require('../models/Offer');
const User = require('../models/User');
const cloud = require('../config/cloudinary');

// Upload Offer (Student)
exports.uploadOffer = async (req, res) => {
    try {
        const { company, package, job } = req.body;

        // File upload handled by middleware
        let fileUrl = '';
        if (req.file) {
            // Upload to Cloudinary from buffer
            const result = await cloud.uploadFromBuffer(req.file.buffer, 'offers');
            fileUrl = result.url;
        } else {
            return res.status(400).json({ message: 'Offer letter file is required' });
        }

        const newOffer = new Offer({
            student: req.user.id,
            company,
            package,
            job: job || null,
            fileUrl
        });

        await newOffer.save();

        res.status(201).json({ message: 'Offer uploaded successfully', offer: newOffer });
    } catch (error) {
        console.error('Error uploading offer:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get My Offers (Student)
exports.getMyOffers = async (req, res) => {
    try {
        const offers = await Offer.find({ student: req.user.id }).sort({ uploadedAt: -1 });
        res.json(offers);
    } catch (error) {
        console.error('Error fetching offers:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get All Offers (TPO) - Filter by status and TPO's department
exports.getAllOffers = async (req, res) => {
    try {
        const { status } = req.query;
        let query = {};
        if (status) query.status = status;

        // Get TPO's department to filter by
        const tpoUser = await User.findById(req.user.id);
        const tpoDepartment = tpoUser?.department;

        // Get all offers with student populated
        let offers = await Offer.find(query)
            .populate('student', 'name email studentId branch') // Populate student details
            .sort({ uploadedAt: -1 });

        // Filter by TPO's department if set
        if (tpoDepartment) {
            offers = offers.filter(o => o.student?.branch === tpoDepartment);
        }

        res.json(offers);
    } catch (error) {
        console.error('Error fetching all offers:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Verify/Reject Offer (TPO)
exports.verifyOffer = async (req, res) => {
    try {
        const { status, remarks } = req.body; // status: 'Verified' | 'Rejected'
        const offer = await Offer.findById(req.params.id);

        if (!offer) {
            return res.status(404).json({ message: 'Offer not found' });
        }

        offer.status = status;
        if (remarks) offer.remarks = remarks;
        await offer.save();

        // If verified, mark student as placed?
        if (status === 'Verified') {
            const student = await User.findById(offer.student);
            // Check Student model structure. Usually Student schema is separate or User has role.
            // Assuming loose coupling for now, or update User.isPlaced if schema supports it.
            // For USP: Automate placement status.
        }

        res.json({ message: `Offer ${status}`, offer });
    } catch (error) {
        console.error('Error verifying offer:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete Offer (Student - only their own)
exports.deleteOffer = async (req, res) => {
    try {
        const offer = await Offer.findById(req.params.id);

        if (!offer) {
            return res.status(404).json({ message: 'Offer not found' });
        }

        // Check if the user owns this offer
        if (offer.student.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this offer' });
        }

        // Delete from Cloudinary if public_id is stored (optional enhancement)
        // For now, just delete the database record
        await Offer.findByIdAndDelete(req.params.id);

        res.json({ message: 'Offer deleted successfully' });
    } catch (error) {
        console.error('Error deleting offer:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
