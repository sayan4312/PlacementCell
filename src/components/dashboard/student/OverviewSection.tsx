import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, CheckCircle, Target, Briefcase, AlertCircle, Upload, Edit, Search, TrendingUp, Award } from 'lucide-react';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line, PieChart, Pie, Cell } from 'recharts';

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
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Section */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white">Welcome back, {user?.name}!</h2>
          <p className="text-gray-400">
            {user?.profileCompleted ? 'Your profile is complete!' : 'Complete your profile to get better opportunities'}
          </p>
        </div>
        {user?.requiresPasswordChange && (
          <div className="glass-card px-4 py-2 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 text-sm">Please change your password</span>
          </div>
        )}
      </div>

      {/* Profile Completion Progress */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Profile Completion</h3>
          <span className="text-2xl font-bold text-gradient-premium">{profileCompletion}%</span>
        </div>
        
        <div className="mb-4">
          <div className="w-full bg-white/10 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${profileCompletion}%` }}
            ></div>
          </div>
        </div>

        {suggestions.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-white">Suggestions to improve:</p>
            {suggestions.map((suggestion, index) => (
              <div key={index} className="flex items-center space-x-2 text-sm text-gray-400">
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
            className="glass-card p-6 hover:scale-[1.02] transition-transform duration-300 cursor-pointer"
            onClick={() => setActiveTab('applications')}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm">Total Applications</p>
                <h3 className="text-3xl font-bold text-white mt-1">{stats.totalApplications}</h3>
              </div>
              <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
                <FileText size={24} />
              </div>
            </div>
            <p className="text-emerald-400 text-sm mt-4 flex items-center gap-1">
              <TrendingUp size={16} /> +{stats.totalApplications} this month
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6 hover:scale-[1.02] transition-transform duration-300 cursor-pointer"
            onClick={() => setActiveTab('applications')}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm">Success Rate</p>
                <h3 className="text-3xl font-bold text-white mt-1">{successRate}%</h3>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
                <CheckCircle size={24} />
              </div>
            </div>
            <p className="text-gray-400 text-sm mt-4">Shortlisted + Selected</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-6 hover:scale-[1.02] transition-transform duration-300 cursor-pointer"
            onClick={() => setActiveTab('profile')}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm">Profile Score</p>
                <h3 className="text-3xl font-bold text-white mt-1">{stats.profileScore}%</h3>
              </div>
              <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
                <Target size={24} />
              </div>
            </div>
            <p className="text-white text-sm mt-4">Click to improve</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card p-6 hover:scale-[1.02] transition-transform duration-300 cursor-pointer"
            onClick={() => setActiveTab('drives')}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm">Eligible Drives</p>
                <h3 className="text-3xl font-bold text-white mt-1">{stats.eligibleDrives}</h3>
              </div>
              <div className="p-3 rounded-xl bg-pink-500/10 text-pink-400">
                <Briefcase size={24} />
              </div>
            </div>
            <p className="text-emerald-400 text-sm mt-4">Click to browse</p>
          </motion.div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="text-xl font-bold text-white mb-6">Application Trends (Last 6 Months)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={applicationTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
                <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '0.75rem' }}
                />
                <Line type="monotone" dataKey="applications" stroke="#818cf8" strokeWidth={3} name="Applications" />
                <Line type="monotone" dataKey="interviews" stroke="#10b981" strokeWidth={3} name="Interviews" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-xl font-bold text-white mb-6">Application Status</h3>
          {(
            (stats.pendingApplications || 0) === 0 &&
            (stats.shortlistedApplications || 0) === 0 &&
            (stats.selectedApplications || 0) === 0 &&
            (stats.rejectedApplications || 0) === 0
          ) ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-white text-lg mb-2">No applications yet</p>
              <p className="text-gray-400">Start applying to job drives to see your application status here.</p>
            </div>
          ) : (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
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
                    label={({ name, value }) => ((value ?? 0) > 0 ? `${name}: ${value}` : '')}
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
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '0.75rem' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="glass-card p-6">
        <h3 className="text-xl font-bold text-white mb-6">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={handleUpdateResume}
            disabled={isUploading}
            className={`flex items-center space-x-3 p-4 rounded-lg transition-all ${
              isUploading 
                ? 'bg-white/5 cursor-not-allowed' 
                : 'bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20'
            }`}
          >
            {isUploading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-400"></div>
            ) : (
              <Upload className="w-5 h-5 text-indigo-400" />
            )}
            <span className="text-white font-medium">
              {isUploading ? 'Uploading...' : 'Update Resume'}
            </span>
          </button>
          
          <button 
            onClick={handleEditProfile}
            disabled={isEditing}
            className={`flex items-center space-x-3 p-4 rounded-lg transition-all ${
              isEditing 
                ? 'bg-white/5 cursor-not-allowed' 
                : 'bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20'
            }`}
          >
            {isEditing ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-400"></div>
            ) : (
              <Edit className="w-5 h-5 text-emerald-400" />
            )}
            <span className="text-white font-medium">
              {isEditing ? 'Opening...' : 'Edit Profile'}
            </span>
          </button>
          
          <button 
            onClick={handleBrowseJobs}
            className="flex items-center space-x-3 p-4 bg-purple-500/10 hover:bg-purple-500/20 rounded-lg border border-purple-500/20 transition-all"
          >
            <Search className="w-5 h-5 text-purple-400" />
            <span className="text-white font-medium">Browse Jobs</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default OverviewSection; 