import React from 'react';
import { Shield, GraduationCap, UserCog } from 'lucide-react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

const iconMap: Record<string, any> = {
  Shield,
  GraduationCap,
  UserCog,
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
  <div className="space-y-6 animate-fade-in">
    {/* Header */}
    <div className="flex justify-between items-center">
      <div>
        <h2 className="text-3xl font-bold text-white">Admin Overview</h2>
        <p className="text-gray-400">Monitor and manage your placement ecosystem.</p>
      </div>
    </div>
    {/* Stats Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat: any, index: number) => {
        // Define icon background colors based on stat type
        const getIconStyles = () => {
          switch (stat.label) {
            case 'TPOs':
              return 'bg-blue-500/20 text-blue-400';
            case 'Students':
              return 'bg-emerald-500/20 text-emerald-400';
            case 'Admins':
              return 'bg-purple-500/20 text-purple-400';
            case 'Companies':
              return 'bg-pink-500/20 text-pink-400';
            default:
              return 'bg-indigo-500/20 text-indigo-400';
          }
        };

        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-card p-6 hover:scale-[1.02] transition-transform duration-300"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white/70 text-sm font-medium">{stat.label}</p>
                <h3 className="text-4xl font-bold text-white mt-2">{stat.value}</h3>
              </div>
              <div className={`p-3 rounded-xl ${getIconStyles()}`}>
                {iconMap[stat.icon] ? (
                  React.createElement(iconMap[stat.icon], { size: 24, strokeWidth: 2.5 })
                ) : null}
              </div>
            </div>
            {stat.change && (
              <p className="text-emerald-400 text-sm mt-4 font-medium">
                {stat.change}
              </p>
            )}
          </motion.div>
        );
      })}
    </div>
    {/* Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="glass-card p-6">
        <h3 className="text-xl font-bold text-white mb-6">Student Registration by Branch</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={overviewBranchWise}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="branch" stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 12 }} interval={0} angle={-30} textAnchor="end" height={60} />
              <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '0.75rem' }}
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              />
              <Bar dataKey="students" name="Registered Students" fill="#818cf8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="glass-card p-6">
        <h3 className="text-xl font-bold text-white mb-6">User Distribution</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
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
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '0.75rem' }}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
    {/* Branch-wise Performance */}
    <div className="glass-card p-6">
      <h3 className="text-xl font-bold text-white mb-6">Branch-wise Placement Performance</h3>
      <div className="space-y-4">
        {overviewBranchWise.map((branch: any, index: number) => (
          <div key={index} className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer border border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-400">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <p className="font-medium text-white">{branch.branch}</p>
                <p className="text-sm text-gray-400">
                  {branch.placed} placed out of {branch.students} students
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-white">{branch.percentage}%</p>
              <p className="text-sm text-gray-400">Placement Rate</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default OverviewSection; 