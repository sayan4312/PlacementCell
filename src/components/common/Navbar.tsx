import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogOut,
  User,
  Bell,
  CheckCircle,
  AlertCircle,
  Info,
  Menu,
  X,
  Home,
  Briefcase,
  FileText,
  Settings,
  Building2,
  MessageSquare
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

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
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    }
    if (dropdownOpen || mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen, mobileMenuOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  const handleLogout = () => {
    setMobileMenuOpen(false);
    logout();
    navigate('/');
  };

  const getDashboardLink = () => {
    switch (user?.role) {
      case 'admin': return '/admin/dashboard';
      case 'tpo': return '/tpo/dashboard';
      case 'company': return '/company/dashboard';
      case 'student': return '/student/dashboard';
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
    } catch (err) { }
  };

  // Mobile menu navigation items
  const getMobileMenuItems = () => {
    const baseItems = [
      { label: 'Dashboard', icon: Home, link: getDashboardLink() },
      { label: 'Profile', icon: User, link: `${getDashboardLink()}?tab=profile` },
    ];

    if (user?.role === 'student') {
      return [
        ...baseItems,
        { label: 'Job Drives', icon: Briefcase, link: `${getDashboardLink()}?tab=drives` },
        { label: 'Internships', icon: Building2, link: `${getDashboardLink()}?tab=internships` },
        { label: 'ATS Checker', icon: FileText, link: `${getDashboardLink()}?tab=ats` },
        { label: 'Applications', icon: FileText, link: `${getDashboardLink()}?tab=applications` },
        { label: 'Offers', icon: CheckCircle, link: `${getDashboardLink()}?tab=offers` },
        { label: 'Chat', icon: MessageSquare, link: `${getDashboardLink()}?tab=chat` },
        { label: 'Notifications', icon: Bell, link: `${getDashboardLink()}?tab=notifications` },
      ];
    } else if (user?.role === 'tpo') {
      return [
        ...baseItems,
        { label: 'Manage Drives', icon: Briefcase, link: `${getDashboardLink()}?tab=drives` },
        { label: 'Internships', icon: Building2, link: `${getDashboardLink()}?tab=internships` },
        { label: 'Applications', icon: FileText, link: `${getDashboardLink()}?tab=applications` },
        { label: 'Students', icon: User, link: `${getDashboardLink()}?tab=students` },
        { label: 'Offers', icon: CheckCircle, link: `${getDashboardLink()}?tab=offers` },
        { label: 'Chat', icon: MessageSquare, link: `${getDashboardLink()}?tab=chat` },
        { label: 'Notifications', icon: Bell, link: `${getDashboardLink()}?tab=notifications` },
      ];
    } else if (user?.role === 'admin') {
      return [
        ...baseItems,
        { label: 'Users', icon: User, link: `${getDashboardLink()}?tab=users` },
        { label: 'Reports', icon: FileText, link: `${getDashboardLink()}?tab=reports` },
        { label: 'Settings', icon: Settings, link: `${getDashboardLink()}?tab=settings` },
      ];
    }
    return baseItems;
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 py-4 sm:py-6 backdrop-blur-md border-b border-white/5 bg-dark-bg/80">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 sm:space-x-3 group">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <img src="/logo.png" alt="CampusNix Logo" className="h-full w-full object-contain" />
              </div>
              <span className="text-lg sm:text-xl font-bold text-gradient-premium hidden xs:block">
                CampusNix
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              {user && (
                <>
                  {/* Notifications Dropdown */}
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
                              to={getDashboardLink() + '?tab=notifications'}
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

                  {/* User Profile Link */}
                  <Link
                    to={getDashboardLink()}
                    className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-glass-100 backdrop-blur-md border border-glass-border text-gray-300 hover:bg-glass-200 hover:text-white transition-all duration-300"
                  >
                    <User size={20} />
                    <span className="hidden lg:block">{user.name}</span>
                  </Link>

                  {/* Logout Button */}
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
              {!user && (
                <Link
                  to="/login"
                  className="btn-primary !px-6 !py-2 !text-sm"
                >
                  Login
                </Link>
              )}
            </div>

            {/* Mobile Navigation Controls */}
            <div className="flex md:hidden items-center space-x-2">
              {user ? (
                <>
                  {/* Mobile Notifications Button */}
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    className="p-2 rounded-xl bg-glass-100 backdrop-blur-md border border-glass-border text-gray-300 relative"
                    onClick={() => {
                      setDropdownOpen(!dropdownOpen);
                      setMobileMenuOpen(false);
                    }}
                  >
                    <Bell size={18} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-gradient-to-r from-pink-500 to-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </motion.button>

                  {/* Hamburger Menu Button */}
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    className="p-2 rounded-xl bg-glass-100 backdrop-blur-md border border-glass-border text-gray-300"
                    onClick={() => {
                      setMobileMenuOpen(!mobileMenuOpen);
                      setDropdownOpen(false);
                    }}
                  >
                    {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                  </motion.button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="btn-primary !px-4 !py-1.5 !text-sm"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Notifications Dropdown */}
        <AnimatePresence>
          {dropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="md:hidden absolute left-4 right-4 mt-4 glass-panel z-50 max-h-[60vh] overflow-hidden"
            >
              <div className="p-3 border-b border-white/10 flex items-center justify-between">
                <span className="font-semibold text-white text-sm">Notifications</span>
                <button
                  className="text-xs text-indigo-400 hover:text-indigo-300"
                  onClick={() => fetchNotifications()}
                >
                  Refresh
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-white/5">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-400 text-sm">No notifications</div>
                ) : (
                  notifications.slice(0, 5).map((n) => (
                    <div
                      key={n._id}
                      className={`flex items-start gap-2 px-3 py-2 cursor-pointer hover:bg-glass-100 ${n.read ? 'opacity-70' : ''}`}
                      onClick={() => {
                        markAsRead(n._id);
                        setDropdownOpen(false);
                        if (n.actionUrl) {
                          window.location.href = n.actionUrl;
                        }
                      }}
                    >
                      <div className="mt-0.5">{getNotificationIcon(n.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium text-xs ${n.read ? 'text-gray-400' : 'text-white'}`}>{n.title}</div>
                        <div className={`text-xs truncate ${n.read ? 'text-gray-500' : 'text-gray-300'}`}>{n.message}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-2 border-t border-white/10 text-center">
                <Link
                  to={getNotificationsLink()}
                  className="text-indigo-400 hover:text-indigo-300 text-xs font-medium"
                  onClick={() => setDropdownOpen(false)}
                >
                  View all
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Slide-out Menu */}
            <motion.div
              ref={mobileMenuRef}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-72 bg-dark-bg/95 backdrop-blur-xl border-l border-white/10 z-50 md:hidden"
            >
              {/* Menu Header */}
              <div className="p-4 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center">
                      <img src="/logo.png" alt="CampusNix Logo" className="h-full w-full object-contain" />
                    </div>
                    <div>
                      <div className="text-white font-medium text-sm">{user?.name}</div>
                      <div className="text-gray-400 text-xs capitalize">{user?.role}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 rounded-lg hover:bg-white/10 text-gray-400"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Menu Items */}
              <div className="p-4 space-y-2">
                {getMobileMenuItems().map((item, index) => (
                  <Link
                    key={index}
                    to={item.link}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 rounded-xl bg-glass-100 border border-glass-border text-gray-300 hover:bg-glass-200 hover:text-white transition-all duration-300"
                  >
                    <item.icon size={18} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                ))}
              </div>

              {/* Logout Button */}
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center space-x-2 w-full px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all duration-300"
                >
                  <LogOut size={18} />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};