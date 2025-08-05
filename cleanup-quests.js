import 'dotenv/config';
import mongoose from 'mongoose';

console.log('🗑️ Cleaning up Quest collection...');

try {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB');
  
  // Xóa collection Quest cũ
  await mongoose.connection.db.collection('quests').drop();
  console.log('✅ Dropped old quests collection');
  
} catch (error) {
  if (error.message.includes('ns not found')) {
    console.log('ℹ️ Collection "quests" không tồn tại, không cần xóa');
  } else {
    console.error('❌ Error:', error.message);
  }
} finally {
  await mongoose.disconnect();
  console.log('🔌 Disconnected from MongoDB');
}
