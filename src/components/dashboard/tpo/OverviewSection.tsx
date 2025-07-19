import React from 'react';
import { Plus, Building2, BarChart3, LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line, PieChart, Pie, Cell } from 'recharts';

// TypeScript interfaces
interface TPOProfile {
  _id?: string;
  name?: string;
  email?: string;
  department?: string;
  experience?: string;
  qualification?: string;
  avatar?: string;
}

interface Stat {
  label: string;
  value: number | string;
  description: string;
  color: string;
  change: string;
  icon?: LucideIcon;
}

interface PlacementTrend {
  month: string;
  drives: number;
  placements: number;
}

interface BranchApplication {
  name: string;
  value: number;
  color: string;
}

interface Application {
  _id?: string;
  id?: string;
  studentName?: string;
  position?: string;
  company?: string;
  status?: string;
  avatar?: string;
  drive?: {
    _id: string;
    postedBy?: {
      _id: string;
      role: 'tpo';
    };
    position?: string;
    company?: {
      companyName?: string;
    };
  };
  student?: {
    name?: string;
    avatar?: string;
  };
}

interface JobDrive {
  _id: string;
  companyName?: string;
  position?: string;
  status?: string;
  ctc?: string;
  location?: string;
  applicants?: any[];
  logo?: string;
  company?: {
    companyName?: string;
  };
}

interface OverviewSectionProps {
  tpoProfile: TPOProfile | null;
  stats: Stat[];
  placementTrends: PlacementTrend[];
  branchWiseApplications: BranchApplication[];
  applications: Application[];
  jobDrives: JobDrive[];
  getStatusColor: (status: string) => string;
  initializeDriveForm: () => void;
  setEditingDrive: (drive: JobDrive | null) => void;
  setShowDriveModal: (show: boolean) => void;
  setShowInternshipModal: (show: boolean) => void;
  setEditingInternship: (internship: any | null) => void;
  setInternshipForm: (form: any) => void;
  setActiveTab: (tab: string) => void;
}

const OverviewSection: React.FC<OverviewSectionProps> = ({
  tpoProfile,
  stats,
  placementTrends,
  branchWiseApplications,
  applications,
  jobDrives,
  getStatusColor,
  initializeDriveForm,
  setEditingDrive,
  setShowDriveModal,
  setShowInternshipModal,
  setEditingInternship,
  setInternshipForm,
  setActiveTab
}) => (
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
      ) : stats.map((stat: Stat, index: number) => (
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
                label={(props) => `${props.name}: ${props.value || 0}`}
              >
                {branchWiseApplications.map((entry: BranchApplication, index: number) => (
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
        {applications.length === 0 ? (
          <div className="text-center text-gray-400 dark:text-gray-500 py-8">No recent applications.</div>
        ) : (
          <div className="space-y-4">
            {applications.slice(0, 3).map((app: Application) => (
              <div key={app._id || app.id || `app-${Math.random()}`} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <img
                    src={app.student?.avatar || 'https://ui-avatars.com/api/?name=Student'}
                    alt={app.student?.name || 'Student'}
                    className="w-10 h-10 rounded-full object-cover bg-gray-200"
                  />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {app.student?.name || "Unknown Student"}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {app.drive?.position || "Unknown Position"} at {app.drive?.company?.companyName || "Unknown Company"}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status || 'pending')}`}>
                  {app.status || 'Pending'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Active Drives</h3>
        {jobDrives.filter((drive: JobDrive) => drive.status === 'active').length === 0 ? (
          <div className="text-center text-gray-400 dark:text-gray-500 py-8">No active drives.</div>
        ) : (
          <div className="space-y-4">
            {jobDrives.filter((drive: JobDrive) => drive.status === 'active').map((drive: JobDrive) => (
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
                    <div className="text-sm text-gray-600 dark:text-gray-300">{drive.company?.companyName || drive.companyName}</div>
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
          </div>
        )}
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
          onClick={() => { setShowInternshipModal(true); setEditingInternship(null); setInternshipForm({ title: '', company: '', description: '', duration: '', stipend: '', location: '', deadline: '', externalLink: '', requirements: [], eligibility: '', notes: '', tags: [], logo: '' }); }}
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

export default OverviewSection; 