import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, DollarSign, MapPin, Calendar, Building2, CheckCircle, Clock, Filter, X, Briefcase, ExternalLink } from 'lucide-react';
import { toast } from 'react-toastify';

interface Drive {
  _id: string;
  position: string;
  description: string;
  company: {
    _id: string;
    companyName: string;
    industry: string;
    companySize?: string;
  };
  companyName?: string; // <-- add this line for fallback
  ctc: string;
  location: string;
  deadline: string;
  eligibility: {
    minCGPA: number;
    allowedBranches: string[];
    maxBacklogs: number;
    minYear: number;
    workMode?: string;
    industry?: string;
  };
  requirements: string[];
  status: string;
  appliedAt?: string;
  externalApplicationUrl?: string;
}

interface DrivesSectionProps {
  drives: Drive[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  handleApplyToDrive: (driveId: string) => void;
  formatDate: (dateString: string) => string;
}

const DrivesSection: React.FC<DrivesSectionProps> = ({
  drives,
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  handleApplyToDrive,
  formatDate,
}) => {
  const [applyingDriveId, setApplyingDriveId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Debug: Log drives data to see if external fields are present
  console.log('Drives data:', drives.map(d => ({
    id: d._id,
    position: d.position,
    externalApplicationUrl: d.externalApplicationUrl
  })));
  const [locationFilter, setLocationFilter] = useState('');
  const [ctcFilter, setCtcFilter] = useState('');

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'eligible': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'applied': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'shortlisted': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'selected': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const handleApply = async (driveId: string) => {
    setApplyingDriveId(driveId);
    try {
      await handleApplyToDrive(driveId);
    } finally {
      setApplyingDriveId(null);
    }
  };

  const handleExternalLink = (drive: Drive) => {
    if (drive.externalApplicationUrl) {
      window.open(drive.externalApplicationUrl, '_blank');
      toast.success('Opening external application link...');
    } else {
      toast.error(`No external application URL set for ${drive.position}`);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setLocationFilter('');
    setCtcFilter('');
  };

  const filteredDrives = useMemo(() => {
    return drives.filter(drive => {
      // Search filter
      const companyName = drive.company?.companyName || drive.companyName || '';
      const matchesSearch = searchTerm === '' || 
        companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        drive.position.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      const matchesStatus = filterStatus === 'all' || drive.status === filterStatus;

      // Location filter
      const matchesLocation = locationFilter === '' || 
        drive.location.toLowerCase().includes(locationFilter.toLowerCase());

      // CTC filter (basic implementation)
      const matchesCtc = ctcFilter === '' || 
        drive.ctc.toLowerCase().includes(ctcFilter.toLowerCase());

      return matchesSearch && matchesStatus && matchesLocation && matchesCtc;
    });
  }, [drives, searchTerm, filterStatus, locationFilter, ctcFilter]);

  const hasActiveFilters = searchTerm || filterStatus !== 'all' || locationFilter || ctcFilter;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Available Job Drives</h3>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search companies, positions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
              showFilters 
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-gray-900 dark:text-white">Advanced Filters</h4>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex items-center space-x-1"
              >
                <X className="w-4 h-4" />
                <span>Clear All</span>
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="eligible">Eligible</option>
                <option value="applied">Applied</option>
                <option value="shortlisted">Shortlisted</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Location
              </label>
              <input
                type="text"
                placeholder="Filter by location"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Package
              </label>
              <input
                type="text"
                placeholder="Filter by CTC"
                value={ctcFilter}
                onChange={(e) => setCtcFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-end">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {filteredDrives.length} of {drives.length} drives
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Results Summary */}
      {hasActiveFilters && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-blue-800 dark:text-blue-200">
              Showing {filteredDrives.length} drives matching your filters
            </div>
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Clear filters
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {filteredDrives.length === 0 ? (
          <div className="text-center py-12">
            <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">
              {hasActiveFilters ? 'No drives match your filters' : 'No drives available'}
            </p>
            <p className="text-gray-400 dark:text-gray-500">
              {hasActiveFilters ? 'Try adjusting your search criteria' : 'Check back later for new opportunities'}
            </p>
          </div>
        ) : (
          filteredDrives.map((drive, index) => (
            <motion.div
              key={drive._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300"
            >
              <div className="p-6">
                <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                  <Building2 className="h-7 w-7 text-purple-600 dark:text-purple-400" />
                  {drive.position} <span className="font-normal text-gray-500 dark:text-gray-400">at</span> {drive.company?.companyName || drive.companyName || "Unknown Company"}
                </p>
                <p className="text-gray-500 dark:text-gray-400 mb-4">{drive.description}</p>
                <div className="flex flex-wrap gap-6 mb-4">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{drive.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Deadline</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{formatDate(drive.deadline)}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>Min CGPA: {drive.eligibility.minCGPA}</span>
                    <span>•</span>
                    <span>{drive.eligibility.workMode || 'On-site'}</span>
                    <span>•</span>
                    <span>{drive.eligibility.industry || 'Technology'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {/* Apply Button */}
                    <button 
                      onClick={() => handleApply(drive._id)}
                      disabled={drive.status !== 'eligible' || applyingDriveId === drive._id}
                      className={`px-4 py-2 text-white rounded-lg transition-colors flex items-center space-x-2 ${
                        drive.status === 'eligible' && applyingDriveId !== drive._id
                          ? 'bg-blue-600 hover:bg-blue-700' 
                          : 'bg-gray-300 cursor-not-allowed text-gray-600'
                      }`}
                    >
                      {applyingDriveId === drive._id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Applying...</span>
                        </>
                      ) : (
                        <span className="flex items-center space-x-1">
                          <CheckCircle className="w-4 h-4" />
                          <span>
                            {drive.status === 'eligible' 
                              ? 'Apply'
                              : drive.status === 'pending' 
                              ? 'Applied' 
                              : drive.status.charAt(0).toUpperCase() + drive.status.slice(1)
                            }
                          </span>
                        </span>
                      )}
                    </button>
                    
                    {/* Application Link Button - always show for testing */}
                    <button 
                      onClick={() => handleExternalLink(drive)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Application Link</span>
                    </button>
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

export default DrivesSection; 