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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-white">Notifications</h3>
          <p className="text-sm text-white/60 mt-1">
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasSelection && (
            <>
              <button
                onClick={deleteSelectedNotifications}
                className="btn-secondary flex items-center gap-2 text-red-400 hover:text-red-300"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Selected</span>
              </button>
              <button
                onClick={clearSelection}
                className="btn-secondary"
              >
                Clear
              </button>
            </>
          )}
          <button
            onClick={markAllAsRead}
            className="btn-primary flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>Mark All Read</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="glass-card p-4 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-glass w-full pl-10"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-white/60" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="input-glass"
            >
              <option value="all">All</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>
          </div>
          <button
            onClick={selectAllFiltered}
            className="btn-secondary text-sm"
          >
            Select All
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Bell className="w-12 h-12 text-white/40 mx-auto mb-4" />
            <p className="text-white/60">No notifications found</p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <motion.div
              key={notification._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`glass-card p-4 cursor-pointer transition-all hover:scale-[1.01] ${
                !notification.read && 'border-l-4 border-indigo-500'
              } ${selectedNotifications.includes(notification._id) ? 'ring-2 ring-indigo-500' : ''}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <input
                    type="checkbox"
                    checked={selectedNotifications.includes(notification._id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleNotificationSelection(notification._id);
                    }}
                    className="mt-1 h-4 w-4 text-indigo-500 focus:ring-indigo-500 bg-white/10 border-white/20 rounded"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={`font-semibold ${notification.read ? 'text-white/70' : 'text-white'}`}>
                        {notification.title || 'No Title'}
                      </h4>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                      )}
                    </div>
                    <p className="text-sm text-white/60 mb-2">
                      {notification.message || 'No message'}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-white/40">
                      <span>{notification.createdAt ? formatDate(notification.createdAt) : 'Unknown date'}</span>
                      {notification.actionUrl && (
                        <span className="text-indigo-400">Click to view</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {!notification.read && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification._id);
                      }}
                      className="p-2 text-white/40 hover:text-emerald-400 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification._id);
                    }}
                    className="p-2 text-white/40 hover:text-red-400 hover:bg-white/10 rounded-lg transition-colors"
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