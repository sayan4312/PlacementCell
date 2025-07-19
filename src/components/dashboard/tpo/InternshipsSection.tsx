import React from 'react';
import { motion } from 'framer-motion';
import { Plus, ExternalLink, Building2 } from 'lucide-react';

interface InternshipsSectionProps {
  internships: any[];
  internshipSearch: string;
  setInternshipSearch: (val: string) => void;
  setShowInternshipModal: (show: boolean) => void;
  setEditingInternship: (internship: any) => void;
  setInternshipForm: (form: any) => void;
  setDeletingInternshipId: (id: string) => void;
  tpoProfile: any; // Add tpoProfile as a prop
}

const InternshipsSection: React.FC<InternshipsSectionProps> = ({
  internships,
  internshipSearch,
  setInternshipSearch,
  setShowInternshipModal,
  setEditingInternship,
  setInternshipForm,
  setDeletingInternshipId,
  tpoProfile
}) => {
  // Show internships posted by this TPO
  const filteredInternships = internships.filter(intern => intern.postedBy?._id === tpoProfile?._id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Internship Opportunities</h3>
        <button className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors" onClick={() => { setShowInternshipModal(true); setEditingInternship(null); setInternshipForm({ title: '', company: '', description: '', duration: '', stipend: '', location: '', deadline: '', externalLink: '', requirements: [], eligibility: '', notes: '', tags: [], logo: '' }); }}>
          <Plus className="w-4 h-4" />
          <span>Post Internship</span>
        </button>
      </div>

      {/* DYNAMIC INTERNSHIPS TAB SEARCH */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search internships by title or company..."
          value={internshipSearch}
          onChange={e => setInternshipSearch(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>
      {/* END INTERNSHIPS TAB SEARCH */}

      <div className="space-y-4">
        {filteredInternships && Array.isArray(filteredInternships) && filteredInternships.filter((internship: any) =>
          (internship && internship.title && internship.title.toLowerCase().includes(internshipSearch.toLowerCase())) ||
          (internship && internship.company && internship.company.toLowerCase().includes(internshipSearch.toLowerCase()))
        ).length === 0 ? (
          <div className="text-center text-gray-400 dark:text-gray-500 py-12">No internships found.</div>
        ) : (
          filteredInternships.filter((internship: any) =>
            (internship && internship.title && internship.title.toLowerCase().includes(internshipSearch.toLowerCase())) ||
            (internship && internship.company && internship.company.toLowerCase().includes(internshipSearch.toLowerCase()))
          ).map((internship: any, index: number) => (
            <motion.div
              key={internship._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col md:flex-row items-stretch overflow-hidden"
              style={{ minHeight: '120px' }}
            >
              {/* Logo/Initial */}
              <div className="flex-shrink-0 flex items-center justify-center w-16 h-16 m-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-white text-xl font-bold">
                {internship.company.charAt(0).toUpperCase()}
              </div>
              {/* Main Content */}
              <div className="flex-1 flex flex-col justify-between p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{internship.title}</h4>
                    <p className="text-lg text-gray-600 dark:text-gray-300 mb-1">{internship.company}</p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-2">
                      <span>Posted on {new Date(internship.createdAt).toLocaleDateString()}</span>
                      {/* Add eligibility/batch info if available */}
                      {internship.eligibility && (
                        <span>for {internship.eligibility.batchYears?.join(', ') || ''} Batch {internship.eligibility.degree || ''}</span>
                      )}
                    </div>
                  </div>
                  <a
                    href={internship.externalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mt-2 md:mt-0"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>View Link</span>
                  </a>
                </div>
                {/* Description Preview */}
                <div className="mb-2 mt-2">
                  <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed line-clamp-2">
                    {internship.description}
                  </p>
                </div>
                {/* Management Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700 mt-2">
                  <button className="px-4 py-1 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors font-medium" onClick={() => { setEditingInternship(internship); setShowInternshipModal(true); setInternshipForm({ title: internship.title, company: internship.company, description: internship.description, externalLink: internship.externalLink }); }}>
                    Edit
                  </button>
                  <button className="px-4 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors font-medium" onClick={() => setDeletingInternshipId(internship._id)}>
                    Delete
                  </button>
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