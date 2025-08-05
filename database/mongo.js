import mongoose from 'mongoose';
import { config } from '../config.js';

export const connectDB = async () => {
  try {
    if (!config.mongoURI || config.mongoURI === 'YOUR_MONGO_URI') {
      console.log('⚠️ MongoDB URI not configured, running without database');
      return;
    }
    await mongoose.connect(config.mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err);
    console.log('⚠️ Continuing without database...');
  }
};
