import React, { useState, useEffect } from 'react';
import { 
  User, 
  Briefcase, 
  FileText, 
  Bell, 
  TrendingUp,
  Building2
} from 'lucide-react';
import apiClient from '../../../services/apiClient';
import { notificationAPI } from '../../../services/apiClient';
import OverviewSection from './OverviewSection';
import ProfileSection from './ProfileSection';
import DrivesSection from './DrivesSection';
import InternshipsSection from './InternshipsSection';
import ApplicationsSection from './ApplicationsSection';
import NotificationsSection from './NotificationsSection';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useLocation } from 'react-router-dom';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  studentId?: string;
  branch?: string;
  year?: string;
  cgpa?: number;
  backlogs?: number;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  skills?: string[];
  achievements?: string[];
  certifications?: string[];
  projects?: Array<{
    name: string;
    tech: string;
    description: string;
    github: string;
  }>;
  resume?: {
    filename: string;
    uploadDate: string;
    size: string;
  };
  profileCompleted?: boolean;
  profileScore?: number;
  isApproved: boolean;
  isActive: boolean;
  requiresPasswordChange: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Drive {
  _id: string;
  position: string;
  description: string;
  company: {
    _id: string;
    companyName: string;
    industry: string;
    companySize?: string;
  };
  ctc: string;
  location: string;
  deadline: string;
  eligibility: {
    minCGPA: number;
    allowedBranches: string[];
    maxBacklogs: number;
    minYear: number;
    workMode?: string;
    industry?: string;
  };
  requirements: string[];
  status: string;
  appliedAt?: string;
}

interface Application {
  _id: string;
  drive: {
    _id: string;
    title: string;
    position: string;
    companyName: string;
  };
  status: string;
  appliedAt: string;
  feedback?: string;
  timeline?: Array<{
    step: string;
    completed: boolean;
    date: string;
  }>;
  nextStep?: string;
}

interface Stats {
  totalApplications: number;
  pendingApplications: number;
  shortlistedApplications: number;
  selectedApplications: number;
  rejectedApplications: number;
  profileScore: number;
  eligibleDrives: number;
}

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  priority: 'low' | 'medium' | 'high';
  read: boolean;
  createdAt: string;
  actionUrl?: string;
  metadata?: any;
}

export const StudentDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [internshipSearch, setInternshipSearch] = useState('');
  const [internshipCompanyFilter, setInternshipCompanyFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // State for data
  const [user, setUser] = useState<User | null>(null);
  const [drives, setDrives] = useState<Drive[]>([]);
  const [internships, setInternships] = useState<any[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [applicationTrends, setApplicationTrends] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      const [userRes, drivesRes, internshipsRes, applicationsRes, statsRes, notificationsRes] = await Promise.all([
        apiClient.get('/users/me'),
        apiClient.get('/drives/eligible'),
        apiClient.get('/internships/available'),
        apiClient.get('/applications/mine'),
        apiClient.get('/applications/stats'),
        notificationAPI.getNotifications()
      ]);

      setUser(userRes.data.user);
      setDrives(drivesRes.data.drives || []);
      setInternships(internshipsRes.data.internships || []);
      setApplications(applicationsRes.data.applications || []);
      setNotifications(notificationsRes.data.notifications || []);
      
      // Process stats
      const statsData = statsRes.data;
      console.log('Stats API response:', statsData); // Debug log
      
      // Convert stats array to object for easier access
      const statsMap = (statsData.stats && Array.isArray(statsData.stats)) 
        ? statsData.stats.reduce((acc: any, stat: any) => {
            acc[stat._id] = stat.count;
            return acc;
          }, {})
        : {};
      
      console.log('Processed stats map:', statsMap); // Debug log
      
      const processedStats: Stats = {
        totalApplications: statsData.totalApplications || 0,
        pendingApplications: statsMap.pending || 0,
        shortlistedApplications: statsMap.shortlisted || 0,
        selectedApplications: statsMap.selected || 0,
        rejectedApplications: statsMap.rejected || 0,
        profileScore: userRes.data.user.profileScore || 0,
        eligibleDrives: drivesRes.data.drives?.length || 0
      };
      setStats(processedStats);

      // Process real application trends from actual data
      const applications = applicationsRes.data.applications || [];
      const trends = [];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentDate = new Date();
      
      // Get last 6 months
      for (let i = 5; i >= 0; i--) {
        const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthName = months[targetDate.getMonth()];
        const monthStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
        const monthEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
        
        // Count applications in this month
        const monthApplications = applications.filter((app: any) => {
          const appDate = new Date(app.appliedAt);
          return appDate >= monthStart && appDate <= monthEnd;
        }).length;
        
        // Count interviews in this month (applications with interview_scheduled status)
        const monthInterviews = applications.filter((app: any) => {
          const appDate = new Date(app.appliedAt);
          return appDate >= monthStart && appDate <= monthEnd && 
                 (app.status === 'shortlisted' || app.status === 'selected');
        }).length;
        
        trends.push({
          month: monthName,
          applications: monthApplications,
          interviews: monthInterviews
        });
      }
      
      setApplicationTrends(trends);

    } catch (err: any) {
      console.error('Dashboard data fetch error:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };



  const handleApplyToDrive = async (driveId: string) => {
    try {
      await apiClient.post(`/drives/${driveId}/apply`);
      // Update the local drives state
      setDrives(prevDrives =>
        prevDrives.map(drive =>
          drive._id === driveId ? { ...drive, status: 'applied' } : drive
        )
      );
      // Fetch the new application and add to applications state
      const res = await apiClient.get('/applications/mine');
      setApplications(res.data.applications || []);
      toast.success('Application submitted successfully!');
    } catch (err: any) {
      console.error('Apply error:', err);
      setError(err.response?.data?.message || 'Failed to apply to drive');
      toast.error(err.response?.data?.message || 'Failed to apply to drive');
    }
  };



  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderOverviewTab = () => (
    <OverviewSection 
      user={user}
      stats={stats}
      applicationTrends={applicationTrends}
      setActiveTab={setActiveTab}
    />
  );

  const renderProfileTab = () => (
    <ProfileSection 
      user={user} 
      onUserUpdate={(updatedUser) => setUser(updatedUser)}
    />
  );

  const renderDrivesTab = () => (
    <DrivesSection 
      drives={drives}
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      filterStatus={filterStatus}
      setFilterStatus={setFilterStatus}
      handleApplyToDrive={handleApplyToDrive}
      formatDate={formatDate}
    />
  );

  const renderInternshipsTab = () => (
    <InternshipsSection 
      internships={internships}
      searchTerm={internshipSearch}
      setSearchTerm={setInternshipSearch}
      companyFilter={internshipCompanyFilter}
      setCompanyFilter={setInternshipCompanyFilter}
      formatDate={formatDate}
    />
  );

  const renderApplicationsTab = () => (
    <ApplicationsSection 
      applications={applications}
      formatDate={formatDate}
    />
  );

  const renderNotificationsTab = () => (
    <NotificationsSection notifications={notifications} />
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'drives', label: 'Job Drives', icon: Briefcase },
    { id: 'internships', label: 'Internships', icon: Building2 },
    { id: 'applications', label: 'My Applications', icon: FileText },
    { id: 'notifications', label: 'Notifications', icon: Bell }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-gray-900 dark:text-white text-lg font-medium mb-2">Error Loading Dashboard</p>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ToastContainer />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab: any) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && renderOverviewTab()}
            {activeTab === 'profile' && renderProfileTab()}
            {activeTab === 'drives' && renderDrivesTab()}
            {activeTab === 'internships' && renderInternshipsTab()}
            {activeTab === 'applications' && renderApplicationsTab()}
            {activeTab === 'notifications' && renderNotificationsTab()}
          </div>
        </div>
      </div>
    </div>
  );
};