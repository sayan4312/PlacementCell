import { Activity, BarChart3, TrendingUp, Zap } from 'lucide-react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, LineChart, Line } from 'recharts';
import { motion } from 'framer-motion';

const AnalyticsSection = ({
  monthlyActiveUsers,
  monthlyJobApplications,
  monthlySuccessRate,
  systemUptime,
  companyEngagement,
  placementData,
  branchWiseData
}: {
  monthlyActiveUsers: any;
  monthlyJobApplications: any;
  monthlySuccessRate: any;
  systemUptime: any;
  companyEngagement: any;
  placementData: any;
  branchWiseData: any;
}) => {
  const metrics = [
    {
      label: "Monthly Active Users",
      value: monthlyActiveUsers.length > 0 ? monthlyActiveUsers[monthlyActiveUsers.length - 1].users : '-',
      icon: <Activity className="h-6 w-6 text-indigo-400" />,
      change: "+15% from last month",
      changeColor: "text-green-600 dark:text-green-400"
    },
    {
      label: "Job Applications",
      value: monthlyJobApplications.length > 0 ? monthlyJobApplications[monthlyJobApplications.length - 1].applications : '-',
      icon: <BarChart3 className="h-6 w-6 text-emerald-400" />,
      change: "+23% from last month",
      changeColor: "text-green-600 dark:text-green-400"
    },
    {
      label: "Success Rate",
      value: monthlySuccessRate.length > 0 ? monthlySuccessRate[monthlySuccessRate.length - 1].successRate + '%' : '-',
      icon: <TrendingUp className="h-6 w-6 text-purple-400" />,
      change: "+2.3% from last month",
      changeColor: "text-green-600 dark:text-green-400"
    },
    {
      label: "System Uptime",
      value: systemUptime !== null ? systemUptime + '%' : '-',
      icon: <Zap className="h-6 w-6 text-pink-400" />,
      change: "Excellent",
      changeColor: "text-green-600 dark:text-green-400"
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-white mb-1">System Analytics</h3>
        <p className="text-gray-400 text-sm">Monitor platform performance and engagement metrics</p>
      </div>
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {metrics.map((metric, i) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.02 }}
            className="glass-card p-6 hover:bg-white/10 transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400 mb-1">{metric.label}</p>
                <p className="text-3xl font-bold text-white">{metric.value}</p>
              </div>
              <div className="p-3 rounded-xl bg-indigo-500/10">
                {metric.icon}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      {/* Detailed Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-6">
          <h4 className="text-lg font-semibold text-white mb-4">Placement Trends</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={placementData}>
              <defs>
                <linearGradient id="colorPlacementsAdmin" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0.3} />
                </linearGradient>
                <linearGradient id="colorApplicationsAdmin" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#fff'
                }} 
              />
              <Bar dataKey="placements" fill="url(#colorPlacementsAdmin)" name="Successful Placements" radius={[8, 8, 0, 0]} />
              <Bar dataKey="applications" fill="url(#colorApplicationsAdmin)" name="Total Applications" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card p-6">
          <h4 className="text-lg font-semibold text-white mb-4">Company Engagement</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={companyEngagement}>
              <defs>
                <linearGradient id="colorCompaniesAdmin" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#fff'
                }} 
              />
              <Line type="monotone" dataKey="companies" stroke="#a855f7" strokeWidth={3} dot={{ fill: '#a855f7', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
      {/* Performance Metrics */}
      <div className="glass-card p-6">
        <h4 className="text-lg font-semibold text-white mb-4">Branch Performance Comparison</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={branchWiseData} layout="horizontal">
            <defs>
              <linearGradient id="colorStudentsAdmin" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0.3} />
              </linearGradient>
              <linearGradient id="colorPlacedAdmin" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis type="number" stroke="#9ca3af" />
            <YAxis dataKey="branch" type="category" width={150} stroke="#9ca3af" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#fff'
              }} 
            />
            <Bar dataKey="students" fill="url(#colorStudentsAdmin)" name="Total Students" radius={[0, 8, 8, 0]} />
            <Bar dataKey="placed" fill="url(#colorPlacedAdmin)" name="Placed Students" radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AnalyticsSection; 