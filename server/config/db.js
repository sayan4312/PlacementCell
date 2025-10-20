const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // MongoDB Atlas connection options
    const options = {
      maxPoolSize: 10, 
      serverSelectionTimeoutMS: 5000, 
      socketTimeoutMS: 45000,
      bufferCommands: true,
    };

    // Get connection string from environment
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error('MongoDB URI is not defined in environment variables');
    }

    console.log('Connecting to MongoDB Atlas...');
    
    const conn = await mongoose.connect(mongoURI, options);

    console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`🔗 Connection URL: ${conn.connection.host}/${conn.connection.name}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed through app termination');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error closing MongoDB connection:', error);
        process.exit(1);
      }
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      console.error('❌ Unhandled Promise Rejection:', err);
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    
    // Provide helpful error messages
    if (error.message.includes('ECONNREFUSED')) {
      console.error('💡 Tip: Check if your MongoDB Atlas cluster is running and accessible');
    } else if (error.message.includes('Authentication failed')) {
      console.error('💡 Tip: Check your MongoDB Atlas username and password');
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('💡 Tip: Check your MongoDB Atlas connection string');
    }
    
    process.exit(1);
  }
};

module.exports = connectDB; 