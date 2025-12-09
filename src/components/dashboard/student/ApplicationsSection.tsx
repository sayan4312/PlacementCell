import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, Filter, SortAsc, SortDesc, X } from 'lucide-react';
import { toast } from 'react-toastify';

interface Application {
  _id: string;
  drive: {
    _id: string;
    position: string;
    companyName: string;
  };
  status: string;
  appliedAt: string;
  feedback?: string;
  timeline?: Array<{
    step: string;
    completed: boolean;
    date: string;
  }>;
  nextStep?: string;
  resume?: string; // Added for resume download
}

interface ApplicationsSectionProps {
  applications: Application[];
  formatDate: (dateString: string) => string;
}

const ApplicationsSection: React.FC<ApplicationsSectionProps> = ({ applications, formatDate }) => {
  const [sortBy, setSortBy] = useState('appliedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedApplication, setExpandedApplication] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'shortlisted': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'selected': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'interview_scheduled': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'shortlisted': return <CheckCircle className="w-4 h-4" />;
      case 'selected': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      case 'interview_scheduled': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setSortBy('appliedAt');
    setSortOrder('desc');
  };

  const filteredAndSortedApplications = useMemo(() => {
    // First filter out applications with null drives
    let filtered = applications.filter(app => app.drive !== null);
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'appliedAt':
          aValue = new Date(a.appliedAt);
          bValue = new Date(b.appliedAt);
          break;
        case 'company':
          aValue = a.drive.companyName.toLowerCase();
          bValue = b.drive.companyName.toLowerCase();
          break;
        case 'position':
          aValue = a.drive.position.toLowerCase();
          bValue = b.drive.position.toLowerCase();
          break;
        case 'status':
          aValue = a.status.toLowerCase();
          bValue = b.status.toLowerCase();
          break;
        default:
          aValue = new Date(a.appliedAt);
          bValue = new Date(b.appliedAt);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return filtered;
  }, [applications, statusFilter, sortBy, sortOrder]);

  const hasActiveFilters = statusFilter !== 'all';

  const toggleApplicationExpansion = (applicationId: string) => {
    setExpandedApplication(expandedApplication === applicationId ? null : applicationId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">My Applications</h3>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
              showFilters 
                ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/20' 
                : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* Filters and Sorting */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-gray-900 dark:text-white">Sort & Filter</h4>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-pink-400 hover:text-pink-300 flex items-center space-x-1"
              >
                <X className="w-4 h-4" />
                <span>Clear All</span>
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Status Filter
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-glass"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="selected">Selected</option>
                <option value="rejected">Rejected</option>
                <option value="interview_scheduled">Interview Scheduled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="input-glass"
              >
                <option value="appliedAt">Application Date</option>
                <option value="company">Company</option>
                <option value="position">Position</option>
                <option value="status">Status</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="flex items-center space-x-2 px-3 py-2 bg-white/5 text-gray-300 rounded-lg hover:bg-white/10 border border-white/10 transition-all"
              >
                {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                <span>{sortOrder === 'asc' ? 'Ascending' : 'Descending'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Results Summary */}
      {hasActiveFilters && (
        <div className="bg-indigo-500/10 rounded-lg p-4 border border-indigo-500/20">
          <div className="flex items-center justify-between">
            <div className="text-sm text-indigo-400">
              Showing {filteredAndSortedApplications.length} applications matching your filters
            </div>
            <button
              onClick={clearFilters}
              className="text-sm text-indigo-400 hover:text-indigo-300"
            >
              Clear filters
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {filteredAndSortedApplications.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-white text-lg mb-2">
              {hasActiveFilters ? 'No applications match your filters' : 'No applications yet'}
            </p>
            <p className="text-gray-400">
              {hasActiveFilters ? 'Try adjusting your filter criteria' : 'Start applying to job drives to see your applications here'}
            </p>
          </div>
        ) : (
          filteredAndSortedApplications.map((application: Application, index: number) => (
            <motion.div
              key={application._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass-card p-6 hover:scale-[1.01] transition-all duration-300"
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                      {application.drive?.companyName ? 
                        application.drive.companyName.split(' ').map((n: string) => n[0]).join('') : 
                        'N/A'
                      }
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-1">
                        {application.drive?.position || 'Unknown Position'}
                      </h4>
                      <p className="text-gray-400 mb-2">{application.drive?.companyName || 'Unknown Company'}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <span>Applied: {formatDate(application.appliedAt)}</span>
                        {application.nextStep && (
                          <>
                            <span>•</span>
                            <span>Next: {application.nextStep}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${getStatusColor(application.status)}`}>
                      {getStatusIcon(application.status)}
                      <span>{application.status.replace('_', ' ')}</span>
                    </span>
                    <button
                      onClick={() => toggleApplicationExpansion(application._id)}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors"
                    >
                      <svg
                        className={`w-5 h-5 transform transition-transform ${expandedApplication === application._id ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedApplication === application._id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-white/10 pt-4 mt-4"
                  >
                    {/* Timeline */}
                    {(() => {
                      // Define the canonical order of steps
                      const canonicalSteps = [
                        'Applied',
                        'Aptitude & Coding Round',
                        'Technical Round',
                        'HR Round',
                        'Job Offer'
                      ];
                      // Map backend timeline to a lookup
                      const timelineMap: { [key: string]: any } = (application.timeline || []).reduce((acc: any, step: any) => {
                        acc[step.step] = step;
                        return acc;
                      }, {});
                      return (
                        <div className="mb-4">
                          <h5 className="text-sm font-medium text-white mb-3">Application Timeline</h5>
                          <div className="space-y-3">
                            {canonicalSteps.map((stepName, index) => {
                              const step = timelineMap[stepName] || { step: stepName, completed: false };
                              
                              // Determine if this is the current active step
                              const isCurrentStep = !step.completed && step.notes?.includes('Current round');
                              
                              // Determine step status for styling
                              let stepStatus = 'pending'; // default
                              if (step.completed) stepStatus = 'completed';
                              else if (isCurrentStep) stepStatus = 'current';
                              
                              return (
                                <div key={index} className="flex items-center space-x-3">
                                  <div className={`w-3 h-3 rounded-full flex items-center justify-center ${
                                    stepStatus === 'completed' ? 'bg-emerald-500' : 
                                    stepStatus === 'current' ? 'bg-indigo-500 animate-pulse' : 
                                    'bg-white/20'
                                  }`}>
                                    {stepStatus === 'completed' && (
                                      <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <p className={`text-sm ${
                                      stepStatus === 'completed' ? 'text-gray-900 dark:text-white font-medium' : 
                                      stepStatus === 'current' ? 'text-blue-600 dark:text-blue-400 font-medium' : 
                                      'text-gray-500 dark:text-gray-400'
                                    }`}>
                                      {stepName}
                                      {stepStatus === 'current' && <span className="ml-2 text-xs text-blue-500">(In Progress)</span>}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Feedback */}
                    {application.feedback && (
                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Feedback</h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">{application.feedback}</p>
                      </div>
                    )}

                    {/* Actions */}
                    {/* Remove all action buttons: View Details, Download Resume, Withdraw */}
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default ApplicationsSection; 