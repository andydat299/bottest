// SIMPLE BAN CHECK - COPY THIS INTO YOUR interactionCreate.js

/**
 * Add this function at the top of your interactionCreate.js file (after imports)
 */
async function checkIfUserBanned(userId) {
  try {
    const db = mongoose.connection.db;
    const bannedUsersCollection = db.collection('bannedUsers');
    
    const ban = await bannedUsersCollection.findOne({ 
      userId: userId, 
      isActive: true 
    });
    
    if (!ban) return { isBanned: false };
    
    // Check if expired
    if (ban.expiresAt && new Date() > new Date(ban.expiresAt)) {
      // Auto unban expired
      await bannedUsersCollection.updateOne(
        { _id: ban._id },
        { $set: { isActive: false, unbannedAt: new Date() } }
      );
      return { isBanned: false };
    }
    
    return { 
      isBanned: true, 
      reason: ban.reason,
      bannedBy: ban.bannedByUsername,
      expiresAt: ban.expiresAt 
    };
    
  } catch (error) {
    console.error('Ban check error:', error);
    return { isBanned: false }; // Fail safe
  }
}

/**
 * THEN UPDATE YOUR COMMAND HANDLING SECTION LIKE THIS:
 */

/*
// BEFORE (current):
if (interaction.isChatInputCommand()) {
  const command = interaction.client.commands.get(interaction.commandName);
  if (!command) return;
  await command.execute(interaction);
}

// AFTER (with ban check):
if (interaction.isChatInputCommand()) {
  // CHECK BAN STATUS FIRST
  const banStatus = await checkIfUserBanned(interaction.user.id);
  if (banStatus.isBanned) {
    const timeLeft = banStatus.expiresAt ? 
      `Hết hạn: ${new Date(banStatus.expiresAt).toLocaleString()}` : 
      'Vĩnh viễn';
      
    await interaction.reply({
      content: [
        '🚫 **Bạn đã bị cấm sử dụng bot!**',
        '',
        `📝 **Lý do:** ${banStatus.reason}`,
        `👮 **Ban bởi:** ${banStatus.bannedBy}`,
        `⏰ **Thời gian:** ${timeLeft}`,
        '',
        '💡 **Liên hệ admin để biết thêm chi tiết.**'
      ].join('\n'),
      ephemeral: true
    });
    return; // STOP COMMAND EXECUTION
  }
  
  // Continue with normal command execution
  const command = interaction.client.commands.get(interaction.commandName);
  if (!command) return;
  await command.execute(interaction);
}
*/

console.log('📋 INSTRUCTIONS:');
console.log('================');
console.log('1. Copy the checkIfUserBanned function above');
console.log('2. Add it to your interactionCreate.js file');  
console.log('3. Update your command handling section');
console.log('4. Make sure mongoose is imported');
console.log('5. Restart bot and test');

console.log('\n🧪 TEST STEPS:');
console.log('==============');
console.log('1. /ban-user add @testuser reason:"test" duration:1h');
console.log('2. Have testuser try /fish');
console.log('3. Should see ban message instead of fish result');
console.log('4. /ban-user remove @testuser');
console.log('5. Testuser can use commands again');

export default {
  checkIfUserBanned
};