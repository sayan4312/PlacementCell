const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    chatGroup: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChatGroup',
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        default: ''
    },
    // File attachment fields
    fileUrl: {
        type: String,
        default: null
    },
    fileName: {
        type: String,
        default: null
    },
    fileType: {
        type: String,
        enum: ['pdf', 'doc', 'docx', 'image', 'other', null],
        default: null
    },
    fileSize: {
        type: String,
        default: null
    },
    public_id: {
        type: String,
        default: null
    },
    // Reply feature
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
        default: null
    },
    // Reactions
    reactions: [{
        emoji: String,
        users: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }]
    }],
    // Pin feature (TPO only)
    isPinned: {
        type: Boolean,
        default: false
    },
    pinnedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    pinnedAt: {
        type: Date,
        default: null
    },
    // Edit/Delete
    isEdited: {
        type: Boolean,
        default: false
    },
    editedAt: {
        type: Date,
        default: null
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    // Mentions
    mentions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true
});

// Indexes for efficient queries
messageSchema.index({ chatGroup: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ chatGroup: 1, isPinned: 1 });
messageSchema.index({ chatGroup: 1, content: 'text' }); // Text search

module.exports = mongoose.model('Message', messageSchema);
