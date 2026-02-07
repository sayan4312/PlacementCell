const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// All routes require authentication
router.use(protect);

// Get user's chat groups
router.get('/groups', chatController.getMyGroups);

// Get group info (members, files, pinned)
router.get('/groups/:groupId/info', chatController.getGroupInfo);

// Get messages for a group
router.get('/groups/:groupId/messages', chatController.getMessages);

// Search messages in group
router.get('/groups/:groupId/search', chatController.searchMessages);

// Send text message
router.post('/groups/:groupId/messages', chatController.sendMessage);

// Send file message
router.post('/groups/:groupId/files', upload.single('chatFile'), chatController.sendFile);

// Mark as read
router.put('/groups/:groupId/read', chatController.markAsRead);

// Message actions
router.put('/messages/:messageId/react', chatController.reactToMessage);
router.put('/messages/:messageId/pin', chatController.togglePin);
router.put('/messages/:messageId', chatController.editMessage);
router.delete('/messages/:messageId', chatController.deleteMessage);

module.exports = router;
