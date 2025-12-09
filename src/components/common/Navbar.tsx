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
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-6 backdrop-blur-md border-b border-white/5 bg-dark-bg/80">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gradient-premium">
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
                    className="p-2.5 rounded-xl bg-glass-100 backdrop-blur-md border border-glass-border text-gray-300 hover:bg-glass-200 hover:text-white transition-all duration-300 relative"
                    onClick={() => setDropdownOpen((open) => !open)}
                    aria-label="Notifications"
                >
                  <Bell size={20} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-gradient-to-r from-pink-500 to-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 shadow-lg">
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
                        className="absolute right-0 mt-2 w-80 glass-panel z-50"
                      >
                        <div className="p-4 border-b border-white/10 flex items-center justify-between">
                          <span className="font-semibold text-white">Notifications</span>
                          <button
                            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                            onClick={() => { fetchNotifications(); }}
                          >
                            Refresh
                          </button>
                        </div>
                        <div className="max-h-96 overflow-y-auto divide-y divide-white/5">
                          {notifications.length === 0 ? (
                            <div className="p-4 text-center text-gray-400">No notifications</div>
                          ) : (
                            notifications.slice(0, 8).map((n) => (
                              <div
                                key={n._id}
                                className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-glass-100 transition-all duration-300 ${n.read ? 'opacity-70' : ''}`}
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
                                    <span className={`font-medium text-sm ${n.read ? 'text-gray-400' : 'text-white'}`}>{n.title}</span>
                                    <span className="text-xs text-gray-500 ml-2">{formatDate(n.createdAt)}</span>
                                  </div>
                                  <div className={`text-xs ${n.read ? 'text-gray-500' : 'text-gray-300'}`}>{n.message}</div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                        <div className="p-2 border-t border-white/10 text-center">
                          <Link
                            to={getDashboardLink() + '/dashboard?tab=notifications'}
                            className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors"
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
                  className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-glass-100 backdrop-blur-md border border-glass-border text-gray-300 hover:bg-glass-200 hover:text-white transition-all duration-300"
                >
                  <User size={20} />
                  <span className="hidden sm:block">{user.name}</span>
                </Link>
                <motion.button
                  onClick={handleLogout}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all duration-300"
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