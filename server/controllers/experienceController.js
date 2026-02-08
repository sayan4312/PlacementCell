const InterviewExperience = require('../models/InterviewExperience');
const User = require('../models/User');
const { uploadFromBuffer } = require('../config/cloudinary');

// Helper: Extract topics from content (simple keyword extraction)
const extractTopics = (content, questions = []) => {
    const keywords = ['binary search', 'dynamic programming', 'oops', 'dbms', 'sql', 'system design',
        'arrays', 'linked list', 'trees', 'graphs', 'recursion', 'sorting', 'searching',
        'os', 'operating system', 'networking', 'cn', 'deadlock', 'mutex', 'semaphore',
        'normalization', 'acid', 'joins', 'indexes', 'polymorphism', 'inheritance',
        'machine learning', 'ml', 'ai', 'react', 'node', 'javascript', 'python', 'java', 'c++'];

    const text = `${content} ${questions.join(' ')}`.toLowerCase();
    return keywords.filter(keyword => text.includes(keyword));
};

// @desc    Get all experiences with filters and pagination
// @route   GET /api/experiences
exports.getAllExperiences = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            company,
            postType,
            batch,
            driveType,
            sort = 'trending', // trending, new, top
            search
        } = req.query;

        const query = { isDeleted: false };

        if (company) query.companyName = new RegExp(company, 'i');
        if (postType) query.postType = postType;
        if (batch) query.batch = batch;
        if (driveType) query.driveType = driveType;
        if (search) {
            query.$or = [
                { title: new RegExp(search, 'i') },
                { content: new RegExp(search, 'i') },
                { companyName: new RegExp(search, 'i') },
                { tags: new RegExp(search, 'i') }
            ];
        }

        let sortOption = {};
        switch (sort) {
            case 'new': sortOption = { createdAt: -1 }; break;
            case 'top': sortOption = { voteScore: -1, createdAt: -1 }; break;
            case 'trending':
            default: sortOption = { voteScore: -1, viewCount: -1, createdAt: -1 }; break;
        }

        const experiences = await InterviewExperience.find(query)
            .populate('user', 'name email role')
            .populate('comments.user', 'name email role')
            .sort(sortOption)
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await InterviewExperience.countDocuments(query);

        res.json({
            experiences,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching experiences:', error);
        res.status(500).json({ message: 'Failed to fetch experiences' });
    }
};

// @desc    Get single experience by ID
// @route   GET /api/experiences/:id
exports.getExperienceById = async (req, res) => {
    try {
        const experience = await InterviewExperience.findById(req.params.id)
            .populate('user', 'name email role')
            .populate('comments.user', 'name email role');

        if (!experience || experience.isDeleted) {
            return res.status(404).json({ message: 'Experience not found' });
        }

        // Increment view count
        experience.viewCount += 1;
        await experience.save();

        res.json({ experience });
    } catch (error) {
        console.error('Error fetching experience:', error);
        res.status(500).json({ message: 'Failed to fetch experience' });
    }
};

// @desc    Create new experience
// @route   POST /api/experiences
exports.createExperience = async (req, res) => {
    try {
        const { title, companyName, role, year, batch, driveType, postType,
            rounds, result, difficulty, content, tips, tags, resources } = req.body;

        // Custom validation
        if (['interview_experience', 'drive_update'].includes(postType) && !companyName) {
            return res.status(400).json({ message: 'Company Name is required for this post type' });
        }

        // Extract all questions from rounds
        const allQuestions = rounds?.flatMap(r => r.questions || []) || [];
        const extractedTopics = extractTopics(content || '', allQuestions);

        // Merge extracted topics with user-provided tags
        const mentionedTopics = [...new Set([...extractedTopics, ...(tags || []).map(t => t.toLowerCase())])];

        const experience = await InterviewExperience.create({
            user: req.user.id,
            title,
            companyName,
            role,
            year,
            batch,
            driveType,
            postType,
            rounds: rounds || [],
            result,
            difficulty,
            content,
            tips: tips || [],
            tags: tags || [],
            resources: resources || [],
            mentionedTopics
        });

        await experience.populate('user', 'name email role');

        res.status(201).json({ experience });
    } catch (error) {
        console.error('Error creating experience:', error);
        res.status(500).json({ message: 'Failed to create experience' });
    }
};

// @desc    Update experience
// @route   PUT /api/experiences/:id
exports.updateExperience = async (req, res) => {
    try {
        const experience = await InterviewExperience.findById(req.params.id);

        if (!experience || experience.isDeleted) {
            return res.status(404).json({ message: 'Experience not found' });
        }

        // Only author can edit
        if (experience.user.toString() !== req.user.id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to edit this post' });
        }

        const updates = req.body;

        // Re-extract topics if content changed
        if (updates.content || updates.rounds) {
            const allQuestions = updates.rounds?.flatMap(r => r.questions || []) ||
                experience.rounds.flatMap(r => r.questions || []);
            updates.mentionedTopics = extractTopics(updates.content || experience.content, allQuestions);
        }

        Object.assign(experience, updates);
        await experience.save();
        await experience.populate('user', 'name email role');

        res.json({ experience });
    } catch (error) {
        console.error('Error updating experience:', error);
        res.status(500).json({ message: 'Failed to update experience' });
    }
};

// @desc    Delete experience (soft delete)
// @route   DELETE /api/experiences/:id
exports.deleteExperience = async (req, res) => {
    try {
        const experience = await InterviewExperience.findById(req.params.id);

        if (!experience) {
            return res.status(404).json({ message: 'Experience not found' });
        }

        // Only author, admin, or TPO can delete
        const canDelete = experience.user.toString() === req.user.id.toString() ||
            ['admin', 'tpo'].includes(req.user.role);

        if (!canDelete) {
            return res.status(403).json({ message: 'Not authorized to delete this post' });
        }

        experience.isDeleted = true;
        await experience.save();

        res.json({ message: 'Experience deleted successfully' });
    } catch (error) {
        console.error('Error deleting experience:', error);
        res.status(500).json({ message: 'Failed to delete experience' });
    }
};

// @desc    Toggle vote (upvote/downvote)
// @route   PATCH /api/experiences/:id/vote
exports.toggleVote = async (req, res) => {
    let retries = 3;
    while (retries > 0) {
        try {
            const { voteType } = req.body; // 'up' or 'down'
            const userId = req.user.id;

            const experience = await InterviewExperience.findById(req.params.id);
            if (!experience || experience.isDeleted) {
                return res.status(404).json({ message: 'Experience not found' });
            }

            const upvoteIndex = experience.upvotes.indexOf(userId);
            const downvoteIndex = experience.downvotes.indexOf(userId);

            if (voteType === 'up') {
                if (upvoteIndex > -1) {
                    // Remove upvote (toggle off)
                    experience.upvotes.splice(upvoteIndex, 1);
                } else {
                    // Add upvote, remove downvote if exists
                    experience.upvotes.push(userId);
                    if (downvoteIndex > -1) experience.downvotes.splice(downvoteIndex, 1);
                }
            } else if (voteType === 'down') {
                if (downvoteIndex > -1) {
                    // Remove downvote (toggle off)
                    experience.downvotes.splice(downvoteIndex, 1);
                } else {
                    // Add downvote, remove upvote if exists
                    experience.downvotes.push(userId);
                    if (upvoteIndex > -1) experience.upvotes.splice(upvoteIndex, 1);
                }
            }

            await experience.save();

            return res.json({
                voteScore: experience.voteScore,
                upvotes: experience.upvotes.length,
                downvotes: experience.downvotes.length,
                userVote: experience.upvotes.includes(userId) ? 'up' :
                    experience.downvotes.includes(userId) ? 'down' : null
            });
        } catch (error) {
            if (error.name === 'VersionError' && retries > 1) {
                retries--;
                continue; // Retry
            }
            console.error('Error voting:', error);
            return res.status(500).json({ message: 'Failed to vote' });
        }
    }
};

// @desc    Add comment
// @route   POST /api/experiences/:id/comments
exports.addComment = async (req, res) => {
    try {
        const { content, parentId } = req.body;
        const experience = await InterviewExperience.findById(req.params.id);

        if (!experience || experience.isDeleted) {
            return res.status(404).json({ message: 'Experience not found' });
        }

        const newComment = {
            user: req.user.id,
            content,
            parentId: parentId || null,
            upvotes: [],
            downvotes: [],
            voteScore: 0
        };

        experience.comments.push(newComment);

        await experience.save();
        await experience.populate('comments.user', 'name email role');

        res.status(201).json({ comments: experience.comments });
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ message: 'Failed to add comment' });
    }
};

// @desc    Vote on a comment
// @route   PATCH /api/experiences/:id/comments/:commentId/vote
exports.voteComment = async (req, res) => {
    let retries = 3;
    while (retries > 0) {
        try {
            const { voteType } = req.body; // 'up' or 'down'
            const userId = req.user.id;
            const experience = await InterviewExperience.findById(req.params.id);

            if (!experience || experience.isDeleted) {
                return res.status(404).json({ message: 'Experience not found' });
            }

            const comment = experience.comments.id(req.params.commentId);
            if (!comment) {
                return res.status(404).json({ message: 'Comment not found' });
            }

            // Remove from both arrays first
            comment.upvotes = comment.upvotes.filter(id => id.toString() !== userId);
            comment.downvotes = comment.downvotes.filter(id => id.toString() !== userId);

            // Add vote
            if (voteType === 'up') {
                comment.upvotes.push(userId);
            } else if (voteType === 'down') {
                comment.downvotes.push(userId);
            }

            comment.voteScore = comment.upvotes.length - comment.downvotes.length;

            await experience.save();
            await experience.populate('comments.user', 'name email role');

            return res.json({ comments: experience.comments });
        } catch (error) {
            if (error.name === 'VersionError' && retries > 1) {
                retries--;
                continue; // Retry
            }
            console.error('Error voting on comment:', error);
            return res.status(500).json({ message: 'Failed to vote on comment' });
        }
    }
};

// @desc    Toggle save/bookmark
// @route   PATCH /api/experiences/:id/save
exports.toggleSave = async (req, res) => {
    try {
        const userId = req.user.id;
        const experience = await InterviewExperience.findById(req.params.id);

        if (!experience || experience.isDeleted) {
            return res.status(404).json({ message: 'Experience not found' });
        }

        const saveIndex = experience.savedBy.indexOf(userId);
        if (saveIndex > -1) {
            experience.savedBy.splice(saveIndex, 1);
        } else {
            experience.savedBy.push(userId);
        }

        await experience.save();

        res.json({ saved: experience.savedBy.includes(userId) });
    } catch (error) {
        console.error('Error toggling save:', error);
        res.status(500).json({ message: 'Failed to save experience' });
    }
};

// @desc    Get saved experiences for current user
// @route   GET /api/experiences/saved
exports.getSavedExperiences = async (req, res) => {
    try {
        const experiences = await InterviewExperience.find({
            savedBy: req.user.id,
            isDeleted: false
        })
            .populate('user', 'name email role')
            .sort({ createdAt: -1 });

        res.json({ experiences });
    } catch (error) {
        console.error('Error fetching saved:', error);
        res.status(500).json({ message: 'Failed to fetch saved experiences' });
    }
};

// @desc    Get user's own posts
// @route   GET /api/experiences/my-posts
exports.getMyPosts = async (req, res) => {
    try {
        const experiences = await InterviewExperience.find({
            user: req.user.id,
            isDeleted: false
        })
            .populate('user', 'name email role')
            .sort({ createdAt: -1 });

        res.json({ experiences });
    } catch (error) {
        console.error('Error fetching my posts:', error);
        res.status(500).json({ message: 'Failed to fetch posts' });
    }
};

// @desc    Get trending insights
// @route   GET /api/experiences/insights
exports.getInsights = async (req, res) => {
    try {
        // Most discussed company (last 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const topCompanies = await InterviewExperience.aggregate([
            { $match: { createdAt: { $gte: thirtyDaysAgo }, isDeleted: false } },
            { $group: { _id: '$companyName', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        // Most mentioned topics
        const topTopics = await InterviewExperience.aggregate([
            { $match: { createdAt: { $gte: thirtyDaysAgo }, isDeleted: false } },
            { $unwind: '$mentionedTopics' },
            { $group: { _id: '$mentionedTopics', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        // Top contributors
        const topContributors = await InterviewExperience.aggregate([
            { $match: { createdAt: { $gte: thirtyDaysAgo }, isDeleted: false } },
            { $group: { _id: '$user', posts: { $sum: 1 }, totalVotes: { $sum: '$voteScore' } } },
            { $sort: { totalVotes: -1, posts: -1 } },
            { $limit: 5 }
        ]);

        // Populate contributor names
        const populatedContributors = await User.populate(topContributors, {
            path: '_id',
            select: 'name email'
        });

        res.json({
            topCompanies,
            topTopics,
            topContributors: populatedContributors.map(c => ({
                user: c._id,
                posts: c.posts,
                totalVotes: c.totalVotes
            }))
        });
    } catch (error) {
        console.error('Error fetching insights:', error);
        res.status(500).json({ message: 'Failed to fetch insights' });
    }
};

// @desc    Get company-specific stats and posts
// @route   GET /api/experiences/company/:companyName
exports.getCompanyCommunity = async (req, res) => {
    try {
        const { companyName } = req.params;
        const { sort = 'hot' } = req.query;

        // Get posts for this company
        let sortOption = {};
        switch (sort) {
            case 'new': sortOption = { createdAt: -1 }; break;
            case 'top': sortOption = { voteScore: -1 }; break;
            case 'hot':
            default: sortOption = { voteScore: -1, createdAt: -1 }; break;
        }

        const posts = await InterviewExperience.find({
            companyName: new RegExp(`^${companyName}$`, 'i'),
            isDeleted: false
        })
            .populate('user', 'name email role')
            .sort(sortOption)
            .limit(50);

        // Calculate company stats
        const interviewPosts = posts.filter(p => p.postType === 'interview_experience');
        const avgDifficulty = interviewPosts.length > 0
            ? interviewPosts.reduce((sum, p) => sum + (p.difficulty || 3), 0) / interviewPosts.length
            : 0;

        const selectedCount = interviewPosts.filter(p => p.result === 'selected').length;
        const selectionRatio = interviewPosts.length > 0
            ? (selectedCount / interviewPosts.length * 100).toFixed(1)
            : 0;

        // Most repeated topics for this company
        const topicCounts = {};
        posts.forEach(p => {
            p.mentionedTopics?.forEach(topic => {
                topicCounts[topic] = (topicCounts[topic] || 0) + 1;
            });
        });
        const mostRepeatedTopics = Object.entries(topicCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([topic, count]) => ({ topic, count }));

        // Get unique rounds mentioned
        const roundTypes = new Set();
        interviewPosts.forEach(p => {
            p.rounds?.forEach(r => {
                if (r.roundType) roundTypes.add(r.roundType);
            });
        });

        res.json({
            companyName,
            stats: {
                totalPosts: posts.length,
                avgDifficulty: avgDifficulty.toFixed(1),
                selectionRatio: `${selectionRatio}%`,
                roundTypes: Array.from(roundTypes)
            },
            mostRepeatedTopics,
            posts
        });
    } catch (error) {
        console.error('Error fetching company community:', error);
        res.status(500).json({ message: 'Failed to fetch company data' });
    }
};

// @desc    Get leaderboard
// @route   GET /api/experiences/leaderboard
exports.getLeaderboard = async (req, res) => {
    try {
        const { company } = req.query;

        const matchStage = { isDeleted: false };
        if (company) matchStage.companyName = new RegExp(company, 'i');

        const leaderboard = await InterviewExperience.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: '$user',
                    posts: { $sum: 1 },
                    totalVotes: { $sum: '$voteScore' },
                    interviewPosts: { $sum: { $cond: [{ $eq: ['$postType', 'interview_experience'] }, 1, 0] } },
                    resourcePosts: { $sum: { $cond: [{ $eq: ['$postType', 'resource'] }, 1, 0] } },
                    codingPosts: { $sum: { $cond: [{ $eq: ['$postType', 'coding_question'] }, 1, 0] } }
                }
            },
            { $sort: { totalVotes: -1, posts: -1 } },
            { $limit: 20 }
        ]);

        const populated = await User.populate(leaderboard, {
            path: '_id',
            select: 'name email role'
        });

        // Assign badges
        const withBadges = populated.map((entry, index) => {
            const badges = [];
            if (entry.interviewPosts >= 5) badges.push('🥇 Interview Expert');
            if (entry.codingPosts >= 3) badges.push('🧠 Coding Contributor');
            if (entry.resourcePosts >= 3) badges.push('📚 Resource Curator');
            if (index < 3) badges.push('🏆 Top Contributor');

            return {
                rank: index + 1,
                user: entry._id,
                posts: entry.posts,
                totalVotes: entry.totalVotes,
                badges
            };
        });

        res.json({ leaderboard: withBadges });
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ message: 'Failed to fetch leaderboard' });
    }
};

// @desc    Report a post
// @route   PATCH /api/experiences/:id/report
exports.reportPost = async (req, res) => {
    try {
        const userId = req.user.id;
        const experience = await InterviewExperience.findById(req.params.id);

        if (!experience || experience.isDeleted) {
            return res.status(404).json({ message: 'Experience not found' });
        }

        if (!experience.reportedBy.includes(userId)) {
            experience.reportedBy.push(userId);
            experience.reportCount += 1;
            experience.isReported = true;
            await experience.save();
        }

        res.json({ message: 'Post reported successfully' });
    } catch (error) {
        console.error('Error reporting post:', error);
        res.status(500).json({ message: 'Failed to report post' });
    }
};

// @desc    Verify a post (TPO/Admin only)
// @route   PATCH /api/experiences/:id/verify
exports.verifyPost = async (req, res) => {
    try {
        if (!['admin', 'tpo'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Only TPO/Admin can verify posts' });
        }

        const experience = await InterviewExperience.findById(req.params.id);
        if (!experience || experience.isDeleted) {
            return res.status(404).json({ message: 'Experience not found' });
        }

        experience.isVerified = true;
        experience.verifiedBy = req.user.id;
        await experience.save();

        res.json({ message: 'Post verified successfully', isVerified: true });
    } catch (error) {
        console.error('Error verifying post:', error);
        res.status(500).json({ message: 'Failed to verify post' });
    }
};

// @desc    Get all companies with post counts
// @route   GET /api/experiences/companies
exports.getCompanies = async (req, res) => {
    try {
        const companies = await InterviewExperience.aggregate([
            { $match: { isDeleted: false } },
            {
                $group: {
                    _id: '$companyName',
                    postCount: { $sum: 1 },
                    avgDifficulty: { $avg: '$difficulty' },
                    latestPost: { $max: '$createdAt' }
                }
            },
            { $sort: { postCount: -1 } }
        ]);

        res.json({ companies });
    } catch (error) {
        console.error('Error fetching companies:', error);
        res.status(500).json({ message: 'Failed to fetch companies' });
    }
};

// @desc    Upload attachment for post
// @route   POST /api/experiences/upload
exports.uploadAttachment = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const result = await uploadFromBuffer(req.file.buffer, 'post_attachments');

        res.json({
            url: result.url,
            public_id: result.public_id,
            format: result.format,
            type: result.format === 'pdf' ? 'pdf' : 'image'
        });
    } catch (error) {
        console.error('Error uploading attachment:', error);
        res.status(500).json({ message: 'Failed to upload file' });
    }
};

// @desc    Get user profile stats and activities
// @route   GET /api/experiences/user/:userId/profile
exports.getUserProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId).select('name email role createdAt');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Aggregate stats
        const stats = await InterviewExperience.aggregate([
            { $match: { user: new mongoose.Types.ObjectId(userId), isDeleted: false } },
            {
                $group: {
                    _id: null,
                    totalPosts: { $sum: 1 },
                    totalVotes: { $sum: '$voteScore' },
                    interviewPosts: { $sum: { $cond: [{ $eq: ['$postType', 'interview_experience'] }, 1, 0] } },
                    resourcePosts: { $sum: { $cond: [{ $eq: ['$postType', 'resource'] }, 1, 0] } },
                    codingPosts: { $sum: { $cond: [{ $eq: ['$postType', 'coding_question'] }, 1, 0] } }
                }
            }
        ]);

        const userStats = stats[0] || { totalPosts: 0, totalVotes: 0, interviewPosts: 0, resourcePosts: 0, codingPosts: 0 };

        // Badges logic (reused)
        const badges = [];
        if (userStats.interviewPosts >= 5) badges.push('🥇 Interview Expert');
        if (userStats.codingPosts >= 3) badges.push('🧠 Coding Contributor');
        if (userStats.resourcePosts >= 3) badges.push('📚 Resource Curator');

        // Get Recent Posts
        const recentPosts = await InterviewExperience.find({ user: userId, isDeleted: false })
            .sort({ createdAt: -1 })
            .limit(10);

        res.json({
            user,
            stats: { ...userStats, badges },
            recentPosts
        });

    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Failed to fetch user profile' });
    }
};
