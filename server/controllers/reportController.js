const User = require('../models/User');
const Drive = require('../models/Drive');
const Application = require('../models/Application');
const mongoose = require('mongoose');

// Get overall placement statistics
exports.getPlacementStats = async (req, res) => {
    try {
        const totalStudents = await User.countDocuments({ role: 'student' });

        // Find distinct students who have at least one 'selected' application
        const placedApps = await Application.find({ status: 'selected' }).populate('drive');
        // Keep as strings for unplaced calculation (find query handles casting automatically)
        const placedStudentIds = [...new Set(placedApps.map(app => app.student.toString()))];
        const placedStudents = placedStudentIds.length;

        const totalJobs = await Drive.countDocuments();
        const activeJobs = await Drive.countDocuments({ status: 'active' });

        // Calculate placement percentage
        const placementRate = totalStudents > 0 ? ((placedStudents / totalStudents) * 100).toFixed(2) : 0;

        // --- Advanced Analytics ---

        // 1. Salary Stats & Distribution
        let highestPackage = 0;
        let totalPackage = 0;
        let packageCount = 0;

        const salaryDistribution = {
            '< 3 LPA': 0,
            '3-6 LPA': 0,
            '6-10 LPA': 0,
            '10-15 LPA': 0,
            '15+ LPA': 0
        };

        const roleDistribution = {};
        const placementTimeline = {}; // Format: "Mon-YYYY" -> count

        placedApps.forEach(app => {
            // Salary Logic
            if (app.drive && app.drive.ctc) {
                let ctc = app.drive.ctc.toString().toLowerCase();
                let value = 0;
                ctc = ctc.replace(/,/g, '');
                const match = ctc.match(/(\d+(\.\d+)?)/);
                if (match) {
                    value = parseFloat(match[0]);
                    if (value > 100) value = value / 100000; // Normalize absolute numbers to LPA
                }

                if (value > 0) {
                    if (value > highestPackage) highestPackage = value;
                    totalPackage += value;
                    packageCount++;

                    // Salary Tier
                    if (value < 3) salaryDistribution['< 3 LPA']++;
                    else if (value < 6) salaryDistribution['3-6 LPA']++;
                    else if (value < 10) salaryDistribution['6-10 LPA']++;
                    else if (value < 15) salaryDistribution['10-15 LPA']++;
                    else salaryDistribution['15+ LPA']++;
                }
            }

            // Role Logic
            if (app.drive && app.drive.position) {
                const role = app.drive.position.trim();
                roleDistribution[role] = (roleDistribution[role] || 0) + 1;
            }

            // Timeline Logic (using updatedAt as proxy for selection date)
            const date = new Date(app.updatedAt);
            const monthYear = date.toLocaleString('default', { month: 'short', year: 'numeric' });
            placementTimeline[monthYear] = (placementTimeline[monthYear] || 0) + 1;
        });

        const averagePackage = packageCount > 0 ? (totalPackage / packageCount).toFixed(2) : 0;

        // 2. Unplaced Analysis
        const unplacedStudents = await User.find({
            role: 'student',
            _id: { $nin: placedStudentIds }
        }).select('cgpa backlogs');

        let totalUnplacedCGPA = 0;
        let unplacedWithBacklogs = 0;

        unplacedStudents.forEach(student => {
            if (student.cgpa) totalUnplacedCGPA += student.cgpa;
            if (student.backlogs > 0) unplacedWithBacklogs++;
        });

        const avgUnplacedCGPA = unplacedStudents.length > 0
            ? (totalUnplacedCGPA / unplacedStudents.length).toFixed(2)
            : 0;


        // Get department-wise stats
        // 1. Get total students per branch
        const studentsByBranch = await User.aggregate([
            { $match: { role: 'student' } },
            { $group: { _id: "$branch", total: { $sum: 1 } } }
        ]);

        // 2. Get placed students per branch
        // CRITICAL FIX: Convert string IDs to ObjectIds for aggregation pipeline
        const placedStudentObjectIds = placedStudentIds.map(id => new mongoose.Types.ObjectId(id));

        const placedByBranch = await User.aggregate([
            { $match: { _id: { $in: placedStudentObjectIds }, role: 'student' } },
            { $group: { _id: "$branch", placed: { $sum: 1 } } }
        ]);

        // 3. Merge results
        const deptStats = studentsByBranch.map(dept => {
            const placedRecord = placedByBranch.find(p => p._id === dept._id);
            const placedCount = placedRecord ? placedRecord.placed : 0;
            return {
                department: dept._id || 'Unknown',
                total: dept.total,
                placed: placedCount,
                rate: dept.total > 0 ? (placedCount / dept.total) * 100 : 0
            };
        });

        res.json({
            overview: {
                totalStudents,
                placedStudents,
                placementRate,
                totalJobs,
                activeJobs,
                highestPackage: highestPackage.toFixed(2),
                averagePackage: averagePackage,
                salaryDistribution,
                roleDistribution,
                placementTimeline,
                unplacedStats: {
                    total: unplacedStudents.length,
                    avgCGPA: avgUnplacedCGPA,
                    withBacklogs: unplacedWithBacklogs
                }
            },
            departmentWise: deptStats
        });
    } catch (error) {
        console.error('Error fetching placement stats:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get company-wise placement report
exports.getCompanyStats = async (req, res) => {
    try {
        // We want statistics for all companies that have received applications
        const companyStats = await Application.aggregate([
            {
                $lookup: {
                    from: 'drives',
                    localField: 'drive',
                    foreignField: '_id',
                    as: 'driveDetails'
                }
            },
            { $unwind: '$driveDetails' },
            {
                $group: {
                    _id: '$driveDetails.companyName',
                    totalApplications: { $sum: 1 },
                    selections: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "selected"] }, 1, 0]
                        }
                    },
                    roles: { $addToSet: '$driveDetails.position' }
                }
            },
            {
                $project: {
                    companyName: "$_id",
                    totalApplications: 1,
                    selections: 1,
                    roles: 1,
                    conversionRate: {
                        $cond: [
                            { $eq: ["$totalApplications", 0] },
                            0,
                            { $multiply: [{ $divide: ["$selections", "$totalApplications"] }, 100] }
                        ]
                    }
                }
            },
            { $sort: { selections: -1 } }
        ]);

        // Fetch Avg Package separately or include it in lookup if complex. 
        // For simplicity, sticking to previous aggregation for avg package might be needed or we fuse them.
        // Let's do a simple merge with previous logic if we want avg package.
        // Actually, converting CTC string to avg is hard in aggregation. 
        // We will return this structure and let frontend handle or do a second query if strictly needed.
        // The previous implementation had avg package but simpler counting.
        // Let's stick to the requested conversion rate emphasis.

        res.json(companyStats);
    } catch (error) {
        console.error('Error fetching company stats:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get download data (full student dump for export)
exports.getStudentReportData = async (req, res) => {
    try {
        const { department, batch } = req.query;
        let query = { role: 'student' };

        if (department) query.branch = department;
        if (batch) query.year = batch;

        const students = await User.find(query)
            .select('name email studentId branch cgpa year')
            .lean();

        // Fetch placement status for these students
        // We need to know if they are placed, and if so, where and package.
        // This requires finding their selected applications.
        const studentIds = students.map(s => s._id);
        const selectedApps = await Application.find({
            student: { $in: studentIds },
            status: 'selected'
        }).populate('drive', 'companyName ctc');

        // Create a map for quick lookup: studentId -> [app1, app2]
        const placementMap = {};
        selectedApps.forEach(app => {
            if (!placementMap[app.student.toString()]) {
                placementMap[app.student.toString()] = [];
            }
            placementMap[app.student.toString()].push(app);
        });

        // Merge data
        const reportData = students.map(student => {
            const apps = placementMap[student._id.toString()];
            const isPlaced = !!(apps && apps.length > 0);
            const companies = apps ? apps.map(a => a.drive.companyName).join(', ') : '-';
            const packages = apps ? apps.map(a => a.drive.ctc).join(', ') : '-';

            return {
                name: student.name,
                email: student.email,
                rollNo: student.studentId || 'N/A',
                department: student.branch,
                cgpa: student.cgpa,
                isPlaced: isPlaced ? 'Yes' : 'No',
                placedCompany: companies,
                package: packages
            };
        });

        res.json(reportData);
    } catch (error) {
        console.error('Error fetching student report data:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
