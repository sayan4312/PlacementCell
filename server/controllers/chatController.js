const ChatGroup = require('../models/ChatGroup');
const Message = require('../models/Message');
const User = require('../models/User');
const { uploadFromBuffer } = require('../config/cloudinary');

// Branch mapping for department names
const branchToDepartment = {
    'Computer Science': 'CSE',
    'Information Technology': 'IT',
    'Electronics & Communication': 'ECE',
    'Electrical Engineering': 'EEE',
    'Mechanical Engineering': 'ME',
    'Civil Engineering': 'CE',
    'Data Science': 'DS',
    'AIML': 'AIML'
};

// Get user's chat groups with unread counts
exports.getMyGroups = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        let query;

        if (user.role === 'student') {
            // Students see only their department groups where they're members
            const dept = branchToDepartment[user.branch] || user.branch;
            query = { 'members.user': req.user.id, department: dept };
        } else if (user.role === 'tpo') {
            // TPO sees only their department's groups (based on TPO's department field)
            if (user.department) {
                const dept = branchToDepartment[user.department] || user.department;
                query = {
                    $or: [
                        { 'members.user': req.user.id, department: dept },
                        { createdBy: req.user.id, department: dept }
                    ]
                };
            } else {
                // If TPO has no department set, show all groups they created/are member of
                query = {
                    $or: [
                        { 'members.user': req.user.id },
                        { createdBy: req.user.id }
                    ]
                };
            }
        } else if (user.role === 'admin') {
            // Admin sees all groups
            query = {};
        } else {
            query = { 'members.user': req.user.id };
        }

        const groups = await ChatGroup.find(query)
            .populate('drive', 'companyName position status deadline')
            .populate('lastMessage.sender', 'name studentId role')
            .populate('members.user', 'name studentId role')
            .sort({ 'lastMessage.createdAt': -1, createdAt: -1 });

        // Add unread count to each group for current user
        const groupsWithUnread = groups.map(g => {
            const group = g.toObject();
            group.unreadCount = g.getUnreadCount(req.user.id);
            return group;
        });

        res.json(groupsWithUnread);
    } catch (error) {
        console.error('Error fetching chat groups:', error);
        res.status(500).json({ message: 'Server error' });
    }


};

// Get messages for a specific group (with pinned messages first)
exports.getMessages = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { page = 1, limit = 50 } = req.query;

        const group = await ChatGroup.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        if (!group.isMember(req.user.id)) {
            return res.status(403).json({ message: 'You are not a member of this group' });
        }

        // Mark as read when fetching messages
        group.markAsRead(req.user.id);
        await group.save();

        // Get pinned messages first
        const pinnedMessages = await Message.find({ chatGroup: groupId, isPinned: true, isDeleted: { $ne: true } })
            .populate('sender', 'name studentId role')
            .populate('replyTo', 'content sender')
            .populate('reactions.users', 'name studentId')
            .sort({ pinnedAt: -1 });

        // Get regular messages
        const messages = await Message.find({ chatGroup: groupId, isDeleted: { $ne: true } })
            .populate('sender', 'name studentId role')
            .populate('replyTo', 'content sender')
            .populate('reactions.users', 'name studentId')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        res.json({
            messages: messages.reverse(),
            pinnedMessages,
            totalMessages: group.totalMessages || 0
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Send a text message (with reply support)
exports.sendMessage = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { content, replyTo } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({ message: 'Message content is required' });
        }

        const group = await ChatGroup.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }
        if (!group.isMember(req.user.id)) {
            return res.status(403).json({ message: 'You are not a member of this group' });
        }

        // Parse @mentions from content
        const mentionPattern = /@(\w+)/g;
        const mentionMatches = content.match(mentionPattern) || [];
        const mentionedUsers = [];

        for (const mention of mentionMatches) {
            const identifier = mention.slice(1);
            const user = await User.findOne({
                $or: [{ studentId: identifier }, { name: new RegExp(identifier, 'i') }]
            });
            if (user && group.isMember(user._id)) {
                mentionedUsers.push(user._id);
            }
        }

        const message = await Message.create({
            chatGroup: groupId,
            sender: req.user.id,
            content: content.trim(),
            replyTo: replyTo || null,
            mentions: mentionedUsers
        });

        // Update group
        group.lastMessage = {
            content: content.trim().substring(0, 100),
            sender: req.user.id,
            createdAt: new Date()
        };
        group.incrementUnread(req.user.id);
        await group.save();

        await message.populate('sender', 'name studentId role');
        await message.populate('replyTo', 'content sender');

        res.status(201).json(message);
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Send a file message
exports.sendFile = async (req, res) => {
    try {
        const { groupId } = req.params;

        if (!req.file) {
            return res.status(400).json({ message: 'File is required' });
        }

        const group = await ChatGroup.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }
        if (!group.isMember(req.user.id)) {
            return res.status(403).json({ message: 'You are not a member of this group' });
        }

        const ext = req.file.originalname.split('.').pop().toLowerCase();
        let fileType = 'other';
        if (ext === 'pdf') fileType = 'pdf';
        else if (['doc', 'docx'].includes(ext)) fileType = 'doc';
        else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) fileType = 'image';

        const uploadResult = await uploadFromBuffer(req.file.buffer, 'chat-files');

        const message = await Message.create({
            chatGroup: groupId,
            sender: req.user.id,
            content: req.body.content || '',
            fileUrl: uploadResult.url,
            fileName: req.file.originalname,
            fileType,
            fileSize: `${(req.file.size / 1024).toFixed(1)} KB`,
            public_id: uploadResult.public_id,
            replyTo: req.body.replyTo || null
        });

        group.lastMessage = {
            content: `📎 ${req.file.originalname}`,
            sender: req.user.id,
            createdAt: new Date()
        };
        group.incrementUnread(req.user.id);
        await group.save();

        await message.populate('sender', 'name studentId role');

        res.status(201).json(message);
    } catch (error) {
        console.error('Error sending file:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Add/remove reaction to message
exports.reactToMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { emoji } = req.body;

        if (!emoji) {
            return res.status(400).json({ message: 'Emoji is required' });
        }

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        const group = await ChatGroup.findById(message.chatGroup);
        if (!group.isMember(req.user.id)) {
            return res.status(403).json({ message: 'Not a member of this group' });
        }

        // Find or create reaction for this emoji
        let reaction = message.reactions.find(r => r.emoji === emoji);

        if (reaction) {
            // Handle both ObjectId and populated object cases
            const userIndex = reaction.users.findIndex(u => {
                const uId = u._id ? u._id.toString() : u.toString();
                return uId === req.user.id.toString();
            });

            if (userIndex > -1) {
                // Remove user's reaction
                reaction.users.splice(userIndex, 1);
                if (reaction.users.length === 0) {
                    message.reactions = message.reactions.filter(r => r.emoji !== emoji);
                }
            } else {
                // Add user's reaction
                reaction.users.push(req.user.id);
            }
        } else {
            // New reaction
            message.reactions.push({ emoji, users: [req.user.id] });
        }

        await message.save();
        await message.populate('reactions.users', 'name studentId');

        res.json(message);
    } catch (error) {
        console.error('Error reacting to message:', error);
        res.status(500).json({ message: 'Server error' });
    }

};

// Pin/unpin message (TPO only)
exports.togglePin = async (req, res) => {
    try {
        const { messageId } = req.params;
        const user = await User.findById(req.user.id);

        if (user.role !== 'tpo' && user.role !== 'admin') {
            return res.status(403).json({ message: 'Only TPO can pin messages' });
        }

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        message.isPinned = !message.isPinned;
        message.pinnedBy = message.isPinned ? req.user.id : null;
        message.pinnedAt = message.isPinned ? new Date() : null;

        await message.save();
        await message.populate('sender', 'name studentId role');

        res.json({ message: 'Pin status updated', data: message });
    } catch (error) {
        console.error('Error toggling pin:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Edit message
exports.editMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { content } = req.body;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        // Only sender can edit
        if (message.sender.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Can only edit your own messages' });
        }

        // Only within 15 minutes
        const fifteenMinutes = 15 * 60 * 1000;
        if (Date.now() - message.createdAt > fifteenMinutes) {
            return res.status(400).json({ message: 'Can only edit within 15 minutes' });
        }

        message.content = content.trim();
        message.isEdited = true;
        message.editedAt = new Date();

        await message.save();
        await message.populate('sender', 'name studentId role');

        res.json(message);
    } catch (error) {
        console.error('Error editing message:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete message (soft delete)
exports.deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        const user = await User.findById(req.user.id);

        // Sender or TPO can delete
        if (message.sender.toString() !== req.user.id && user.role !== 'tpo' && user.role !== 'admin') {
            return res.status(403).json({ message: 'Cannot delete this message' });
        }

        message.isDeleted = true;
        message.content = 'This message was deleted';
        message.fileUrl = null;
        message.fileName = null;

        await message.save();

        res.json({ message: 'Message deleted' });
    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Search messages in group
exports.searchMessages = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { q } = req.query;

        if (!q || q.length < 2) {
            return res.status(400).json({ message: 'Search query must be at least 2 characters' });
        }

        const group = await ChatGroup.findById(groupId);
        if (!group || !group.isMember(req.user.id)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const messages = await Message.find({
            chatGroup: groupId,
            isDeleted: { $ne: true },
            content: { $regex: q, $options: 'i' }
        })
            .populate('sender', 'name studentId role')
            .sort({ createdAt: -1 })
            .limit(50);

        res.json(messages);
    } catch (error) {
        console.error('Error searching messages:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Mark messages as read
exports.markAsRead = async (req, res) => {
    try {
        const { groupId } = req.params;

        const group = await ChatGroup.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        group.markAsRead(req.user.id);
        await group.save();

        res.json({ message: 'Marked as read' });
    } catch (error) {
        console.error('Error marking as read:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get group info (members, files, pinned)
exports.getGroupInfo = async (req, res) => {
    try {
        const { groupId } = req.params;

        const group = await ChatGroup.findById(groupId)
            .populate('drive', 'companyName position status deadline eligibility')
            .populate('members.user', 'name studentId role email')
            .populate('createdBy', 'name');

        if (!group || !group.isMember(req.user.id)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Get shared files
        const sharedFiles = await Message.find({
            chatGroup: groupId,
            fileUrl: { $ne: null },
            isDeleted: { $ne: true }
        })
            .populate('sender', 'name studentId')
            .sort({ createdAt: -1 })
            .limit(20);

        // Get pinned messages
        const pinnedMessages = await Message.find({
            chatGroup: groupId,
            isPinned: true,
            isDeleted: { $ne: true }
        })
            .populate('sender', 'name studentId role')
            .sort({ pinnedAt: -1 });

        res.json({
            group,
            sharedFiles,
            pinnedMessages,
            memberCount: group.members.length
        });
    } catch (error) {
        console.error('Error getting group info:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Helper: Create chat groups for a drive
exports.createGroupsForDrive = async (drive, creatorId) => {
    const groups = [];
    const branches = drive.eligibility?.allowedBranches || ['All'];

    for (const branch of branches) {
        try {
            const groupName = `${branch} ${drive.companyName} ${drive.position}`;
            const group = await ChatGroup.create({
                drive: drive._id,
                department: branch,
                name: groupName,
                members: [{ user: creatorId, joinedAt: new Date(), lastReadAt: new Date(), unreadCount: 0 }],
                createdBy: creatorId
            });
            groups.push(group);
        } catch (err) {
            if (err.code !== 11000) {
                console.error('Error creating chat group:', err);
            }
        }
    }
    return groups;
};

// Helper: Add student to drive's chat group
exports.addStudentToGroup = async (driveId, studentId, studentBranch) => {
    try {
        const dept = branchToDepartment[studentBranch] || studentBranch;

        let group = await ChatGroup.findOne({ drive: driveId, department: dept });

        if (!group) {
            group = await ChatGroup.findOne({ drive: driveId, department: 'All' });
        }

        if (group) {
            group.addMember(studentId);
            await group.save();
            return group;
        }
        return null;
    } catch (error) {
        console.error('Error adding student to group:', error);
        return null;
    }
};
