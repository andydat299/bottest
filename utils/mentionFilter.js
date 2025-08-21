/**
 * Mention Filter - Prevents bot from responding to mass mentions
 * Blocks responses when @everyone, @here, or mass mentions are used
 */

export function checkMassMentions(interaction) {
  try {
    // Skip filter for DMs
    if (!interaction.guild) return false;
    
    // Get the message content if it exists (for message-based interactions)
    const content = interaction.message?.content || '';
    
    // Check for @everyone mention
    if (content.includes('@everyone')) {
      console.log(`🔇 [FILTER] @everyone detected from ${interaction.user.username}`);
      return true;
    }
    
    // Check for @here mention  
    if (content.includes('@here')) {
      console.log(`🔇 [FILTER] @here detected from ${interaction.user.username}`);
      return true;
    }
    
    // Check message mentions object if available
    if (interaction.message?.mentions) {
      const mentions = interaction.message.mentions;
      
      // Block @everyone/@here mentions
      if (mentions.everyone) {
        console.log(`🔇 [FILTER] Mass mention (@everyone/@here) from ${interaction.user.username}`);
        return true;
      }
      
      // Block excessive role mentions (>2 roles)
      if (mentions.roles && mentions.roles.size > 2) {
        console.log(`🔇 [FILTER] Mass role mentions (${mentions.roles.size}) from ${interaction.user.username}`);
        return true;
      }
      
      // Block excessive user mentions (>5 users)  
      if (mentions.users && mentions.users.size > 5) {
        console.log(`🔇 [FILTER] Mass user mentions (${mentions.users.size}) from ${interaction.user.username}`);
        return true;
      }
    }
    
    return false; // No mass mentions detected
    
  } catch (error) {
    console.error('Error checking mass mentions:', error);
    return false; // Fail safe - allow interaction
  }
}

export function shouldBlockInteraction(interaction) {
  // Configuration
  const config = {
    blockEveryone: true,     // Block @everyone
    blockHere: true,         // Block @here  
    maxRoles: 2,            // Max role mentions allowed
    maxUsers: 5,            // Max user mentions allowed
    exemptAdmins: false     // Set true to exempt admins
  };
  
  // Exempt admins if configured
  if (config.exemptAdmins && interaction.member?.permissions?.has('Administrator')) {
    return false;
  }
  
  // Check for mass mentions
  return checkMassMentions(interaction);
}

// Export config for easy customization
export const MENTION_FILTER_CONFIG = {
  enabled: true,
  blockEveryone: true,
  blockHere: true, 
  maxRoles: 2,
  maxUsers: 5,
  exemptAdmins: false,
  exemptChannels: [], // Add channel IDs to exempt specific channels
  logBlocked: true    // Log blocked interactions
};

/**
 * Enhanced filter with channel exemptions
 */
export function isInteractionBlocked(interaction) {
  if (!MENTION_FILTER_CONFIG.enabled) return false;
  
  // Check exempt channels
  if (MENTION_FILTER_CONFIG.exemptChannels.includes(interaction.channelId)) {
    return false;
  }
  
  // Check admin exemption
  if (MENTION_FILTER_CONFIG.exemptAdmins && 
      interaction.member?.permissions?.has('Administrator')) {
    return false;
  }
  
  return checkMassMentions(interaction);
}