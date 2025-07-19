import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, CheckCircle, Target, Briefcase, AlertCircle, GraduationCap, Upload, Edit, Search, TrendingUp, Calendar, Award } from 'lucide-react';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

interface OverviewSectionProps {
  user: any;
  stats: any;
  applicationTrends: any[];
  setActiveTab: (tab: string) => void;
}

const OverviewSection: React.FC<OverviewSectionProps> = ({ user, stats, applicationTrends, setActiveTab }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Calculate profile completion percentage
  const calculateProfileCompletion = () => {
    if (!user) return 0;
    
    const fields = [
      user.name, user.email, user.phone, user.address, user.dateOfBirth,
      user.studentId, user.branch, user.year, user.cgpa, user.backlogs,
      user.skills?.length > 0, user.projects?.length > 0, 
      user.certifications?.length > 0, user.achievements?.length > 0,
      user.resume?.filename
    ];
    
    const completedFields = fields.filter(Boolean).length;
    return Math.round((completedFields / fields.length) * 100);
  };

  const profileCompletion = calculateProfileCompletion();

  // Calculate application success rate
  const calculateSuccessRate = () => {
    if (!stats || stats.totalApplications === 0) return 0;
    const successful = (stats.shortlistedApplications + stats.selectedApplications);
    return Math.round((successful / stats.totalApplications) * 100);
  };

  const successRate = calculateSuccessRate();

  // Get profile improvement suggestions
  const getProfileSuggestions = () => {
    const suggestions = [];
    
    if (!user.skills || user.skills.length < 3) {
      suggestions.push('Add more technical skills to your profile');
    }
    
    if (!user.projects || user.projects.length < 2) {
      suggestions.push('Showcase your projects to stand out');
    }
    
    if (!user.resume?.filename) {
      suggestions.push('Upload your resume to complete your profile');
    }
    
    if (!user.certifications || user.certifications.length === 0) {
      suggestions.push('Add certifications to boost your profile');
    }
    
    return suggestions.slice(0, 3); // Show top 3 suggestions
  };

  const suggestions = getProfileSuggestions();

  const handleUpdateResume = async () => {
    setIsUploading(true);
    try {
      // Create a file input element
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.pdf,.doc,.docx';
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          // Here you would typically upload to your server
          console.log('Uploading resume:', file.name);
          // Simulate upload delay
          await new Promise(resolve => setTimeout(resolve, 2000));
          alert('Resume updated successfully!');
        }
        setIsUploading(false);
      };
      input.click();
    } catch (error) {
      console.error('Error updating resume:', error);
      alert('Failed to update resume. Please try again.');
      setIsUploading(false);
    }
  };

  const handleEditProfile = () => {
    setIsEditing(true);
    // Navigate to profile tab and trigger edit mode
    setActiveTab('profile');
    // You could also trigger a modal or form here
    setTimeout(() => {
      setIsEditing(false);
    }, 1000);
  };

  const handleBrowseJobs = () => {
    setActiveTab('drives');
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Welcome back, {user?.name}!</h2>
            <p className="text-blue-100 text-lg">
              {user?.profileCompleted ? 'Your profile is complete!' : 'Complete your profile to get better opportunities'}
            </p>
            {user?.requiresPasswordChange && (
              <div className="mt-2 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4" />
                <span className="text-yellow-200">Please change your password</span>
              </div>
            )}
          </div>
          <div className="hidden md:block">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
              <GraduationCap className="w-12 h-12" />
            </div>
          </div>
        </div>
      </div>

      {/* Profile Completion Progress */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Profile Completion</h3>
          <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{profileCompletion}%</span>
        </div>
        
        <div className="mb-4">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${profileCompletion}%` }}
            ></div>
          </div>
        </div>

        {suggestions.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Suggestions to improve:</p>
            {suggestions.map((suggestion, index) => (
              <div key={index} className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <Award className="w-4 h-4 text-yellow-500" />
                <span>{suggestion}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setActiveTab('applications')}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                +{stats.totalApplications}
              </span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {stats.totalApplications}
              </p>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Total Applications
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Click to view details
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setActiveTab('applications')}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                {successRate}%
              </span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {successRate}%
              </p>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Success Rate
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Shortlisted + Selected
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setActiveTab('profile')}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900">
                <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                {stats.profileScore}%
              </span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {stats.profileScore}%
              </p>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Profile Score
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Click to improve
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setActiveTab('drives')}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900">
                <Briefcase className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                {stats.eligibleDrives}
              </span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {stats.eligibleDrives}
              </p>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Eligible Drives
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Click to browse
              </p>
            </div>
          </motion.div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Application Trends (Last 6 Months)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={applicationTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="applications" stroke="#3B82F6" strokeWidth={2} name="Applications" />
              <Line type="monotone" dataKey="interviews" stroke="#10B981" strokeWidth={2} name="Interviews" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Application Status</h3>
          {(
            (stats.pendingApplications || 0) === 0 &&
            (stats.shortlistedApplications || 0) === 0 &&
            (stats.selectedApplications || 0) === 0 &&
            (stats.rejectedApplications || 0) === 0
          ) ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">No applications yet</p>
              <p className="text-gray-400 dark:text-gray-500">Start applying to job drives to see your application status here.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Pending', value: stats?.pendingApplications || 0, color: '#8B5CF6' },
                    { name: 'Shortlisted', value: stats?.shortlistedApplications || 0, color: '#10B981' },
                    { name: 'Selected', value: stats?.selectedApplications || 0, color: '#059669' },
                    { name: 'Rejected', value: stats?.rejectedApplications || 0, color: '#EF4444' }
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => (value > 0 ? `${name}: ${value}` : '')}
                >
                  {[
                    { name: 'Pending', value: stats?.pendingApplications || 0, color: '#8B5CF6' },
                    { name: 'Shortlisted', value: stats?.shortlistedApplications || 0, color: '#10B981' },
                    { name: 'Selected', value: stats?.selectedApplications || 0, color: '#059669' },
                    { name: 'Rejected', value: stats?.rejectedApplications || 0, color: '#EF4444' }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={handleUpdateResume}
            disabled={isUploading}
            className={`flex items-center space-x-3 p-4 rounded-lg transition-colors ${
              isUploading 
                ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' 
                : 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30'
            }`}
          >
            {isUploading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            ) : (
              <Upload className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            )}
            <span className="text-blue-700 dark:text-blue-300 font-medium">
              {isUploading ? 'Uploading...' : 'Update Resume'}
            </span>
          </button>
          
          <button 
            onClick={handleEditProfile}
            disabled={isEditing}
            className={`flex items-center space-x-3 p-4 rounded-lg transition-colors ${
              isEditing 
                ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' 
                : 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30'
            }`}
          >
            {isEditing ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
            ) : (
              <Edit className="w-5 h-5 text-green-600 dark:text-green-400" />
            )}
            <span className="text-green-700 dark:text-green-300 font-medium">
              {isEditing ? 'Opening...' : 'Edit Profile'}
            </span>
          </button>
          
          <button 
            onClick={handleBrowseJobs}
            className="flex items-center space-x-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
          >
            <Search className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span className="text-purple-700 dark:text-purple-300 font-medium">Browse Jobs</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default OverviewSection; 