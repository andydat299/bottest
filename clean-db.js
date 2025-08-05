import 'dotenv/config';
import mongoose from 'mongoose';

async function cleanDatabase() {
  try {
    if (!process.env.MONGO_URI || process.env.MONGO_URI === 'YOUR_MONGO_URI') {
      console.log('❌ MongoDB URI not configured');
      return;
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Drop the users collection to reset indexes
    const db = mongoose.connection.db;
    try {
      await db.collection('users').drop();
      console.log('✅ Dropped old users collection');
    } catch (error) {
      console.log('ℹ️ Collection may not exist yet:', error.message);
    }

    console.log('✅ Database cleaned successfully');
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
  }
}

cleanDatabase();
