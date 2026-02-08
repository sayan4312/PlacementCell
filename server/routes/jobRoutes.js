const express = require('express');
const router = express.Router();
const { searchJobs, getJobDetails } = require('../services/jobSearchService');
const auth = require('../middleware/auth');

/**
 * @route   GET /api/jobs/search
 * @desc    Search for external jobs
 * @access  Private (authenticated users)
 */
router.get('/search', auth, async (req, res) => {
    try {
        const { q, location, type, page } = req.query;

        if (!q) {
            return res.status(400).json({ message: 'Search query (q) is required' });
        }

        const result = await searchJobs(
            q,
            location || 'india',
            type || '',
            parseInt(page) || 1
        );

        res.json(result);
    } catch (error) {
        console.error('Job search error:', error);
        res.status(500).json({ message: error.message || 'Failed to search jobs' });
    }
});

/**
 * @route   GET /api/jobs/:jobId
 * @desc    Get job details by ID
 * @access  Private
 */
router.get('/:jobId', auth, async (req, res) => {
    try {
        const job = await getJobDetails(req.params.jobId);

        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        res.json({ job });
    } catch (error) {
        console.error('Job details error:', error);
        res.status(500).json({ message: error.message || 'Failed to get job details' });
    }
});

module.exports = router;
