import React, { useState } from 'react';
import { saveAs } from 'file-saver';
import Toast from '../student/Toast';

interface ApplicationsSectionProps {
  applications: any[];
  applicationSearch: string;
  setApplicationSearch: (val: string) => void;
  applicationStatusFilter: string;
  setApplicationStatusFilter: (val: string) => void;
  getStatusColor: (status: string) => string;
  handleApplicationStatus: (appId: string, status: string) => void;
  applicationActionLoading: string | null;
  tpoProfile: any;
  jobDrives: any[];
}

const ApplicationsSection: React.FC<ApplicationsSectionProps> = ({ applications, tpoProfile, jobDrives, ...props }) => {
  // Filter applications by TPO's department
  const filteredApplications = applications.filter(app => app.student?.branch === tpoProfile?.department);

  // Drive filter state for import/export
  const [selectedDriveId, setSelectedDriveId] = useState('all');

  // Company filter state
  const [companyFilter, setCompanyFilter] = useState('all');

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Get unique companies from applications
  const uniqueCompanies = Array.from(new Set(filteredApplications.map(app => app.drive?.companyName || app.drive?.company?.companyName || app.companyName || 'Unknown Company')));

  // CSV Export Handler (Drive-specific)
  const handleExportCSV = () => {
    const headers = ['Application ID', 'Student Name', 'Email', 'Status', 'Position', 'Company'];

    // Filter applications based on selected drive
    const applicationsToExport = filteredApplications
      .filter(app => selectedDriveId === 'all' || app.drive?._id === selectedDriveId)
      .filter(app => companyFilter === 'all' || (app.drive?.companyName || app.drive?.company?.companyName || app.companyName) === companyFilter)
      .filter(app => props.applicationStatusFilter === 'all' || app.status === props.applicationStatusFilter);

    const rows = applicationsToExport.map(app => [
      app._id,
      app.student?.name || '',
      app.student?.email || '',
      app.status === 'pending' ? 'Applied' : app.status,
      app.drive?.position || app.drive?.title || 'N/A',
      app.drive?.companyName || app.drive?.company?.companyName || app.companyName || 'N/A'
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    // Generate filename based on company name
    let fileName = 'applicants';
    if (selectedDriveId === 'all') {
      fileName = 'applicants-all-drives';
    } else {
      const selectedDrive = jobDrives.find(d => d._id === selectedDriveId);
      if (selectedDrive) {
        const companyName = selectedDrive.companyName || selectedDrive.company?.companyName || 'unknown-company';
        const position = selectedDrive.position || selectedDrive.title || '';
        // Clean company name and position for filename
        const cleanCompanyName = companyName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
        const cleanPosition = position.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
        fileName = `${cleanCompanyName}-${cleanPosition}-applicants`;
      } else {
        fileName = 'selected-drive-applicants';
      }
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${fileName}.csv`);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between mb-2 space-x-2">
        <h3 className="text-2xl font-bold text-white">Student Applications</h3>
        <div className="flex gap-2">
          <button
            className="btn-primary"
            onClick={handleExportCSV}
          >
            Export Applicants
          </button>
          <div className="relative group">
            <label className="inline-block btn-secondary cursor-pointer">
              Import Shortlist
              <input
                type="file"
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                style={{ display: 'none' }}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  if (selectedDriveId === 'all') {
                    setToast({ message: 'Please select a specific drive before importing shortlist', type: 'error' });
                    return;
                  }

                  const formData = new FormData();
                  formData.append('file', file);
                  formData.append('driveId', selectedDriveId);

                  try {
                    const token = localStorage.getItem('token');
                    const response = await fetch('/api/applications/import-shortlist', {
                      method: 'POST',
                      body: formData,
                      headers: {
                        'Authorization': `Bearer ${token}`
                      },
                      credentials: 'include'
                    });

                    if (response.ok) {
                      const result = await response.json();
                      const shortlisted = result.shortlisted || 0;
                      const selected = result.selected || 0;
                      const rejected = result.rejected || 0;
                      const errors = result.errors?.length || 0;

                      let message = 'Import completed! ';
                      if (shortlisted > 0) message += `Shortlisted: ${shortlisted}`;
                      if (selected > 0) message += `${shortlisted > 0 ? ', ' : ''}Selected: ${selected}`;
                      if (rejected > 0) message += `${shortlisted > 0 || selected > 0 ? ', ' : ''}Rejected: ${rejected}`;
                      if (errors > 0) message += `, ${errors} errors`;

                      setToast({ message, type: 'success' });
                      setTimeout(() => window.location.reload(), 2000); // Delay reload to show toast
                    } else {
                      const error = await response.json();
                      setToast({ message: `Import failed: ${error.message}`, type: 'error' });
                    }
                  } catch (error) {
                    setToast({ message: 'Import failed. Please try again.', type: 'error' });
                  }
                }}
              />
            </label>
            <div className="absolute bottom-full mb-2 left-0 bg-dark-bg border border-white/20 backdrop-blur-xl text-white text-xs rounded-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-80 pointer-events-none shadow-lg">
              <strong>Import Instructions:</strong>
              <br />• Use the same format as <strong>Export Applicants</strong>
              <br />• CSV columns: <strong>Application ID, Student Name, Email, Status, Position, Company</strong>
              <br />• Status can be <strong>"shortlisted"</strong> or <strong>"selected"</strong>
              <br />• Timeline progresses automatically with each import
              <br />• All other applications will be marked as <strong>rejected</strong>
            </div>
          </div>


        </div>
      </div>

      {/* Drive Selection Filter */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-4 mb-4">
          <label className="text-sm font-medium text-gray-300">
            Select Drive for Export/Import:
          </label>
          <select
            value={selectedDriveId}
            onChange={(e) => setSelectedDriveId(e.target.value)}
            className="input-glass"
          >
            <option value="all">All Drives</option>
            {jobDrives?.map((drive) => (
              <option key={drive._id} value={drive._id}>
                {drive.title} - {drive.companyName}
              </option>
            ))}
          </select>
          {selectedDriveId !== 'all' && (
            <span className="text-sm text-emerald-400">
              ✓ Drive selected for import/export
            </span>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <input
          type="text"
          placeholder="Search applications..."
          value={props.applicationSearch}
          onChange={e => props.setApplicationSearch(e.target.value)}
          className="input-glass"
        />
        <select
          value={props.applicationStatusFilter}
          onChange={e => props.setApplicationStatusFilter(e.target.value)}
          className="input-glass"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="shortlisted">Shortlisted</option>
          <option value="rejected">Rejected</option>
        </select>
        <select
          value={companyFilter}
          onChange={e => setCompanyFilter(e.target.value)}
          className="input-glass"
        >
          <option value="all">All Companies</option>
          {uniqueCompanies.map(company => (
            <option key={company} value={company}>{company}</option>
          ))}
        </select>
      </div>
      <div className="glass-card overflow-hidden">
        <table className="min-w-full divide-y divide-white/10">
          <thead>
            <tr className="bg-white/5">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Branch</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">CGPA</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Position</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Company</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Applied Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {filteredApplications.filter((app: any) => {
              const studentName = app.student?.name || '';
              const position = app.drive?.position || '';
              const company = app.drive?.companyName || app.drive?.company?.companyName || app.companyName || 'Unknown Company';
              // Filter by status, search, and company
              return (
                (props.applicationStatusFilter === 'all' ||
                  app.status === props.applicationStatusFilter) &&
                (companyFilter === 'all' || company === companyFilter) &&
                (studentName.toLowerCase().includes(props.applicationSearch.toLowerCase()) ||
                  position.toLowerCase().includes(props.applicationSearch.toLowerCase()) ||
                  company.toLowerCase().includes(props.applicationSearch.toLowerCase()))
              );
            }).map((app: any) => (
              <tr key={app._id} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap text-white flex items-center gap-2">
                  <img
                    src={app.student?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(app.student?.name || 'Student')}&background=random&color=fff&bold=true&rounded=true`}
                    alt={app.student?.name || 'Student'}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span>{app.student?.name || 'Unknown Student'}</span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-gray-300">{app.student?.branch || 'N/A'}</td>
                <td className="px-4 py-3 whitespace-nowrap text-gray-300">{app.student?.cgpa ?? 'N/A'}</td>
                <td className="px-4 py-3 whitespace-nowrap text-gray-300">{app.drive?.position || app.position || 'Unknown Position'}</td>
                <td className="px-4 py-3 whitespace-nowrap text-gray-300">{app.drive?.companyName || app.drive?.company?.companyName || app.companyName || 'Unknown Company'}</td>
                <td className="px-4 py-3 whitespace-nowrap text-gray-300">{formatDate(app.appliedAt)}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${app.status === 'applied' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                      app.status === 'pending' ? 'bg-gray-500/20 text-gray-300 border border-gray-500/30' :
                        app.status === 'shortlisted' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          app.status === 'rejected' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                            'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                    }`}>
                    {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Toast notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default ApplicationsSection; 