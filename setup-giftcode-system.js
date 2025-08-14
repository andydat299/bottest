import mongoose from 'mongoose';

console.log('🔧 SETTING UP GIFTCODE SYSTEM...\n');

async function setupGiftcodeSystem() {
  try {
    // Connect to database
    if (mongoose.connection.readyState !== 1) {
      console.log('📡 Connecting to database...');
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bottest');
    }

    console.log('✅ Connected to database');

    const db = mongoose.connection.db;
    
    // Create giftcodes collection with indexes
    console.log('📦 Creating giftcodes collection...');
    
    const giftcodesCollection = db.collection('giftcodes');
    
    // Create indexes for better performance
    await giftcodesCollection.createIndex({ code: 1 }, { unique: true });
    await giftcodesCollection.createIndex({ isActive: 1 });
    await giftcodesCollection.createIndex({ expiresAt: 1 });
    await giftcodesCollection.createIndex({ 'createdBy.discordId': 1 });
    
    console.log('✅ Created giftcodes collection with indexes');

    // Update users collection to support usedGiftcodes
    console.log('👥 Updating users collection...');
    
    const usersCollection = db.collection('users');
    
    // Add usedGiftcodes field to existing users who don't have it
    const updateResult = await usersCollection.updateMany(
      { usedGiftcodes: { $exists: false } },
      { $set: { usedGiftcodes: [] } }
    );
    
    console.log(`✅ Updated ${updateResult.modifiedCount} users with usedGiftcodes field`);

    // Create some sample giftcodes
    console.log('\n🎁 Creating sample giftcodes...');
    
    const sampleGiftcodes = [
      {
        code: 'WELCOME2024',
        rewards: {
          coins: 1000,
          fishingRods: [1],
          vipDays: 0
        },
        description: 'Giftcode chào mừng năm 2024',
        maxUses: 100,
        maxUsesPerUser: 1,
        expiresAt: null,
        isActive: true,
        usedCount: 0,
        usedBy: [],
        createdBy: {
          discordId: 'SYSTEM',
          username: 'System'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        code: 'FISHING50',
        rewards: {
          coins: 500,
          fishingRods: [3, 5],
          vipDays: 0
        },
        description: 'Giftcode cho người yêu thích câu cá',
        maxUses: 50,
        maxUsesPerUser: 2,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        isActive: true,
        usedCount: 0,
        usedBy: [],
        createdBy: {
          discordId: 'SYSTEM',
          username: 'System'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        code: 'VIP7DAY',
        rewards: {
          coins: 2000,
          fishingRods: [],
          vipDays: 7
        },
        description: 'Giftcode VIP 7 ngày đặc biệt',
        maxUses: 20,
        maxUsesPerUser: 1,
        expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
        isActive: true,
        usedCount: 0,
        usedBy: [],
        createdBy: {
          discordId: 'SYSTEM',
          username: 'System'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const giftcode of sampleGiftcodes) {
      try {
        await giftcodesCollection.insertOne(giftcode);
        console.log(`✅ Created giftcode: ${giftcode.code}`);
      } catch (error) {
        if (error.code === 11000) { // Duplicate key error
          console.log(`⚠️ Giftcode ${giftcode.code} already exists, skipping...`);
        } else {
          console.error(`❌ Error creating giftcode ${giftcode.code}:`, error.message);
        }
      }
    }

    // Get final statistics
    console.log('\n📊 GIFTCODE SYSTEM STATISTICS:');
    
    const totalGiftcodes = await giftcodesCollection.countDocuments();
    const activeGiftcodes = await giftcodesCollection.countDocuments({ isActive: true });
    const totalUsers = await usersCollection.countDocuments();
    const usersWithGiftcodeField = await usersCollection.countDocuments({ 
      usedGiftcodes: { $exists: true } 
    });

    console.log(`🎫 Total giftcodes: ${totalGiftcodes}`);
    console.log(`🟢 Active giftcodes: ${activeGiftcodes}`);
    console.log(`👥 Total users: ${totalUsers}`);
    console.log(`✅ Users with giftcode support: ${usersWithGiftcodeField}`);

    console.log('\n🎮 AVAILABLE COMMANDS:');
    console.log('📋 For Users:');
    console.log('  • /redeem code:CODE - Sử dụng giftcode');
    console.log('  • /giftcode-info - Xem thông tin hệ thống');
    
    console.log('\n👑 For Admins:');
    console.log('  • /giftcode-admin create - Tạo giftcode mới');
    console.log('  • /giftcode-admin list - Xem danh sách');
    console.log('  • /giftcode-admin info code:CODE - Chi tiết giftcode');
    console.log('  • /giftcode-admin disable code:CODE - Vô hiệu hóa');
    console.log('  • /giftcode-admin enable code:CODE - Kích hoạt lại');

    console.log('\n🎁 SAMPLE GIFTCODES TO TEST:');
    console.log('• WELCOME2024 - 1000 xu + Cần câu Level 1');
    console.log('• FISHING50 - 500 xu + Cần câu Level 3,5 (7 ngày)');
    console.log('• VIP7DAY - 2000 xu + 7 ngày VIP (3 ngày)');

    console.log('\n🚀 DEPLOYMENT:');
    console.log('1. npm run deploy');
    console.log('2. Test: /redeem code:WELCOME2024');
    console.log('3. Test: /giftcode-info');
    console.log('4. Admin test: /giftcode-admin list');

  } catch (error) {
    console.error('❌ Error setting up giftcode system:', error);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('📴 Disconnected from database');
    }
  }
}

// Run setup
if (import.meta.url === `file://${process.argv[1]}`) {
  setupGiftcodeSystem().then(() => {
    console.log('\n✅ Giftcode system setup completed!');
  });
}