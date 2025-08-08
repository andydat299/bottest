/**
 * Utility functions for safe Discord interaction handling
 */

/**
 * Safely defer an interaction update
 * @param {Interaction} interaction - Discord interaction
 * @returns {Promise<boolean>} Success status
 */
export async function safeDeferUpdate(interaction) {
  // Check if interaction is already acknowledged
  if (interaction.replied || interaction.deferred) {
    console.log('⚠️ Interaction already acknowledged, skipping deferUpdate');
    return false;
  }

  try {
    await interaction.deferUpdate();
    return true;
  } catch (error) {
    console.error('❌ Failed to defer interaction:', error.message);
    return false;
  }
}

/**
 * Safely reply to an interaction
 * @param {Interaction} interaction - Discord interaction
 * @param {Object} options - Reply options
 * @returns {Promise<boolean>} Success status
 */
export async function safeReply(interaction, options) {
  try {
    if (interaction.replied) {
      // Already replied, try to edit
      await interaction.editReply(options);
    } else if (interaction.deferred) {
      // Deferred, edit the reply
      await interaction.editReply(options);
    } else {
      // Not replied or deferred, reply normally
      await interaction.reply(options);
    }
    return true;
  } catch (error) {
    console.error('❌ Failed to reply to interaction:', error.message);
    return false;
  }
}

/**
 * Safely send error message to interaction
 * @param {Interaction} interaction - Discord interaction
 * @param {string} errorMessage - Error message to send
 * @returns {Promise<boolean>} Success status
 */
export async function safeErrorReply(interaction, errorMessage) {
  const errorContent = {
    content: `❌ **Có lỗi xảy ra:**\n\`\`\`${errorMessage}\`\`\``,
    ephemeral: true
  };

  try {
    if (interaction.replied) {
      await interaction.followUp(errorContent);
    } else if (interaction.deferred) {
      await interaction.editReply(errorContent);
    } else {
      await interaction.reply(errorContent);
    }
    return true;
  } catch (error) {
    console.error('❌ Failed to send error reply:', error.message);
    return false;
  }
}

/**
 * Create interaction collector with safe handling
 * @param {Message} message - Message to collect on
 * @param {Object} options - Collector options
 * @returns {InteractionCollector} Collector with error handling
 */
export function createSafeCollector(message, options = {}) {
  const collector = message.createMessageComponentCollector({
    time: 30000, // 30 seconds default
    ...options
  });

  // Add safe error handling
  collector.on('collect', async (selectInteraction) => {
    console.log(`🔄 Processing interaction: ${selectInteraction.customId}`);
    
    // Check if interaction is valid and not expired
    if (selectInteraction.replied || selectInteraction.deferred) {
      console.log('⚠️ Interaction already processed, ignoring');
      return;
    }

    try {
      // Safely defer the interaction
      const deferred = await safeDeferUpdate(selectInteraction);
      if (!deferred) {
        console.log('⚠️ Could not defer interaction, skipping');
        return;
      }

      // Let the original handler process this
      selectInteraction.isProcessed = false;
      
    } catch (error) {
      console.error('❌ Collector error:', error);
      await safeErrorReply(selectInteraction, error.message);
    }
  });

  collector.on('end', (collected, reason) => {
    console.log(`🔚 Collector ended: ${reason} (${collected.size} interactions)`);
  });

  return collector;
}

/**
 * Wrap interaction handler with safe execution
 * @param {Function} handler - Original handler function
 * @returns {Function} Wrapped handler
 */
export function wrapInteractionHandler(handler) {
  return async (interaction, ...args) => {
    try {
      // Check if interaction is still valid
      if (interaction.replied || interaction.deferred) {
        console.log('⚠️ Interaction already processed in wrapper');
        return;
      }

      await handler(interaction, ...args);
    } catch (error) {
      console.error('❌ Interaction handler error:', error);
      await safeErrorReply(interaction, error.message);
    }
  };
}