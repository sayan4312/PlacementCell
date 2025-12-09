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
          <h3 className="text-xl font-semibold text-white">Internship Opportunities</h3>
          <p className="text-sm text-gray-400 mt-1">
            Browse and apply to internship opportunities
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center space-x-2 px-3 py-2 text-sm bg-white/5 text-gray-300 rounded-lg hover:bg-white/10 border border-white/10 transition-all"
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
            className="input-glass pl-10"
          />
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
              {/* Company Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Company
                </label>
                <select
                  value={companyFilter}
                  onChange={(e) => setCompanyFilter(e.target.value)}
                  className="input-glass"
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
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Sort By
                </label>
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
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Order
                </label>
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

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-indigo-400 hover:text-indigo-300"
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
            <h3 className="text-lg font-medium text-white mb-2">
              No internships found
            </h3>
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
              {/* Logo/Initial */}
              <div className="flex-shrink-0 flex items-center justify-center w-16 h-16 m-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg text-white text-xl font-bold">
                {internship.company.charAt(0).toUpperCase()}
              </div>
              {/* Main Content */}
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
                  <p className="text-gray-400 text-sm leading-relaxed">
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