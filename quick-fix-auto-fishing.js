#!/usr/bin/env node

/**
 * Quick Fix for Auto-Fishing Daily Limits Reset
 */

console.log('🚀 QUICK FIX: RESET AUTO-FISHING DAILY LIMITS\n');

async function quickFixAutoFishing() {
  try {
    // Import mongoose and connect
    const mongoose = await import('mongoose');
    
    // Connect to MongoDB
    if (!process.env.MONGODB_URI && !process.env.MONGO_URI) {
      console.error('❌ MongoDB URI not found in environment variables');
      console.log('💡 Make sure to set MONGODB_URI or MONGO_URI in your .env file');
      return;
    }
    
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    await mongoose.default.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Import schemas
    const { AutoFishing } = await import('./schemas/autoFishingSchema.js');
    const { VIP } = await import('./schemas/vipSchema.js');
    
    console.log('📋 Schemas imported successfully');
    
    // VIP limits configuration
    const VIP_AUTO_FISHING_LIMITS = {
      none: { enabled: false, dailyMinutes: 0 },
      bronze: { enabled: false, dailyMinutes: 0 },
      silver: { enabled: false, dailyMinutes: 0 },
      gold: { enabled: true, dailyMinutes: 120 },    // 2 hours
      diamond: { enabled: true, dailyMinutes: 1440 } // 24 hours
    };
    
    // Reset all auto-fishing records
    console.log('🔄 Resetting all auto-fishing records...');
    
    // Get all VIP users
    const vipUsers = await VIP.find({ isActive: true });
    console.log(`Found ${vipUsers.length} active VIP users`);
    
    let resetCount = 0;
    
    for (const vipUser of vipUsers) {
      const limits = VIP_AUTO_FISHING_LIMITS[vipUser.currentTier] || VIP_AUTO_FISHING_LIMITS.none;
      
      console.log(`Processing user ${vipUser.userId} (${vipUser.currentTier})`);
      
      if (limits.enabled) {
        // Find or create auto-fishing record
        let autoFishing = await AutoFishing.findOne({ userId: vipUser.userId });
        
        if (!autoFishing) {
          autoFishing = new AutoFishing({
            userId: vipUser.userId,
            isActive: false,
            sessionStartTime: null,
            sessionEndTime: null,
            remainingTimeToday: limits.dailyMinutes,
            lastResetDate: new Date(),
            totalFishCaught: 0,
            totalXuEarned: 0
          });
          console.log(`  ✅ Created new record with ${limits.dailyMinutes} minutes`);
        } else {
          autoFishing.remainingTimeToday = limits.dailyMinutes;
          autoFishing.lastResetDate = new Date();
          autoFishing.isActive = false; // Stop any active sessions
          autoFishing.sessionStartTime = null;
          autoFishing.sessionEndTime = null;
          console.log(`  ✅ Reset existing record to ${limits.dailyMinutes} minutes`);
        }
        
        await autoFishing.save();
        resetCount++;
      } else {
        // User doesn't have auto-fishing access
        const autoFishing = await AutoFishing.findOne({ userId: vipUser.userId });
        if (autoFishing) {
          autoFishing.remainingTimeToday = 0;
          autoFishing.isActive = false;
          autoFishing.sessionStartTime = null;
          autoFishing.sessionEndTime = null;
          await autoFishing.save();
          console.log(`  🚫 Disabled auto-fishing for ${vipUser.currentTier} user`);
        }
      }
    }
    
    // Clean up orphaned records (users without VIP)
    console.log('\n🧹 Cleaning orphaned auto-fishing records...');
    const allAutoFishing = await AutoFishing.find({});
    let cleanedCount = 0;
    
    for (const record of allAutoFishing) {
      const hasVip = await VIP.findOne({ 
        userId: record.userId, 
        isActive: true,
        $or: [
          { currentTier: 'gold' },
          { currentTier: 'diamond' }
        ]
      });
      
      if (!hasVip) {
        record.remainingTimeToday = 0;
        record.isActive = false;
        record.sessionStartTime = null;
        record.sessionEndTime = null;
        await record.save();
        cleanedCount++;
        console.log(`  🧹 Cleaned record for user without auto-fishing VIP: ${record.userId}`);
      }
    }
    
    console.log(`\n✅ RESET COMPLETED!`);
    console.log(`📊 Statistics:`);
    console.log(`  • VIP users processed: ${vipUsers.length}`);
    console.log(`  • Auto-fishing records reset: ${resetCount}`);
    console.log(`  • Orphaned records cleaned: ${cleanedCount}`);
    console.log(`\n💡 Users can now use auto-fishing again with their daily limits:`);
    console.log(`  • VIP Gold: 120 minutes (2 hours) per day`);
    console.log(`  • VIP Diamond: 1440 minutes (24 hours) per day`);
    
    // Close database connection
    await mongoose.default.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Quick fix failed:', error);
    process.exit(1);
  }
}

// Execute quick fix
quickFixAutoFishing().then(() => {
  console.log('\n🎉 Auto-Fishing daily limits have been reset!');
  console.log('🚀 Users should now be able to start auto-fishing sessions.');
  process.exit(0);
});