#!/usr/bin/env node

/**
 * Manual VIP Setter Script
 * Set VIP directly in database without Discord command
 */

console.log('👑 MANUAL VIP SETTER\n');

async function setVipManually() {
  try {
    console.log('📊 Connecting to database...');
    
    // Import User schema
    const { User } = await import('./schemas/userSchema.js');
    
    console.log('✅ Successfully connected to database\n');
    
    // Configuration - CHANGE THESE VALUES
    const TARGET_USER_ID = 'YOUR_DISCORD_ID_HERE';  // Replace with your Discord ID
    const VIP_TIER = 'diamond';  // bronze, silver, gold, diamond
    
    console.log('🎯 VIP Setting Configuration:');
    console.log(`   Target User ID: ${TARGET_USER_ID}`);
    console.log(`   VIP Tier: ${VIP_TIER.toUpperCase()}\n`);
    
    if (TARGET_USER_ID === 'YOUR_DISCORD_ID_HERE') {
      console.log('❌ ERROR: Please edit the script and set your Discord ID');
      console.log('   1. Open manual-set-vip.js');
      console.log('   2. Change TARGET_USER_ID to your Discord ID');
      console.log('   3. Change VIP_TIER if needed');
      console.log('   4. Run script again');
      return;
    }
    
    // Find user
    console.log('🔍 Finding user in database...');
    let user = await User.findOne({ discordId: TARGET_USER_ID });
    
    if (!user) {
      console.log('❌ User not found in database');
      console.log(`   Discord ID ${TARGET_USER_ID} không có tài khoản`);
      console.log('   User cần dùng /fish command trước để tạo account');
      return;
    }
    
    console.log('✅ User found in database');
    console.log(`   Username: ${user.username || 'Unknown'}`);
    console.log(`   Current Balance: ${(user.balance || 0).toLocaleString()} xu`);
    console.log(`   Rod Level: ${user.rodLevel || 1}`);
    
    // Show current VIP status
    console.log('\n📋 Current VIP Status:');
    console.log(`   currentVipTier: ${user.currentVipTier || 'null'}`);
    console.log(`   isVip: ${user.isVip || false}`);
    console.log(`   vipTier: ${user.vipTier || 'null'}`);
    
    // Set new VIP
    console.log('\n⚡ Setting new VIP...');
    
    const oldVipTier = user.currentVipTier;
    const oldIsVip = user.isVip;
    
    // Update VIP fields
    user.currentVipTier = VIP_TIER;
    user.isVip = true;
    
    // Mark fields as modified
    user.markModified('currentVipTier');
    user.markModified('isVip');
    
    // Save to database
    await user.save();
    
    console.log('✅ VIP successfully updated!');
    
    // Verify the save
    console.log('\n🔍 Verifying save...');
    const verifyUser = await User.findOne({ discordId: TARGET_USER_ID });
    
    console.log('📊 Updated VIP Status:');
    console.log(`   currentVipTier: ${verifyUser.currentVipTier}`);
    console.log(`   isVip: ${verifyUser.isVip}`);
    
    // VIP hierarchy check
    const vipHierarchy = { 'bronze': 1, 'silver': 2, 'gold': 3, 'diamond': 4 };
    const vipLevel = vipHierarchy[verifyUser.currentVipTier?.toLowerCase()] || 0;
    
    console.log(`   VIP Level: ${vipLevel}/4`);
    
    if (vipLevel >= 1) {
      console.log('\n🎣 Rod Access:');
      console.log('   ✅ Can access all premium rods (Levels 11-20)');
      console.log('   ✅ Full rod collection available');
      console.log('   ✅ No VIP restrictions');
    } else {
      console.log('\n🎣 Rod Access:');
      console.log('   🔒 Limited to standard rods (Levels 1-10)');
      console.log('   ❌ Premium rods locked');
    }
    
    console.log('\n🎉 VIP SETTING COMPLETED!');
    console.log('💡 Next steps:');
    console.log('   1. Test with /debug-vip in Discord');
    console.log('   2. Try /upgrade-rod for premium rods');
    console.log('   3. Use /rod-shop to see accessible rods');
    
    // Show change summary
    console.log('\n📈 Change Summary:');
    console.log(`   Old VIP: ${oldVipTier || 'NONE'} → New VIP: ${VIP_TIER.toUpperCase()}`);
    console.log(`   Old isVip: ${oldIsVip || false} → New isVip: true`);
    console.log(`   Access Level: ${vipLevel}/4`);
    
  } catch (error) {
    console.error('❌ Manual VIP setting failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('   • Check if database is running');
    console.log('   • Verify Discord ID is correct');
    console.log('   • Ensure user has account (used /fish command)');
    console.log('   • Check database connection settings');
  }
}

// Run manual VIP setter
setVipManually().then(() => {
  console.log('\n✅ Manual VIP setting script completed!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});