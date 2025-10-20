import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  Check, 
  Trash2, 
  Filter,
  Search,
  Eye,
  AlertCircle,
  CheckCircle,
  Info,
  XCircle
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
  department?: string; // Added department field
}

interface NotificationsSectionProps {
  notifications?: Notification[];
  tpoProfile?: { department: string }; // Added tpoProfile prop
}

const NotificationsSection: React.FC<NotificationsSectionProps> = ({ notifications, tpoProfile, ...props }) => {
  const [localNotifications, setLocalNotifications] = useState<Notification[]>(notifications || []);
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'read'>('all');
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  // Update local notifications when prop changes
  useEffect(() => {
    setLocalNotifications(notifications || []);
  }, [notifications]);

  // 1. Remove Type and Priority fields from the send notification modal
  // 2. Only keep Title, Message, Target Roles, Action URL, and Send/Cancel buttons
  // 3. Update form submission to not send type or priority

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Notifications</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {hasSelection && (
            <>
              <button
                onClick={deleteSelectedNotifications}
                className="flex items-center space-x-1 px-3 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Selected</span>
              </button>
              <button
                onClick={clearSelection}
                className="px-3 py-1 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Clear
              </button>
            </>
          )}
          <button
            onClick={markAllAsRead}
            className="flex items-center space-x-1 px-3 py-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
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
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>
          </div>
          <button
            onClick={selectAllFiltered}
            className="px-3 py-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
          >
            Select All
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No notifications found</p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <motion.div
              key={notification._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`border-l-4 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                notification.read 
                  ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700' 
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
              } ${selectedNotifications.includes(notification._id) ? 'ring-2 ring-blue-500' : ''}`}
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
    </div>
  );
};

export default NotificationsSection; 