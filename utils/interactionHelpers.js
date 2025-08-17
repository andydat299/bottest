/**
 * Safe interaction reply helper to handle webhook token expiration
 * Discord webhook tokens expire after 15 minutes
 */

export async function safeEditReply(interaction, options) {
  try {
    // Check if token is still valid (Discord webhooks expire after 15 minutes)
    const tokenAge = Date.now() - interaction.createdTimestamp;
    const maxAge = 14 * 60 * 1000; // 14 minutes (safe margin)
    
    if (tokenAge > maxAge) {
      console.log('⚠️ Webhook token near expiry, using followUp instead');
      await interaction.followUp(options);
      return 'followUp';
    }
    
    await interaction.editReply(options);
    return 'editReply';
  } catch (error) {
    if (error.code === 50027) {
      console.log('⚠️ Webhook token expired (50027), attempting followUp');
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
}

export async function safeReply(interaction, options) {
  try {
    if (interaction.replied || interaction.deferred) {
      return await safeEditReply(interaction, options);
    } else {
      await interaction.reply(options);
      return 'reply';
    }
  } catch (error) {
    console.error('❌ Safe reply failed:', error.message);
    return 'failed';
  }
}

export function isInteractionValid(interaction) {
  const tokenAge = Date.now() - interaction.createdTimestamp;
  const maxAge = 14 * 60 * 1000; // 14 minutes
  return tokenAge <= maxAge;
}

export function getInteractionTimeLeft(interaction) {
  const tokenAge = Date.now() - interaction.createdTimestamp;
  const maxAge = 15 * 60 * 1000; // 15 minutes
  const timeLeft = maxAge - tokenAge;
  return Math.max(0, timeLeft);
}

export function formatTimeLeft(milliseconds) {
  const minutes = Math.floor(milliseconds / (60 * 1000));
  const seconds = Math.floor((milliseconds % (60 * 1000)) / 1000);
  return `${minutes}m ${seconds}s`;
}

// Auto-fishing specific helpers
export function createAutoFishingLimits() {
  return {
    MAX_DURATION: 10 * 60 * 1000, // 10 minutes max
    FISHING_INTERVAL: 30 * 1000,  // 30 seconds between catches
    WARNING_TIME: 8 * 60 * 1000,  // Warn at 8 minutes
  };
}

export async function safeAutoFishingUpdate(interaction, options, iteration, maxIterations) {
  try {
    // Add iteration info to options
    if (options.embeds && options.embeds[0]) {
      const embed = options.embeds[0];
      if (embed.data && embed.data.fields) {
        embed.data.fields = embed.data.fields.filter(field => field.name !== '⏱️ Tiến độ');
        embed.data.fields.push({
          name: '⏱️ Tiến độ',
          value: `${iteration}/${maxIterations} lần (${Math.round((iteration/maxIterations)*100)}%)`,
          inline: true
        });
      }
    }

    const result = await safeEditReply(interaction, options);
    
    if (result === 'failed') {
      console.log(`❌ Auto-fishing update failed at iteration ${iteration}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Auto-fishing update error:', error.message);
    return false;
  }
}