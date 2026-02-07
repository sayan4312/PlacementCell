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
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-white">Internship Opportunities</h3>
        <button className="btn-primary" onClick={() => { setShowInternshipModal(true); setEditingInternship(null); setInternshipForm({ title: '', company: '', description: '', duration: '', stipend: '', location: '', deadline: '', externalLink: '', requirements: [], eligibility: '', notes: '', tags: [], logo: '' }); }}>
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
          className="input-glass w-full"
        />
      </div>
      {/* END INTERNSHIPS TAB SEARCH */}

      <div className="space-y-4">
        {filteredInternships && Array.isArray(filteredInternships) && filteredInternships.filter((internship: any) =>
          (internship && internship.title && internship.title.toLowerCase().includes(internshipSearch.toLowerCase())) ||
          (internship && internship.company && internship.company.toLowerCase().includes(internshipSearch.toLowerCase()))
        ).length === 0 ? (
          <div className="text-center text-gray-400 py-12">No internships found.</div>
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
              className="group flex flex-col md:flex-row items-stretch overflow-hidden hover:border-indigo-500/30 bg-slate-900/50 backdrop-blur-sm border border-white/5 rounded-xl transition-all duration-300"
              style={{ minHeight: '120px' }}
            >
              {/* Logo/Initial */}
              <div className="flex-shrink-0 flex items-center justify-center w-full md:w-32 bg-white/5 border-b md:border-b-0 md:border-r border-white/5 p-6">
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-white text-2xl font-bold font-mono">
                  {internship.company.charAt(0).toUpperCase()}
                </div>
              </div>

              {/* Main Content */}
              <div className="flex-1 flex flex-col justify-between p-5 sm:p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <h4 className="text-xl font-bold text-white mb-1 group-hover:text-indigo-400 transition-colors">{internship.title}</h4>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold text-gray-300">{internship.company}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-600" />
                      <span className="text-gray-400">Posted {new Date(internship.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <a
                    href={internship.externalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-lg hover:bg-indigo-500/20 hover:border-indigo-500/30 transition-all text-sm self-start"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Apply Link</span>
                  </a>
                </div>

                {/* Eligibility & Info */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {internship.eligibility && (
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-white/5 text-gray-300 border border-white/10">
                      Batch: {internship.eligibility.batchYears?.join(', ') || 'Any'}
                    </span>
                  )}
                  {internship.eligibility?.degree && (
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-white/5 text-gray-300 border border-white/10">
                      {internship.eligibility.degree}
                    </span>
                  )}
                </div>

                {/* Description Preview */}
                <div className="mt-3">
                  <p className="text-gray-400 text-sm leading-relaxed line-clamp-2">
                    {internship.description}
                  </p>
                </div>

                {/* Management Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5 mt-4">
                  <button
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                    onClick={() => { setEditingInternship(internship); setShowInternshipModal(true); setInternshipForm({ title: internship.title, company: internship.company, description: internship.description, externalLink: internship.externalLink }); }}
                  >
                    Edit
                  </button>
                  <button
                    className="text-sm text-red-400 hover:text-red-300 transition-colors"
                    onClick={() => setDeletingInternshipId(internship._id)}
                  >
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