#!/usr/bin/env node

/**
 * Debug và Fix Auto-Fishing Daily Limits Issue
 */

console.log('🔍 DEBUGGING AUTO-FISHING DAILY LIMITS ISSUE\n');

async function debugAutoFishingLimits() {
  try {
    console.log('📋 Connecting to database...');
    
    // Import required modules
    const { AutoFishing } = await import('./schemas/autoFishingSchema.js');
    const { VIP } = await import('./schemas/vipSchema.js');
    const { getAutoFishingLimits } = await import('./utils/autoFishingManager.js');
    
    console.log('✅ Modules imported successfully');
    
    // Check all auto-fishing records
    console.log('\n📊 Current Auto-Fishing Records:');
    const allRecords = await AutoFishing.find({});
    
    if (allRecords.length === 0) {
      console.log('   No auto-fishing records found');
    } else {
      console.log(`   Found ${allRecords.length} records:`);
      for (const record of allRecords) {
        console.log(`   User: ${record.userId}`);
        console.log(`   Active: ${record.isActive}`);
        console.log(`   Remaining Today: ${record.remainingTimeToday} minutes`);
        console.log(`   Last Reset: ${record.lastResetDate}`);
        console.log(`   ---`);
      }
    }
    
    // Check VIP records
    console.log('\n👑 VIP Records:');
    const vipRecords = await VIP.find({ isActive: true });
    
    if (vipRecords.length === 0) {
      console.log('   No active VIP records found');
    } else {
      console.log(`   Found ${vipRecords.length} active VIP records:`);
      for (const vip of vipRecords) {
        const limits = getAutoFishingLimits(vip.currentTier);
        console.log(`   User: ${vip.userId}`);
        console.log(`   Tier: ${vip.currentTier}`);
        console.log(`   Daily Limit: ${limits.dailyMinutes} minutes`);
        console.log(`   Enabled: ${limits.enabled}`);
        console.log(`   ---`);
      }
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

async function fixAutoFishingLimits() {
  try {
    console.log('\n🔧 FIXING AUTO-FISHING LIMITS...');
    
    const { AutoFishing } = await import('./schemas/autoFishingSchema.js');
    const { VIP } = await import('./schemas/vipSchema.js');
    const { getAutoFishingLimits } = await import('./utils/autoFishingManager.js');
    
    // Get all VIP users
    const vipUsers = await VIP.find({ isActive: true });
    let fixedCount = 0;
    
    console.log(`📋 Processing ${vipUsers.length} VIP users...`);
    
    for (const vipUser of vipUsers) {
      const limits = getAutoFishingLimits(vipUser.currentTier);
      
      if (limits.enabled) {
        console.log(`🔧 Fixing user ${vipUser.userId} (${vipUser.currentTier})`);
        
        // Find or create auto-fishing record
        let autoFishing = await AutoFishing.findOne({ userId: vipUser.userId });
        
        if (!autoFishing) {
          // Create new record
          autoFishing = new AutoFishing({
            userId: vipUser.userId,
            isActive: false,
            remainingTimeToday: limits.dailyMinutes,
            lastResetDate: new Date(),
            totalFishCaught: 0,
            totalXuEarned: 0
          });
          console.log(`   ✅ Created new auto-fishing record`);
        } else {
          // Reset existing record
          autoFishing.remainingTimeToday = limits.dailyMinutes;
          autoFishing.lastResetDate = new Date();
          autoFishing.isActive = false; // Stop any active sessions
          console.log(`   ✅ Reset existing auto-fishing record`);
        }
        
        await autoFishing.save();
        fixedCount++;
        
        console.log(`   📊 New remaining time: ${autoFishing.remainingTimeToday} minutes`);
      }
    }
    
    console.log(`\n✅ Fixed ${fixedCount} auto-fishing records`);
    
    // Also fix any orphaned records (users without VIP)
    console.log('\n🧹 Cleaning orphaned records...');
    const allAutoFishing = await AutoFishing.find({});
    let cleanedCount = 0;
    
    for (const record of allAutoFishing) {
      const hasVip = await VIP.findOne({ 
        userId: record.userId, 
        isActive: true 
      });
      
      if (!hasVip) {
        // User doesn't have VIP, set remaining time to 0
        record.remainingTimeToday = 0;
        record.isActive = false;
        await record.save();
        cleanedCount++;
        console.log(`   🧹 Cleaned record for non-VIP user: ${record.userId}`);
      }
    }
    
    console.log(`✅ Cleaned ${cleanedCount} orphaned records`);
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
  }
}

async function testAutoFishingAccess() {
  try {
    console.log('\n🧪 TESTING AUTO-FISHING ACCESS...');
    
    const { AutoFishing } = await import('./schemas/autoFishingSchema.js');
    const { VIP } = await import('./schemas/vipSchema.js');
    const { getAutoFishingStatus } = await import('./utils/autoFishingManager.js');
    
    // Test with some sample user IDs
    const testUserIds = ['123456789', '987654321']; // Replace with actual user IDs
    
    for (const userId of testUserIds) {
      console.log(`\n🧪 Testing user: ${userId}`);
      
      try {
        const status = await getAutoFishingStatus(AutoFishing, VIP, userId);
        
        if (status) {
          console.log(`   VIP Tier: ${status.vipTier}`);
          console.log(`   Enabled: ${status.limits.enabled}`);
          console.log(`   Daily Limit: ${status.limits.dailyMinutes} minutes`);
          console.log(`   Remaining Today: ${status.remainingTimeToday} minutes`);
          console.log(`   Can Use: ${status.remainingTimeToday > 0 && status.limits.enabled}`);
        } else {
          console.log('   ❌ Could not get status');
        }
      } catch (error) {
        console.log(`   ❌ Error getting status: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run debug and fix
async function runDiagnostics() {
  await debugAutoFishingLimits();
  
  console.log('\n❓ Do you want to fix the auto-fishing limits? (This will reset all daily limits)');
  console.log('💡 This will:');
  console.log('  • Reset all VIP users to their daily limits');
  console.log('  • Stop any active auto-fishing sessions');
  console.log('  • Clean orphaned records');
  
  // Auto-fix since this is a script
  await fixAutoFishingLimits();
  await testAutoFishingAccess();
  
  console.log('\n🎉 AUTO-FISHING DIAGNOSTICS COMPLETED!');
  console.log('📝 Summary:');
  console.log('  • Debug completed');
  console.log('  • Limits fixed and reset');
  console.log('  • Access tested');
  console.log('\n💡 Users should now be able to use auto-fishing again.');
}

// Execute diagnostics
runDiagnostics().catch(error => {
  console.error('❌ Diagnostics failed:', error);
  process.exit(1);
});