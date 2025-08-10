/**
 * Script để thêm field autoFishingToday vào userSchema hiện có
 * Chạy script này để update schema mà không làm mất dữ liệu cũ
 */

import mongoose from 'mongoose';

async function addAutoFishingField() {
  try {
    console.log('🔧 Đang thêm field autoFishingToday vào userSchema...');
    
    // Kết nối database
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bottest');
    }
    
    // Lấy collection users
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    // Thêm field autoFishingToday cho tất cả users chưa có
    const result = await usersCollection.updateMany(
      { autoFishingToday: { $exists: false } },
      { 
        $set: { 
          autoFishingToday: {
            date: null,
            minutes: 0
          }
        }
      }
    );
    
    console.log(`✅ Đã cập nhật ${result.modifiedCount} users với field autoFishingToday`);
    
    // Kiểm tra kết quả
    const sampleUser = await usersCollection.findOne({});
    console.log('📊 Sample user schema:', {
      _id: sampleUser?._id,
      autoFishingToday: sampleUser?.autoFishingToday,
      hasField: !!sampleUser?.autoFishingToday
    });
    
    console.log('🎉 Hoàn thành! Bây giờ auto-fishing sẽ track quota hằng ngày.');
    
  } catch (error) {
    console.error('❌ Lỗi khi thêm field:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Chạy script nếu được gọi trực tiếp
if (import.meta.url === `file://${process.argv[1]}`) {
  addAutoFishingField();
}

export { addAutoFishingField };