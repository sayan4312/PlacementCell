const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
require('dotenv').config();
const { configureCloudinary } = require('./config/cloudinary');
configureCloudinary();
const auth = require('./middleware/auth');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const driveRoutes = require('./routes/drives');
const applicationRoutes = require('./routes/applications');
const internshipRoutes = require('./routes/internships');
const adminRoutes = require('./routes/admin');
const analyticsRoutes = require('./routes/analytics');
const notificationRoutes = require('./routes/notifications');
const companyRoutes = require('./routes/company');
const reportRoutes = require('./routes/reportRoutes');
const offerRoutes = require('./routes/offerRoutes');
const chatRoutes = require('./routes/chatRoutes');

const app = express();

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Security middleware
app.use(helmet());
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static('uploads'));

// Health check endpoint (before auth middleware)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Initialize server function
const initializeServer = async () => {
  try {
    // Connect to database first
    await connectDB();

    // Routes (after database connection is established)
    app.use('/api/auth', authRoutes);
    app.use('/api', auth);
    app.use('/api/users', userRoutes);
    app.use('/api/drives', driveRoutes);
    app.use('/api/applications', applicationRoutes);
    app.use('/api/notifications', notificationRoutes);
    app.use('/api/internships', internshipRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/analytics', analyticsRoutes);
    app.use('/api/companies', companyRoutes);
    app.use('/api/reports', reportRoutes);
    app.use('/api/offers', offerRoutes);
    app.use('/api/chat', chatRoutes);

    // Error handling middleware
    app.use((err, req, res, next) => {
      console.error(err.stack);

      // Handle multer errors
      if (err.name === 'MulterError') {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({ message: 'Unexpected field name.' });
        }
      }

      // Handle validation errors
      if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(error => error.message);
        return res.status(400).json({
          message: 'Validation failed',
          errors
        });
      }

      // Handle JWT errors
      if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid token' });
      }

      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired' });
      }

      // Handle MongoDB errors
      if (err.name === 'CastError') {
        return res.status(400).json({ message: 'Invalid ID format' });
      }

      if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(400).json({
          message: `${field} already exists`
        });
      }

      res.status(500).json({
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
      });
    });

    // 404 handler
    app.use('*', (req, res) => {
      res.status(404).json({ message: 'Route not found' });
    });

    // Start server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

  } catch (error) {
    console.error('Failed to initialize server:', error);
    process.exit(1);
  }
};

// Start the server
initializeServer();