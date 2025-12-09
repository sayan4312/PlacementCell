import React, { useEffect, useState } from 'react';
import apiClient from '../../../services/apiClient';
import { motion } from 'framer-motion';

interface Company {
  _id: string;
  name: string;
  contactInfo?: string;
  notes?: string;
  createdAt?: string;
  driveDetailsPdf?: string;
}

interface Drive {
  _id: string;
  title: string;
  company: string;
  position: string;
  ctc: string;
  deadline: string;
  status: string;
  applications?: Application[];
}

interface Application {
  _id: string;
  student: {
    _id: string;
    name: string;
    email: string;
    rollNo: string;
    branch: string;
    year: string;
  };
  drive: string;
  status: string;
  appliedAt: string;
}

const CompaniesSection: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [form, setForm] = useState({ name: '', contactInfo: '', notes: '' });
  const [formError, setFormError] = useState('');
  
  // New state for company details
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companyDrives, setCompanyDrives] = useState<Drive[]>([]);
  const [companyApplicants, setCompanyApplicants] = useState<Application[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'drives' | 'applicants'>('drives');

  const fetchCompanies = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get('/companies');
      setCompanies(res.data.companies || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const openAddModal = () => {
    setEditingCompany(null);
    setForm({ name: '', contactInfo: '', notes: '' });
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (company: Company) => {
    setEditingCompany(company);
    setForm({ name: company.name, contactInfo: company.contactInfo || '', notes: company.notes || '' });
    setFormError('');
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this company?')) return;
    setLoading(true);
    try {
      await apiClient.delete(`/companies/${id}`);
      fetchCompanies();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to delete company');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!form.name.trim()) {
      setFormError('Company name is required');
      return;
    }
    setLoading(true);
    try {
      if (editingCompany) {
        await apiClient.put(`/companies/${editingCompany._id}`, form);
      } else {
        await apiClient.post('/companies', form);
      }
      setShowModal(false);
      fetchCompanies();
    } catch (err: any) {
      setFormError(err?.response?.data?.message || 'Failed to save company');
    } finally {
      setLoading(false);
    }
  };

  const openCompanyDetails = async (company: Company) => {
    setSelectedCompany(company);
    setShowDetailsModal(true);
    setActiveTab('drives');
    await fetchCompanyDetails(company.name);
  };

  const fetchCompanyDetails = async (companyName: string) => {
    setDetailsLoading(true);
    try {
      // Fetch drives for this company
      const drivesRes = await apiClient.get(`/drives?company=${encodeURIComponent(companyName)}`);
      setCompanyDrives((drivesRes.data.drives || []) as Drive[]);

      // Fetch all applications for this company's drives
      const applicationsRes = await apiClient.get(`/applications?company=${encodeURIComponent(companyName)}`);
      setCompanyApplicants(applicationsRes.data.applications || []);
    } catch (err: any) {
      console.error('Failed to fetch company details:', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-white mb-1">Companies</h3>
          <p className="text-sm text-gray-400">
            Manage company records and view their placement activities
          </p>
        </div>
        <button className="btn-primary px-6" onClick={openAddModal}>
          + Add Company
        </button>
      </div>

      {error && (
        <div className="glass-card border-l-4 border-red-500 p-4 bg-red-500/10">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Company Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Contact Info
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Notes
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {companies.map((company, index) => (
                  <motion.tr
                    key={company._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">{company.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">{company.contactInfo || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-300 max-w-xs truncate">
                        {company.notes || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-lg text-green-700 bg-green-100 hover:bg-green-200 dark:text-green-300 dark:bg-green-900/30 dark:hover:bg-green-900/50 transition-colors"
                        onClick={() => openCompanyDetails(company)}
                      >
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Details
                      </button>
                      <button
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-lg text-blue-700 bg-blue-100 hover:bg-blue-200 dark:text-blue-300 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 transition-colors"
                        onClick={() => openEditModal(company)}
                      >
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                      <button
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-lg text-red-700 bg-red-100 hover:bg-red-200 dark:text-red-300 dark:bg-red-900/30 dark:hover:bg-red-900/50 transition-colors"
                        onClick={() => handleDelete(company._id)}
                      >
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </td>
                  </motion.tr>
                ))}
                {companies.length === 0 && !loading && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="text-gray-500 dark:text-gray-400">
                        <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <p className="text-lg font-medium">No companies found</p>
                        <p className="text-sm">Get started by adding your first company.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal for add/edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card w-full max-w-md relative border border-white/10 max-h-[90vh] flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">
                {editingCompany ? 'Edit Company' : 'Add Company'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Company Name *
                </label>
                <input
                  type="text"
                  className="input-glass"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Enter company name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Contact Information
                </label>
                <input
                  type="text"
                  className="input-glass"
                  value={form.contactInfo}
                  onChange={e => setForm({ ...form, contactInfo: e.target.value })}
                  placeholder="Email, phone, or address"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Notes
                </label>
                <textarea
                  className="input-glass resize-none"
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  placeholder="Additional notes about the company"
                  rows={3}
                />
              </div>
              
              {formError && (
                <div className="glass-card border-l-4 border-red-500 p-4 bg-red-500/10">
                  <p className="text-sm text-red-400">{formError}</p>
                </div>
              )}
              
              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {editingCompany ? 'Updating...' : 'Adding...'}
                    </div>
                  ) : (
                    editingCompany ? 'Update Company' : 'Add Company'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Company Details Modal */}
      {showDetailsModal && selectedCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-7xl h-5/6 p-6 relative overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {selectedCompany.name}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Company Details & Analytics
                  </p>
                  {selectedCompany.driveDetailsPdf && (
                    <a
                      href={selectedCompany.driveDetailsPdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center mt-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all text-sm font-semibold shadow-lg hover:shadow-xl"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 16v-8m0 8l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      View Drive Details PDF
                    </a>
                  )}
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Tab Navigation */}
              <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                <button
                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                    activeTab === 'drives'
                      ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                  onClick={() => setActiveTab('drives')}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                    </svg>
                    <span>Drives ({companyDrives.length})</span>
                  </div>
                </button>
                {/* Remove the Applicants tab button */}
              </div>

              {/* Content Area */}
              <div className="overflow-y-auto h-full pr-2">
                {detailsLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <>
                    {activeTab === 'drives' && (
                      <div className="space-y-4">
                        {companyDrives.length === 0 ? (
                          <div className="text-center py-12">
                            <svg className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                            </svg>
                            <p className="text-lg font-medium text-gray-900 dark:text-white">No drives found</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">This company hasn't posted any job drives yet.</p>
                          </div>
                        ) : (
                          <div className="grid gap-4">
                            {companyDrives.map((drive: Drive) => {
                              const driveApplicants = companyApplicants.filter(app =>
                                typeof app.drive === 'string'
                                  ? app.drive === drive._id
                                  : (app.drive && typeof app.drive === 'object' && '_id' in app.drive && (app.drive as { _id: string })._id === drive._id)
                              );
                              return (
                                <motion.div
                                  key={drive._id}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: 0.05 }}
                                >
                                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all">
                                    <div className="flex justify-between items-start">
                                      <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{drive.title}</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                          <div>
                                            <p className="text-gray-600 dark:text-gray-400">
                                              <span className="font-medium">Position:</span> {drive.position}
                                            </p>
                                            <p className="text-gray-600 dark:text-gray-400">
                                              <span className="font-medium">Package:</span> {drive.ctc ? drive.ctc : 'N/A'}
                                            </p>
                                          </div>
                                          <div>
                                            <p className="text-gray-600 dark:text-gray-400">
                                              <span className="font-medium">Deadline:</span> {new Date(drive.deadline).toLocaleDateString()}
                                            </p>
                                            <p className="text-gray-600 dark:text-gray-400">
                                              <span className="font-medium">Status:</span> {drive.status}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="mt-2 text-sm text-blue-600 dark:text-blue-300 font-semibold">
                                          Applicants: {driveApplicants.length}
                                        </div>
                                        {driveApplicants.length > 0 && (
                                          <button
                                            onClick={() => {
                                              const csvData = [
                                                ['Name', 'Email', 'Roll No', 'Branch', 'Year', 'Status', 'Applied Date'],
                                                ...driveApplicants.map(app => [
                                                  app.student.name,
                                                  app.student.email,
                                                  app.student.rollNo,
                                                  app.student.branch,
                                                  app.student.year,
                                                  app.status,
                                                  new Date(app.appliedAt).toLocaleDateString()
                                                ])
                                              ];
                                              const csvContent = csvData.map(row => row.join(',')).join('\n');
                                              const blob = new Blob([csvContent], { type: 'text/csv' });
                                              const url = window.URL.createObjectURL(blob);
                                              const a = document.createElement('a');
                                              a.href = url;
                                              a.download = `${selectedCompany?.name}_${drive.title}_applicants.csv`;
                                              document.body.appendChild(a);
                                              a.click();
                                              document.body.removeChild(a);
                                              window.URL.revokeObjectURL(url);
                                            }}
                                            className="mt-2 inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                          >
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            Export Applicants (CSV)
                                          </button>
                                        )}
                                      </div>
                                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                        drive.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                        drive.status === 'completed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                      }`}>
                                        {drive.status}
                                      </span>
                                    </div>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Remove the Applicants tab content */}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default CompaniesSection; 