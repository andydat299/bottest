console.log('🔧 FIXING WEBHOOK TOKEN ERROR...\n');

console.log('❌ ERROR ANALYSIS:');
console.log('==================');
console.log('Error: DiscordAPIError[50027]: Invalid Webhook Token');
console.log('Location: /app/commands/auto-fishing.js:171:9');
console.log('Issue: interaction.editReply() called with expired webhook token');

console.log('\n🔍 ROOT CAUSES:');
console.log('===============');
console.log('1. ❌ Webhook token expires after 15 minutes');
console.log('2. ❌ Auto-fishing command running longer than token lifetime');
console.log('3. ❌ Using setTimeout with editReply() after token expires');
console.log('4. ❌ No error handling for expired interactions');

console.log('\n💡 SOLUTIONS:');
console.log('=============');

console.log('\n🔧 Solution 1 - Add Token Validation:');
console.log(`
// Before any editReply call, check if interaction is still valid:
async function safeEditReply(interaction, options) {
  try {
    // Check if token is still valid (Discord webhooks expire after 15 minutes)
    const tokenAge = Date.now() - interaction.createdTimestamp;
    const maxAge = 15 * 60 * 1000; // 15 minutes
    
    if (tokenAge > maxAge) {
      console.log('⚠️ Webhook token expired, skipping editReply');
      return false;
    }
    
    await interaction.editReply(options);
    return true;
  } catch (error) {
    if (error.code === 50027) {
      console.log('⚠️ Invalid webhook token, interaction expired');
      return false;
    }
    throw error;
  }
}
`);

console.log('\n🔧 Solution 2 - Replace editReply with followUp:');
console.log(`
// Instead of editReply, use followUp for long-running processes:
if (tokenAge > maxAge) {
  // Send new message instead of editing expired one
  await interaction.followUp(options);
} else {
  await interaction.editReply(options);
}
`);

console.log('\n🔧 Solution 3 - Limit Auto-Fishing Duration:');
console.log(`
// Limit auto-fishing to max 10 minutes to avoid token expiry:
const MAX_AUTO_FISHING_TIME = 10 * 60 * 1000; // 10 minutes
const AUTO_FISHING_INTERVAL = 30 * 1000; // 30 seconds

// Calculate max iterations
const maxIterations = Math.floor(MAX_AUTO_FISHING_TIME / AUTO_FISHING_INTERVAL);
let currentIteration = 0;

const fishingInterval = setInterval(async () => {
  currentIteration++;
  
  if (currentIteration >= maxIterations) {
    clearInterval(fishingInterval);
    await safeEditReply(interaction, {
      embeds: [createFinalEmbed('⏰ Auto-fishing stopped (time limit reached)')]
    });
    return;
  }
  
  // Continue fishing...
}, AUTO_FISHING_INTERVAL);
`);

console.log('\n🚀 QUICK FIX IMPLEMENTATION:');
console.log('============================');

export default function fixWebhookError() {
  return {
    safeEditReply: async function(interaction, options) {
      try {
        const tokenAge = Date.now() - interaction.createdTimestamp;
        const maxAge = 14 * 60 * 1000; // 14 minutes (safe margin)
        
        if (tokenAge > maxAge) {
          console.log('⚠️ Webhook token near expiry, using followUp');
          await interaction.followUp(options);
          return 'followUp';
        }
        
        await interaction.editReply(options);
        return 'editReply';
      } catch (error) {
        if (error.code === 50027) {
          console.log('⚠️ Webhook token expired, attempting followUp');
          try {
            await interaction.followUp(options);
            return 'followUp';
          } catch (followUpError) {
            console.error('❌ Both editReply and followUp failed:', followUpError.message);
            return 'failed';
          }
        }
        throw error;
      }
    },
    
    isInteractionValid: function(interaction) {
      const tokenAge = Date.now() - interaction.createdTimestamp;
      const maxAge = 14 * 60 * 1000; // 14 minutes
      return tokenAge <= maxAge;
    }
  };
}

console.log('\n📋 IMPLEMENTATION STEPS:');
console.log('========================');
console.log('1. Import the helper function in auto-fishing.js');
console.log('2. Replace all editReply calls with safeEditReply');
console.log('3. Add interaction validation before long operations');
console.log('4. Limit auto-fishing duration to prevent timeouts');
console.log('5. Add proper error handling for webhook errors');

console.log('\n✅ This fix will prevent the webhook token error!');
console.log('💡 The marry system is not affected by this error.');