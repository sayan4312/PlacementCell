import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, CheckCircle, XCircle } from 'lucide-react';
import { saveAs } from 'file-saver';

interface ApplicationsSectionProps {
  applications: any[];
  applicationSearch: string;
  setApplicationSearch: (val: string) => void;
  applicationStatusFilter: string;
  setApplicationStatusFilter: (val: string) => void;
  getStatusColor: (status: string) => string;
  handleApplicationStatus: (appId: string, status: string) => void;
  applicationActionLoading: string | null;
  tpoProfile: any; // Add tpoProfile as a prop
}

const ApplicationsSection: React.FC<ApplicationsSectionProps> = ({ applications, tpoProfile, ...props }) => {
  // Filter applications by TPO's department
  const filteredApplications = applications.filter(app => app.student?.branch === tpoProfile?.department);

  // Company filter state
  const [companyFilter, setCompanyFilter] = useState('all');

  // Get unique companies from applications
  const uniqueCompanies = Array.from(new Set(filteredApplications.map(app => app.drive?.companyName || app.drive?.company?.companyName || app.companyName || 'Unknown Company')));

  // CSV Export Handler
  const handleExportCSV = () => {
    const headers = ['Application ID', 'Student Name', 'Email', 'Status'];
    const rows = filteredApplications.map(app => [
      app._id,
      app.student?.name || '',
      app.student?.email || '',
      app.status === 'pending' ? 'Applied' : app.status
    ]);
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'applicants.csv');
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2 space-x-2">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Student Applications</h3>
        <div className="flex gap-2">
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 focus:outline-none"
            onClick={handleExportCSV}
          >
            Export Applicants
          </button>
          <label className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 focus:outline-none cursor-pointer">
            Import Shortlist
            <input
              type="file"
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              style={{ display: 'none' }}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const formData = new FormData();
                formData.append('file', file);
                await fetch('/api/applications/import-shortlist', {
                  method: 'POST',
                  body: formData,
                  credentials: 'include'
                });
                window.location.reload();
              }}
            />
          </label>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <input
          type="text"
          placeholder="Search applications..."
          value={props.applicationSearch}
          onChange={e => props.setApplicationSearch(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
        />
        <select
          value={props.applicationStatusFilter}
          onChange={e => props.setApplicationStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-w-[160px]"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="shortlisted">Shortlisted</option>
          <option value="rejected">Rejected</option>
        </select>
        <select
          value={companyFilter}
          onChange={e => setCompanyFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-w-[160px]"
        >
          <option value="all">All Companies</option>
          {uniqueCompanies.map(company => (
            <option key={company} value={company}>{company}</option>
          ))}
        </select>
      </div>
      <div>
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase">Name</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase">Branch</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase">CGPA</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase">Position</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase">Company</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase">Applied Date</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
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
              <tr key={app._id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <td className="px-4 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <img
                    src={app.student?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(app.student?.name || 'Student')}&background=random&color=fff&bold=true&rounded=true`}
                    alt={app.student?.name || 'Student'}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span>{app.student?.name || 'Unknown Student'}</span>
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100">{app.student?.branch || 'N/A'}</td>
                <td className="px-4 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100">{app.student?.cgpa ?? 'N/A'}</td>
                <td className="px-4 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100">{app.drive?.position || app.position || 'Unknown Position'}</td>
                <td className="px-4 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100">{app.drive?.companyName || app.drive?.company?.companyName || app.companyName || 'Unknown Company'}</td>
                <td className="px-4 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100">{formatDate(app.appliedAt)}</td>
                <td className="px-4 py-2 whitespace-nowrap">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    app.status === 'applied' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                    app.status === 'pending' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' :
                    app.status === 'shortlisted' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    app.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  }`}>
                    {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ApplicationsSection; 