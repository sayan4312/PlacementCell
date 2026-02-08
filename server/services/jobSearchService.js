const axios = require('axios');

// In-memory cache to avoid hitting API limits
const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Search for jobs using JSearch API (RapidAPI)
 * @param {string} query - Job title or keyword (e.g., "software engineer")
 * @param {string} location - Location (e.g., "india", "bangalore")
 * @param {string} employmentType - FULLTIME, PARTTIME, INTERN, CONTRACTOR
 * @param {number} page - Page number for pagination
 * @returns {Promise<Object>} - Job listings
 */
const searchJobs = async (query, location = 'india', employmentType = '', page = 1) => {
    const cacheKey = `${query}-${location}-${employmentType}-${page}`;

    // Check cache first
    if (cache.has(cacheKey)) {
        const cached = cache.get(cacheKey);
        if (Date.now() - cached.timestamp < CACHE_TTL) {
            console.log('Returning cached job results');
            return cached.data;
        }
        cache.delete(cacheKey);
    }

    try {
        const params = {
            query: `${query} in ${location}`,
            page: page.toString(),
            num_pages: '1'
        };

        // Add employment type filter if specified
        if (employmentType) {
            params.employment_types = employmentType;
        }

        const response = await axios.get('https://jsearch.p.rapidapi.com/search', {
            params,
            headers: {
                'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
                'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
            }
        });

        // Normalize the response
        const jobs = (response.data.data || []).map(job => ({
            id: job.job_id,
            title: job.job_title,
            company: job.employer_name,
            companyLogo: job.employer_logo,
            location: job.job_city ? `${job.job_city}, ${job.job_country}` : job.job_country || 'Remote',
            isRemote: job.job_is_remote,
            employmentType: job.job_employment_type,
            description: job.job_description?.substring(0, 300) + '...',
            salary: job.job_min_salary && job.job_max_salary
                ? `${job.job_salary_currency || '$'}${job.job_min_salary} - ${job.job_max_salary}`
                : job.job_salary_period ? `${job.job_salary_period}` : null,
            applyLink: job.job_apply_link,
            postedAt: job.job_posted_at_datetime_utc,
            source: job.job_publisher
        }));

        const result = {
            jobs,
            totalCount: response.data.count || jobs.length,
            page,
            hasMore: jobs.length >= 10
        };

        // Cache the result
        cache.set(cacheKey, { data: result, timestamp: Date.now() });

        return result;
    } catch (error) {
        console.error('JSearch API Error:', error.response?.data || error.message);
        throw new Error('Failed to fetch jobs from external source');
    }
};

/**
 * Get job details by ID
 */
const getJobDetails = async (jobId) => {
    try {
        const response = await axios.get('https://jsearch.p.rapidapi.com/job-details', {
            params: { job_id: jobId },
            headers: {
                'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
                'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
            }
        });

        const job = response.data.data?.[0];
        if (!job) return null;

        return {
            id: job.job_id,
            title: job.job_title,
            company: job.employer_name,
            companyLogo: job.employer_logo,
            location: job.job_city ? `${job.job_city}, ${job.job_country}` : job.job_country,
            isRemote: job.job_is_remote,
            employmentType: job.job_employment_type,
            description: job.job_description,
            highlights: job.job_highlights,
            qualifications: job.job_required_skills,
            salary: job.job_min_salary && job.job_max_salary
                ? `${job.job_salary_currency || '$'}${job.job_min_salary} - ${job.job_max_salary}`
                : null,
            applyLink: job.job_apply_link,
            postedAt: job.job_posted_at_datetime_utc,
            source: job.job_publisher
        };
    } catch (error) {
        console.error('JSearch Job Details Error:', error.response?.data || error.message);
        throw new Error('Failed to fetch job details');
    }
};

module.exports = {
    searchJobs,
    getJobDetails
};
