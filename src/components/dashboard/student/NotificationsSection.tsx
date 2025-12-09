import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, CheckCircle, AlertCircle, Info, X, Filter, Trash2, Eye } from 'lucide-react';
import { notificationAPI } from '../../../services/apiClient';
import { useNavigate } from 'react-router-dom';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
  actionUrl?: string;
  priority: 'low' | 'medium' | 'high';
}

interface NotificationsSectionProps {
  notifications?: Notification[];
}

const NotificationsSection: React.FC<NotificationsSectionProps> = ({ notifications }) => {
  const [localNotifications, setLocalNotifications] = useState<Notification[]>(notifications || []);
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'read'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Update local notifications when prop changes
  useEffect(() => {
    setLocalNotifications(notifications || []);
  }, [notifications]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-red-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
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
      setLoading(true);
      await notificationAPI.markAllAsRead();
      setLocalNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      setSelectedNotifications([]);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    } finally {
      setLoading(false);
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

  const deleteSelected = async () => {
    try {
      setLoading(true);
      await notificationAPI.deleteNotifications(selectedNotifications);
      setLocalNotifications(prev => 
        prev.filter(notification => !selectedNotifications.includes(notification._id))
      );
      setSelectedNotifications([]);
    } catch (error) {
      console.error('Error deleting selected notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleNotificationSelection = (notificationId: string) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const selectAll = () => {
    const filteredIds = filteredNotifications.map(n => n._id);
    setSelectedNotifications(filteredIds);
  };

  const clearSelection = () => {
    setSelectedNotifications([]);
  };

  const clearFilters = () => {
    setFilterType('all');
  };

  const filteredNotifications = useMemo(() => {
    return localNotifications.filter(notification => {
      const matchesType = filterType === 'all' || 
        (filterType === 'unread' && !notification.read) ||
        (filterType === 'read' && notification.read);
      
      return matchesType;
    });
  }, [localNotifications, filterType]);

  const unreadCount = localNotifications.filter(n => !n.read).length;
  const hasActiveFilters = filterType !== 'all';
  const hasSelection = selectedNotifications.length > 0;

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read if not already read
    if (!notification.read) {
      markAsRead(notification._id);
    }
    
    // Navigate to specific content based on actionUrl
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    } else {
      // Fallback: Navigate based on notification content
      const message = notification.message.toLowerCase();
      const title = notification.title.toLowerCase();
      
      if (message.includes('application') || title.includes('application') || 
          message.includes('interview') || title.includes('interview') ||
          message.includes('selected') || message.includes('shortlisted')) {
        navigate('/student/dashboard?tab=applications');
      } else if (message.includes('drive') || title.includes('drive') || 
                 message.includes('job') || title.includes('job') ||
                 message.includes('position') || title.includes('position')) {
        navigate('/student/dashboard?tab=drives');
      } else {
        // Default fallback to overview tab
        navigate('/student/dashboard?tab=overview');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Notifications</h3>
          {unreadCount > 0 && (
            <span className="px-3 py-1 bg-pink-500/20 text-pink-400 text-sm font-medium rounded-full border border-pink-500/30">
              {unreadCount} notification{unreadCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {hasSelection && (
            <div className="flex items-center gap-2">
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 text-sm bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 border border-emerald-500/30 transition-all flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Mark as Read</span>
              </button>
              <button
                onClick={deleteSelected}
                className="px-4 py-2 text-sm bg-pink-500/20 text-pink-400 rounded-lg hover:bg-pink-500/30 border border-pink-500/30 transition-all flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
              <button
                onClick={clearSelection}
                className="btn-secondary text-sm"
              >
                Clear
              </button>
            </div>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              showFilters 
                ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' 
                : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-semibold text-white">Filter Notifications</h4>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-pink-400 hover:text-pink-300 flex items-center gap-1 transition-colors"
              >
                <X className="w-4 h-4" />
                <span>Clear Filters</span>
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Status
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="input-glass w-full"
              >
                <option value="all">All Notifications</option>
                <option value="unread">Unread Only</option>
                <option value="read">Read Only</option>
              </select>
            </div>
          </div>
        </motion.div>
      )}

      {/* Bulk Actions */}
      {filteredNotifications.length > 0 && !hasSelection && (
        <div className="flex items-center justify-between glass-card p-4">
          <div className="text-sm font-medium text-gray-300">
            {filteredNotifications.length} notification{filteredNotifications.length > 1 ? 's' : ''}
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={selectAll}
              className="text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              Select All
            </button>
            <button
              onClick={markAllAsRead}
              className="text-sm text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
            >
              Mark All as Read
            </button>
          </div>
        </div>
      )}

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="h-8 w-8 text-white" />
            </div>
            <p className="text-white text-lg font-semibold mb-2">
              {hasActiveFilters ? 'No notifications match your filters' : 'No notifications yet'}
            </p>
            <p className="text-gray-400">
              {hasActiveFilters ? 'Try adjusting your filter criteria' : 'You\'re all caught up!'}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification, index) => (
            <motion.div
              key={notification._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`glass-card p-5 hover:scale-[1.01] transition-all duration-300 ${
                notification.read ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                <input
                  type="checkbox"
                  checked={selectedNotifications.includes(notification._id)}
                  onChange={() => toggleNotificationSelection(notification._id)}
                  className="mt-1 h-4 w-4 rounded border-white/20 bg-white/5 text-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="mt-0.5">
                        {getNotificationIcon(notification.type || 'info')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-semibold mb-1 ${
                          notification.read ? 'text-gray-400' : 'text-white'
                        }`}>
                          {notification.title || 'No Title'}
                        </h4>
                        <p className={`text-sm leading-relaxed mb-2 ${
                          notification.read ? 'text-gray-500' : 'text-gray-300'
                        }`}>
                          {notification.message || 'No message'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {notification.createdAt ? formatDate(notification.createdAt) : 'Unknown date'}
                        </p>
                        {notification.actionUrl && (
                          <button
                            onClick={() => handleNotificationClick(notification)}
                            className="mt-3 text-sm text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1 transition-colors"
                          >
                            View Details →
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification._id)}
                          className="p-2 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all"
                          title="Mark as read"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification._id)}
                        className="p-2 text-gray-400 hover:text-pink-400 hover:bg-pink-500/10 rounded-lg transition-all"
                        title="Delete notification"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
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