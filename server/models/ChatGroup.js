const mongoose = require('mongoose');

const chatGroupSchema = new mongoose.Schema({
    drive: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Drive',
        required: true
    },
    department: {
        type: String,
        required: true,
        enum: ['CSE', 'IT', 'ECE', 'EEE', 'ME', 'CE', 'DS', 'AIML', 'All']
    },
    name: {
        type: String,
        required: true
    },
    members: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        joinedAt: {
            type: Date,
            default: Date.now
        },
        lastReadAt: {
            type: Date,
            default: null
        },
        unreadCount: {
            type: Number,
            default: 0
        }
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    lastMessage: {
        content: String,
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        createdAt: Date
    },
    totalMessages: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Compound index for unique drive+department combination
chatGroupSchema.index({ drive: 1, department: 1 }, { unique: true });
chatGroupSchema.index({ 'members.user': 1 });
chatGroupSchema.index({ createdBy: 1 });

// Helper to get user ID regardless of whether it's populated or not
const getUserId = (user) => {
    if (!user) return null;
    return user._id ? user._id.toString() : user.toString();
};

// Method to add member
chatGroupSchema.methods.addMember = function (userId) {
    const exists = this.members.some(m => getUserId(m.user) === userId.toString());
    if (!exists) {
        this.members.push({ user: userId, joinedAt: new Date(), lastReadAt: null, unreadCount: 0 });
    }
    return this;
};

// Method to check if user is member
chatGroupSchema.methods.isMember = function (userId) {
    return this.members.some(m => getUserId(m.user) === userId.toString());
};

// Method to increment unread for all members except sender
chatGroupSchema.methods.incrementUnread = function (senderId) {
    this.members.forEach(m => {
        if (getUserId(m.user) !== senderId.toString()) {
            m.unreadCount = (m.unreadCount || 0) + 1;
        }
    });
    this.totalMessages = (this.totalMessages || 0) + 1;
    return this;
};

// Method to mark as read for a user
chatGroupSchema.methods.markAsRead = function (userId) {
    const member = this.members.find(m => getUserId(m.user) === userId.toString());
    if (member) {
        member.unreadCount = 0;
        member.lastReadAt = new Date();
    }
    return this;
};

// Method to get unread count for a user
chatGroupSchema.methods.getUnreadCount = function (userId) {
    const member = this.members.find(m => getUserId(m.user) === userId.toString());
    return member ? (member.unreadCount || 0) : 0;
};

module.exports = mongoose.model('ChatGroup', chatGroupSchema);
