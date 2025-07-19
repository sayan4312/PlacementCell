import React from 'react';
import { Shield, GraduationCap } from 'lucide-react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Area, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

const iconMap: Record<string, any> = {
  Shield,
  GraduationCap,
};

// Add explicit types to props
const OverviewSection = ({
  stats,
  overviewPlacementTrends,
  overviewRoleDistribution,
  overviewBranchWise,
}: {
  stats: any;
  overviewPlacementTrends: any;
  overviewRoleDistribution: any;
  overviewBranchWise: any;
}) => (
  <div className="space-y-6">
    {/* Welcome Section */}
    <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2">System Overview</h2>
          <p className="text-purple-100 text-lg">Monitor and manage your placement ecosystem</p>
        </div>
        <div className="hidden md:block">
          <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
            <Shield className="w-12 h-12" />
          </div>
        </div>
      </div>
    </div>
    {/* Stats Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat: any, index: number) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-full bg-${stat.color}-100 dark:bg-${stat.color}-900`}>
              {iconMap[stat.icon] ? (
                React.createElement(iconMap[stat.icon], { className: `h-6 w-6 text-${stat.color}-600 dark:text-${stat.color}-400` })
              ) : null}
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
            <p className="text-xs text-gray-500 dark:text-gray-500">
              {stat.description}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
    {/* Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Placement Trends</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={overviewPlacementTrends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="placements" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
            <Area type="monotone" dataKey="applications" stackId="2" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">User Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <RechartsPieChart>
            <Pie
              data={overviewRoleDistribution.filter((entry: any) => entry.name !== 'Company')}
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={props => `${props.name ?? ''}: ${props.value ?? 0}`}
            >
              {overviewRoleDistribution.filter((entry: any) => entry.name !== 'Company').map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>
    </div>
    {/* Branch-wise Performance */}
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Branch-wise Placement Performance</h3>
      <div className="space-y-4">
        {overviewBranchWise.map((branch: any, index: number) => (
          <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{branch.branch}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {branch.placed} placed out of {branch.students} students
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{branch.percentage}%</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Placement Rate</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default OverviewSection; 