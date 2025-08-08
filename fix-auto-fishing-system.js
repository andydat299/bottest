#!/usr/bin/env node

/**
 * Comprehensive Auto-Fishing System Check and Fix
 */

console.log('🔧 AUTO-FISHING SYSTEM COMPREHENSIVE CHECK & FIX\n');

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

async function connectToDatabase() {
  try {
    const mongoose = await import('mongoose');
    
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MongoDB URI not found in environment variables');
    }
    
    await mongoose.default.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    return mongoose.default;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    throw error;
  }
}

async function checkAutoFishingSystem() {
  const mongoose = await connectToDatabase();
  
  try {
    // Import schemas
    const { AutoFishing } = await import('./schemas/autoFishingSchema.js');
    const { VIP } = await import('./schemas/vipSchema.js');
    const { User } = await import('./schemas/userSchema.js');
    
    console.log('📋 Checking Auto-Fishing System...\n');
    
    // 1. Check VIP configuration
    console.log('1️⃣ Checking VIP Auto-Fishing Configuration:');
    const VIP_LIMITS = {
      none: { enabled: false, dailyMinutes: 0 },
      bronze: { enabled: false, dailyMinutes: 0 },
      silver: { enabled: false, dailyMinutes: 0 },
      gold: { enabled: true, dailyMinutes: 120 },
      diamond: { enabled: true, dailyMinutes: 1440 }
    };
    
    Object.entries(VIP_LIMITS).forEach(([tier, config]) => {
      console.log(`   ${tier.toUpperCase()}: ${config.enabled ? config.dailyMinutes + ' min/day' : 'disabled'}`);
    });
    
    // 2. Check VIP users
    console.log('\n2️⃣ Checking VIP Users:');
    const vipUsers = await VIP.find({ isActive: true });
    console.log(`   Found ${vipUsers.length} active VIP users`);
    
    const eligibleUsers = vipUsers.filter(user => 
      user.currentTier === 'gold' || user.currentTier === 'diamond'
    );
    console.log(`   ${eligibleUsers.length} users eligible for auto-fishing`);
    
    // 3. Check Auto-Fishing records
    console.log('\n3️⃣ Checking Auto-Fishing Records:');
    const autoFishingRecords = await AutoFishing.find({});
    console.log(`   Found ${autoFishingRecords.length} auto-fishing records`);
    
    let issuesFound = 0;
    let fixedIssues = 0;
    
    // 4. Analyze and fix issues
    console.log('\n4️⃣ Analyzing Issues:');
    
    for (const vipUser of eligibleUsers) {
      const limits = VIP_LIMITS[vipUser.currentTier];
      let autoFishing = await AutoFishing.findOne({ userId: vipUser.userId });
      
      console.log(`\n   User: ${vipUser.userId} (${vipUser.currentTier})`);
      
      if (!autoFishing) {
        console.log('     ❌ Missing auto-fishing record');
        issuesFound++;
        
        // Create record
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
        
        await autoFishing.save();
        console.log(`     ✅ Created with ${limits.dailyMinutes} minutes`);
        fixedIssues++;
        
      } else {
        // Check for issues in existing record
        let needsUpdate = false;
        
        if (autoFishing.remainingTimeToday === undefined || autoFishing.remainingTimeToday === null) {
          console.log('     ❌ remainingTimeToday is null/undefined');
          autoFishing.remainingTimeToday = limits.dailyMinutes;
          needsUpdate = true;
          issuesFound++;
        }
        
        if (autoFishing.remainingTimeToday < 0) {
          console.log('     ❌ remainingTimeToday is negative');
          autoFishing.remainingTimeToday = limits.dailyMinutes;
          needsUpdate = true;
          issuesFound++;
        }
        
        if (!autoFishing.lastResetDate) {
          console.log('     ❌ Missing lastResetDate');
          autoFishing.lastResetDate = new Date();
          needsUpdate = true;
          issuesFound++;
        }
        
        // Check if daily reset is needed
        const now = new Date();
        const lastReset = autoFishing.lastResetDate;
        const hoursDiff = (now - lastReset) / (1000 * 60 * 60);
        
        if (hoursDiff >= 24) {
          console.log('     ⏰ Daily reset needed');
          autoFishing.remainingTimeToday = limits.dailyMinutes;
          autoFishing.lastResetDate = now;
          autoFishing.isActive = false;
          needsUpdate = true;
          issuesFound++;
        }
        
        if (needsUpdate) {
          await autoFishing.save();
          console.log(`     ✅ Updated record`);
          fixedIssues++;
        } else {
          console.log(`     ✅ Record OK (${autoFishing.remainingTimeToday} min remaining)`);
        }
      }
    }
    
    // 5. Clean orphaned records
    console.log('\n5️⃣ Cleaning Orphaned Records:');
    let cleanedCount = 0;
    
    for (const record of autoFishingRecords) {
      const hasEligibleVip = await VIP.findOne({
        userId: record.userId,
        isActive: true,
        currentTier: { $in: ['gold', 'diamond'] }
      });
      
      if (!hasEligibleVip) {
        record.remainingTimeToday = 0;
        record.isActive = false;
        await record.save();
        cleanedCount++;
        console.log(`     🧹 Cleaned record for user ${record.userId}`);
      }
    }
    
    // 6. Summary
    console.log('\n📊 SUMMARY:');
    console.log(`   Issues found: ${issuesFound}`);
    console.log(`   Issues fixed: ${fixedIssues}`);
    console.log(`   Records cleaned: ${cleanedCount}`);
    console.log(`   VIP users eligible: ${eligibleUsers.length}`);
    
    if (issuesFound === 0) {
      console.log('\n✅ AUTO-FISHING SYSTEM IS HEALTHY!');
    } else {
      console.log('\n🔧 AUTO-FISHING SYSTEM HAS BEEN FIXED!');
    }
    
    console.log('\n💡 Users should now be able to use auto-fishing properly.');
    
  } catch (error) {
    console.error('❌ Check failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the check
checkAutoFishingSystem().then(() => {
  console.log('\n🎉 Auto-Fishing system check completed!');
  process.exit(0);
}).catch(error => {
  console.error('❌ System check failed:', error);
  process.exit(1);
});