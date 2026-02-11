const Application = require('../models/Application');
const csv = require('csv-parse');
const User = require('../models/User');
const Drive = require('../models/Drive');
const mongoose = require('mongoose');

exports.getAllApplications = async (req, res) => {
  try {
    const { company } = req.query;

    let query = {};

    // Get user info to check if TPO and filter by department
    const user = await User.findById(req.user.userId);
    if (user.role === 'tpo') {
      // For TPOs, only show applications from students in their department
      const department = user.department;
      // Find students in this department
      const students = await User.find({
        role: 'student',
        branch: department
      }).select('_id');

      const studentIds = students.map(student => student._id);

      // Find applications from these students
      query.student = { $in: studentIds };
    } else if (company) {
      // If company filter is provided, find applications for that company's drives
      const drives = await Drive.find({
        companyName: { $regex: company, $options: 'i' }
      }).select('_id');

      const driveIds = drives.map(drive => drive._id);

      // Then find applications for these drives
      query.drive = { $in: driveIds };
    }

    const applications = await Application.find(query)
      .populate('student', 'name email rollNumber branch year cgpa')
      .populate({
        path: 'drive',
        select: 'title companyName position ctc location deadline status',
        populate: {
          path: 'company',
          select: 'companyName industry'
        },
        match: {
          companyName: { $exists: true, $ne: null, $ne: '' },
          position: { $exists: true, $ne: null, $ne: '' }
        }
      })
      .sort({ appliedAt: -1 });

    // Filter out applications where drive population failed due to missing data
    const validApplications = applications.filter(app =>
      app.drive &&
      app.drive.companyName &&
      app.drive.position &&
      app.drive.companyName !== 'Unknown Company' &&
      app.drive.position !== 'Unknown Position'
    );

    res.json({ applications: validApplications });
  } catch (error) {
    console.error('Get all applications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Bulk import shortlist from CSV
exports.importShortlist = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  const { driveId } = req.body;
  if (!driveId) {
    return res.status(400).json({ message: 'Drive ID is required' });
  }

  try {
    // Validate that the drive exists and the user has permission to manage it
    const drive = await Drive.findById(driveId);
    if (!drive) {
      return res.status(404).json({ message: 'Drive not found' });
    }

    // Check if user is TPO or if company user owns this drive
    if (req.user.role === 'tpo') {
      // TPO can manage drives in their department
      // Additional validation can be added here if needed
    } else if (req.user.role === 'company') {
      // Company user can only manage their own drives
      if (drive.company.toString() !== req.user.userId) {
        return res.status(403).json({ message: 'Unauthorized to manage this drive' });
      }
    } else {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    // First, get all applications for this drive
    const allApplicationsForDrive = await Application.find({
      drive: driveId,
      status: { $in: ['pending', 'applied', 'shortlisted'] } // Include all active applications
    }).populate('student', 'name email');

    const shortlistedIds = [];
    const errors = [];
    const parser = csv.parse({ columns: true, trim: true });

    req.file.buffer
      .toString()
      .split('\n')
      .forEach(line => parser.write(line + '\n'));
    parser.end();

    // Collect all shortlisted Application IDs from CSV
    for await (const record of parser) {
      const appId = record['Application ID'] || record['application_id'] || record['id'] || record['app_id'];
      const studentName = record['Student Name'] || record['student_name'] || record['name'];
      const email = record['Email'] || record['email'];
      const status = (record['Status'] || record['status'] || '').toLowerCase();
      const position = record['Position'] || record['position'] || record['drive'];
      const company = record['Company'] || record['company'];

      if (!appId) {
        errors.push({ appId: 'Missing', studentName: studentName || 'Unknown', error: 'Application ID is required' });
        continue;
      }

      // Process both shortlisted and selected statuses
      if (status && !['shortlisted', 'selected'].includes(status)) {
        errors.push({ appId, studentName: studentName || 'Unknown', error: `Invalid status: ${status}. Only 'shortlisted' or 'selected' candidates should be included.` });
        continue;
      }

      // Validate that this application ID exists for this drive
      const appExists = allApplicationsForDrive.find(app => app._id.toString() === appId);
      if (!appExists) {
        errors.push({ appId, studentName: studentName || 'Unknown', error: 'Application not found for this drive' });
        continue;
      }

      shortlistedIds.push({ appId, status: status || 'shortlisted' });
    }

    console.log('DEBUG: shortlistedIds sample:', shortlistedIds.slice(0, 2));

    // Extract just the application IDs for the rejection query
    const applicationIds = shortlistedIds.map(item => item.appId);
    console.log('DEBUG: applicationIds sample:', applicationIds.slice(0, 2));

    let shortlistedCount = 0;
    let selectedCount = 0;
    let processedIds = []; // Track successfully processed IDs

    // Process each application individually to avoid parallel save errors
    for (const csvItem of shortlistedIds) {
      try {
        // Find and update each application individually
        const app = await Application.findOne({
          _id: csvItem.appId,
          drive: driveId,
          status: { $in: ['pending', 'applied', 'shortlisted'] }
        });

        if (!app) {
          console.log(`Application ${csvItem.appId} not found or already in final status`);
          continue;
        }

        const targetStatus = csvItem.status || 'shortlisted';

        if (targetStatus === 'selected') {
          app.updateStatusAndTimeline('selected');
          await app.save();
          selectedCount++;
        } else {
          app.updateStatusAndTimeline('shortlisted');
          await app.save();
          shortlistedCount++;
        }

        processedIds.push(csvItem.appId);
        console.log(`Successfully updated application ${app._id} to ${targetStatus}`);

      } catch (error) {
        console.error(`Error updating application ${csvItem.appId}:`, error.message);
        // Continue processing other applications
      }
    }

    const rejectedCount = await Application.updateMany(
      {
        drive: driveId,
        _id: { $nin: processedIds }, // NOT in successfully processed IDs
        status: { $in: ['pending', 'applied'] } // Only reject pending/applied, not already shortlisted
      },
      { status: 'rejected' }
    );

    // Get detailed results for response
    const shortlistedApps = await Application.find({
      drive: driveId,
      _id: { $in: processedIds }
    }).populate('student', 'name email');

    const results = shortlistedApps.map(app => ({
      appId: app._id,
      status: 'shortlisted',
      studentName: app.student?.name || 'Unknown',
      studentEmail: app.student?.email || 'Unknown'
    }));

    res.json({
      shortlisted: shortlistedCount,
      selected: selectedCount,
      rejected: rejectedCount.modifiedCount,
      errors,
      driveTitle: drive.title,
      companyName: drive.companyName,
      results,
      message: `Processed ${shortlistedCount} shortlisted, ${selectedCount} selected candidates and rejected ${rejectedCount.modifiedCount} others for ${drive.companyName}'s ${drive.title} drive`
    });

  } catch (error) {
    console.error('Import shortlist error:', error);
    res.status(500).json({ message: 'Server error during import' });
  }
};





exports.getStudentApplicationStats = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const studentId = new mongoose.Types.ObjectId(req.user.userId);

    const stats = await Application.aggregate([
      { $match: { student: studentId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalApplications = await Application.countDocuments({ student: studentId });
    const recentApplications = await Application.find({ student: studentId })
      .populate('drive', 'title companyName')
      .sort({ appliedAt: -1 })
      .limit(5);

    res.json({
      stats,
      totalApplications,
      recentApplications
    });
  } catch (error) {
    console.error('Get application stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Clean up orphaned applications (applications with non-existent drives)
// @route   DELETE /api/applications/cleanup-orphaned
// @access  Private (Admin only)
exports.cleanupOrphanedApplications = async (req, res) => {
  try {
    // Find all applications
    const allApplications = await Application.find({});

    const orphanedApplications = [];

    // Check each application to see if its drive still exists
    for (const application of allApplications) {
      if (application.drive) {
        const driveExists = await Drive.findById(application.drive);
        if (!driveExists) {
          orphanedApplications.push(application._id);
        }
      } else {
        // Applications without a drive reference are also orphaned
        orphanedApplications.push(application._id);
      }
    }

    // Delete orphaned applications
    const result = await Application.deleteMany({
      _id: { $in: orphanedApplications }
    });

    res.json({
      message: `Cleanup completed. Removed ${result.deletedCount} orphaned applications.`,
      deletedCount: result.deletedCount,
      orphanedIds: orphanedApplications
    });
  } catch (error) {
    console.error('Cleanup orphaned applications error:', error);
    res.status(500).json({ message: 'Server error during cleanup' });
  }
}; 