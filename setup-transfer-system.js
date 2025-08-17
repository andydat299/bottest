import mongoose from 'mongoose';

console.log('💸 SETTING UP TRANSFER SYSTEM...\n');

async function setupTransferSystem() {
  try {
    // Connect to database
    if (mongoose.connection.readyState !== 1) {
      console.log('📡 Connecting to database...');
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bottest');
    }

    console.log('✅ Connected to database');

    const db = mongoose.connection.db;

    // Create transfers collection with proper indexes
    console.log('📦 Setting up transfers collection...');
    
    const transfersCollection = db.collection('transfers');
    
    // Create indexes for better performance
    await transfersCollection.createIndex({ senderId: 1 });
    await transfersCollection.createIndex({ recipientId: 1 });
    await transfersCollection.createIndex({ createdAt: -1 });
    await transfersCollection.createIndex({ senderId: 1, createdAt: -1 });
    await transfersCollection.createIndex({ recipientId: 1, createdAt: -1 });
    await transfersCollection.createIndex({ amount: -1 });
    await transfersCollection.createIndex({ status: 1 });
    
    console.log('✅ Created transfers collection with indexes');

    // Check if users collection has transfer-related fields
    console.log('👥 Checking users collection...');
    const usersCollection = db.collection('users');
    
    // Add transfer stats to existing users if not present
    const usersWithoutTransferStats = await usersCollection.countDocuments({
      transferStats: { $exists: false }
    });
    
    if (usersWithoutTransferStats > 0) {
      console.log(`🔄 Adding transfer stats to ${usersWithoutTransferStats} users...`);
      
      await usersCollection.updateMany(
        { transferStats: { $exists: false } },
        { 
          $set: { 
            transferStats: {
              totalSent: 0,
              totalReceived: 0,
              totalFees: 0,
              transferCount: 0,
              receiveCount: 0,
              lastTransfer: null
            }
          } 
        }
      );
      
      console.log('✅ Updated users with transfer stats');
    }

    console.log('\n💸 TRANSFER SYSTEM CONFIGURATION:');
    console.log('==================================');

    console.log('\n📊 Transfer Settings:');
    console.log('• Minimum amount: 1,000 xu');
    console.log('• Maximum amount: 100,000 xu');
    console.log('• Transfer fee: 2% (deducted from sender)');
    console.log('• Rate limit: 10 transfers per hour');
    console.log('• Self-transfer: Blocked');
    console.log('• Bot-transfer: Blocked');

    console.log('\n🛡️ Security Features:');
    console.log('• Transaction logging');
    console.log('• Rate limiting (10/hour)');
    console.log('• Balance validation');
    console.log('• Atomic transactions');
    console.log('• Auto DM notifications');

    console.log('\n📋 Available Commands:');
    console.log('• /transfer - Chuyển xu cho người khác');
    console.log('• /transfer-history - Xem lịch sử chuyển tiền');
    console.log('• /transfer-leaderboard - Bảng xếp hạng');

    console.log('\n💡 Transfer Examples:');
    console.log('============================');

    console.log('\n📤 Basic Transfer:');
    console.log('/transfer recipient:@username amount:10000');
    console.log('→ Gửi 10,000 xu, phí 200 xu, người nhận được 9,800 xu');

    console.log('\n📤 Transfer with Message:');
    console.log('/transfer recipient:@friend amount:5000 message:"Cảm ơn bạn đã giúp đỡ!"');
    console.log('→ Gửi kèm tin nhắn cảm ơn');

    console.log('\n📊 View History:');
    console.log('/transfer-history type:sent    # Xem lịch sử đã gửi');
    console.log('/transfer-history type:received # Xem lịch sử đã nhận');
    console.log('/transfer-history type:all      # Xem tất cả');

    console.log('\n🏆 Leaderboards:');
    console.log('/transfer-leaderboard category:top_senders      # Top người gửi');
    console.log('/transfer-leaderboard category:top_receivers    # Top người nhận');
    console.log('/transfer-leaderboard category:most_active      # Hoạt động tích cực');
    console.log('/transfer-leaderboard category:highest_transfers # Giao dịch lớn');

    console.log('\n📈 Expected Benefits:');
    console.log('• Increased user interaction');
    console.log('• Community building');
    console.log('• Xu circulation improvement');
    console.log('• Social gaming elements');

    console.log('\n💰 Economy Impact:');
    console.log('• Fee collection for system stability');
    console.log('• Controlled transfer limits');
    console.log('• Prevents excessive money flow');
    console.log('• Encourages earning activities');

    // Sample transfer for demonstration
    console.log('\n🧪 Creating sample transfer data...');
    
    const sampleTransfers = [
      {
        senderId: 'sample_user_1',
        senderUsername: 'SampleUser1',
        recipientId: 'sample_user_2', 
        recipientUsername: 'SampleUser2',
        amount: 10000,
        fee: 200,
        amountReceived: 9800,
        message: 'Sample transfer for testing',
        status: 'completed',
        createdAt: new Date()
      },
      {
        senderId: 'sample_user_2',
        senderUsername: 'SampleUser2',
        recipientId: 'sample_user_3',
        recipientUsername: 'SampleUser3', 
        amount: 25000,
        fee: 500,
        amountReceived: 24500,
        message: 'Thank you for helping!',
        status: 'completed',
        createdAt: new Date(Date.now() - 1000 * 60 * 60) // 1 hour ago
      }
    ];

    // Only add samples if no transfers exist
    const existingTransfers = await transfersCollection.countDocuments({});
    if (existingTransfers === 0) {
      await transfersCollection.insertMany(sampleTransfers);
      console.log('✅ Added sample transfer data for testing');
    } else {
      console.log(`📊 Found ${existingTransfers} existing transfers`);
    }

    console.log('\n🎯 DEPLOYMENT CHECKLIST:');
    console.log('========================');
    console.log('1. ✅ Database schema created');
    console.log('2. ✅ Indexes optimized');
    console.log('3. ✅ Sample data ready');
    console.log('4. 🔄 Deploy commands: npm run deploy');
    console.log('5. 🔄 Test transfer: /transfer');
    console.log('6. 🔄 Check leaderboard: /transfer-leaderboard');

  } catch (error) {
    console.error('❌ Error setting up transfer system:', error);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('📴 Disconnected from database');
    }
  }
}

// Run setup
if (import.meta.url === `file://${process.argv[1]}`) {
  setupTransferSystem().then(() => {
    console.log('\n✅ Transfer system setup completed!');
    console.log('\n🚀 NEXT STEPS:');
    console.log('1. npm run deploy');
    console.log('2. Test /transfer command');
    console.log('3. Check /transfer-history');
    console.log('4. View /transfer-leaderboard');
    console.log('5. Monitor user adoption!');
  });
}