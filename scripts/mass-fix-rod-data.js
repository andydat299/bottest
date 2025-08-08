#!/usr/bin/env node

/**
 * Mass Rod Data Fix Script
 * Fix rod level 11-20 sync issues for all users
 */

import mongoose from 'mongoose';

console.log('🔧 MASS ROD DATA FIX SCRIPT\n');

// Rod benefits data (levels 11-20)
const rodBenefits = {
  11: { name: 'Golden Rod', durability: 500, tier: 'Legendary' },
  12: { name: 'Platinum Rod', durability: 550, tier: 'Legendary' },
  13: { name: 'Diamond Rod', durability: 600, tier: 'Legendary' },
  14: { name: 'Titanium Rod', durability: 650, tier: 'Legendary' },
  15: { name: 'Mythril Rod', durability: 700, tier: 'Legendary' },
  16: { name: 'Celestial Rod', durability: 800, tier: 'Mythical' },
  17: { name: 'Divine Rod', durability: 900, tier: 'Mythical' },
  18: { name: 'Eternal Rod', durability: 1000, tier: 'Mythical' },
  19: { name: 'Cosmic Rod', durability: 1200, tier: 'Mythical' },
  20: { name: 'Transcendent Rod', durability: 1500, tier: 'Transcendent' }
};

async function fixRodData() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'your-mongodb-connection-string');
    console.log('✅ Connected to database');

    const { User } = await import('../schemas/userSchema.js');
    
    // Find all users with rod level >= 11
    const usersToFix = await User.find({ 
      rodLevel: { $gte: 11 } 
    });
    
    console.log(`🔍 Found ${usersToFix.length} users with rod level 11+`);
    
    let fixedCount = 0;
    let issuesFound = 0;
    
    for (const user of usersToFix) {
      const rodLevel = user.rodLevel;
      const currentDurability = user.rodDurability || 0;
      const rodsOwned = user.rodsOwned || [];
      
      let needsUpdate = false;
      const issues = [];
      
      // Get correct rod data
      const correctRod = rodBenefits[rodLevel];
      if (!correctRod) continue;
      
      // Check durability issues
      if (currentDurability > correctRod.durability) {
        issues.push(`Durability over limit: ${currentDurability}/${correctRod.durability}`);
        user.rodDurability = correctRod.durability; // Set to max
        needsUpdate = true;
      }
      
      if (currentDurability <= 0) {
        issues.push(`Invalid durability: ${currentDurability}`);
        user.rodDurability = Math.floor(correctRod.durability * 0.8); // Set to 80%
        needsUpdate = true;
      }
      
      // Check missing rods in rodsOwned
      const missingRods = [];
      for (let level = 1; level <= rodLevel; level++) {
        if (!rodsOwned.includes(level)) {
          missingRods.push(level);
        }
      }
      
      if (missingRods.length > 0) {
        issues.push(`Missing rods: ${missingRods.join(', ')}`);
        user.rodsOwned = [...new Set([...rodsOwned, ...missingRods])].sort((a, b) => a - b);
        needsUpdate = true;
      }
      
      // Update user if needed
      if (needsUpdate) {
        await user.save();
        fixedCount++;
        issuesFound += issues.length;
        
        console.log(`🔧 Fixed user ${user.username || user.discordId}:`);
        issues.forEach(issue => console.log(`   • ${issue}`));
        console.log(`   ✅ Updated: durability=${user.rodDurability}/${correctRod.durability}, rods=${user.rodsOwned.length}`);
        console.log('');
      }
    }
    
    console.log('📊 FIX RESULTS:');
    console.log(`   👥 Users checked: ${usersToFix.length}`);
    console.log(`   🔧 Users fixed: ${fixedCount}`);
    console.log(`   ⚠️ Issues resolved: ${issuesFound}`);
    console.log(`   ✅ Users with no issues: ${usersToFix.length - fixedCount}`);
    
    if (fixedCount > 0) {
      console.log('\n🎉 Rod data sync completed successfully!');
      console.log('📝 All rod levels 11-20 are now properly synced with fish system');
    } else {
      console.log('\n✅ No issues found - all rod data is properly synced!');
    }
    
  } catch (error) {
    console.error('❌ Fix script error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

// Run the fix
fixRodData();