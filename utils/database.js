/**
 * Updated MongoDB Connection Configuration
 * Removes deprecated options and warnings
 */

import mongoose from 'mongoose';

/**
 * Connect to MongoDB database
 * Uses modern connection method without deprecated options
 */
export const connectDatabase = async () => {
  try {
    // ✅ Modern connection (no deprecated options)
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully');
    console.log(`🗄️ Database: ${mongoose.connection.name}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    console.error('🔧 Check your MONGODB_URI environment variable');
    process.exit(1);
  }
};

/**
 * Set up connection event handlers
 */
export const setupDatabaseEvents = () => {
  // Connection successful
  mongoose.connection.on('connected', () => {
    console.log('🔗 Mongoose connected to MongoDB');
  });

  // Connection error
  mongoose.connection.on('error', (err) => {
    console.error('❌ Mongoose connection error:', err);
  });

  // Disconnected
  mongoose.connection.on('disconnected', () => {
    console.log('🔌 Mongoose disconnected from MongoDB');
  });

  // Connection ready
  mongoose.connection.on('open', () => {
    console.log('📂 MongoDB connection opened');
  });

  // Process termination
  process.on('SIGINT', async () => {
    try {
      await mongoose.connection.close();
      console.log('🔌 MongoDB connection closed through app termination');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error closing MongoDB connection:', error);
      process.exit(1);
    }
  });

  // Handle Railway/Docker SIGTERM
  process.on('SIGTERM', async () => {
    try {
      await mongoose.connection.close();
      console.log('🔌 MongoDB connection closed through SIGTERM');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error closing MongoDB connection:', error);
      process.exit(1);
    }
  });
};

/**
 * Initialize database connection with events
 */
export const initializeDatabase = async () => {
  console.log('🚀 Initializing database connection...');
  
  // Set up event handlers first
  setupDatabaseEvents();
  
  // Connect to database
  await connectDatabase();
  
  console.log('✅ Database initialization completed');
};

/**
 * Check database connection status
 */
export const getDatabaseStatus = () => {
  const state = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected', 
    2: 'connecting',
    3: 'disconnecting'
  };
  
  return {
    state: states[state] || 'unknown',
    name: mongoose.connection.name,
    host: mongoose.connection.host,
    port: mongoose.connection.port
  };
};