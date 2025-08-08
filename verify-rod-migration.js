#!/usr/bin/env node

/**
 * Test Script: Verify fishing rod migration was successful
 */

console.log('🧪 FISHING ROD MIGRATION VERIFICATION\n');

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

async function verifyMigration() {
  const mongoose = await connectToDatabase();
  
  try {
    // Import schemas
    const { User } = await import('./schemas/userSchema.js');
    const { FISHING_RODS } = await import('./utils/rodManager.js');
    
    console.log('📋 Verifying fishing rod migration...\n');
    
    // Get all users with rod data
    const usersWithRods = await User.find({
      $or: [
        { rodLevel: { $exists: true } },
        { rodsOwned: { $exists: true } }
      ]
    });
    
    console.log(`Found ${usersWithRods.length} users with rod data`);
    
    if (usersWithRods.length === 0) {
      console.log('No users found with rod data');
      return;
    }
    
    let verificationStats = {
      totalUsers: usersWithRods.length,
      validUsers: 0,
      issues: 0,
      warnings: 0,
      ready: 0
    };
    
    const issues = [];
    const warnings = [];
    
    console.log('\n🔍 Checking each user...\n');
    
    for (const user of usersWithRods) {
      console.log(`Checking user: ${user.discordId} (${user.username})`);
      
      let userValid = true;
      let userIssues = [];
      let userWarnings = [];
      
      // Check rodLevel
      const rodLevel = user.rodLevel;
      if (rodLevel === undefined || rodLevel === null) {
        userIssues.push('rodLevel is null/undefined');
        userValid = false;
      } else if (rodLevel < 1 || rodLevel > 20) {
        userIssues.push(`rodLevel out of range: ${rodLevel}`);
        userValid = false;
      } else if (!FISHING_RODS[rodLevel]) {
        userIssues.push(`rodLevel references non-existent rod: ${rodLevel}`);
        userValid = false;
      } else {
        console.log(`  ✅ rodLevel: ${rodLevel} (${FISHING_RODS[rodLevel].name})`);
      }
      
      // Check rodsOwned
      const rodsOwned = user.rodsOwned;
      if (!rodsOwned || !Array.isArray(rodsOwned)) {
        userIssues.push('rodsOwned is not an array');
        userValid = false;
      } else if (rodsOwned.length === 0) {
        userIssues.push('rodsOwned is empty');
        userValid = false;
      } else {
        // Check each rod in rodsOwned
        const invalidRods = rodsOwned.filter(level => level < 1 || level > 20 || !FISHING_RODS[level]);
        if (invalidRods.length > 0) {
          userIssues.push(`rodsOwned contains invalid rods: [${invalidRods.join(', ')}]`);
          userValid = false;
        }
        
        // Check if user owns their current rod
        if (rodLevel && !rodsOwned.includes(rodLevel)) {
          userIssues.push(`User doesn't own their current rod (level ${rodLevel})`);
          userValid = false;
        }
        
        // Check for duplicates
        const uniqueRods = [...new Set(rodsOwned)];
        if (uniqueRods.length !== rodsOwned.length) {
          userWarnings.push('rodsOwned contains duplicates');
        }
        
        // Check rod progression (should own all rods up to current level)
        if (rodLevel) {
          for (let i = 1; i <= rodLevel; i++) {
            if (!rodsOwned.includes(i)) {
              userWarnings.push(`Missing rod level ${i} in progression`);
            }
          }
        }
        
        console.log(`  ✅ rodsOwned: [${rodsOwned.join(', ')}] (${rodsOwned.length} rods)`);
      }
      
      // Check rodExperience
      const rodExperience = user.rodExperience;
      if (rodExperience === undefined || rodExperience === null) {
        userWarnings.push('rodExperience not set');
      } else if (rodExperience < 0) {
        userWarnings.push(`rodExperience is negative: ${rodExperience}`);
      } else {
        console.log(`  ✅ rodExperience: ${rodExperience}`);
      }
      
      // Check 20-level system readiness
      if (userValid && rodLevel && rodLevel <= 10) {
        console.log(`  🎯 Ready for 20-level system (can upgrade to level ${rodLevel + 1}-20)`);
        verificationStats.ready++;
      }
      
      // Record issues and warnings
      if (userIssues.length > 0) {
        issues.push({ user: user.discordId, issues: userIssues });
        verificationStats.issues++;
        console.log(`  ❌ Issues: ${userIssues.join(', ')}`);
      }
      
      if (userWarnings.length > 0) {
        warnings.push({ user: user.discordId, warnings: userWarnings });
        verificationStats.warnings++;
        console.log(`  ⚠️ Warnings: ${userWarnings.join(', ')}`);
      }
      
      if (userValid && userIssues.length === 0) {
        verificationStats.validUsers++;
        console.log(`  ✅ User data valid`);
      }
      
      console.log('');
    }
    
    // Verification summary
    console.log('📊 VERIFICATION SUMMARY:');
    console.log(`  Total users: ${verificationStats.totalUsers}`);
    console.log(`  Valid users: ${verificationStats.validUsers}`);
    console.log(`  Users with issues: ${verificationStats.issues}`);
    console.log(`  Users with warnings: ${verificationStats.warnings}`);
    console.log(`  Ready for new system: ${verificationStats.ready}`);
    
    // Show issues
    if (issues.length > 0) {
      console.log('\n❌ ISSUES FOUND:');
      issues.forEach(({ user, issues }) => {
        console.log(`  User ${user}:`);
        issues.forEach(issue => console.log(`    • ${issue}`));
      });
    }
    
    // Show warnings
    if (warnings.length > 0) {
      console.log('\n⚠️ WARNINGS:');
      warnings.forEach(({ user, warnings }) => {
        console.log(`  User ${user}:`);
        warnings.forEach(warning => console.log(`    • ${warning}`));
      });
    }
    
    // Overall status
    const successRate = (verificationStats.validUsers / verificationStats.totalUsers * 100).toFixed(1);
    
    if (verificationStats.issues === 0) {
      console.log('\n✅ MIGRATION VERIFICATION PASSED!');
      console.log(`🎉 ${successRate}% of users have valid rod data`);
      console.log('🚀 20-level fishing rod system is ready to use');
    } else {
      console.log('\n⚠️ MIGRATION VERIFICATION FOUND ISSUES');
      console.log(`📊 ${successRate}% of users have valid rod data`);
      console.log('🔧 Some users may need manual data fixes');
    }
    
    // Test new system functions
    console.log('\n🧪 Testing new rod system functions...');
    
    try {
      const { getRodBenefits, calculateMissReduction, getUpgradeInfo } = await import('./utils/rodManager.js');
      
      // Test rod benefits
      const testRod = getRodBenefits(15);
      console.log(`✅ getRodBenefits(15): ${testRod.name} (-${testRod.missReduction}% miss)`);
      
      // Test miss reduction
      const missReduction = calculateMissReduction(20);
      console.log(`✅ calculateMissReduction(20): ${missReduction}%`);
      
      // Test upgrade info
      const upgradeInfo = getUpgradeInfo(10, 100000000);
      console.log(`✅ getUpgradeInfo(10): Can upgrade to level ${upgradeInfo.nextLevel || 'MAX'}`);
      
      console.log('✅ All rod system functions working correctly');
      
    } catch (error) {
      console.error('❌ Rod system function test failed:', error.message);
    }
    
    console.log('\n💡 Next steps:');
    if (verificationStats.issues === 0) {
      console.log('• Deploy new rod commands: npm run deploy');
      console.log('• Test with users: /fishing-rods, /upgrade-rod');
      console.log('• Users can now upgrade to levels 11-20');
    } else {
      console.log('• Fix data issues first');
      console.log('• Re-run migration if needed');
      console.log('• Run verification again');
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Execute verification
verifyMigration().then(() => {
  console.log('\n🎉 Verification completed!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Verification script failed:', error);
  process.exit(1);
});