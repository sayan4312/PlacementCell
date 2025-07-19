import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LogOut, 
  User, 
  Bell, 
  GraduationCap, 
  CheckCircle, 
  AlertCircle, 
  Info 
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { ThemeToggle } from './ThemeToggle';
import { notificationAPI } from '../../services/apiClient';

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

export const Navbar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await notificationAPI.getNotifications({ limit: 8 });
      setNotifications(res.data.notifications || []);
    } catch (err) {
      setNotifications([]);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getDashboardLink = () => {
    switch (user?.role) {
      case 'admin': return '/admin';
      case 'tpo': return '/tpo';
      case 'company': return '/company';
      case 'student': return '/student';
      default: return '/';
    }
  };

  // Helper to get dashboard route with notifications tab
  const getNotificationsLink = () => {
    switch (user?.role) {
      case 'admin': return '/admin/dashboard?tab=notifications';
      case 'tpo': return '/tpo/dashboard?tab=notifications';
      case 'student': return '/student/dashboard?tab=notifications';
      default: return '/';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
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
      setNotifications(prev => prev.map(n => n._id === notificationId ? { ...n, read: true } : n));
    } catch (err) {}
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <GraduationCap className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              Placement Cell
            </span>
          </Link>

          <div className="flex items-center space-x-4">
            <ThemeToggle />
            {user && (
              <>
                <div className="relative" ref={dropdownRef}>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                    className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 relative"
                    onClick={() => setDropdownOpen((open) => !open)}
                    aria-label="Notifications"
                >
                  <Bell size={20} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                        {unreadCount}
                      </span>
                    )}
                </motion.button>
                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 shadow-xl rounded-lg border border-gray-200 dark:border-gray-700 z-50"
                      >
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                          <span className="font-semibold text-gray-900 dark:text-white">Notifications</span>
                          <button
                            className="text-xs text-blue-600 hover:underline"
                            onClick={() => { fetchNotifications(); }}
                          >
                            Refresh
                          </button>
                        </div>
                        <div className="max-h-96 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
                          {notifications.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 dark:text-gray-400">No notifications</div>
                          ) : (
                            notifications.slice(0, 8).map((n) => (
                              <div
                                key={n._id}
                                className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition ${n.read ? 'opacity-70' : ''}`}
                                onClick={() => {
                                  markAsRead(n._id);
                                  if (n.actionUrl) {
                                    window.location.href = n.actionUrl;
                                  }
                                }}
                              >
                                <div className="mt-1">{getNotificationIcon(n.type)}</div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <span className={`font-medium text-sm ${n.read ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>{n.title}</span>
                                    <span className="text-xs text-gray-400 ml-2">{formatDate(n.createdAt)}</span>
                                  </div>
                                  <div className={`text-xs ${n.read ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>{n.message}</div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                        <div className="p-2 border-t border-gray-100 dark:border-gray-700 text-center">
                          <Link
                            to={getDashboardLink() + '/dashboard?tab=notifications'}
                            className="text-blue-600 hover:underline text-sm font-medium"
                            onClick={() => setDropdownOpen(false)}
                          >
                            View all notifications
                          </Link>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <Link 
                  to={getDashboardLink()}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <User size={20} />
                  <span className="hidden sm:block">{user.name}</span>
                </Link>
                <motion.button
                  onClick={handleLogout}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 rounded-full text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut size={20} />
                </motion.button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};