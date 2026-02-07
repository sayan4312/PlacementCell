import { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  Building2,
  GraduationCap,
  BarChart3,
  Bell,
  FileText
} from 'lucide-react';
import apiClient from '../../../services/apiClient';
import CompaniesSection from './CompaniesSection';
import OverviewSection from './OverviewSection';
import UsersSection from './UsersSection';
import AnalyticsSection from './AnalyticsSection';
import NotificationSection from './NotificationsSection';
import ReportGenerator from './ReportGenerator';
import { toast } from 'react-toastify';
import { useLocation } from 'react-router-dom';
import DashboardSidebar from '../../common/DashboardSidebar';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');

  const [filterRole, setFilterRole] = useState('all');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Backend data states
  const [stats, setStats] = useState<any[]>([]);
  // Unused state removed: placementData, branchWiseData
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showTpoModal, setShowTpoModal] = useState(false);
  const [tpoForm, setTpoForm] = useState({ name: '', email: '', department: '', experience: '', qualification: '', specialization: '' });
  const [modalError, setModalError] = useState('');
  const [viewUser, setViewUser] = useState<any>(null);
  const [editTpo, setEditTpo] = useState<any>(null);
  const [showEditTpoModal, setShowEditTpoModal] = useState(false);
  const [editTpoForm, setEditTpoForm] = useState({ name: '', email: '', department: '', experience: '', qualification: '', specialization: '' });
  const [editTpoError, setEditTpoError] = useState('');

  // New analytics data states
  const [monthlyActiveUsers, setMonthlyActiveUsers] = useState<any[]>([]);
  const [monthlyJobApplications, setMonthlyJobApplications] = useState<any[]>([]);
  const [monthlySuccessRate, setMonthlySuccessRate] = useState<any[]>([]);
  const [systemUptime, setSystemUptime] = useState<number | null>(null);
  const [companyEngagement, setCompanyEngagement] = useState<any[]>([]);

  // Add new state for overview tab data
  const [overviewPlacementTrends, setOverviewPlacementTrends] = useState<any[]>([]);
  const [overviewRoleDistribution, setOverviewRoleDistribution] = useState<any[]>([]);
  const [overviewBranchWise, setOverviewBranchWise] = useState<any[]>([]);

  // Add notification state
  const [notifications, setNotifications] = useState<any[]>([]);

  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // Fetch users with search/filter
  const fetchUsers = async (search = searchTerm, role = filterRole) => {
    setLoading(true);
    try {
      let url = '/admin/users?limit=1000'; // Increase limit to see more users
      if (role && role !== 'all') url += `&role=${role}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const res = await apiClient.get(url);
      console.log('Fetched users:', res.data.users);
      setUsers(res.data.users || []);
    } catch (err) {
      setError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setError('');
    Promise.all([
      apiClient.get('/users/stats'),
      apiClient.get('/analytics/placement'),
      apiClient.get('/analytics/role-distribution'),
      apiClient.get('/analytics/branch-wise'),
      apiClient.get('/admin/users?limit=1000'),
      apiClient.get('/analytics/monthly-active-users'),
      apiClient.get('/analytics/monthly-job-applications'),
      apiClient.get('/analytics/monthly-success-rate'),
      apiClient.get('/analytics/system-uptime'),
      apiClient.get('/analytics/company-engagement'),
      apiClient.get('/notifications'),
    ])
      .then(([
        statsRes,
        _placementRes,
        _roleDistRes,
        _branchWiseRes,
        usersRes,
        activeUsersRes,
        jobAppsRes,
        successRateRes,
        uptimeRes,
        companyEngRes,
        notificationsRes
      ]) => {
        setStats(statsRes.data.stats || []);
        // placementData, roleDist, branchWiseData unused in this scope

        // Filter out admin users
        const filteredUsers = (usersRes.data.users || []).filter((u: any) => u.role !== 'admin');
        setUsers(filteredUsers);
        setMonthlyActiveUsers(activeUsersRes.data.monthlyActiveUsers || []);
        setMonthlyJobApplications(jobAppsRes.data.monthlyJobApplications || []);
        setMonthlySuccessRate(successRateRes.data.monthlySuccessRate || []);
        setSystemUptime(uptimeRes.data.uptime ?? null);
        setCompanyEngagement(companyEngRes.data.companyEngagement || []);
        setNotifications(notificationsRes.data?.notifications || []);
      })
      .catch(() => {
        setError('Failed to load dashboard data.');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError('');
    Promise.all([
      apiClient.get('/users/stats'),
      apiClient.get('/analytics/placement'),
      apiClient.get('/analytics/role-distribution'),
      apiClient.get('/analytics/branch-wise'),
    ])
      .then(([
        statsRes,
        placementRes,
        roleDistRes,
        branchWiseRes,
      ]) => {
        setStats(statsRes.data.stats || []);
        setOverviewPlacementTrends(placementRes.data.placementData || []);
        setOverviewRoleDistribution(roleDistRes.data.roleDistribution || []);
        setOverviewBranchWise(branchWiseRes.data.branchWiseData || []);
      })
      .catch(() => {
        setError('Failed to load dashboard data.');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, filterRole]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'blocked': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'success': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'error': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'student': return GraduationCap;
      case 'company': return Building2;
      case 'tpo': return Users;
      case 'admin': return Shield;
      default: return Users;
    }
  };

  // User action handler
  const handleUserAction = async (userId: string, action: string) => {
    setError('');
    try {
      if (action === 'view') {
        const user = users.find((u: any) => u.id === userId);
        setViewUser(user);
      } else if (action === 'approve') {
        await apiClient.patch(`/users/${userId}/approve`, { isApproved: true });
        fetchUsers();
      } else if (action === 'reject' || action === 'block') {
        await apiClient.patch(`/users/${userId}/approve`, { isActive: false });
        fetchUsers();
      } else if (action === 'unblock') {
        await apiClient.patch(`/users/${userId}/approve`, { isActive: true });
        fetchUsers();
      } else if (action === 'delete') {
        await apiClient.delete(`/users/${userId}`);
        fetchUsers();
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Action failed.');
    }
  };

  // Create TPO handler
  const handleCreateTPO = async () => {
    setModalError('');
    try {
      await apiClient.post('/users/tpo', { ...tpoForm, password: 'tpo123' });
      setShowTpoModal(false);
      setTpoForm({ name: '', email: '', department: '', experience: '', qualification: '', specialization: '' });
      fetchUsers();
      toast.success('TPO created successfully!');
    } catch (err: any) {
      setModalError(err?.response?.data?.message || 'Failed to create TPO.');
    }
  };

  // Handler to open edit modal for TPO
  const handleEditTpo = (tpo: any) => {
    setEditTpo(tpo);
    setEditTpoForm({
      name: tpo.name || '',
      email: tpo.email || '',
      department: tpo.department || '',
      experience: tpo.experience || '',
      qualification: tpo.qualification || '',
      specialization: tpo.specialization || ''
    });
    setShowEditTpoModal(true);
  };

  // Handler to submit TPO edit
  const handleEditTpoSubmit = async () => {
    setEditTpoError('');
    try {
      await apiClient.put(`/users/${editTpo._id || editTpo.id}`, editTpoForm);
      setShowEditTpoModal(false);
      setEditTpo(null);
      fetchUsers();
      toast.success('TPO updated successfully!');
    } catch (err: any) {
      setEditTpoError(err?.response?.data?.message || 'Failed to update TPO.');
    }
  };

  // Map icon string to actual component
  const iconMap: Record<string, any> = {
    Shield,
    Users,
    Building2,
    GraduationCap,
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Shield },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'companies', label: 'Companies', icon: Building2 },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'reports', label: 'Reports', icon: FileText },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      badge: notifications.filter((n: any) => !n.read).length
    }
  ];

  // Poll for notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await apiClient.get('/notifications');
        setNotifications(res.data.notifications || []);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    // Initial fetch
    fetchNotifications();

    // Poll every 30 seconds
    const intervalId = setInterval(fetchNotifications, 30000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="min-h-screen bg-dark-bg">
      <DashboardSidebar
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        userInfo={{ name: 'Admin', role: 'admin' }}
      />

      <main className={`pt-[100px] transition-all duration-300 ml-0 ${sidebarCollapsed ? 'md:ml-24' : 'md:ml-72'}`}>
        <div className="p-6">
          <div className="glass-panel p-6">
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-indigo-400 mb-6">
              {tabs.find(t => t.id === activeTab)?.label || 'Dashboard'}
            </h2>
            {loading && <p className="text-center py-8">Loading dashboard data...</p>}
            {error && <p className="text-center py-8 text-red-500">{error}</p>}
            {!loading && !error && (
              <>
                {activeTab === 'overview' && (
                  <OverviewSection
                    stats={stats}
                    overviewPlacementTrends={overviewPlacementTrends}
                    overviewRoleDistribution={overviewRoleDistribution}
                    overviewBranchWise={overviewBranchWise}
                  />
                )}
                {activeTab === 'users' && (
                  <UsersSection
                    users={users}
                    loading={loading}
                    error={error}
                    onShowTpoModal={() => setShowTpoModal(true)}
                    onUserAction={(userId: string, action: string) => {
                      const user = users.find((u: any) => u._id === userId || u.id === userId);
                      if (action === 'edit' && user && user.role === 'tpo') {
                        handleEditTpo(user);
                      } else if (action === 'view') {
                        setViewUser(user);
                      } else if (action === 'approve') {
                        handleUserAction(userId, 'approve');
                      } else if (action === 'reject' || action === 'block') {
                        handleUserAction(userId, 'reject');
                      } else if (action === 'unblock') {
                        handleUserAction(userId, 'unblock');
                      } else if (action === 'delete') {
                        handleUserAction(userId, 'delete');
                      }
                    }}
                  />
                )}
                {activeTab === 'companies' && <CompaniesSection />}
                {activeTab === 'analytics' && (
                  <AnalyticsSection
                    monthlyActiveUsers={monthlyActiveUsers}
                    monthlyJobApplications={monthlyJobApplications}
                    monthlySuccessRate={monthlySuccessRate}
                    systemUptime={systemUptime}
                    companyEngagement={companyEngagement}
                  />
                )}
                {activeTab === 'reports' && <ReportGenerator />}
                {activeTab === 'notifications' && <NotificationSection notifications={notifications} />}
              </>
            )}
          </div>
        </div>
      </main>
      {showTpoModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card w-full max-w-2xl relative border border-white/10 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-indigo-500/10">
                  <Users className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Create TPO</h2>
                  <p className="text-gray-400 text-sm">Fill in the details to create a new TPO account</p>
                </div>
              </div>
              <button onClick={() => setShowTpoModal(false)} className="text-gray-400 hover:text-white transition-colors">
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            <form onSubmit={handleCreateTPO} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Name *</label>
                  <input
                    type="text"
                    className="input-glass"
                    value={tpoForm.name}
                    onChange={e => setTpoForm({ ...tpoForm, name: e.target.value })}
                    placeholder="Enter name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Email *</label>
                  <input
                    type="email"
                    className="input-glass"
                    value={tpoForm.email}
                    onChange={e => setTpoForm({ ...tpoForm, email: e.target.value })}
                    placeholder="Enter email"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Department</label>
                  <select
                    className="input-glass"
                    value={tpoForm.department}
                    onChange={e => setTpoForm({ ...tpoForm, department: e.target.value })}
                  >
                    <option value="">Select Department</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electronics & Communication">Electronics & Communication</option>
                    <option value="Electrical Engineering">Electrical Engineering</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Civil Engineering">Civil Engineering</option>
                    <option value="Data Science">Data Science</option>
                    <option value="AIML">AIML</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Experience</label>
                  <input
                    type="text"
                    className="input-glass"
                    value={tpoForm.experience}
                    onChange={e => setTpoForm({ ...tpoForm, experience: e.target.value })}
                    placeholder="e.g., 5 years"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Qualification</label>
                  <select
                    className="input-glass"
                    value={tpoForm.qualification}
                    onChange={e => setTpoForm({ ...tpoForm, qualification: e.target.value })}
                  >
                    <option value="">Select Qualification</option>
                    <option value="B.Tech">B.Tech</option>
                    <option value="M.Tech">M.Tech</option>
                    <option value="MBA">MBA</option>
                    <option value="PhD">PhD</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Specialization</label>
                  <input
                    type="text"
                    className="input-glass"
                    value={tpoForm.specialization}
                    onChange={e => setTpoForm({ ...tpoForm, specialization: e.target.value })}
                    placeholder="Enter specialization"
                  />
                </div>
              </div>
              {modalError && (
                <div className="glass-card border-l-4 border-red-500 p-3 bg-red-500/10">
                  <p className="text-sm text-red-400">{modalError}</p>
                </div>
              )}
              <div className="flex justify-end space-x-3 pt-4 border-t border-white/10">
                <button type="button" onClick={() => setShowTpoModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Create TPO</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditTpoModal && editTpo && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg md:max-w-xl relative flex flex-col" style={{ maxHeight: '90vh' }}>
            <div className="flex flex-col md:flex-row items-start md:items-center px-6 py-4 rounded-t-2xl bg-gradient-to-r from-green-700 to-blue-700 relative">
              <Users className="w-8 h-8 text-white mr-3 mb-2 md:mb-0" />
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white">Edit TPO</h2>
                <p className="text-white text-xs opacity-80 mt-1">Update TPO information.</p>
              </div>
              <button onClick={() => setShowEditTpoModal(false)} className="absolute top-3 right-3 z-10 text-white hover:text-gray-200 focus:outline-none bg-black/20 rounded-full p-1">
                <span className="text-xl">&times;</span>
              </button>
            </div>
            <form onSubmit={e => { e.preventDefault(); handleEditTpoSubmit(); }} className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Name</label>
                  <input type="text" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white" value={editTpoForm.name} onChange={e => setEditTpoForm({ ...editTpoForm, name: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Email</label>
                  <input type="email" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white" value={editTpoForm.email} onChange={e => setEditTpoForm({ ...editTpoForm, email: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Department</label>
                  <select className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white" value={editTpoForm.department} onChange={e => setEditTpoForm({ ...editTpoForm, department: e.target.value })}>
                    <option value="">Select Department</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electronics & Communication">Electronics & Communication</option>
                    <option value="Electrical Engineering">Electrical Engineering</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Civil Engineering">Civil Engineering</option>
                    <option value="Data Science">Data Science</option>
                    <option value="AIML">AIML</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Experience</label>
                  <input type="text" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white" value={editTpoForm.experience} onChange={e => setEditTpoForm({ ...editTpoForm, experience: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Qualification</label>
                  <select className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white" value={editTpoForm.qualification} onChange={e => setEditTpoForm({ ...editTpoForm, qualification: e.target.value })}>
                    <option value="">Select Qualification</option>
                    <option value="B.Tech">B.Tech</option>
                    <option value="M.Tech">M.Tech</option>
                    <option value="MBA">MBA</option>
                    <option value="PhD">PhD</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Specialization</label>
                  <input type="text" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white" value={editTpoForm.specialization} onChange={e => setEditTpoForm({ ...editTpoForm, specialization: e.target.value })} />
                </div>
              </div>
              {editTpoError && <div className="text-red-600 text-sm text-center">{editTpoError}</div>}
              <div className="flex justify-end mt-4">
                <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 focus:outline-none">Update TPO</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}