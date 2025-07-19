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
      icon: <Activity className="h-8 w-8 text-blue-600 dark:text-blue-400" />,
      change: "+15% from last month",
      changeColor: "text-green-600 dark:text-green-400"
    },
    {
      label: "Job Applications",
      value: monthlyJobApplications.length > 0 ? monthlyJobApplications[monthlyJobApplications.length - 1].applications : '-',
      icon: <BarChart3 className="h-8 w-8 text-green-600 dark:text-green-400" />,
      change: "+23% from last month",
      changeColor: "text-green-600 dark:text-green-400"
    },
    {
      label: "Success Rate",
      value: monthlySuccessRate.length > 0 ? monthlySuccessRate[monthlySuccessRate.length - 1].successRate + '%' : '-',
      icon: <TrendingUp className="h-8 w-8 text-purple-600 dark:text-purple-400" />,
      change: "+2.3% from last month",
      changeColor: "text-green-600 dark:text-green-400"
    },
    {
      label: "System Uptime",
      value: systemUptime !== null ? systemUptime + '%' : '-',
      icon: <Zap className="h-8 w-8 text-orange-600 dark:text-orange-400" />,
      change: "Excellent",
      changeColor: "text-green-600 dark:text-green-400"
    }
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">System Analytics</h3>
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {metrics.map((metric, i) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{metric.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{metric.value}</p>
                {/* Removed trend/change text */}
              </div>
              {metric.icon}
            </div>
          </motion.div>
        ))}
      </div>
      {/* Detailed Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Placement Trends</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={placementData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="placements" fill="#3B82F6" name="Successful Placements" />
              <Bar dataKey="applications" fill="#10B981" name="Total Applications" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Company Engagement</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={companyEngagement}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="companies" stroke="#8B5CF6" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
      {/* Performance Metrics */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Branch Performance Comparison</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={branchWiseData} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="branch" type="category" width={150} />
            <Tooltip />
            <Bar dataKey="students" fill="#3B82F6" name="Total Students" />
            <Bar dataKey="placed" fill="#10B981" name="Placed Students" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AnalyticsSection; 