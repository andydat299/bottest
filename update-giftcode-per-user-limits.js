import mongoose from 'mongoose';

console.log('🔄 UPDATING GIFTCODE SYSTEM WITH PER-USER LIMITS...\n');

async function updateGiftcodeSystem() {
  try {
    // Connect to database
    if (mongoose.connection.readyState !== 1) {
      console.log('📡 Connecting to database...');
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bottest');
    }

    console.log('✅ Connected to database');

    const db = mongoose.connection.db;
    const giftcodesCollection = db.collection('giftcodes');

    // Update existing giftcodes to have maxUsesPerUser field
    console.log('🔄 Adding maxUsesPerUser to existing giftcodes...');
    
    const updateResult = await giftcodesCollection.updateMany(
      { maxUsesPerUser: { $exists: false } },
      { $set: { maxUsesPerUser: 1 } }
    );

    console.log(`✅ Updated ${updateResult.modifiedCount} giftcodes with maxUsesPerUser: 1`);

    // Show current giftcodes with their limits
    console.log('\n📋 CURRENT GIFTCODES WITH LIMITS:');
    
    const giftcodes = await giftcodesCollection.find({ isActive: true }).toArray();
    
    for (const gc of giftcodes) {
      console.log(`\n🎫 ${gc.code}:`);
      console.log(`   📊 Total limit: ${gc.maxUses || 'Unlimited'}`);
      console.log(`   👤 Per-user limit: ${gc.maxUsesPerUser || 1}`);
      console.log(`   📈 Current usage: ${gc.usedCount}/${gc.maxUses || '∞'}`);
      
      // Show per-user usage statistics
      if (gc.usedBy && gc.usedBy.length > 0) {
        const userUsage = {};
        gc.usedBy.forEach(usage => {
          userUsage[usage.username] = (userUsage[usage.username] || 0) + 1;
        });
        
        console.log(`   👥 User usage:`);
        Object.entries(userUsage).slice(0, 5).forEach(([username, count]) => {
          console.log(`      ${username}: ${count}/${gc.maxUsesPerUser || 1}`);
        });
        
        if (Object.keys(userUsage).length > 5) {
          console.log(`      ... and ${Object.keys(userUsage).length - 5} more users`);
        }
      }
    }

    console.log('\n🎯 NEW FEATURES ADDED:');
    console.log('✅ maxUsesPerUser field to all giftcodes');
    console.log('✅ Per-user usage tracking and limits');
    console.log('✅ Backward compatibility with old system');
    console.log('✅ Better usage statistics in admin commands');

    console.log('\n📝 ADMIN CREATE EXAMPLES:');
    console.log('🎫 Single use per user:');
    console.log('   /giftcode-admin create coins:1000 max_uses:100 max_uses_per_user:1');
    
    console.log('\n🎫 Multiple uses per user:');
    console.log('   /giftcode-admin create coins:500 max_uses:200 max_uses_per_user:3');
    
    console.log('\n🎫 Daily giftcode (unlimited total, 1 per user):');
    console.log('   /giftcode-admin create coins:100 max_uses_per_user:1 expires_in:24h');
    
    console.log('\n🎫 Event giftcode (limited total, multiple per user):');
    console.log('   /giftcode-admin create coins:2000 fishing_rods:"5,10" max_uses:50 max_uses_per_user:2');

    console.log('\n🎮 USER EXPERIENCE:');
    console.log('📋 Users can now use some giftcodes multiple times');
    console.log('📋 Clear messages about usage limits');
    console.log('📋 Better tracking of individual usage');

    console.log('\n⚠️ IMPORTANT NOTES:');
    console.log('• Old giftcodes default to 1 use per user');
    console.log('• New giftcodes can have custom per-user limits');
    console.log('• Total usage limits still apply globally');
    console.log('• Backward compatibility maintained');

  } catch (error) {
    console.error('❌ Error updating giftcode system:', error);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('📴 Disconnected from database');
    }
  }
}

// Run update
if (import.meta.url === `file://${process.argv[1]}`) {
  updateGiftcodeSystem().then(() => {
    console.log('\n✅ Giftcode system update completed!');
    console.log('\n🚀 NEXT STEPS:');
    console.log('1. npm run deploy');
    console.log('2. Test per-user limits with existing giftcodes');
    console.log('3. Create new giftcodes with custom per-user limits');
  });
}