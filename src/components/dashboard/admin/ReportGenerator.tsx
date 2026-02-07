import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, BarChart2, PieChart, Users, Briefcase, Activity, AlertCircle, TrendingUp } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart as RechartsPieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { getPlacementStats, getCompanyStats, getStudentReportData } from '../../../services/reportService';
import { toast } from 'react-toastify';
import html2canvas from 'html2canvas';

const ReportGenerator = () => {
    const [stats, setStats] = useState<any>(null);
    const [companyStats, setCompanyStats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [statsData, companyData] = await Promise.all([
                getPlacementStats(),
                getCompanyStats()
            ]);
            setStats(statsData);
            setCompanyStats(companyData);
        } catch (error) {
            console.error('Error fetching report data:', error);
            toast.error('Failed to load report data');
        } finally {
            setLoading(false);
        }
    };

    const downloadPDF = async () => {
        try {
            toast.info('Generating PDF... This may take a moment.');
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.width;
            const pageHeight = doc.internal.pageSize.height;
            const margin = 14;

            // --- Capture Charts ---
            const chart1 = document.getElementById('chart-salary');
            const chart2 = document.getElementById('chart-timeline');
            const chart3 = document.getElementById('chart-role');

            let chart1Img = null;
            let chart2Img = null;
            let chart3Img = null;

            if (chart1) {
                const canvas = await html2canvas(chart1, { scale: 2 });
                chart1Img = canvas.toDataURL('image/png');
            }
            if (chart2) {
                const canvas = await html2canvas(chart2, { scale: 2 });
                chart2Img = canvas.toDataURL('image/png');
            }
            if (chart3) {
                const canvas = await html2canvas(chart3, { scale: 2 });
                chart3Img = canvas.toDataURL('image/png');
            }

            // --- PDF Generation ---

            // Utility to add header to each page
            const addHeader = (title: string) => {
                doc.setFillColor(79, 70, 229); // Indigo 600
                doc.rect(0, 0, pageWidth, 20, 'F');
                doc.setFontSize(16);
                doc.setTextColor(255, 255, 255);
                doc.text(title, margin, 13);
                doc.setFontSize(10);
                doc.text(new Date().toLocaleDateString(), pageWidth - margin - 20, 13);
                doc.setTextColor(0, 0, 0);
                return 30; // Return Y start position for content
            };

            // --- PAGE 1: Overview ---
            let currentY = addHeader('Placement Report - Executive Summary');

            if (stats?.overview) {
                doc.setFontSize(14);
                doc.setTextColor(55, 65, 81);
                doc.text('Key Performance Indicators', margin, currentY);
                currentY += 10;

                const summaryData = [
                    ['Metric', 'Value'],
                    ['Total Students', stats.overview.totalStudents],
                    ['Placed Students', stats.overview.placedStudents],
                    ['Placement Rate', `${stats.overview.placementRate}%`],
                    ['Highest Package', `${stats.overview.highestPackage} LPA`],
                    ['Average Package', `${stats.overview.averagePackage} LPA`],
                    ['Active Job Drives', stats.overview.activeJobs],
                    ['Unplaced Avg CGPA', stats.overview.unplacedStats?.avgCGPA || 'N/A']
                ];

                autoTable(doc, {
                    startY: currentY,
                    head: [summaryData[0]],
                    body: summaryData.slice(1),
                    theme: 'grid',
                    headStyles: { fillColor: [79, 70, 229], textColor: 255, halign: 'center' },
                    columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'center' } },
                    styles: { fontSize: 11, cellPadding: 5 }
                });

                currentY = (doc as any).lastAutoTable.finalY + 15;

                // Unplaced Insights Text
                doc.setFontSize(12);
                doc.text(`Unplaced Analysis:`, margin, currentY);
                currentY += 6;
                doc.setFontSize(10);
                doc.text(`- Students with Backlogs: ${stats.overview.unplacedStats?.withBacklogs || 0}`, margin + 5, currentY);
                currentY += 5;
                doc.text(`- Remaining Eligible Pool: ${stats.overview.unplacedStats?.total || 0}`, margin + 5, currentY);
            }

            // --- PAGE 2: Salary Analytics ---
            doc.addPage();
            currentY = addHeader('Salary Analysis');

            if (chart1Img) {
                doc.setFontSize(12);
                doc.text('Salary Distribution Graph', margin, currentY);
                currentY += 10;

                const imgProps = doc.getImageProperties(chart1Img);
                const pdfWidth = pageWidth - (margin * 2);
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

                doc.addImage(chart1Img, 'PNG', margin, currentY, pdfWidth, pdfHeight);
                currentY += pdfHeight + 15;
            }

            if (stats?.overview?.salaryDistribution) {
                doc.setFontSize(12);
                doc.text('Detailed Salary Breakdown', margin, currentY);
                currentY += 5;
                const salaryData = Object.entries(stats.overview.salaryDistribution).map(([range, count]) => [range, count]);

                autoTable(doc, {
                    startY: currentY,
                    head: [['Salary Range', 'Student Count']],
                    body: salaryData as any,
                    theme: 'striped',
                    headStyles: { fillColor: [16, 185, 129] },
                    styles: { halign: 'center' }
                });
            }

            // --- PAGE 3: Trends & Roles ---
            doc.addPage();
            currentY = addHeader('Placement Trends & Roles');

            if (chart2Img) {
                doc.setFontSize(12);
                doc.text('Monthly Placement Progress', margin, currentY);
                currentY += 8;

                const imgProps = doc.getImageProperties(chart2Img);
                const pdfWidth = pageWidth - (margin * 2);
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

                doc.addImage(chart2Img, 'PNG', margin, currentY, pdfWidth, pdfHeight);
                currentY += pdfHeight + 15;
            }

            if (chart3Img) {
                // Check space
                if (currentY + 100 > pageHeight) {
                    doc.addPage();
                    currentY = addHeader('Role Distribution');
                }


            }

            // --- PAGE 4: Departments & Recruiters ---
            doc.addPage();
            currentY = addHeader('Department & Recruiter Performance');

            // Department Table
            if (stats?.departmentWise) {
                doc.setFontSize(12);
                doc.text('Department Stats', margin, currentY);
                currentY += 5;
                autoTable(doc, {
                    startY: currentY,
                    head: [['Department', 'Total', 'Placed', 'Rate (%)']],
                    body: stats.departmentWise.map((d: any) => [
                        d.department, d.total, d.placed, d.rate.toFixed(2)
                    ]),
                    theme: 'striped',
                    headStyles: { fillColor: [79, 70, 229] },
                    columnStyles: { 3: { halign: 'right' } }
                });
                currentY = (doc as any).lastAutoTable.finalY + 15;
            }

            // Company Table
            doc.setFontSize(12);
            doc.text('Top Recruiter Analysis', margin, currentY);
            currentY += 5;

            autoTable(doc, {
                startY: currentY,
                head: [['Company', 'Applications', 'Selections', 'Conv. Rate (%)']],
                body: companyStats.map((c: any) => [
                    c._id, c.totalApplications, c.selections, (c.conversionRate || 0).toFixed(1)
                ]),
                theme: 'striped',
                headStyles: { fillColor: [139, 92, 246] },
                columnStyles: { 3: { halign: 'right' } }
            });

            doc.save('Placement_Report_Final.pdf');
            toast.success('Report generated successfully!');

        } catch (error) {
            console.error('PDF Generation Error:', error);
            toast.error('Failed to generate PDF. Check console.');
        }
    };

    const downloadExcel = async () => {
        try {
            const students = await getStudentReportData();
            const ws = XLSX.utils.json_to_sheet(students);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Students");
            XLSX.writeFile(wb, "placement-data.xlsx");
        } catch (error) {
            toast.error('Failed to download Excel');
        }
    };

    if (loading) return <div className="p-8 text-center text-white">Loading reports...</div>;

    // Transform Data for Charts
    const salaryData = stats?.overview?.salaryDistribution ?
        Object.entries(stats.overview.salaryDistribution).map(([name, value]) => ({ name, value })) : [];

    const roleData = stats?.overview?.roleDistribution ?
        Object.entries(stats.overview.roleDistribution).map(([name, value]) => ({ name, value })) : [];

    const timelineData = stats?.overview?.placementTimeline ?
        Object.entries(stats.overview.placementTimeline).map(([name, value]) => ({ name, value })) : [];

    const COLORS = ['#818cf8', '#34d399', '#f472b6', '#fbbf24', '#60a5fa', '#a78bfa'];

    const metrics = [
        {
            label: 'Total Registered',
            value: stats?.overview?.totalStudents || 0,
            icon: Users,
            color: 'bg-blue-500/20 text-blue-400'
        },
        {
            label: 'Students Placed',
            value: stats?.overview?.placedStudents || 0,
            icon: Briefcase,
            color: 'bg-emerald-500/20 text-emerald-400'
        },
        {
            label: 'Placement Rate',
            value: `${stats?.overview?.placementRate || 0}%`,
            icon: BarChart2,
            color: 'bg-purple-500/20 text-purple-400'
        },
        {
            label: 'Active Drives',
            value: stats?.overview?.activeJobs || 0,
            icon: PieChart,
            color: 'bg-orange-500/20 text-orange-400'
        },
        {
            label: 'Highest Package',
            value: `₹${stats?.overview?.highestPackage || 0} LPA`,
            icon: TrendingUp,
            color: 'bg-pink-500/20 text-pink-400'
        },
        {
            label: 'Average Package',
            value: `₹${stats?.overview?.averagePackage || 0} LPA`,
            icon: Activity,
            color: 'bg-cyan-500/20 text-cyan-400'
        }
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-white">Placement Reports</h2>
                    <p className="text-gray-400">Deep dive into placement metrics and trends.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={downloadPDF}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-colors border border-red-500/20"
                    >
                        <FileText className="w-4 h-4" /> Export Report
                    </button>
                    <button
                        onClick={downloadExcel}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-xl hover:bg-emerald-500/20 transition-colors border border-emerald-500/20"
                    >
                        <Download className="w-4 h-4" /> Raw Data
                    </button>
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {metrics.map((metric, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="glass-card p-4 hover:bg-white/5 transition-colors"
                    >
                        <div className="flex flex-col h-full justify-between">
                            <div className="flex justify-between items-start mb-2">
                                <div className={`p-2 rounded-lg ${metric.color}`}>
                                    <metric.icon className="w-5 h-5" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-1">{metric.value}</h3>
                                <p className="text-gray-400 text-xs font-medium">{metric.label}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Unplaced Insights */}
            <div className="glass-card p-6 bg-red-500/5 border-red-500/10">
                <div className="flex items-center gap-2 mb-4">
                    <AlertCircle className="text-red-400 w-5 h-5" />
                    <h3 className="text-lg font-bold text-white">Unplaced Student Insights</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <p className="text-gray-400 text-sm">Total Unplaced</p>
                        <p className="text-2xl font-bold text-white">{stats?.overview?.unplacedStats?.total || 0}</p>
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm">Average CGPA</p>
                        <p className="text-2xl font-bold text-white">{stats?.overview?.unplacedStats?.avgCGPA || 0}</p>
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm">Students with Backlogs</p>
                        <p className="text-2xl font-bold text-white">{stats?.overview?.unplacedStats?.withBacklogs || 0}</p>
                    </div>
                </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card p-6" id="chart-salary">
                    <h3 className="text-lg font-bold text-white mb-6">Salary Distribution</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={salaryData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={false} />
                                <XAxis type="number" stroke="#9ca3af" />
                                <YAxis dataKey="name" type="category" width={100} stroke="#9ca3af" tick={{ fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                />
                                <Bar dataKey="value" fill="#818cf8" radius={[0, 4, 4, 0]} name="Students" barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="glass-card p-6" id="chart-timeline">
                    <h3 className="text-lg font-bold text-white mb-6">Placement Trend (Monthly)</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={timelineData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="name" stroke="#9ca3af" />
                                <YAxis stroke="#9ca3af" />
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} />
                                <Line type="monotone" dataKey="value" stroke="#34d399" strokeWidth={3} dot={{ fill: '#34d399' }} name="Selections" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="glass-card p-6 lg:col-span-1" id="chart-role">
                    <h3 className="text-lg font-bold text-white mb-6">Role Distribution</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RechartsPieChart>
                                <Pie
                                    data={roleData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {roleData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} />
                            </RechartsPieChart>
                        </ResponsiveContainer>
                        <div className="mt-4 flex flex-wrap justify-center gap-2">
                            {roleData.map((entry, index) => (
                                <div key={index} className="flex items-center text-xs text-gray-400">
                                    <div className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                    {entry.name}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="glass-card p-6 lg:col-span-2">
                    <h3 className="text-lg font-bold text-white mb-6">Top Company Conversions</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="text-xs uppercase text-gray-400 bg-white/5">
                                <tr>
                                    <th className="px-4 py-3 rounded-l-lg">Company</th>
                                    <th className="px-4 py-3">Applications</th>
                                    <th className="px-4 py-3">Selections</th>
                                    <th className="px-4 py-3 rounded-r-lg">Conversion Rate</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {companyStats.slice(0, 5).map((company: any) => (
                                    <tr key={company._id} className="text-sm text-gray-300 hover:bg-white/5 transition-colors">
                                        <td className="px-4 py-3 font-medium text-white">{company._id}</td>
                                        <td className="px-4 py-3">{company.totalApplications}</td>
                                        <td className="px-4 py-3">{company.selections}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-emerald-500 rounded-full"
                                                        style={{ width: `${Math.min(company.conversionRate, 100)}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-emerald-400">{(company.conversionRate || 0).toFixed(1)}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Department Stats */}
            <div className="glass-card p-6">
                <h3 className="text-xl font-bold text-white mb-6">Department Performance</h3>
                <div className="space-y-4">
                    {stats?.departmentWise?.map((dept: any) => (
                        <div key={dept.department} className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium text-gray-300">{dept.department}</span>
                                <span className="text-gray-400">
                                    {dept.placed}/{dept.total} ({dept.rate.toFixed(1)}%)
                                </span>
                            </div>
                            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${dept.rate}%` }}
                                    className="h-full bg-indigo-500 rounded-full"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ReportGenerator;
