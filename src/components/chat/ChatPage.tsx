import { useState, useEffect, useRef } from 'react';
import { chatAPI } from '../../services/chatService';
import {
    MessageSquare, Send, Paperclip, File, FileText, Image, X, Users,
    Search, Pin, Edit2, Trash2, Reply, Smile, MoreVertical, Info, ChevronLeft
} from 'lucide-react';
import { toast } from 'react-toastify';

interface ChatGroup {
    _id: string;
    name: string;
    department: string;
    drive: {
        companyName: string;
        position: string;
        status: string;
        deadline?: string;
    };
    lastMessage?: {
        content: string;
        createdAt: string;
    };
    members: { user: { _id: string; name: string; studentId?: string } }[];
    unreadCount?: number;
}

interface Reaction {
    emoji: string;
    users: { _id: string; name: string; studentId?: string }[];
}

interface Message {
    _id: string;
    sender: {
        _id: string;
        name: string;
        studentId?: string;
        role: string;
    };
    content: string;
    fileUrl?: string;
    fileName?: string;
    fileType?: string;
    createdAt: string;
    replyTo?: {
        _id: string;
        content: string;
        sender: { name: string; studentId?: string };
    };
    reactions?: Reaction[];
    isPinned?: boolean;
    isEdited?: boolean;
    isDeleted?: boolean;
}

interface ChatPageProps {
    currentUser: {
        _id: string;
        name: string;
        studentId?: string;
        role: string;
    };
}

const EMOJI_OPTIONS = ['👍', '❤️', '😂', '😮', '😢', '👏'];

const ChatPage = ({ currentUser }: ChatPageProps) => {
    const [groups, setGroups] = useState<ChatGroup[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<ChatGroup | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const [editingMessage, setEditingMessage] = useState<Message | null>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Message[]>([]);
    const [showSearch, setShowSearch] = useState(false);
    const [showGroupInfo, setShowGroupInfo] = useState(false);
    const [groupInfo, setGroupInfo] = useState<any>(null);
    const [showMessageActions, setShowMessageActions] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { fetchGroups(); }, []);

    useEffect(() => {
        if (selectedGroup) {
            fetchMessages(selectedGroup._id);
            setShowSearch(false);
            setSearchResults([]);
            setShowGroupInfo(false);
        }
    }, [selectedGroup]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (!selectedGroup) return;
        const interval = setInterval(() => fetchMessages(selectedGroup._id, true), 5000);
        return () => clearInterval(interval);
    }, [selectedGroup]);

    const fetchGroups = async () => {
        try {
            const data = await chatAPI.getMyGroups();
            setGroups(data);
            // On desktop, auto-select first group. On mobile show groups list first.
            const isMobileView = window.innerWidth < 768;
            if (data.length > 0 && !selectedGroup && !isMobileView) setSelectedGroup(data[0]);
        } catch (error) {
            console.error('Failed to fetch groups', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (groupId: string, silent = false) => {
        try {
            const data = await chatAPI.getMessages(groupId);
            setMessages(data.messages || []);
            setPinnedMessages(data.pinnedMessages || []);
        } catch (error) {
            if (!silent) console.error('Failed to fetch messages', error);
        }
    };

    const handleSendMessage = async () => {
        if (!selectedGroup || (!newMessage.trim() && !selectedFile)) return;

        setSendingMessage(true);
        try {
            if (editingMessage) {
                await chatAPI.editMessage(editingMessage._id, newMessage.trim());
                setEditingMessage(null);
            } else if (selectedFile) {
                await chatAPI.sendFile(selectedGroup._id, selectedFile, newMessage.trim(), replyingTo?._id);
                setSelectedFile(null);
            } else {
                await chatAPI.sendMessage(selectedGroup._id, newMessage.trim(), replyingTo?._id);
            }
            setNewMessage('');
            setReplyingTo(null);
            fetchMessages(selectedGroup._id);
            fetchGroups();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to send message');
        } finally {
            setSendingMessage(false);
        }
    };

    const handleReact = async (messageId: string, emoji: string) => {
        try {
            await chatAPI.reactToMessage(messageId, emoji);
            fetchMessages(selectedGroup!._id);
            setShowEmojiPicker(null);
        } catch (error) {
            toast.error('Failed to react');
        }
    };

    const handlePin = async (messageId: string) => {
        try {
            await chatAPI.togglePin(messageId);
            fetchMessages(selectedGroup!._id);
            toast.success('Pin status updated');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to pin');
        }
    };

    const handleDelete = async (messageId: string) => {
        if (!confirm('Delete this message?')) return;
        try {
            await chatAPI.deleteMessage(messageId);
            fetchMessages(selectedGroup!._id);
            toast.success('Message deleted');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to delete');
        }
    };

    const handleSearch = async () => {
        if (!selectedGroup || searchQuery.length < 2) return;
        try {
            const results = await chatAPI.searchMessages(selectedGroup._id, searchQuery);
            setSearchResults(results);
        } catch (error) {
            toast.error('Search failed');
        }
    };

    const fetchGroupInfo = async () => {
        if (!selectedGroup) return;
        try {
            const info = await chatAPI.getGroupInfo(selectedGroup._id);
            setGroupInfo(info);
            setShowGroupInfo(true);
        } catch (error) {
            toast.error('Failed to load group info');
        }
    };

    const getSenderDisplay = (sender: Message['sender']) => {
        return sender.role === 'student' ? (sender.studentId || sender.name) : sender.name;
    };

    const getFileIcon = (fileType?: string) => {
        switch (fileType) {
            case 'pdf': return <FileText className="text-red-400" size={20} />;
            case 'doc':
            case 'docx': return <File className="text-blue-400" size={20} />;
            case 'image': return <Image className="text-green-400" size={20} />;
            default: return <File className="text-gray-400" size={20} />;
        }
    };

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        if (date.toDateString() === today.toDateString()) return 'Today';
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return date.toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (groups.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-96 text-gray-400">
                <MessageSquare size={48} className="mb-4 opacity-50" />
                <p className="text-lg">No chat groups yet</p>
                <p className="text-sm mt-2">Apply to drives to join their chat groups</p>
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-12rem)] rounded-xl overflow-hidden border border-white/10">
            {/* Groups Sidebar - Full width on mobile when no group selected, hidden when chat is open on mobile */}
            <div className={`bg-glass-100 border-r border-white/10 flex flex-col ${selectedGroup
                ? 'hidden md:flex md:w-80'
                : 'w-full md:w-80'
                }`}>
                <div className="p-4 border-b border-white/10">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                        <MessageSquare size={18} />
                        Chat Groups
                    </h3>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {groups.map((group) => (
                        <div
                            key={group._id}
                            onClick={() => setSelectedGroup(group)}
                            className={`p-4 cursor-pointer border-b border-white/5 ${selectedGroup?._id === group._id
                                ? 'bg-indigo-500/20 border-l-2 border-l-indigo-500'
                                : 'hover:bg-white/5'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold relative">
                                    {group.department.substring(0, 2)}
                                    {(group.unreadCount || 0) > 0 && (
                                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold">
                                            {group.unreadCount}
                                        </span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white font-medium truncate text-sm">{group.name}</p>
                                    {group.lastMessage && (
                                        <p className="text-gray-500 text-xs truncate mt-1">{group.lastMessage.content}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Area - Full width on mobile, hidden when no group selected on mobile */}
            <div className={`flex-1 flex flex-col bg-dark-bg ${selectedGroup
                ? 'flex w-full md:w-auto'
                : 'hidden md:flex'
                }`}>
                {selectedGroup ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-3 sm:p-4 border-b border-white/10 bg-glass-100">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    {/* Back button - only on mobile */}
                                    <button
                                        onClick={() => setSelectedGroup(null)}
                                        className="md:hidden p-2 -ml-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                    <div>
                                        <h3 className="text-white font-semibold flex items-center gap-2 text-sm sm:text-base">
                                            {selectedGroup.name}
                                            {selectedGroup.drive?.status && (
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${selectedGroup.drive.status === 'active' ? 'bg-green-500/20 text-green-400' :
                                                    selectedGroup.drive.status === 'closed' ? 'bg-red-500/20 text-red-400' :
                                                        'bg-yellow-500/20 text-yellow-400'
                                                    }`}>
                                                    {selectedGroup.drive.status.toUpperCase()}
                                                </span>
                                            )}
                                        </h3>
                                        <div className="flex items-center gap-2 sm:gap-3 mt-1">
                                            <p className="text-gray-500 text-xs flex items-center gap-1">
                                                <Users size={12} />
                                                {selectedGroup.members?.length || 0} members
                                            </p>
                                            {selectedGroup.drive?.deadline && (
                                                <p className={`text-xs items-center gap-1 hidden sm:flex ${new Date(selectedGroup.drive.deadline) < new Date() ? 'text-red-400' :
                                                    new Date(selectedGroup.drive.deadline) < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) ? 'text-yellow-400' :
                                                        'text-gray-400'
                                                    }`}>
                                                    ⏰ Deadline: {new Date(selectedGroup.drive.deadline).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setShowSearch(!showSearch)}
                                        className={`p-2 rounded-lg transition-colors ${showSearch ? 'bg-indigo-500/20 text-indigo-400' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                                    >
                                        <Search size={18} />
                                    </button>
                                    <button
                                        onClick={fetchGroupInfo}
                                        className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                    >
                                        <Info size={18} />
                                    </button>
                                </div>
                            </div>


                            {/* Search Bar */}
                            {showSearch && (
                                <div className="mt-3 flex gap-2">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                        placeholder="Search messages..."
                                        className="flex-1 bg-glass-200 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500/50"
                                    />
                                    <button onClick={handleSearch} className="px-3 py-2 bg-indigo-500 text-white rounded-lg text-sm">
                                        Search
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Pinned Messages Bar */}
                        {pinnedMessages.length > 0 && (
                            <div className="px-4 py-2 bg-yellow-500/10 border-b border-yellow-500/20 flex items-center gap-2 overflow-x-auto">
                                <Pin size={14} className="text-yellow-400 flex-shrink-0" />
                                <span className="text-yellow-400 text-xs font-medium">Pinned:</span>
                                {pinnedMessages.slice(0, 3).map(pm => (
                                    <span key={pm._id} className="text-xs text-gray-300 bg-yellow-500/10 px-2 py-1 rounded truncate max-w-[150px]">
                                        {pm.content.substring(0, 30)}...
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Search Results or Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {showSearch && searchResults.length > 0 ? (
                                <>
                                    <div className="text-center text-gray-500 text-sm mb-4">
                                        {searchResults.length} results for "{searchQuery}"
                                        <button onClick={() => { setShowSearch(false); setSearchResults([]); }} className="ml-2 text-indigo-400">Clear</button>
                                    </div>
                                    {searchResults.map((msg) => renderMessage(msg, true))}
                                </>
                            ) : (
                                messages.map((msg, idx) => {
                                    const showDate = idx === 0 || formatDate(messages[idx - 1].createdAt) !== formatDate(msg.createdAt);
                                    return (
                                        <div key={msg._id}>
                                            {showDate && (
                                                <div className="text-center my-4">
                                                    <span className="text-xs text-gray-500 bg-glass-100 px-3 py-1 rounded-full">
                                                        {formatDate(msg.createdAt)}
                                                    </span>
                                                </div>
                                            )}
                                            {renderMessage(msg)}
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Reply Preview */}
                        {replyingTo && (
                            <div className="px-4 py-2 bg-indigo-500/10 border-t border-indigo-500/20 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Reply size={14} className="text-indigo-400" />
                                    <span className="text-xs text-gray-400">Replying to</span>
                                    <span className="text-xs text-indigo-400 font-medium">{getSenderDisplay(replyingTo.sender)}</span>
                                    <span className="text-xs text-gray-500 truncate max-w-[200px]">{replyingTo.content}</span>
                                </div>
                                <button onClick={() => setReplyingTo(null)} className="text-gray-400 hover:text-white">
                                    <X size={14} />
                                </button>
                            </div>
                        )}

                        {/* Edit Preview */}
                        {editingMessage && (
                            <div className="px-4 py-2 bg-yellow-500/10 border-t border-yellow-500/20 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Edit2 size={14} className="text-yellow-400" />
                                    <span className="text-xs text-yellow-400">Editing message</span>
                                </div>
                                <button onClick={() => { setEditingMessage(null); setNewMessage(''); }} className="text-gray-400 hover:text-white">
                                    <X size={14} />
                                </button>
                            </div>
                        )}

                        {/* Input Area */}
                        <div className="p-3 sm:p-4 border-t border-white/10 bg-glass-100 mb-0 sm:mb-0">
                            {selectedFile && (
                                <div className="flex items-center gap-2 mb-2 p-2 bg-glass-200 rounded-lg">
                                    {getFileIcon(selectedFile.name.split('.').pop())}
                                    <span className="text-sm text-white flex-1 truncate">{selectedFile.name}</span>
                                    <button onClick={() => setSelectedFile(null)} className="p-1 hover:bg-white/10 rounded-full">
                                        <X size={14} className="text-gray-400" />
                                    </button>
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 sm:gap-2">
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-2.5 sm:p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                    >
                                        <Paperclip size={20} />
                                    </button>
                                    <input ref={fileInputRef} type="file" onChange={(e) => e.target.files?.[0] && setSelectedFile(e.target.files[0])} className="hidden" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif" />
                                </div>
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                                    placeholder={editingMessage ? "Edit message..." : "Type a message..."}
                                    className="flex-1 bg-glass-200 border border-white/10 rounded-lg px-3 py-2 sm:px-4 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 text-sm sm:text-base"
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={sendingMessage || (!newMessage.trim() && !selectedFile)}
                                    className="p-2.5 sm:p-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50"
                                >
                                    {sendingMessage ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Send size={20} />
                                    )}
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-500">
                        <div className="text-center">
                            <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
                            <p>Select a group to start chatting</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Group Info Sidebar */}
            {showGroupInfo && groupInfo && (
                <div className="w-80 bg-glass-100 border-l border-white/10 flex flex-col">
                    <div className="p-4 border-b border-white/10 flex items-center justify-between">
                        <h3 className="text-white font-semibold">Group Info</h3>
                        <button onClick={() => setShowGroupInfo(false)} className="text-gray-400 hover:text-white">
                            <X size={18} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                        <div className="mb-6">
                            <h4 className="text-gray-400 text-xs uppercase mb-2">Drive</h4>
                            <p className="text-white font-medium">{groupInfo.group.drive?.companyName} - {groupInfo.group.drive?.position}</p>
                            <p className="text-gray-500 text-sm">Deadline: {groupInfo.group.drive?.deadline ? new Date(groupInfo.group.drive.deadline).toLocaleDateString() : 'N/A'}</p>
                        </div>
                        <div className="mb-6">
                            <h4 className="text-gray-400 text-xs uppercase mb-2">Members ({groupInfo.memberCount})</h4>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {groupInfo.group.members?.map((m: any) => (
                                    <div key={m.user?._id} className="flex items-center gap-2 text-sm">
                                        <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs">
                                            {m.user?.name?.[0] || '?'}
                                        </div>
                                        <span className="text-white">{m.user?.studentId || m.user?.name}</span>
                                        {m.user?.role !== 'student' && <span className="text-xs text-green-400">TPO</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                        {groupInfo.sharedFiles?.length > 0 && (
                            <div>
                                <h4 className="text-gray-400 text-xs uppercase mb-2">Shared Files</h4>
                                <div className="space-y-2">
                                    {groupInfo.sharedFiles.map((f: any) => (
                                        <a key={f._id} href={f.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 bg-glass-200 rounded-lg hover:bg-white/10">
                                            {getFileIcon(f.fileType)}
                                            <span className="text-sm text-white truncate">{f.fileName}</span>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );

    function renderMessage(msg: Message, isSearchResult = false) {
        const isMe = msg.sender._id === currentUser._id;
        const canEdit = isMe && !msg.isDeleted && (Date.now() - new Date(msg.createdAt).getTime() < 15 * 60 * 1000);
        const canDelete = isMe || currentUser.role === 'tpo' || currentUser.role === 'admin';
        const canPin = currentUser.role === 'tpo' || currentUser.role === 'admin';

        return (
            <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
                <div className={`max-w-[70%] relative ${isMe ? 'bg-indigo-500/20 rounded-l-xl rounded-tr-xl' : 'bg-glass-200 rounded-r-xl rounded-tl-xl'} p-3`}>
                    {/* Reply Reference */}
                    {msg.replyTo && (
                        <div className="mb-2 p-2 bg-black/20 rounded-lg border-l-2 border-indigo-400">
                            <p className="text-[10px] text-indigo-400">{msg.replyTo.sender?.studentId || msg.replyTo.sender?.name}</p>
                            <p className="text-xs text-gray-400 truncate">{msg.replyTo.content}</p>
                        </div>
                    )}

                    {/* Sender Name */}
                    {!isMe && (
                        <p className={`text-xs font-medium mb-1 ${msg.sender.role === 'student' ? 'text-indigo-400' : 'text-green-400'}`}>
                            {getSenderDisplay(msg.sender)}
                            {msg.sender.role !== 'student' && <span className="ml-1 text-[10px] text-gray-500">(TPO)</span>}
                        </p>
                    )}

                    {/* Pin Badge */}
                    {msg.isPinned && (
                        <div className="flex items-center gap-1 text-yellow-400 text-[10px] mb-1">
                            <Pin size={10} /> Pinned
                        </div>
                    )}

                    {/* File Attachment */}
                    {msg.fileUrl && !msg.isDeleted && (
                        <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 bg-black/20 rounded-lg mb-2 hover:bg-black/30">
                            {getFileIcon(msg.fileType)}
                            <span className="text-sm text-white truncate">{msg.fileName}</span>
                        </a>
                    )}

                    {/* Message Content */}
                    <p className={`text-white text-sm ${msg.isDeleted ? 'italic text-gray-500' : ''}`}>{msg.content}</p>

                    {/* Edited Badge & Time */}
                    <div className="flex items-center justify-end gap-2 mt-1">
                        {msg.isEdited && <span className="text-[10px] text-gray-500 italic">edited</span>}
                        <p className="text-[10px] text-gray-500">{formatTime(msg.createdAt)}</p>
                    </div>

                    {/* Reactions */}
                    {msg.reactions && msg.reactions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                            {msg.reactions.map((r) => (
                                <button
                                    key={r.emoji}
                                    onClick={() => handleReact(msg._id, r.emoji)}
                                    className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 ${r.users.some(u => u._id === currentUser._id) ? 'bg-indigo-500/30' : 'bg-white/10'}`}
                                >
                                    {r.emoji} {r.users.length}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Message Actions */}
                    {!msg.isDeleted && !isSearchResult && (
                        <div className="absolute -top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-glass-100 rounded-lg p-1">
                            {/* Emoji Picker */}
                            <div className="relative">
                                <button onClick={() => setShowEmojiPicker(showEmojiPicker === msg._id ? null : msg._id)} className="p-1 hover:bg-white/10 rounded">
                                    <Smile size={14} className="text-gray-400" />
                                </button>
                                {showEmojiPicker === msg._id && (
                                    <div className="absolute bottom-full left-0 mb-1 bg-glass-100 border border-white/10 rounded-lg p-2 flex gap-1 z-10">
                                        {EMOJI_OPTIONS.map(emoji => (
                                            <button key={emoji} onClick={() => handleReact(msg._id, emoji)} className="hover:bg-white/10 p-1 rounded">
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button onClick={() => setReplyingTo(msg)} className="p-1 hover:bg-white/10 rounded">
                                <Reply size={14} className="text-gray-400" />
                            </button>

                            {canPin && (
                                <button onClick={() => handlePin(msg._id)} className="p-1 hover:bg-white/10 rounded">
                                    <Pin size={14} className={msg.isPinned ? 'text-yellow-400' : 'text-gray-400'} />
                                </button>
                            )}

                            {canEdit && (
                                <button onClick={() => { setEditingMessage(msg); setNewMessage(msg.content); }} className="p-1 hover:bg-white/10 rounded">
                                    <Edit2 size={14} className="text-gray-400" />
                                </button>
                            )}

                            {canDelete && (
                                <button onClick={() => handleDelete(msg._id)} className="p-1 hover:bg-white/10 rounded">
                                    <Trash2 size={14} className="text-red-400" />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }
};

export default ChatPage;
