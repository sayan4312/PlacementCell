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
              className="glass-card flex flex-col md:flex-row items-stretch overflow-hidden hover:scale-[1.01] transition-all duration-300"
              style={{ minHeight: '120px' }}
            >
              {/* Logo/Initial */}
              <div className="flex-shrink-0 flex items-center justify-center w-16 h-16 m-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg text-white text-xl font-bold">
                {internship.company.charAt(0).toUpperCase()}
              </div>
              {/* Main Content */}
              <div className="flex-1 flex flex-col justify-between p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <h4 className="text-2xl font-bold text-white mb-1">{internship.title}</h4>
                    <p className="text-lg text-gray-300 mb-1">{internship.company}</p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-2">
                      <span>Posted on {new Date(internship.createdAt).toLocaleDateString()}</span>
                      
                      {internship.eligibility && (
                        <span>for {internship.eligibility.batchYears?.join(', ') || ''} Batch {internship.eligibility.degree || ''}</span>
                      )}
                    </div>
                  </div>
                  <a
                    href={internship.externalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-4 py-2 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-lg hover:bg-indigo-500/30 hover:scale-[1.02] transition-all mt-2 md:mt-0"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>View Link</span>
                  </a>
                </div>
                {/* Description Preview */}
                <div className="mb-2 mt-2">
                  <p className="text-gray-300 text-base leading-relaxed line-clamp-2">
                    {internship.description}
                  </p>
                </div>
                {/* Management Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-white/10 mt-2">
                  <button className="btn-secondary" onClick={() => { setEditingInternship(internship); setShowInternshipModal(true); setInternshipForm({ title: internship.title, company: internship.company, description: internship.description, externalLink: internship.externalLink }); }}>
                    Edit
                  </button>
                  <button className="px-4 py-1 text-red-400 hover:bg-red-500/10 border border-red-500/30 rounded-lg transition-colors font-medium" onClick={() => setDeletingInternshipId(internship._id)}>
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