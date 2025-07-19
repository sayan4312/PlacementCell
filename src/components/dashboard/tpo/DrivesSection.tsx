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
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Job Drives</h3>
        <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors" onClick={() => { initializeDriveForm(); setEditingDrive(null); setShowDriveModal(true); }}>
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
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
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
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start space-x-4">
                <div>
                  <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-blue-500 mr-1" />
                    {typeof drive.position === 'object' ? drive.position?.name || drive.position?.title || 'Unknown Position' : drive.position || 'Unknown Position'}
                  </h4>
                  <p className="text-base font-semibold text-blue-700 dark:text-blue-300 mb-1 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-purple-500 mr-1" />
                    {typeof drive.company === 'object' ? drive.company?.companyName || drive.companyName || 'Unknown Company' : drive.company || drive.companyName || 'Unknown Company'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
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
                  <p className="text-sm text-gray-500 dark:text-gray-400">Package</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {typeof drive.ctc === 'object' ? drive.ctc?.value || 'N/A' : drive.ctc || 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {typeof drive.location === 'object' ? drive.location?.name || 'N/A' : drive.location || 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Deadline</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{formatDate(drive.deadline)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="inline-block w-4 h-4" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Applications</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{Array.isArray(drive.applicants) ? drive.applicants.length : 0}</p>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Eligibility Criteria</h5>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-md text-sm">
                  Min CGPA: {drive.eligibility?.minCGPA ?? '-'}
                </span>
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-md text-sm">
                  Max Backlogs: {drive.eligibility?.maxBacklogs ?? '-'}
                </span>
                <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-md text-sm">
                  {typeof drive.workMode === 'object' ? drive.workMode?.name || 'N/A' : drive.workMode || 'N/A'}
                </span>
                {drive.eligibility?.allowedBranches && Array.isArray(drive.eligibility.allowedBranches) && drive.eligibility.allowedBranches.map((branch: string, index: number) => (
                  <span
                    key={`branch-${drive._id}-${index}-${branch}`}
                    className="px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded-md text-sm"
                  >
                    {branch}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Posted on {drive.createdAt ? new Date(drive.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
              </span>
              <div className="flex items-center space-x-2">
                <button className="px-3 py-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" onClick={() => handleEditDrive(drive)}>
                  Edit
                </button>
                <button className="px-3 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" onClick={() => setDeletingDriveId(drive._id)}>
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