import apiClient from './apiClient';

export const chatAPI = {
    // Get user's chat groups with unread counts
    getMyGroups: async () => {
        const response = await apiClient.get('/chat/groups');
        return response.data;
    },

    // Get group info (members, files, pinned)
    getGroupInfo: async (groupId: string) => {
        const response = await apiClient.get(`/chat/groups/${groupId}/info`);
        return response.data;
    },

    // Get messages for a group
    getMessages: async (groupId: string, page = 1) => {
        const response = await apiClient.get(`/chat/groups/${groupId}/messages`, {
            params: { page }
        });
        return response.data;
    },

    // Search messages in group
    searchMessages: async (groupId: string, query: string) => {
        const response = await apiClient.get(`/chat/groups/${groupId}/search`, {
            params: { q: query }
        });
        return response.data;
    },

    // Send text message (with optional reply)
    sendMessage: async (groupId: string, content: string, replyTo?: string) => {
        const response = await apiClient.post(`/chat/groups/${groupId}/messages`, { content, replyTo });
        return response.data;
    },

    // Send file message
    sendFile: async (groupId: string, file: File, content?: string, replyTo?: string) => {
        const formData = new FormData();
        formData.append('chatFile', file);
        if (content) formData.append('content', content);
        if (replyTo) formData.append('replyTo', replyTo);

        const response = await apiClient.post(`/chat/groups/${groupId}/files`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    // Mark messages as read
    markAsRead: async (groupId: string) => {
        const response = await apiClient.put(`/chat/groups/${groupId}/read`);
        return response.data;
    },

    // Add/remove reaction
    reactToMessage: async (messageId: string, emoji: string) => {
        const response = await apiClient.put(`/chat/messages/${messageId}/react`, { emoji });
        return response.data;
    },

    // Pin/unpin message (TPO only)
    togglePin: async (messageId: string) => {
        const response = await apiClient.put(`/chat/messages/${messageId}/pin`);
        return response.data;
    },

    // Edit message
    editMessage: async (messageId: string, content: string) => {
        const response = await apiClient.put(`/chat/messages/${messageId}`, { content });
        return response.data;
    },

    // Delete message
    deleteMessage: async (messageId: string) => {
        const response = await apiClient.delete(`/chat/messages/${messageId}`);
        return response.data;
    }
};

export default chatAPI;
