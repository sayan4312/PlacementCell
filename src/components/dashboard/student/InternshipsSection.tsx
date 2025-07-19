import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  ExternalLink, 
  Building2,
  Search,
  Filter
} from 'lucide-react';

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
  const [sortBy, setSortBy] = useState<'createdAt' | 'company'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);

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

  const handleSort = (field: 'createdAt' | 'company') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Internship Opportunities</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Browse and apply to internship opportunities
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <Filter className="w-4 h-4" />
          <span>Filters</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search internships by title, company, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filters */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Company Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Company
                </label>
                <select
                  value={companyFilter}
                  onChange={(e) => setCompanyFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="All">All Companies</option>
                  {uniqueCompanies.map((company) => (
                    <option key={company} value={company}>
                      {company}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="createdAt">Posted Date</option>
                  <option value="company">Company</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Order
                </label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
              </div>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Clear all filters
              </button>
            )}
          </motion.div>
        )}
      </div>

      {/* Internships List */}
      <div className="space-y-4">
        {filteredAndSortedInternships.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No internships found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
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
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col md:flex-row items-stretch overflow-hidden"
            >
              {/* Logo/Initial */}
              <div className="flex-shrink-0 flex items-center justify-center w-16 h-16 m-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-white text-xl font-bold">
                {internship.company.charAt(0).toUpperCase()}
              </div>
              {/* Main Content */}
              <div className="flex-1 flex flex-col justify-center px-2 py-3 md:py-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{internship.title}</h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">{internship.company}</p>
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
                    className="flex items-center justify-center px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium mt-3 md:mt-0 md:ml-4 min-w-[90px] mr-4"
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Apply
                  </a>
                </div>
                <div className="mt-2">
                  <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                    {internship.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default InternshipsSection; 