const axios = require('axios');

// Gemini API endpoint
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

/**
 * Analyze resume against job description using Gemini AI
 * @param {string} resumeText - Extracted text from resume
 * @param {string} jobDescription - Job description text
 * @returns {Promise<Object>} - ATS analysis result
 */
const analyzeResume = async (resumeText, jobDescription) => {
    try {
        const prompt = `You are an expert ATS (Applicant Tracking System) analyzer. Analyze the following resume against the job description and provide a detailed compatibility report.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

Provide your analysis in the following JSON format ONLY (no markdown, no code blocks, just pure JSON):
{
    "atsScore": <number between 0-100>,
    "summary": "<brief 2-3 sentence summary of the match>",
    "matchedKeywords": ["<keyword1>", "<keyword2>", ...],
    "missingKeywords": ["<keyword1>", "<keyword2>", ...],
    "strengths": ["<strength1>", "<strength2>", ...],
    "improvements": ["<specific improvement suggestion1>", "<specific improvement suggestion2>", ...],
    "skillsMatch": {
        "technical": <percentage 0-100>,
        "experience": <percentage 0-100>,
        "education": <percentage 0-100>,
        "softSkills": <percentage 0-100>
    },
    "formatIssues": ["<issue1>", "<issue2>", ...],
    "recommendation": "<overall recommendation for the candidate>"
}

Be thorough but constructive. Focus on actionable improvements.`;

        console.log('Using Gemini Model URL:', GEMINI_API_URL); // DEBUG LOG

        const response = await axios.post(
            `${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`,
            {
                contents: [{
                    parts: [{ text: prompt }]
                }]
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            throw new Error('No response from Gemini API');
        }

        // Parse JSON from response
        let analysisResult;
        try {
            // Try to extract JSON from the response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                analysisResult = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('No JSON found in response');
            }
        } catch (parseError) {
            console.error('Failed to parse Gemini response:', parseError);
            console.error('Raw response:', text);
            // Return a fallback structure
            analysisResult = {
                atsScore: 50,
                summary: 'Unable to fully analyze. Please try again.',
                matchedKeywords: [],
                missingKeywords: [],
                strengths: [],
                improvements: ['Please ensure resume is properly formatted'],
                skillsMatch: { technical: 50, experience: 50, education: 50, softSkills: 50 },
                formatIssues: [],
                recommendation: 'Please try again with a clearer resume format.'
            };
        }

        return analysisResult;
    } catch (error) {
        console.error('Gemini API Error:', error.response?.data || error.message);
        throw new Error('Failed to analyze resume with AI');
    }
};

/**
 * Get quick keyword match without AI (fallback/quick mode)
 * @param {string} resumeText - Resume text
 * @param {string} jobDescription - Job description
 * @returns {Object} - Basic match result
 */
const quickKeywordMatch = (resumeText, jobDescription) => {
    const resumeLower = resumeText.toLowerCase();
    const jobLower = jobDescription.toLowerCase();

    // Common technical keywords to look for
    const techKeywords = [
        'javascript', 'python', 'java', 'react', 'node', 'nodejs', 'sql', 'mongodb',
        'aws', 'docker', 'kubernetes', 'git', 'agile', 'scrum', 'html', 'css',
        'typescript', 'angular', 'vue', 'express', 'django', 'flask', 'spring',
        'machine learning', 'data science', 'api', 'rest', 'graphql', 'devops',
        'ci/cd', 'testing', 'debugging', 'linux', 'cloud', 'azure', 'gcp',
        'c++', 'c#', '.net', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin',
        'tensorflow', 'pytorch', 'pandas', 'numpy', 'excel', 'powerbi', 'tableau'
    ];

    // Find keywords mentioned in job description
    const jobKeywords = techKeywords.filter(kw => jobLower.includes(kw));

    // Find which ones are in the resume
    const matched = jobKeywords.filter(kw => resumeLower.includes(kw));
    const missing = jobKeywords.filter(kw => !resumeLower.includes(kw));

    const score = jobKeywords.length > 0
        ? Math.round((matched.length / jobKeywords.length) * 100)
        : 50;

    return {
        atsScore: score,
        matchedKeywords: matched,
        missingKeywords: missing,
        summary: `Found ${matched.length} of ${jobKeywords.length} key technical skills in your resume.`,
        strengths: matched.length > 0 ? [`Strong in: ${matched.slice(0, 5).join(', ')}`] : [],
        improvements: missing.length > 0 ? [`Consider adding: ${missing.slice(0, 5).join(', ')}`] : [],
        skillsMatch: {
            technical: score,
            experience: 50,
            education: 50,
            softSkills: 50
        },
        formatIssues: [],
        recommendation: score >= 70 ? 'Good match! Apply with confidence.' :
            score >= 50 ? 'Decent match. Consider tailoring your resume.' :
                'Low match. Strongly recommend adding missing keywords.'
    };
};

module.exports = {
    analyzeResume,
    quickKeywordMatch
};
