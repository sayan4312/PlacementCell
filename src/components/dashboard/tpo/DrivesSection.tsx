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
    <div className="space-y-6">
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
            className="group relative bg-slate-900/50 backdrop-blur-sm border border-white/5 rounded-xl overflow-hidden hover:border-indigo-500/30 hover:bg-slate-900/80 transition-all duration-300"
          >
            {/* Status Strip */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${getStatusColor(drive.status).replace('bg-', 'bg-').replace('text-', 'bg-').split(' ')[0]}`} />

            <div className="p-5 sm:p-6 pl-6 sm:pl-8">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="text-lg sm:text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">
                      {typeof drive.position === 'object' ? drive.position?.name || drive.position?.title || 'Unknown Position' : drive.position || 'Unknown Position'}
                    </h4>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-semibold border ${getStatusColor(drive.status).replace('bg-', 'border-').replace('text-', 'text-').split(' ')[0]} bg-transparent`}>
                      {drive.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Building2 className="w-4 h-4" />
                    <span className="font-medium text-gray-300">
                      {typeof drive.company === 'object' ? drive.company?.companyName || drive.companyName || 'Unknown Company' : drive.company || drive.companyName || 'Unknown Company'}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-gray-600" />
                    <span>Posted {drive.createdAt ? new Date(drive.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '-'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditDrive(drive)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors border border-transparent hover:border-white/10"
                    title="Edit Drive"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeletingDriveId(drive._id)}
                    className="p-2 text-red-400 hover:bg-red-500/10 hover:border-red-500/20 border border-transparent rounded-lg transition-colors"
                    title="Delete Drive"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 p-4 rounded-lg bg-black/20 border border-white/5">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Package</p>
                  <p className="font-semibold text-white flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    {typeof drive.ctc === 'object' ? drive.ctc?.value || 'N/A' : drive.ctc || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Location</p>
                  <p className="font-semibold text-white flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-400" />
                    {typeof drive.location === 'object' ? drive.location?.name || 'N/A' : drive.location || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Deadline</p>
                  <p className="font-semibold text-white flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-orange-400" />
                    {formatDate(drive.deadline)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Applicants</p>
                  <p className="font-semibold text-white flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-full border border-purple-400 flex items-center justify-center text-[8px] text-purple-400 font-bold">A</span>
                    {Array.isArray(drive.applicants) ? drive.applicants.length : 0}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs text-gray-500 uppercase tracking-wider mr-2">Eligibility:</span>
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-white/5 text-gray-300 border border-white/10">
                  CGPA &ge; {drive.eligibility?.minCGPA ?? '-'}
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-white/5 text-gray-300 border border-white/10">
                  Backlogs &le; {drive.eligibility?.maxBacklogs ?? '-'}
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-white/5 text-gray-300 border border-white/10">
                  {typeof drive.workMode === 'object' ? drive.workMode?.name || 'N/A' : drive.workMode || 'N/A'}
                </span>
                {drive.eligibility?.allowedBranches && Array.isArray(drive.eligibility.allowedBranches) && drive.eligibility.allowedBranches.slice(0, 3).map((branch: string, index: number) => (
                  <span
                    key={`branch-${drive._id}-${index}-${branch}`}
                    className="px-2 py-0.5 rounded text-xs font-medium bg-white/5 text-gray-300 border border-white/10"
                  >
                    {branch}
                  </span>
                ))}
                {drive.eligibility?.allowedBranches?.length > 3 && (
                  <span className="text-xs text-gray-500">+{drive.eligibility.allowedBranches.length - 3} more</span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default DrivesSection; 