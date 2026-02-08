import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ExternalLink,
  Building2,
  Search,
  Filter,
  Globe,
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  Loader2
} from 'lucide-react';
import apiClient from '../../../services/apiClient';

interface Internship {
  _id: string;
  title: string;
  company: string;
  description: string;
  externalLink: string;
  postedBy: {
    name: string;
    department: string;
  };
  createdAt: string;
}

interface ExternalJob {
  id: string;
  title: string;
  company: string;
  companyLogo: string | null;
  location: string;
  isRemote: boolean;
  employmentType: string;
  description: string;
  salary: string | null;
  applyLink: string;
  postedAt: string;
  source: string;
}

interface InternshipsSectionProps {
  internships: Internship[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  companyFilter: string;
  setCompanyFilter: (company: string) => void;
  formatDate: (dateString: string) => string;
}

const InternshipsSection: React.FC<InternshipsSectionProps> = ({
  internships,
  searchTerm,
  setSearchTerm,
  companyFilter,
  setCompanyFilter,
  formatDate
}) => {
  const [activeTab, setActiveTab] = useState<'tpo' | 'external'>('tpo');
  const [sortBy, setSortBy] = useState<'createdAt' | 'company'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);

  // External jobs state
  const [externalJobs, setExternalJobs] = useState<ExternalJob[]>([]);
  const [externalSearchQuery, setExternalSearchQuery] = useState('');
  const [externalLocation, setExternalLocation] = useState('india');
  const [externalLoading, setExternalLoading] = useState(false);
  const [externalError, setExternalError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  // Search external jobs
  const searchExternalJobs = useCallback(async () => {
    if (!externalSearchQuery.trim()) {
      setExternalError('Please enter a search term');
      return;
    }

    setExternalLoading(true);
    setExternalError('');
    setHasSearched(true);

    try {
      const res = await apiClient.get('/jobs/search', {
        params: {
          q: externalSearchQuery,
          location: externalLocation,
          type: 'INTERN'
        }
      });
      setExternalJobs(res.data.jobs || []);
    } catch (err: any) {
      console.error('Error fetching external jobs:', err);
      setExternalError(err.response?.data?.message || 'Failed to fetch jobs. Please try again.');
      setExternalJobs([]);
    } finally {
      setExternalLoading(false);
    }
  }, [externalSearchQuery, externalLocation]);

  const filteredAndSortedInternships = useMemo(() => {
    let filtered = internships;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(internship =>
        internship.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        internship.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        internship.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply company filter
    if (companyFilter && companyFilter !== 'All') {
      filtered = filtered.filter(internship =>
        internship.company.toLowerCase() === companyFilter.toLowerCase()
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'company':
          aValue = a.company.toLowerCase();
          bValue = b.company.toLowerCase();
          break;
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [internships, searchTerm, companyFilter, sortBy, sortOrder]);

  const clearFilters = () => {
    setSearchTerm('');
    setCompanyFilter('All');
    setSortBy('createdAt');
    setSortOrder('desc');
  };

  const hasActiveFilters = searchTerm || companyFilter !== 'All';

  // Get unique companies for the filter dropdown
  const uniqueCompanies = useMemo(() => {
    const companies = [...new Set(internships.map(internship => internship.company))];
    return companies.sort();
  }, [internships]);

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return formatDate(dateString);
  };

  return (
    <div className="space-y-6">
      {/* Header with Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-white">Internship Opportunities</h3>
          <p className="text-sm text-gray-400 mt-1">
            Browse internship opportunities from TPO and external sources
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
          <button
            onClick={() => setActiveTab('tpo')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'tpo'
                ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                : 'text-gray-400 hover:text-white'
              }`}
          >
            <Briefcase className="w-4 h-4" />
            TPO Posted
          </button>
          <button
            onClick={() => setActiveTab('external')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'external'
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                : 'text-gray-400 hover:text-white'
              }`}
          >
            <Globe className="w-4 h-4" />
            External Jobs
          </button>
        </div>
      </div>

      {/* TPO Posted Tab Content */}
      {activeTab === 'tpo' && (
        <>
          {/* Search and Filters */}
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search internships by title, company, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-glass pl-10"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-white/5 text-gray-300 rounded-lg hover:bg-white/10 border border-white/10 transition-all"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
              </button>
            </div>

            {/* Filters */}
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white/5 rounded-lg p-4 space-y-4 border border-white/10"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Company</label>
                    <select
                      value={companyFilter}
                      onChange={(e) => setCompanyFilter(e.target.value)}
                      className="input-glass"
                    >
                      <option value="All">All Companies</option>
                      {uniqueCompanies.map((company) => (
                        <option key={company} value={company}>{company}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Sort By</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="input-glass"
                    >
                      <option value="createdAt">Posted Date</option>
                      <option value="company">Company</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Order</label>
                    <select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value as any)}
                      className="input-glass"
                    >
                      <option value="desc">Newest First</option>
                      <option value="asc">Oldest First</option>
                    </select>
                  </div>
                </div>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="text-sm text-indigo-400 hover:text-indigo-300">
                    Clear all filters
                  </button>
                )}
              </motion.div>
            )}
          </div>

          {/* TPO Internships List */}
          <div className="space-y-4">
            {filteredAndSortedInternships.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No internships found</h3>
                <p className="text-gray-400">
                  {hasActiveFilters
                    ? 'Try adjusting your search terms'
                    : 'No internship opportunities are currently available'
                  }
                </p>
              </div>
            ) : (
              filteredAndSortedInternships.map((internship, index) => (
                <motion.div
                  key={internship._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-card flex flex-col md:flex-row items-stretch overflow-hidden hover:scale-[1.01] transition-all"
                >
                  <div className="flex-shrink-0 flex items-center justify-center w-16 h-16 m-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg text-white text-xl font-bold">
                    {internship.company.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 flex flex-col justify-center px-2 py-3 md:py-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div>
                        <h4 className="text-lg font-bold text-white leading-tight">{internship.title}</h4>
                        <p className="text-gray-400 text-sm">{internship.company}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                          <span>Posted by {internship.postedBy?.name || 'TPO'}</span>
                          <span className="mx-1">•</span>
                          <span>{formatDate(internship.createdAt)}</span>
                        </div>
                      </div>
                      <a
                        href={internship.externalLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary flex items-center justify-center min-w-[90px] mr-4 mt-3 md:mt-0 md:ml-4"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Apply
                      </a>
                    </div>
                    <div className="mt-2">
                      <p className="text-gray-400 text-sm leading-relaxed">{internship.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </>
      )}

      {/* External Jobs Tab Content */}
      {activeTab === 'external' && (
        <>
          {/* External Search */}
          <div className="glass-card p-4 space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search jobs (e.g., Software Engineer, Data Analyst)"
                  value={externalSearchQuery}
                  onChange={(e) => setExternalSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchExternalJobs()}
                  className="input-glass pl-10"
                />
              </div>
              <div className="relative md:w-48">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={externalLocation}
                  onChange={(e) => setExternalLocation(e.target.value)}
                  className="input-glass pl-10"
                >
                  <option value="india">India</option>
                  <option value="bangalore">Bangalore</option>
                  <option value="hyderabad">Hyderabad</option>
                  <option value="mumbai">Mumbai</option>
                  <option value="delhi">Delhi</option>
                  <option value="pune">Pune</option>
                  <option value="chennai">Chennai</option>
                  <option value="remote">Remote</option>
                </select>
              </div>
              <button
                onClick={searchExternalJobs}
                disabled={externalLoading}
                className="btn-primary flex items-center justify-center gap-2 min-w-[120px]"
              >
                {externalLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Search
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Powered by JSearch • Aggregates from LinkedIn, Indeed, Glassdoor & more
            </p>
          </div>

          {/* External Jobs Results */}
          <div className="space-y-4">
            {externalError && (
              <div className="text-center py-8 text-red-400">{externalError}</div>
            )}

            {!hasSearched && !externalLoading && (
              <div className="text-center py-12">
                <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">Search External Jobs</h3>
                <p className="text-gray-400">
                  Enter a job title or keyword to search for internships and jobs from across the web
                </p>
              </div>
            )}

            {externalLoading && (
              <div className="text-center py-12">
                <Loader2 className="w-12 h-12 text-indigo-400 mx-auto mb-4 animate-spin" />
                <p className="text-gray-400">Searching across job boards...</p>
              </div>
            )}

            {hasSearched && !externalLoading && externalJobs.length === 0 && !externalError && (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No jobs found</h3>
                <p className="text-gray-400">Try a different search term or location</p>
              </div>
            )}

            {externalJobs.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass-card p-4 hover:scale-[1.01] transition-all"
              >
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Company Logo */}
                  <div className="flex-shrink-0 w-14 h-14 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center overflow-hidden">
                    {job.companyLogo ? (
                      <img src={job.companyLogo} alt={job.company} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white text-xl font-bold">{job.company.charAt(0)}</span>
                    )}
                  </div>

                  {/* Job Details */}
                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                      <div>
                        <h4 className="text-lg font-bold text-white">{job.title}</h4>
                        <p className="text-indigo-400 font-medium">{job.company}</p>
                      </div>
                      <a
                        href={job.applyLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary flex items-center gap-2 text-sm whitespace-nowrap self-start"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Apply Now
                      </a>
                    </div>

                    {/* Meta Info */}
                    <div className="flex flex-wrap gap-3 mt-2 text-sm">
                      <span className="flex items-center gap-1 text-gray-400">
                        <MapPin className="w-3 h-3" />
                        {job.isRemote ? '🏠 Remote' : job.location}
                      </span>
                      {job.salary && (
                        <span className="flex items-center gap-1 text-green-400">
                          <DollarSign className="w-3 h-3" />
                          {job.salary}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-gray-500">
                        <Clock className="w-3 h-3" />
                        {formatRelativeTime(job.postedAt)}
                      </span>
                      {job.employmentType && (
                        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs">
                          {job.employmentType}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-gray-400 text-sm mt-2 line-clamp-2">{job.description}</p>

                    {/* Source */}
                    <p className="text-xs text-gray-600 mt-2">Source: {job.source}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default InternshipsSection;