import React, { useState } from 'react';
import { Plus, Building2, BarChart3, LucideIcon, TrendingUp, Users, FileText, CheckCircle } from 'lucide-react';
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
}) => {
  const [isCreatingDrive, setIsCreatingDrive] = useState(false);
  const [isCreatingInternship, setIsCreatingInternship] = useState(false);
  const [showAllDrives, setShowAllDrives] = useState(false);

  const handleCreateDrive = () => {
    setIsCreatingDrive(true);
    initializeDriveForm();
    setEditingDrive(null);
    setShowDriveModal(true);
    setTimeout(() => setIsCreatingDrive(false), 1000);
  };

  const handleCreateInternship = () => {
    setIsCreatingInternship(true);
    setShowInternshipModal(true);
    setEditingInternship(null);
    setInternshipForm({ title: '', company: '', description: '', duration: '', stipend: '', location: '', deadline: '', externalLink: '', requirements: [], eligibility: '', notes: '', tags: [], logo: '' });
    setTimeout(() => setIsCreatingInternship(false), 1000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Section */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white">Welcome back, {tpoProfile?.name || 'TPO'}!</h2>
          <p className="text-gray-400">
            {tpoProfile?.department || 'Department'} • {tpoProfile?.experience || 'Experience'}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.length === 0 ? (
          <div className="col-span-4 text-center text-gray-400 py-8">No stats available.</div>
        ) : stats.map((stat: Stat, index: number) => {
          const iconBgColors: Record<string, string> = {
            blue: 'bg-indigo-500/10',
            green: 'bg-emerald-500/10',
            purple: 'bg-purple-500/10',
            orange: 'bg-pink-500/10'
          };
          const iconColors: Record<string, string> = {
            blue: 'text-indigo-400',
            green: 'text-emerald-400',
            purple: 'text-purple-400',
            orange: 'text-pink-400'
          };
          return (
            <motion.div
              key={`stat-${index}-${stat.label}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-6 hover:scale-[1.02] transition-transform duration-300 cursor-pointer"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-400 text-sm">{stat.label}</p>
                  <h3 className="text-3xl font-bold text-white mt-1">{stat.value}</h3>
                </div>
                <div className={`p-3 rounded-xl ${iconBgColors[stat.color] || 'bg-indigo-500/10'}`}>
                  {stat.icon && React.createElement(stat.icon, { className: `h-6 w-6 ${iconColors[stat.color] || 'text-indigo-400'}`, size: 24 })}
                </div>
              </div>
              <p className="text-emerald-400 text-sm mt-4 flex items-center gap-1">
                <TrendingUp size={16} /> {stat.change}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="text-xl font-bold text-white mb-6">Placement Trends (Last 6 Months)</h3>
          {placementTrends.length === 0 ? (
            <div className="text-center text-gray-400 py-12">No data available.</div>
          ) : (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={placementTrends}>
                  <defs>
                    <linearGradient id="colorDrives" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="colorPlacements" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="month" stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
                  <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '0.75rem' }} />
                  <Line type="monotone" dataKey="drives" stroke="#6366f1" strokeWidth={3} fill="url(#colorDrives)" name="Job Drives" />
                  <Line type="monotone" dataKey="placements" stroke="#10b981" strokeWidth={3} fill="url(#colorPlacements)" name="Placements" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        <div className="glass-card p-6">
          <h3 className="text-xl font-bold text-white mb-6">Applications by Branch</h3>
          {branchWiseApplications.length === 0 ? (
            <div className="text-center text-gray-400 py-12">No data available.</div>
          ) : (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
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
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '0.75rem' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="text-xl font-bold text-white mb-6">Recent Applications</h3>
          {applications.length === 0 ? (
            <div className="text-center text-gray-400 py-8">No recent applications.</div>
          ) : (
            <div className="space-y-4">
              {applications.slice(0, 3).map((app: Application) => (
                <div key={app._id || app.id || `app-${Math.random()}`} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors">
                  <div className="flex items-center space-x-3">
                    <img
                      src={app.student?.avatar || 'https://ui-avatars.com/api/?name=Student'}
                      alt={app.student?.name || 'Student'}
                      className="w-10 h-10 rounded-full object-cover bg-gray-200"
                    />
                    <div>
                      <p className="font-medium text-white">
                        {app.student?.name || "Unknown Student"}
                      </p>
                      <p className="text-sm text-gray-400">
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
        <div className="glass-card p-6">
          <h3 className="text-xl font-bold text-white mb-6">Active Drives</h3>
          {jobDrives.filter((drive: JobDrive) => drive.status === 'active').length === 0 ? (
            <div className="text-center text-gray-400 py-8">No active drives.</div>
          ) : (
            <>
              <div className="space-y-4">
                {jobDrives
                  .filter((drive: JobDrive) => drive.status === 'active')
                  .slice(0, showAllDrives ? undefined : 3)
                  .map((drive: JobDrive) => (
                    <motion.div
                      key={drive._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-center justify-between hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <img
                          src={drive.logo || 'https://ui-avatars.com/api/?name=Company&background=random'}
                          alt={drive.company?.companyName || drive.companyName || 'Company'}
                          className="w-12 h-12 rounded object-cover bg-gray-200"
                        />
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-white text-base">{drive.companyName}</span>
                            <span className="text-xs px-2 py-1 rounded-full font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">{drive.status}</span>
                          </div>
                          <div className="text-sm text-gray-300">{drive.company?.companyName || drive.companyName}</div>
                          <div className="text-xs text-gray-400 flex space-x-2 mt-1">
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
              {jobDrives.filter((drive: JobDrive) => drive.status === 'active').length > 3 && (
                <button
                  onClick={() => setShowAllDrives(!showAllDrives)}
                  className="mt-4 w-full py-2 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors text-white text-sm font-medium"
                >
                  {showAllDrives ? 'Show Less' : `Show ${jobDrives.filter((drive: JobDrive) => drive.status === 'active').length - 3} More`}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="glass-card p-6">
        <h3 className="text-xl font-bold text-white mb-6">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button
            onClick={handleCreateDrive}
            disabled={isCreatingDrive}
            className={`flex items-center space-x-3 p-4 rounded-lg transition-all ${isCreatingDrive
              ? 'bg-white/5 cursor-not-allowed'
              : 'bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 hover:scale-[1.02]'
              }`}
          >
            {isCreatingDrive ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-400"></div>
            ) : (
              <Plus className="w-5 h-5 text-indigo-400" />
            )}
            <span className="text-white font-medium">
              {isCreatingDrive ? 'Opening...' : 'Post Job Drive'}
            </span>
          </button>
          <button
            onClick={handleCreateInternship}
            disabled={isCreatingInternship}
            className={`flex items-center space-x-3 p-4 rounded-lg transition-all ${isCreatingInternship
              ? 'bg-white/5 cursor-not-allowed'
              : 'bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:scale-[1.02]'
              }`}
          >
            {isCreatingInternship ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-400"></div>
            ) : (
              <Building2 className="w-5 h-5 text-emerald-400" />
            )}
            <span className="text-white font-medium">
              {isCreatingInternship ? 'Opening...' : 'Add Internship'}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className="flex items-center space-x-3 p-4 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-lg hover:scale-[1.02] transition-all"
          >
            <FileText className="w-5 h-5 text-purple-400" />
            <span className="text-white font-medium">Review Applications</span>
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className="flex items-center space-x-3 p-4 bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/20 rounded-lg hover:scale-[1.02] transition-all"
          >
            <Users className="w-5 h-5 text-pink-400" />
            <span className="text-white font-medium">Manage Students</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default OverviewSection; 