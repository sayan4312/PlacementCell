import { motion } from 'framer-motion';
import { useState } from 'react';
import { GraduationCap, Users, Shield, UserPlus, Eye, Edit, CheckCircle, XCircle, UserX, UserCheck, Target, Briefcase, Award, ChevronDown, ChevronRight } from 'lucide-react';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'blocked': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
};

const getRoleIcon = (role: string) => {
  switch (role) {
    case 'student': return GraduationCap;
    case 'tpo': return Users;
    case 'admin': return Shield;
    default: return Users;
  }
};

const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const UsersSection = ({
  users,
  loading,
  error,
  onShowTpoModal,
  onUserAction
}: {
  users: any;
  loading: any;
  error: any;
  onShowTpoModal: any;
  onUserAction: any;
}) => {
  const [expandedSections, setExpandedSections] = useState({
    tpo: true,
    student: false,
    admin: false
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const groupedUsers = {
    tpo: users.filter((user: any) => user.role === 'tpo'),
    student: users.filter((user: any) => user.role === 'student'),
    admin: users.filter((user: any) => user.role === 'admin')
  };

  console.log('All users:', users);
  console.log('Grouped TPOs:', groupedUsers.tpo);

  const renderUserCard = (user: any, compact = false) => {
    const RoleIcon = getRoleIcon(user.role);
    return (
      <motion.div
        key={user._id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.01 }}
        className={`glass-card ${compact ? 'p-4' : 'p-6'} hover:bg-white/10 transition-all duration-300`}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3">
            <div className={`${compact ? 'w-10 h-10' : 'w-16 h-16'} rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-700`}>
              <RoleIcon className={`${compact ? 'w-6 h-6' : 'w-10 h-10'} text-blue-500 dark:text-blue-400`} />
            </div>
            <div>
              <h4 className={`${compact ? 'text-base' : 'text-lg'} font-semibold text-gray-900 dark:text-white`}>
                {user.name}
              </h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">{user.email}</p>
              <div className="flex items-center space-x-2 mt-1">
                <RoleIcon className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500 dark:text-gray-400 capitalize">{user.role}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>{user.status}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={() => onUserAction(user.id, 'view')} className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <Eye className="w-4 h-4" />
            </button>
            <button onClick={() => onUserAction(user._id, 'edit')} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
              <Edit className="w-4 h-4" />
            </button>
            {user.status === 'pending' && (
              <>
                <button onClick={() => onUserAction(user.id, 'approve')} className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors">
                  <CheckCircle className="w-4 h-4" />
                </button>
                <button onClick={() => onUserAction(user.id, 'reject')} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                  <XCircle className="w-4 h-4" />
                </button>
              </>
            )}
            {user.status === 'active' && (
              <button onClick={() => onUserAction(user.id, 'block')} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                <UserX className="w-4 h-4" />
              </button>
            )}
            {user.status === 'blocked' && (
              <button onClick={() => onUserAction(user.id, 'unblock')} className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors">
                <UserCheck className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        
        {!compact && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Last Active</label>
              <p className="text-gray-900 dark:text-white">{formatDate(user.lastActive)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">{user.role === 'student' ? 'Branch' : 'Department'}</label>
              <p className="text-gray-900 dark:text-white">{user.role === 'student' ? user.branch : user.department}</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">{user.role === 'student' ? 'CGPA' : 'Experience'}</label>
              <p className="text-gray-900 dark:text-white">{user.role === 'student' ? user.cgpa : user.experience}</p>
            </div>
          </div>
        )}

        {compact && (
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-500">Last Active:</span> {formatDate(user.lastActive)}
            </div>
            <div>
              <span className="text-gray-500">{user.role === 'student' ? 'Branch:' : 'Dept:'}</span> {user.role === 'student' ? user.branch : user.department}
            </div>
          </div>
        )}

        {user.role === 'student' && !compact && (
          <div className="mt-4 flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Profile Score: {user.profileScore}%</span>
            </div>
            <div className="flex items-center space-x-2">
              <Briefcase className="w-4 h-4 text-green-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">{user.applications} applications</span>
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  const renderSection = (title: string, roleKey: keyof typeof expandedSections, icon: any, count: number) => {
    const Icon = icon;
    const isExpanded = expandedSections[roleKey];
    const sectionUsers = groupedUsers[roleKey];

    return (
      <div className="glass-card p-6">
        <button
          onClick={() => toggleSection(roleKey)}
          className="w-full flex items-center justify-between p-3 hover:bg-white/5 rounded-lg transition-all duration-300"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-indigo-500/10">
              <Icon className="w-5 h-5 text-indigo-400" />
            </div>
            <h4 className="text-lg font-semibold text-white">{title}</h4>
            <span className="bg-white/5 text-gray-300 px-3 py-1 rounded-full text-sm font-medium">
              {count}
            </span>
          </div>
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
        </button>
        
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 grid grid-cols-1 gap-4"
          >
            {sectionUsers.map((user: any) => renderUserCard(user, roleKey === 'tpo'))}
          </motion.div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-white mb-1">User Management</h3>
          <p className="text-gray-400 text-sm">Manage TPOs, students, and administrators</p>
        </div>
        <button className="btn-primary px-6" onClick={onShowTpoModal}>
          <UserPlus className="w-4 h-4" /> Create TPO
        </button>
      </div>
      
      {loading && <p className="text-center py-8">Loading users...</p>}
      {error && <p className="text-center py-8 text-red-500">{error}</p>}
      
      {!loading && !error && (
        <div className="space-y-4">
          {renderSection('Training & Placement Officers', 'tpo', Users, groupedUsers.tpo.length)}
        </div>
      )}
    </div>
  );
};

export default UsersSection; 