const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { analyzeResume, quickKeywordMatch } = require('../services/atsService');

/**
 * @route   POST /api/ats/analyze
 * @desc    Analyze resume against job description with Gemini AI
 * @access  Private (students only)
 */
router.post('/analyze', auth, async (req, res) => {
    try {
        const { resumeText, jobDescription } = req.body;

        if (!jobDescription || !jobDescription.trim()) {
            return res.status(400).json({ message: 'Job description is required' });
        }

        if (!resumeText || resumeText.trim().length < 50) {
            return res.status(400).json({
                message: 'Resume text is too short. Please upload your complete resume.'
            });
        }

        // Analyze with Gemini AI
        const analysis = await analyzeResume(resumeText, jobDescription);

        res.json({
            success: true,
            analysis
        });
    } catch (error) {
        console.error('ATS Analysis Error:', error);
        res.status(500).json({
            message: error.message || 'Failed to analyze resume'
        });
    }
});

/**
 * @route   POST /api/ats/quick-check
 * @desc    Quick keyword-based ATS check (no AI)
 * @access  Private
 */
router.post('/quick-check', auth, async (req, res) => {
    try {
        const { resumeText, jobDescription } = req.body;

        if (!resumeText || !jobDescription) {
            return res.status(400).json({
                message: 'Both resume text and job description are required'
            });
        }

        const result = quickKeywordMatch(resumeText, jobDescription);

        res.json({
            success: true,
            analysis: result
        });
    } catch (error) {
        console.error('Quick ATS Check Error:', error);
        res.status(500).json({ message: 'Failed to perform quick check' });
    }
});

module.exports = router;
