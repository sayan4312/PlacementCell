const mongoose = require('mongoose');

const roundSchema = new mongoose.Schema({
    roundName: { type: String, required: true },
    roundType: { type: String, enum: ['aptitude', 'coding', 'technical', 'hr', 'group_discussion', 'other'], default: 'other' },
    questions: [{ type: String }],
    description: { type: String }
});

const commentSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, default: null }, // null = top-level, ObjectId = reply
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    downvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    voteScore: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

const resourceSchema = new mongoose.Schema({
    title: { type: String, required: true },
    url: { type: String },
    fileUrl: { type: String },
    type: { type: String, enum: ['pdf', 'link', 'image', 'document', 'other'], default: 'link' }
});

const interviewExperienceSchema = new mongoose.Schema({
    // Author
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Post Type
    postType: {
        type: String,
        enum: ['interview_experience', 'question', 'coding_question', 'resource', 'drive_update', 'discussion'],
        required: true
    },

    // Basic Info
    title: { type: String, required: true },
    companyName: { type: String, index: true },
    role: { type: String },
    year: { type: Number },
    batch: { type: String }, // e.g., "2024", "2025"
    driveType: { type: String, enum: ['internship', 'fulltime', 'both'], default: 'fulltime' },

    // Interview Details (for interview_experience type)
    rounds: [roundSchema],
    result: { type: String, enum: ['selected', 'rejected', 'pending', 'waiting'], default: 'pending' },
    difficulty: { type: Number, min: 1, max: 5, default: 3 },

    // Content
    content: { type: String }, // Main body (markdown supported)
    tips: [{ type: String }],
    tags: [{ type: String, index: true }], // e.g., "DSA", "System Design"

    // Resources
    resources: [resourceSchema],

    // Voting
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    downvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    voteScore: { type: Number, default: 0 },

    // Comments
    comments: [commentSchema],
    commentCount: { type: Number, default: 0 },

    // Question Aggregation (for tracking mentions)
    mentionedTopics: [{ type: String, index: true }], // Auto-extracted keywords

    // Moderation
    isPinned: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false }, // Verified by TPO
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isReported: { type: Boolean, default: false },
    reportCount: { type: Number, default: 0 },
    reportedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isDeleted: { type: Boolean, default: false },

    // Bookmarks
    savedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // Stats
    viewCount: { type: Number, default: 0 }
}, {
    timestamps: true
});

// Indexes for efficient queries
interviewExperienceSchema.index({ companyName: 1, createdAt: -1 });
interviewExperienceSchema.index({ voteScore: -1, createdAt: -1 });
interviewExperienceSchema.index({ postType: 1 });
interviewExperienceSchema.index({ user: 1 });
// interviewExperienceSchema.index({ mentionedTopics: 1 }); // Removed duplicate index
interviewExperienceSchema.index({ title: 'text', content: 'text', companyName: 'text' });

// Virtual for net votes
interviewExperienceSchema.virtual('netVotes').get(function () {
    return this.upvotes.length - this.downvotes.length;
});

// Pre-save hook to update voteScore
interviewExperienceSchema.pre('save', function (next) {
    this.voteScore = this.upvotes.length - this.downvotes.length;
    this.commentCount = this.comments.length;
    next();
});

module.exports = mongoose.model('InterviewExperience', interviewExperienceSchema);
