import React from 'react';
import { motion } from 'framer-motion';
import { Plus, DollarSign, MapPin, Calendar, Building2, Briefcase } from 'lucide-react';

interface DrivesSectionProps {
  jobDrives: any[];
  driveSearch: string;
  setDriveSearch: (val: string) => void;
  getStatusColor: (status: string) => string;
  handleEditDrive: (drive: any) => void;
  setDeletingDriveId: (id: string) => void;
  initializeDriveForm: () => void;
  setEditingDrive: (drive: any) => void;
  setShowDriveModal: (show: boolean) => void;
}

const DrivesSection: React.FC<DrivesSectionProps> = ({
  jobDrives,
  driveSearch,
  setDriveSearch,
  getStatusColor,
  handleEditDrive,
  setDeletingDriveId,
  initializeDriveForm,
  setEditingDrive,
  setShowDriveModal
}) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-white">Job Drives</h3>
        <button className="btn-primary" onClick={() => { initializeDriveForm(); setEditingDrive(null); setShowDriveModal(true); }}>
          <Plus className="w-4 h-4" />
          <span>Post New Drive</span>
        </button>
      </div>

      {/* DYNAMIC DRIVES TAB SEARCH */}
      <div className="flex items-center justify-between mb-4">
        <input
          type="text"
          placeholder="Search drives..."
          value={driveSearch}
          onChange={e => setDriveSearch(e.target.value)}
          className="input-glass w-64"
        />
      </div>
      {/* END DRIVES TAB SEARCH */}

      <div className="grid grid-cols-1 gap-6">
        {jobDrives && Array.isArray(jobDrives) && jobDrives.filter((drive: any) =>
          drive && ((drive.company?.companyName || drive.companyName) && (drive.company?.companyName || drive.companyName).toLowerCase().includes(driveSearch.toLowerCase())) ||
          drive && drive.position && drive.position.toLowerCase().includes(driveSearch.toLowerCase()) ||
          drive && typeof drive.company === 'string' && drive.company.toLowerCase().includes(driveSearch.toLowerCase())
        ).map((drive: any, index: number) => (
          <motion.div
            key={drive._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="glass-card p-6 hover:scale-[1.01] transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start space-x-4">
                <div>
                  <h4 className="text-xl font-semibold text-white mb-1 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-indigo-400 mr-1" />
                    {typeof drive.position === 'object' ? drive.position?.name || drive.position?.title || 'Unknown Position' : drive.position || 'Unknown Position'}
                  </h4>
                  <p className="text-base font-semibold text-indigo-300 mb-1 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-purple-400 mr-1" />
                    {typeof drive.company === 'object' ? drive.company?.companyName || drive.companyName || 'Unknown Company' : drive.company || drive.companyName || 'Unknown Company'}
                  </p>
                  <p className="text-sm text-gray-400">
                    {typeof drive.description === 'object' ? drive.description?.text || 'No description' : drive.description || 'No description'}
                  </p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(drive.status)}`}> 
                {drive.status}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-400">Package</p>
                  <p className="font-semibold text-white">
                    {typeof drive.ctc === 'object' ? drive.ctc?.value || 'N/A' : drive.ctc || 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-400">Location</p>
                  <p className="font-semibold text-white">
                    {typeof drive.location === 'object' ? drive.location?.name || 'N/A' : drive.location || 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-400">Deadline</p>
                  <p className="font-semibold text-white">{formatDate(drive.deadline)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="inline-block w-4 h-4" />
                <div>
                  <p className="text-sm text-gray-400">Applications</p>
                  <p className="font-semibold text-white">{Array.isArray(drive.applicants) ? drive.applicants.length : 0}</p>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <h5 className="text-sm font-medium text-gray-300 mb-2">Eligibility Criteria</h5>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-md text-sm">
                  Min CGPA: {drive.eligibility?.minCGPA ?? '-'}
                </span>
                <span className="px-2 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-md text-sm">
                  Max Backlogs: {drive.eligibility?.maxBacklogs ?? '-'}
                </span>
                <span className="px-2 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-md text-sm">
                  {typeof drive.workMode === 'object' ? drive.workMode?.name || 'N/A' : drive.workMode || 'N/A'}
                </span>
                {drive.eligibility?.allowedBranches && Array.isArray(drive.eligibility.allowedBranches) && drive.eligibility.allowedBranches.map((branch: string, index: number) => (
                  <span
                    key={`branch-${drive._id}-${index}-${branch}`}
                    className="px-2 py-1 bg-pink-500/20 text-pink-300 border border-pink-500/30 rounded-md text-sm"
                  >
                    {branch}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">
                Posted on {drive.createdAt ? new Date(drive.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
              </span>
              <div className="flex items-center space-x-2">
                <button className="btn-secondary" onClick={() => handleEditDrive(drive)}>
                  Edit
                </button>
                <button className="px-3 py-1 text-red-400 hover:bg-red-500/10 border border-red-500/30 rounded-lg transition-colors" onClick={() => setDeletingDriveId(drive._id)}>
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default DrivesSection; 