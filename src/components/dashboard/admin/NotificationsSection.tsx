import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  Check, 
  Trash2, 
  Filter,
  Search,
  Plus,
  Send,
  AlertCircle,
  CheckCircle,
  Info,
  XCircle,
  X
} from 'lucide-react';
import { notificationAPI } from '../../../services/apiClient';
import { useNavigate } from 'react-router-dom';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  priority: 'low' | 'medium' | 'high';
  read: boolean;
  actionUrl?: string;
  createdAt: string;
  metadata?: any;
}

interface NotificationsSectionProps {
  notifications?: Notification[];
}

const NotificationsSection: React.FC<NotificationsSectionProps> = ({ notifications }) => {
  const [localNotifications, setLocalNotifications] = useState<Notification[]>(notifications || []);
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'read'>('all');
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendForm, setSendForm] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'success' | 'warning' | 'error',
    priority: 'low' as 'low' | 'medium' | 'high',
    targetRoles: [] as string[],
    actionUrl: ''
  });

  const navigate = useNavigate();

  // Update local notifications when prop changes
  useEffect(() => {
    setLocalNotifications(notifications || []);
  }, [notifications]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50 dark:bg-red-900/20';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low':
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20';
      default:
        return 'border-l-gray-500 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationAPI.markSingleAsRead(notificationId);
      setLocalNotifications(prev =>
        prev.map(notification =>
          notification._id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setLocalNotifications(prev =>
        prev.map(notification => ({ ...notification, read: true }))
      );
      setSelectedNotifications([]);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await notificationAPI.deleteNotification(notificationId);
      setLocalNotifications(prev =>
        prev.filter(notification => notification._id !== notificationId)
      );
      setSelectedNotifications(prev =>
        prev.filter(id => id !== notificationId)
      );
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const deleteSelectedNotifications = async () => {
    try {
      await notificationAPI.deleteNotifications(selectedNotifications);
      setLocalNotifications(prev =>
        prev.filter(notification => !selectedNotifications.includes(notification._id))
      );
      setSelectedNotifications([]);
    } catch (error) {
      console.error('Error deleting selected notifications:', error);
    }
  };

  const toggleNotificationSelection = (notificationId: string) => {
    setSelectedNotifications(prev =>
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const selectAllFiltered = () => {
    const filteredIds = filteredNotifications.map(n => n._id);
    setSelectedNotifications(filteredIds);
  };

  const clearSelection = () => {
    setSelectedNotifications([]);
  };

  const handleSendNotification = async () => {
    try {
      await notificationAPI.createSystemNotification({
        title: sendForm.title,
        message: sendForm.message,
        actionUrl: sendForm.actionUrl || undefined,
        roles: sendForm.targetRoles.length > 0 ? sendForm.targetRoles : undefined
      });
      
      setShowSendModal(false);
      setSendForm({
        title: '',
        message: '',
        type: 'info',
        priority: 'low',
        targetRoles: [],
        actionUrl: ''
      });
      
      // Refresh notifications
      const res = await notificationAPI.getNotifications();
      setLocalNotifications(res.data.notifications || []);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  const filteredNotifications = useMemo(() => {
    return localNotifications.filter(notification => {
      const matchesType = 
        filterType === 'all' ||
        (filterType === 'unread' && !notification.read) ||
        (filterType === 'read' && notification.read);
      
      const matchesSearch = !searchTerm || 
        (notification.title && notification.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (notification.message && notification.message.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchesType && matchesSearch;
    });
  }, [localNotifications, filterType, searchTerm]);

  const unreadCount = localNotifications.filter(n => !n.read).length;
  const hasSelection = selectedNotifications.length > 0;

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification._id);
    }
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const toggleRole = (role: string) => {
    setSendForm(prev => ({
      ...prev,
      targetRoles: prev.targetRoles.includes(role)
        ? prev.targetRoles.filter(r => r !== role)
        : [...prev.targetRoles, role]
    }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-white mb-1">Notifications</h3>
          <p className="text-sm text-gray-400">
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={() => setShowSendModal(true)} className="btn-primary px-6">
            <Plus className="w-4 h-4" /> Send Notification
          </button>
          {hasSelection && (
            <>
              <button
                onClick={deleteSelectedNotifications}
                className="flex items-center space-x-1 px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-300"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Selected</span>
              </button>
              <button
                onClick={clearSelection}
                className="px-3 py-2 text-gray-400 hover:bg-white/5 rounded-lg transition-all duration-300"
              >
                Clear
              </button>
            </>
          )}
          <button
            onClick={markAllAsRead}
            className="flex items-center space-x-1 px-3 py-2 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all duration-300"
          >
            <Check className="w-4 h-4" />
            <span>Mark All Read</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-glass w-full pl-10"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="input-glass px-3 py-2"
            >
              <option value="all">All</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>
          </div>
          <button
            onClick={selectAllFiltered}
            className="px-3 py-2 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all duration-300"
          >
            Select All
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">No notifications found</p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <motion.div
              key={notification._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.01 }}
              className={`glass-card p-4 cursor-pointer transition-all duration-300 ${
                notification.read 
                  ? 'bg-white/3' 
                  : 'bg-white/8 border-l-4 border-indigo-500'
              } ${selectedNotifications.includes(notification._id) ? 'ring-2 ring-indigo-500' : ''}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <input
                    type="checkbox"
                    checked={selectedNotifications.includes(notification._id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleNotificationSelection(notification._id);
                    }}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="flex items-start space-x-3 flex-1">
                    {getNotificationIcon(notification.type || 'info')}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className={`font-medium ${notification.read ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-white'}`}>
                          {notification.title || 'No Title'}
                        </h4>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {notification.message || 'No message'}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-500">
                        <span>{notification.createdAt ? formatDate(notification.createdAt) : 'Unknown date'}</span>
                        {notification.actionUrl && (
                          <span className="text-blue-600 dark:text-blue-400">Click to view</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  {!notification.read && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification._id);
                      }}
                      className="p-1 text-gray-400 hover:text-green-600 rounded"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification._id);
                    }}
                    className="p-1 text-gray-400 hover:text-red-600 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Send Notification Modal */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card w-full max-w-md relative border border-white/10"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <h3 className="text-xl font-semibold text-white">Send System Notification</h3>
              <button
                onClick={() => setShowSendModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={sendForm.title}
                  onChange={(e) => setSendForm(prev => ({ ...prev, title: e.target.value }))}
                  className="input-glass"
                  placeholder="Notification title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Message *
                </label>
                <textarea
                  value={sendForm.message}
                  onChange={(e) => setSendForm(prev => ({ ...prev, message: e.target.value }))}
                  rows={3}
                  className="input-glass resize-none"
                  placeholder="Notification message"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Target Roles (leave empty for all users)
                </label>
                <div className="space-y-2">
                  {['student', 'tpo', 'company'].map((role) => (
                    <label key={role} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sendForm.targetRoles.includes(role)}
                        onChange={() => toggleRole(role)}
                        className="h-4 w-4 text-indigo-500 focus:ring-indigo-500 border-gray-600 rounded bg-white/5"
                      />
                      <span className="text-sm text-gray-300 capitalize">{role}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Action URL (optional)
                </label>
                <input
                  type="url"
                  value={sendForm.actionUrl}
                  onChange={(e) => setSendForm(prev => ({ ...prev, actionUrl: e.target.value }))}
                  className="input-glass"
                  placeholder="https://example.com"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 px-6 py-4 border-t border-white/10">
              <button
                onClick={() => setShowSendModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSendNotification}
                disabled={!sendForm.title || !sendForm.message}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" /> Send Notification
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default NotificationsSection; 