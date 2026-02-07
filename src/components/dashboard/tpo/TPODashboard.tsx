import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Briefcase,
  Plus,
  Calendar,
  MapPin,
  DollarSign,
  ExternalLink,
  TrendingUp,
  Building2,
  BarChart3,
  FileText,
  Bell,
  UserPlus,
  Shield,
  X,
  ChevronDown,
  Filter,
  CheckCircle
} from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { PieChart, Pie, Cell } from 'recharts';
import apiClient from '../../../services/apiClient';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DrivesSection from './DrivesSection';
import InternshipsSection from './InternshipsSection';
import ApplicationsSection from './ApplicationsSection';
import StudentsSection from './StudentsSection';
import NotificationsSection from './NotificationsSection';
import OverviewSection from './OverviewSection';
import { useLocation } from 'react-router-dom';
import OfferVerificationTable from '../../offers/OfferVerificationTable';

// Add these above the component
const YEAR_OPTIONS = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
];

// Add hardcoded DEPARTMENTS array
const DEPARTMENTS = [
  'Computer Science',
  'Information Technology',
  'Electronics & Communication',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Data Science',
  'AIML'
];

const CompaniesList: React.FC = () => {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    setLoading(true);
    setError('');
    apiClient.get('/companies')
      .then(res => setCompanies(res.data.companies || []))
      .catch(() => setError('Failed to load companies'))
      .finally(() => setLoading(false));
  }, []);
  if (loading) return <div className="py-8 text-center text-white/70">Loading companies...</div>;
  if (error) return <div className="py-8 text-center text-red-400">{error}</div>;
  if (!companies.length) return <div className="py-8 text-center text-white/50">No companies found.</div>;
  return (
    <div className="glass-card p-6 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-6 py-4 text-left text-xs font-semibold text-white/90 uppercase tracking-wider">Name</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-white/90 uppercase tracking-wider">Contact Info</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-white/90 uppercase tracking-wider">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {companies.map(company => (
              <tr key={company._id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{company.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">{company.contactInfo || '-'}</td>
                <td className="px-6 py-4 text-sm text-white/70">{company.notes || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const TPODashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // State variables for backend data
  const [stats, setStats] = useState<any[]>([]);
  const [tpoProfile, setTpoProfile] = useState<any>(null);
  const [jobDrives, setJobDrives] = useState<any[]>([]);
  const [internships, setInternships] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [placementTrends, setPlacementTrends] = useState<any[]>([]);
  const [branchWiseApplications, setBranchWiseApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [editingDrive, setEditingDrive] = useState<any>(null);
  const [driveForm, setDriveForm] = useState({
    companyName: '',
    position: '',
    description: '',
    ctc: '',
    location: '',
    deadline: '',
    eligibility: {
      minCGPA: '',
      allowedBranches: [] as string[],
      maxBacklogs: '',
      minYear: ''
    },
    workMode: 'On-site',
    logo: '',
    externalApplicationUrl: ''
  });
  const [driveModalError, setDriveModalError] = useState('');
  const [deletingDriveId, setDeletingDriveId] = useState<string | null>(null);
  const [isSubmittingDrive, setIsSubmittingDrive] = useState(false);

  // --- INTERNSHIP STATE ---
  const [showInternshipModal, setShowInternshipModal] = useState(false);
  const [editingInternship, setEditingInternship] = useState<any>(null);
  const [internshipForm, setInternshipForm] = useState({
    title: '',
    company: '',
    description: '',
    externalLink: ''
  });
  const [internshipModalError, setInternshipModalError] = useState('');
  const [deletingInternshipId, setDeletingInternshipId] = useState<string | null>(null);

  const [applicationActionLoading, setApplicationActionLoading] = useState<string | null>(null);

  // --- SEARCH/FILTER STATE ---
  const [driveSearch, setDriveSearch] = useState('');
  const [internshipSearch, setInternshipSearch] = useState('');
  const [applicationSearch, setApplicationSearch] = useState('');
  const [applicationStatusFilter, setApplicationStatusFilter] = useState('all');

  // Active Drives filter state
  const [activeDrivesFilter, setActiveDrivesFilter] = useState('all');
  const [showActiveDrivesDropdown, setShowActiveDrivesDropdown] = useState(false);
  const [showAllActiveDrives, setShowAllActiveDrives] = useState(false);

  // 1. Add state for students, showStudentModal, studentForm, studentModalError
  const [students, setStudents] = useState<any[]>([]);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [studentForm, setStudentForm] = useState({
    name: '',
    email: '',
    studentId: '',
    branch: '',
    year: '',
    cgpa: '',
    backlogs: '',
    phone: '',
    address: ''
  });
  const [studentModalError, setStudentModalError] = useState('');

  // --- NOTIFICATION STATE ---
  const [notifications, setNotifications] = useState<any[]>([]);

  // Add state for companies
  const [companies, setCompanies] = useState<any[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [companiesError, setCompaniesError] = useState('');



  const location = useLocation();

  useEffect(() => {
    setLoading(true);
    setError('');
    Promise.all([
      apiClient.get('/users/me'),
      apiClient.get('/drives'),
      apiClient.get('/applications'),
      apiClient.get('/analytics/tpo-dashboard-stats'),
      apiClient.get('/analytics/placement-trends'),
      apiClient.get('/analytics/applications-by-branch'),
      apiClient.get('/notifications'),
    ])
      .then(([profileRes, drivesRes, applicationsRes, dashboardStatsRes, trendsRes, branchAppsRes, notificationsRes]) => {
        const profile = profileRes.data?.user || profileRes.data;
        const drives = Array.isArray(drivesRes.data?.drives) ? drivesRes.data.drives : [];
        const applications = Array.isArray(applicationsRes.data?.applications) ? applicationsRes.data.applications : [];
        setTpoProfile(profile);
        setJobDrives(drives);
        setApplications(applications);
        setPlacementTrends(trendsRes.data?.trends || []);
        setBranchWiseApplications(branchAppsRes.data?.branchApplications || []);
        setNotifications(notificationsRes.data?.notifications || []);
        // Map dashboard stats to stats array for OverviewSection
        const dash = dashboardStatsRes.data;
        setStats([
          { label: 'Total Drives', value: dash.totalDrives, description: 'All job drives managed', color: 'blue', change: '', icon: Briefcase },
          { label: 'Total Applications', value: dash.totalApplications, description: 'All student applications', color: 'purple', change: '', icon: FileText },
          { label: 'Total Students', value: dash.totalStudents, description: 'Registered students', color: 'green', change: '', icon: UserPlus },
        ]);
      })
      .catch(() => {
        setError('Failed to load dashboard data.');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (showActiveDrivesDropdown) {
        setShowActiveDrivesDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showActiveDrivesDropdown]);

  // Utility function to filter valid applications
  const filterValidApplications = (applications: any[]) => {
    return applications.filter((app: any) => {
      const hasValidPosition = app.drive?.position && app.drive.position !== "Unknown Position";
      const hasValidCompany = (app.drive?.companyName && app.drive.companyName !== "Unknown Company") ||
        (app.company?.companyName && app.company.companyName !== "Unknown Company");
      return hasValidPosition && hasValidCompany;
    });
  };

  // 2. Fetch students (department-wise)
  const fetchStudents = async () => {
    try {
      const res = await apiClient.get('/users/role/student');
      const users = Array.isArray(res.data?.users) ? res.data.users : [];
      tpoProfile && setStudents(users.filter((s: any) => s && s.branch === tpoProfile.department));
    } catch {
      toast.error('Failed to fetch students');
    }
  };

  // 3. Add Student handler
  const handleAddStudent = async () => {
    setStudentModalError('');
    try {
      await apiClient.post('/users/student', { ...studentForm, branch: tpoProfile?.department });
      toast.success('Student created successfully!');
      setShowStudentModal(false);
      setStudentForm({ name: '', email: '', studentId: '', branch: '', year: '', cgpa: '', backlogs: '', phone: '', address: '' });
      fetchStudents();
    } catch (err: any) {
      setStudentModalError(err?.response?.data?.message || 'Failed to create student.');
      toast.error('Failed to create student.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'closed': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // Add the initializeDriveForm function
  const initializeDriveForm = () => {
    setDriveForm({
      companyName: '',
      position: '',
      description: '',
      ctc: '',
      location: '',
      deadline: '',
      eligibility: {
        minCGPA: '',
        allowedBranches: [],
        maxBacklogs: '',
        minYear: ''
      },
      workMode: 'On-site',
      logo: '',
      externalApplicationUrl: ''
    });
  };

  // Update handleDriveSubmit to send companyName
  const handleDriveSubmit = async () => {
    setIsSubmittingDrive(true);
    setDriveModalError('');
    try {
      if (editingDrive) {
        await apiClient.put(`/drives/${editingDrive._id}`, {
          companyName: driveForm.companyName,
          position: driveForm.position,
          description: driveForm.description,
          ctc: driveForm.ctc,
          location: driveForm.location,
          deadline: driveForm.deadline,
          eligibility: driveForm.eligibility,
          workMode: driveForm.workMode,
          logo: driveForm.logo,
          externalApplicationUrl: driveForm.externalApplicationUrl
        });
        toast.success('Drive updated successfully!');
      } else {
        await apiClient.post('/drives', {
          companyName: driveForm.companyName,
          position: driveForm.position,
          description: driveForm.description,
          ctc: driveForm.ctc,
          location: driveForm.location,
          deadline: driveForm.deadline,
          eligibility: driveForm.eligibility,
          workMode: driveForm.workMode,
          logo: driveForm.logo,
          externalApplicationUrl: driveForm.externalApplicationUrl
        });
        toast.success('Drive created successfully!');
      }
      setShowDriveModal(false);
      setEditingDrive(null);
      setTimeout(() => {
        fetchDrives();
      }, 500);
    } catch (err) {
      const errorMsg =
        (err && typeof err === 'object' && 'response' in err && (err as any).response?.data?.message) ||
        (err instanceof Error && err.message) ||
        'Failed to save drive.';
      setDriveModalError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSubmittingDrive(false);
    }
  };

  const handleDeleteDrive = async (id: string) => {
    try {
      await apiClient.delete(`/drives/${id}`);
      toast.success('Drive deleted successfully!');
      setDeletingDriveId(null);
      fetchDrives();
    } catch (err) {
      toast.error('Failed to delete drive.');
    }
  };

  const fetchDrives = async () => {
    try {
      console.log('Fetching drives...');
      const res = await apiClient.get('/drives');
      console.log('Drives response:', res.data);
      const drives = Array.isArray(res.data?.drives) ? res.data.drives : [];
      setJobDrives(drives);
    } catch (err) {
      console.error('Error fetching drives:', err);
      toast.error('Failed to fetch drives.');
      // Don't let the error crash the component
      setJobDrives([]);
    }
  };

  const fetchInternships = async () => {
    try {
      const res = await apiClient.get('/internships');
      const internships = Array.isArray(res.data?.internships) ? res.data.internships : [];
      setInternships(internships);
    } catch {
      toast.error('Failed to fetch internships');
    }
  };

  const handleInternshipSubmit = async () => {
    setInternshipModalError('');
    try {
      // Only send required fields
      const payload = {
        title: internshipForm.title.trim(),
        company: internshipForm.company.trim(),
        description: internshipForm.description.trim(),
        externalLink: internshipForm.externalLink.trim(),
      };
      if (editingInternship) {
        await apiClient.put(`/internships/${editingInternship._id}`, payload);
        toast.success('Internship updated successfully');
      } else {
        await apiClient.post('/internships', payload);
        toast.success('Internship created successfully');
      }
      setShowInternshipModal(false);
      setEditingInternship(null);
      setInternshipForm({ title: '', company: '', description: '', externalLink: '' });
      fetchInternships();
    } catch (err: any) {
      setInternshipModalError(err?.response?.data?.message || 'Failed to save internship');
    }
  };

  const handleDeleteInternship = async (id: string) => {
    try {
      await apiClient.delete(`/internships/${id}`);
      toast.success('Internship deleted');
      fetchInternships();
    } catch {
      toast.error('Failed to delete internship');
    }
    setDeletingInternshipId(null);
  };

  const handleApplicationStatus = async (appId: string, status: string) => {
    setApplicationActionLoading(appId + status);
    try {
      await apiClient.patch(`/applications/${appId}/status`, { status });
      toast.success(`Application ${status}`);
      fetchApplications();
    } catch {
      toast.error('Failed to update application status');
    }
    setApplicationActionLoading(null);
  };

  const fetchApplications = async () => {
    try {
      const res = await apiClient.get('/applications');
      const applications = Array.isArray(res.data?.applications) ? res.data.applications : [];
      setApplications(applications);
    } catch {
      toast.error('Failed to fetch applications');
    }
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* TPO Profile Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-6">
            <img
              src={tpoProfile?.avatar || 'https://ui-avatars.com/api/?name=TPO'}
              alt={tpoProfile?.name || 'TPO'}
              className="w-20 h-20 rounded-full object-cover border-4 border-white/20 bg-gray-200"
            />
            <div>
              <h2 className="text-3xl font-bold mb-2 drop-shadow-sm">{tpoProfile?.name || 'TPO Name'}</h2>
              <p className="text-blue-100 text-lg mb-2">{tpoProfile?.department || 'Department'}</p>
              <p className="text-blue-100">{tpoProfile?.experience || 'Experience'} experience • {tpoProfile?.qualification || 'Qualification'}</p>
            </div>
          </div>
          <div className="text-right min-w-[120px]">
            <p className="text-blue-100 text-sm">Total Drives Managed</p>
            <p className="text-3xl font-bold">{stats?.[0]?.value || 0}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.length === 0 ? (
          <div className="col-span-4 text-center text-gray-400 dark:text-gray-500 py-8">No stats available.</div>
        ) : stats.map((stat: any, index: number) => (
          <motion.div
            key={`stat-${index}-${stat.label}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow flex flex-col gap-2"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-full bg-${stat.color}-100 dark:bg-${stat.color}-900 flex items-center justify-center`}>
                {stat.icon && React.createElement(stat.icon, { className: `h-6 w-6 text-${stat.color}-600 dark:text-${stat.color}-400` })}
              </div>
              <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                {stat.change}
              </span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {stat.value}
              </p>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                {stat.label}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {stat.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Placement Trends</h3>
          {placementTrends.length === 0 ? (
            <div className="text-center text-gray-400 dark:text-gray-500 py-12">No data available.</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={placementTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke="#8884d8" />
                <YAxis stroke="#8884d8" />
                <Tooltip />
                <Line type="monotone" dataKey="drives" stroke="#3B82F6" strokeWidth={2} name="Job Drives" />
                <Line type="monotone" dataKey="placements" stroke="#10B981" strokeWidth={2} name="Placements" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Applications by Branch</h3>
          {branchWiseApplications.length === 0 ? (
            <div className="text-center text-gray-400 dark:text-gray-500 py-12">No data available.</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={branchWiseApplications}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={(props: any) => `${props.name}: ${props.value || 0}`}
                >
                  {branchWiseApplications.map((entry: any, index: number) => (
                    <Cell key={`cell-${entry.name || index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Applications</h3>
          {(() => {
            // Filter out applications with unknown position or company
            const validApplications = filterValidApplications(applications);

            return validApplications.length === 0 ? (
              <div className="text-center text-gray-400 dark:text-gray-500 py-8">No recent applications.</div>
            ) : (
              <div className="space-y-4">
                {validApplications.slice(0, 3).map((app: any) => (
                  <div key={app._id || app.id || `app-${Math.random()}`} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <img
                        src={app.avatar || 'https://ui-avatars.com/api/?name=Student'}
                        alt={app.studentName}
                        className="w-10 h-10 rounded-full object-cover bg-gray-200"
                      />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {app.student?.name || "Unknown Student"}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {app.drive?.position} at {app.drive?.companyName || app.company?.companyName}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                      {app.status}
                    </span>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Active Drives</h3>
            <div className="relative">
              <button
                onClick={() => setShowActiveDrivesDropdown(!showActiveDrivesDropdown)}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <Filter className="w-4 h-4" />
                <span className="text-sm">
                  {activeDrivesFilter === 'all' ? 'All Drives' :
                    activeDrivesFilter === 'high-ctc' ? 'High CTC' :
                      activeDrivesFilter === 'recent' ? 'Recent' : 'Most Applications'}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showActiveDrivesDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showActiveDrivesDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                  <div className="py-2">
                    {[
                      { value: 'all', label: 'All Drives' },
                      { value: 'high-ctc', label: 'High CTC (>10L)' },
                      { value: 'recent', label: 'Recently Posted' },
                      { value: 'most-applications', label: 'Most Applications' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setActiveDrivesFilter(option.value);
                          setShowActiveDrivesDropdown(false);
                        }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${activeDrivesFilter === option.value ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                          }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {(() => {
            let filteredDrives = jobDrives.filter((drive: any) => drive.status === 'active');

            // Apply additional filtering based on dropdown selection
            switch (activeDrivesFilter) {
              case 'high-ctc':
                filteredDrives = filteredDrives.filter((drive: any) => {
                  const ctcValue = parseInt(drive.ctc?.replace(/[^\d]/g, '') || '0');
                  return ctcValue >= 1000000; // 10L+ 
                });
                break;
              case 'recent':
                filteredDrives = filteredDrives.sort((a: any, b: any) =>
                  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
                break;
              case 'most-applications':
                filteredDrives = filteredDrives.sort((a: any, b: any) =>
                  (Array.isArray(b.applicants) ? b.applicants.length : 0) -
                  (Array.isArray(a.applicants) ? a.applicants.length : 0)
                );
                break;
              default:
                // 'all' - no additional filtering
                break;
            }

            const drivesToShow = showAllActiveDrives ? filteredDrives : filteredDrives.slice(0, 3);
            const hasMoreDrives = filteredDrives.length > 3;

            return filteredDrives.length === 0 ? (
              <div className="text-center text-gray-400 dark:text-gray-500 py-8">
                {activeDrivesFilter === 'all' ? 'No active drives.' : `No drives match the selected filter.`}
              </div>
            ) : (
              <div className="space-y-4">
                {drivesToShow.map((drive: any) => (
                  <motion.div
                    key={drive._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 flex items-center justify-between shadow-sm border border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex items-center space-x-4">
                      <img
                        src={drive.logo || 'https://ui-avatars.com/api/?name=Company&background=random'}
                        alt={drive.company?.companyName || drive.companyName || 'Company'}
                        className="w-12 h-12 rounded object-cover bg-gray-200"
                      />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-gray-900 dark:text-white text-base">{drive.companyName}</span>
                          <span className="text-xs px-2 py-1 rounded-full font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">{drive.status}</span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">{drive.position}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 flex space-x-2 mt-1">
                          <span>CTC: {drive.ctc}</span>
                          <span>•</span>
                          <span>{drive.location}</span>
                          <span>•</span>
                          <span>Applications: {Array.isArray(drive.applicants) ? drive.applicants.length : 0}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {hasMoreDrives && (
                  <button
                    onClick={() => setShowAllActiveDrives(!showAllActiveDrives)}
                    className="w-full py-3 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-center space-x-2 text-gray-700 dark:text-gray-300"
                  >
                    <span className="text-sm font-medium">
                      {showAllActiveDrives ? 'Show Less' : `Show ${filteredDrives.length - 3} More Drives`}
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showAllActiveDrives ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button
            className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
            onClick={() => { initializeDriveForm(); setEditingDrive(null); setShowDriveModal(true); }}
          >
            <Plus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="text-blue-700 dark:text-blue-300 font-medium">Post Job Drive</span>
          </button>
          <button
            className="flex items-center space-x-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors focus:outline-none focus:ring-2 focus:ring-green-400 cursor-pointer"
            onClick={() => { setShowInternshipModal(true); setEditingInternship(null); setInternshipForm({ title: '', company: '', description: '', externalLink: '' }); }}
          >
            <Building2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="text-green-700 dark:text-green-300 font-medium">Add Internship</span>
          </button>
          <button
            className="flex items-center space-x-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400 cursor-pointer"
            onClick={() => setActiveTab('applications')}
          >
            <span className="inline-block w-5 h-5" />
            <span className="text-purple-700 dark:text-purple-300 font-medium">Review Applications</span>
          </button>
          <button
            className="flex items-center space-x-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400 cursor-pointer"
            onClick={() => setActiveTab('overview') /* or show a toast if no reports tab */}
          >
            <BarChart3 className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <span className="text-orange-700 dark:text-orange-300 font-medium">View Reports</span>
          </button>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'drives', label: 'Job Drives', icon: Briefcase },
    { id: 'internships', label: 'Internships', icon: Building2 },
    { id: 'applications', label: 'Applications', icon: FileText },
    { id: 'students', label: 'Students', icon: UserPlus },
    { id: 'offers', label: 'Offer Verification', icon: CheckCircle },
    { id: 'companies', label: 'Companies', icon: Building2 },
    { id: 'notifications', label: 'Notifications', icon: Bell }
  ];

  // 5. Add effect to fetch students when tab is active
  useEffect(() => {
    if (activeTab === 'students') fetchStudents();
  }, [activeTab]);

  // Update handleEditDrive
  const handleEditDrive = (drive: any) => {
    setEditingDrive(drive);
    setShowDriveModal(true);
    setDriveForm({
      ...drive,
      eligibility: {
        ...drive.eligibility,
        allowedBranches: [...drive.eligibility.allowedBranches]
      },
      externalApplicationUrl: drive.externalApplicationUrl || ''
    });
  };

  useEffect(() => {
    if (activeTab === 'internships') {
      fetchInternships();
    }
  }, [activeTab]);

  // Fetch companies for dropdown
  useEffect(() => {
    setCompaniesLoading(true);
    setCompaniesError('');
    apiClient.get('/companies')
      .then(res => setCompanies(res.data.companies || []))
      .catch(() => setCompaniesError('Failed to load companies'))
      .finally(() => setCompaniesLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center pt-20">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center pt-20">
        <div className="glass-panel p-8 max-w-md text-center">
          <div className="text-red-400 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-white text-lg font-medium mb-2">Error Loading Dashboard</p>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const companiesWithActiveDrives = new Set(jobDrives.filter((d: any) => d.status === 'active').map((d: any) => d.companyName));
  const availableCompanies = companies.filter((company: any) => !companiesWithActiveDrives.has(company.name));

  return (
    <div className="min-h-screen bg-dark-bg pt-20">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="glass-panel">
          <div className="border-b border-white/10">
            <nav className="flex overflow-x-auto scrollbar-hide px-4 sm:px-6 -mb-px" aria-label="Tabs">
              {tabs.map((tab: any) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3 sm:py-4 px-3 sm:px-4 border-b-2 font-medium text-xs sm:text-sm flex items-center space-x-1.5 sm:space-x-2 transition-all duration-300 whitespace-nowrap flex-shrink-0 ${activeTab === tab.id
                    ? 'border-indigo-500 text-white'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-white/20'
                    }`}
                >
                  {tab.icon && React.createElement(tab.icon, { className: "h-4 w-4" })}
                  <span className="hidden xs:inline sm:inline">{tab.label}</span>
                  <span className="xs:hidden sm:hidden">{tab.label.split(' ')[0]}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <OverviewSection
                tpoProfile={tpoProfile}
                stats={stats}
                placementTrends={placementTrends}
                branchWiseApplications={branchWiseApplications}
                applications={applications}
                jobDrives={jobDrives}
                getStatusColor={getStatusColor}
                initializeDriveForm={initializeDriveForm}
                setEditingDrive={setEditingDrive}
                setShowDriveModal={setShowDriveModal}
                setShowInternshipModal={setShowInternshipModal}
                setEditingInternship={setEditingInternship}
                setInternshipForm={setInternshipForm}
                setActiveTab={setActiveTab}
              />
            )}
            {activeTab === 'drives' && (
              <DrivesSection
                jobDrives={jobDrives}
                driveSearch={driveSearch}
                setDriveSearch={setDriveSearch}
                getStatusColor={getStatusColor}
                handleEditDrive={handleEditDrive}
                setDeletingDriveId={setDeletingDriveId}
                initializeDriveForm={initializeDriveForm}
                setEditingDrive={setEditingDrive}
                setShowDriveModal={setShowDriveModal}
              />
            )}
            {activeTab === 'internships' && (
              <InternshipsSection
                internships={internships}
                tpoProfile={tpoProfile}
                internshipSearch={internshipSearch}
                setInternshipSearch={setInternshipSearch}
                setShowInternshipModal={setShowInternshipModal}
                setEditingInternship={setEditingInternship}
                setInternshipForm={setInternshipForm}
                setDeletingInternshipId={setDeletingInternshipId}
              />
            )}
            {activeTab === 'applications' && (
              <ApplicationsSection
                applications={filterValidApplications(applications)}
                tpoProfile={tpoProfile}
                jobDrives={jobDrives}
                applicationSearch={applicationSearch}
                setApplicationSearch={setApplicationSearch}
                applicationStatusFilter={applicationStatusFilter}
                setApplicationStatusFilter={setApplicationStatusFilter}
                getStatusColor={getStatusColor}
                handleApplicationStatus={handleApplicationStatus}
                applicationActionLoading={applicationActionLoading}
              />
            )}
            {activeTab === 'students' && (
              <StudentsSection
                students={students}
                showStudentModal={showStudentModal}
                setShowStudentModal={setShowStudentModal}
                studentForm={studentForm}
                setStudentForm={setStudentForm}
                studentModalError={studentModalError}
                handleAddStudent={handleAddStudent}
                tpoProfile={tpoProfile}
                YEAR_OPTIONS={YEAR_OPTIONS}
              />
            )}
            {activeTab === 'companies' && <CompaniesList />}
            {activeTab === 'offers' && <OfferVerificationTable />}
            {activeTab === 'notifications' && (
              <NotificationsSection notifications={notifications} tpoProfile={tpoProfile} />
            )}
          </div>
        </div>
      </div>
      {/* DRIVE MODAL */}
      {showDriveModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl w-full max-w-3xl relative flex flex-col"
            style={{ maxHeight: '90vh' }}
          >
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{editingDrive ? 'Edit Drive' : 'Post New Drive'}</h2>
                  <p className="text-white/60 text-sm mt-1">Fill in the details to create or update a job drive</p>
                </div>
              </div>
              <button onClick={() => setShowDriveModal(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-5 h-5 text-white/70" />
              </button>
            </div>
            <form id="drive-form" onSubmit={e => { e.preventDefault(); handleDriveSubmit(); }} className="flex-1 overflow-y-auto px-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-sm font-semibold mb-2 text-white">Company</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-400 w-5 h-5" />
                    {editingDrive ? (
                      <input
                        type="text"
                        className="input-glass w-full pl-10 opacity-70"
                        value={driveForm.companyName}
                        disabled
                      />
                    ) : (
                      <select
                        className="input-glass w-full pl-10"
                        value={driveForm.companyName}
                        onChange={e => setDriveForm({ ...driveForm, companyName: e.target.value })}
                        required
                        disabled={companiesLoading}
                      >
                        <option value="">Select a company</option>
                        {availableCompanies.map((company: any) => (
                          <option key={company._id} value={company.name}>{company.name}</option>
                        ))}
                      </select>
                    )}
                    {companiesLoading && <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">Loading...</span>}
                    {companiesError && <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-red-500">{companiesError}</span>}
                  </div>
                </div>
                <div className="relative">
                  <label className="block text-sm font-semibold mb-2 text-white">Position</label>
                  <div className="relative">
                    <UserPlus className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5" />
                    <input type="text" className="input-glass w-full pl-10" value={driveForm.position} onChange={e => setDriveForm({ ...driveForm, position: e.target.value })} required />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-2 text-white">Description</label>
                  <textarea className="input-glass w-full resize-none" rows={3} value={driveForm.description} onChange={e => setDriveForm({ ...driveForm, description: e.target.value })} required />
                </div>
                <div className="relative">
                  <label className="block text-sm font-semibold mb-2 text-white">CTC</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-400 w-5 h-5" />
                    <input type="text" className="input-glass w-full pl-10" value={driveForm.ctc} onChange={e => setDriveForm({ ...driveForm, ctc: e.target.value })} required />
                  </div>
                </div>
                <div className="relative">
                  <label className="block text-sm font-semibold mb-2 text-white">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 w-5 h-5" />
                    <input type="text" className="input-glass w-full pl-10" value={driveForm.location} onChange={e => setDriveForm({ ...driveForm, location: e.target.value })} required />
                  </div>
                </div>
                <div className="relative">
                  <label className="block text-sm font-semibold mb-2 text-white">Deadline</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-400 w-5 h-5" />
                    <input type="date" className="input-glass w-full pl-10" value={driveForm.deadline} onChange={e => setDriveForm({ ...driveForm, deadline: e.target.value })} required />
                  </div>
                  <p className="text-xs text-white/50 mt-2 ml-1">Last date to apply</p>
                </div>
                <div className="relative">
                  <label className="block text-sm font-semibold mb-2 text-white">External Application URL (Optional)</label>
                  <div className="relative">
                    <ExternalLink className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-400 w-5 h-5" />
                    <input
                      type="url"
                      placeholder="https://company.com/apply (optional)"
                      className="input-glass w-full pl-10"
                      value={driveForm.externalApplicationUrl}
                      onChange={e => setDriveForm({ ...driveForm, externalApplicationUrl: e.target.value })}
                    />
                  </div>
                  <p className="text-xs text-white/50 mt-2 ml-1">Students will see an additional "Application Link" button</p>
                </div>
                <div className="relative">
                  <label className="block text-sm font-semibold mb-2 text-white">Work Mode</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pink-400 w-5 h-5" />
                    <select
                      className="input-glass w-full pl-10"
                      value={driveForm.workMode}
                      onChange={e => setDriveForm({ ...driveForm, workMode: e.target.value })}
                    >
                      <option value="">Select Work Mode</option>
                      <option value="On-site">On-site</option>
                      <option value="Remote">Remote</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="border-t border-white/10 pt-6 mt-4">
                <h3 className="text-base font-bold mb-4 text-white flex items-center gap-2"><Shield className="w-5 h-5 text-indigo-400" /> Eligibility Criteria</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="block text-sm font-semibold mb-2 text-white">Min CGPA</label>
                    <input type="number" step="0.01" className="input-glass w-full" value={driveForm.eligibility.minCGPA} onChange={e => setDriveForm({ ...driveForm, eligibility: { ...driveForm.eligibility, minCGPA: e.target.value } })} />
                  </div>
                  <div className="relative">
                    <label className="block text-sm font-semibold mb-2 text-white">Allowed Branches</label>
                    <select
                      multiple
                      className="input-glass w-full"
                      value={driveForm.eligibility.allowedBranches}
                      onChange={e => {
                        const options = Array.from(e.target.selectedOptions, option => option.value);
                        setDriveForm({ ...driveForm, eligibility: { ...driveForm.eligibility, allowedBranches: options } });
                      }}
                    >
                      {DEPARTMENTS.map(branch => (
                        <option key={`dept-${branch}`} value={branch}>{branch}</option>
                      ))}
                    </select>
                    <p className="text-xs text-white/50 mt-2 ml-1">Hold Ctrl (Windows) or Cmd (Mac) to select multiple</p>
                  </div>
                  <div className="relative">
                    <label className="block text-sm font-semibold mb-2 text-white">Max Backlogs</label>
                    <input type="number" className="input-glass w-full" value={driveForm.eligibility.maxBacklogs} onChange={e => setDriveForm({ ...driveForm, eligibility: { ...driveForm.eligibility, maxBacklogs: e.target.value } })} />
                  </div>
                  <div className="relative">
                    <label className="block text-sm font-semibold mb-2 text-white">Min Year</label>
                    <input type="number" className="input-glass w-full" value={driveForm.eligibility.minYear} onChange={e => setDriveForm({ ...driveForm, eligibility: { ...driveForm.eligibility, minYear: e.target.value } })} />
                  </div>
                </div>
              </div>
              {driveModalError && (
                <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-red-400 text-sm text-center">{driveModalError}</p>
                </div>
              )}
            </form>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-white/10">
              <button type="button" onClick={() => { setShowDriveModal(false); setEditingDrive(null); }} className="btn-secondary">Cancel</button>
              <button
                type="submit"
                form="drive-form"
                disabled={isSubmittingDrive}
                className={`btn-primary flex items-center gap-2 ${isSubmittingDrive ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSubmittingDrive ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    {editingDrive ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    {editingDrive ? 'Update Drive' : 'Create Drive'}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
      {/* END DRIVE MODAL */}
      {/* DELETE CONFIRMATION */}
      {deletingDriveId && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md p-8 relative text-center">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Delete Drive?</h2>
            <p className="mb-6">Are you sure you want to delete this drive? This action cannot be undone.</p>
            <div className="flex justify-center gap-4">
              <button className="px-4 py-2 bg-gray-200 rounded" onClick={() => setDeletingDriveId(null)}>Cancel</button>
              <button className="px-4 py-2 bg-red-600 text-white rounded" onClick={() => handleDeleteDrive(deletingDriveId!)}>Delete</button>
            </div>
          </div>
        </div>
      )}
      {/* END DELETE CONFIRMATION */}
      {/* INTERNSHIP MODAL */}
      {showInternshipModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl w-full max-w-2xl relative flex flex-col"
            style={{ maxHeight: '90vh' }}
          >
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{editingInternship ? 'Edit Internship' : 'Add New Internship'}</h2>
                  <p className="text-white/60 text-sm mt-1">Fill in the details to create or update an internship opportunity</p>
                </div>
              </div>
              <button onClick={() => setShowInternshipModal(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-5 h-5 text-white/70" />
              </button>
            </div>
            <form id="internship-form" onSubmit={e => { e.preventDefault(); handleInternshipSubmit(); }} className="flex-1 overflow-y-auto px-6 py-6">
              <div className="space-y-4">
                <div className="relative">
                  <label className="block text-sm font-semibold mb-2 text-white">Title</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 w-5 h-5" />
                    <input type="text" className="input-glass w-full pl-10" value={internshipForm.title} onChange={e => setInternshipForm({ ...internshipForm, title: e.target.value })} required />
                  </div>
                </div>
                <div className="relative">
                  <label className="block text-sm font-semibold mb-2 text-white">Company</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-400 w-5 h-5" />
                    <input type="text" className="input-glass w-full pl-10" value={internshipForm.company} onChange={e => setInternshipForm({ ...internshipForm, company: e.target.value })} required />
                  </div>
                </div>
                <div className="relative">
                  <label className="block text-sm font-semibold mb-2 text-white">Description</label>
                  <textarea className="input-glass w-full resize-none" rows={4} value={internshipForm.description} onChange={e => setInternshipForm({ ...internshipForm, description: e.target.value })} required />
                </div>
                <div className="relative">
                  <label className="block text-sm font-semibold mb-2 text-white">External Link</label>
                  <div className="relative">
                    <ExternalLink className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-400 w-5 h-5" />
                    <input type="url" className="input-glass w-full pl-10" value={internshipForm.externalLink} onChange={e => setInternshipForm({ ...internshipForm, externalLink: e.target.value })} required />
                  </div>
                  <p className="text-xs text-white/50 mt-2 ml-1">Link to the internship application page</p>
                </div>
              </div>
              {internshipModalError && (
                <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-red-400 text-sm text-center">{internshipModalError}</p>
                </div>
              )}
            </form>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-white/10">
              <button type="button" onClick={() => { setShowInternshipModal(false); setEditingInternship(null); }} className="btn-secondary">Cancel</button>
              <button type="submit" form="internship-form" className="btn-primary flex items-center gap-2">
                <Building2 className="w-5 h-5" /> {editingInternship ? 'Update Internship' : 'Create Internship'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
      {/* END INTERNSHIP MODAL */}
      {/* DELETE INTERNSHIP CONFIRMATION */}
      {deletingInternshipId && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md p-8 relative text-center">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Delete Internship?</h2>
            <p className="mb-6">Are you sure you want to delete this internship? This action cannot be undone.</p>
            <div className="flex justify-center gap-4">
              <button className="px-4 py-2 bg-gray-200 rounded" onClick={() => setDeletingInternshipId(null)}>Cancel</button>
              <button className="px-4 py-2 bg-red-600 text-white rounded" onClick={() => handleDeleteInternship(deletingInternshipId!)}>Delete</button>
            </div>
          </div>
        </div>
      )}
      {/* END DELETE INTERNSHIP CONFIRMATION */}
    </div>
  );
};