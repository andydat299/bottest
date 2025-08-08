#!/usr/bin/env node

/**
 * Quick Database VIP Setter - No Discord Command Required
 */

console.log('⚡ QUICK VIP SETTER (NO DISCORD COMMAND)\n');

async function quickSetVip() {
  try {
    // CONFIGURATION - EDIT THESE
    const DISCORD_USER_ID = 'EDIT_THIS_WITH_YOUR_DISCORD_ID';
    const VIP_TIER = 'diamond';
    
    console.log('🎯 Quick VIP Configuration:');
    console.log(`Target User: ${DISCORD_USER_ID}`);
    console.log(`VIP Tier: ${VIP_TIER}\n`);
    
    if (DISCORD_USER_ID === 'EDIT_THIS_WITH_YOUR_DISCORD_ID') {
      console.log('❌ Please edit this script first!');
      console.log('1. Open quick-vip-set.js');
      console.log('2. Change DISCORD_USER_ID to your real Discord ID');
      console.log('3. Run script again: node quick-vip-set.js');
      return;
    }
    
    // Import and connect
    const { User } = await import('./schemas/userSchema.js');
    
    // Find user
    const user = await User.findOne({ discordId: DISCORD_USER_ID });
    if (!user) {
      console.log('❌ User not found. Make sure they used /fish command first.');
      return;
    }
    
    console.log(`✅ Found user: ${user.username || 'Unknown'}`);
    
    // Set VIP
    user.currentVipTier = VIP_TIER;
    user.isVip = true;
    await user.save();
    
    console.log('✅ VIP set successfully!');
    console.log(`🎉 ${user.username} is now VIP ${VIP_TIER.toUpperCase()}`);
    console.log('\n💡 Now test in Discord:');
    console.log('  /debug-vip - Should show DIAMOND VIP');
    console.log('  /upgrade-rod - Should work for premium rods');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

quickSetVip();