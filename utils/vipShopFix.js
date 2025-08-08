/**
 * Fixed VIP Shop Collector - Safe Interaction Handling
 */

// Example of how the collector should be structured in vip-shop.js
export function createSafeVipShopCollector(response) {
  const collector = response.createMessageComponentCollector({ 
    time: 60000 // 60 seconds
  });

  collector.on('collect', async (selectInteraction) => {
    console.log(`🔄 VIP shop interaction: ${selectInteraction.customId}`);
    
    // Enhanced safety checks
    if (selectInteraction.replied || selectInteraction.deferred) {
      console.log('⚠️ Interaction already processed, skipping');
      return;
    }

    // Check if it's the right type of interaction
    if (!selectInteraction.isStringSelectMenu()) {
      console.log('⚠️ Not a string select menu, skipping');
      return;
    }

    // Set processing flag to prevent double processing
    if (selectInteraction.isBeingProcessed) {
      console.log('⚠️ Interaction already being processed, skipping');
      return;
    }
    selectInteraction.isBeingProcessed = true;

    try {
      // Use race condition to prevent hanging
      await Promise.race([
        selectInteraction.deferUpdate(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Defer timeout after 3 seconds')), 3000)
        )
      ]);

      // Route to appropriate handler
      if (selectInteraction.customId === 'vip_purchase') {
        await handleVipPurchase(selectInteraction, selectInteraction.values[0]);
      }
      // Add other handlers here as needed

    } catch (error) {
      console.error('❌ VIP shop interaction error:', error);
      
      // Smart error handling based on error type
      if (error.message.includes('already been acknowledged') || 
          error.message.includes('Defer timeout')) {
        console.log('⚠️ Interaction timing issue, no response needed');
        return;
      }

      // Try to respond with error
      try {
        const errorContent = {
          content: `❌ **Có lỗi khi xử lý giao dịch:**\n\`\`\`${error.message}\`\`\``,
          ephemeral: true
        };

        if (!selectInteraction.replied && !selectInteraction.deferred) {
          await selectInteraction.reply(errorContent);
        } else if (selectInteraction.deferred && !selectInteraction.replied) {
          await selectInteraction.editReply(errorContent);
        } else {
          // Use followUp for already replied interactions
          await selectInteraction.followUp(errorContent);
        }
      } catch (responseError) {
        console.error('❌ Could not send error response:', responseError.message);
      }
    } finally {
      // Clear processing flag
      selectInteraction.isBeingProcessed = false;
    }
  });

  collector.on('end', (collected, reason) => {
    console.log(`🔚 VIP shop collector ended: ${reason} (${collected.size} interactions)`);
  });

  return collector;
}

// Quick fix template for vip-shop.js
export const QUICK_FIX_TEMPLATE = `
// Replace the collector.on('collect') section with this:

collector.on('collect', async (selectInteraction) => {
  // Safety checks
  if (selectInteraction.replied || selectInteraction.deferred || selectInteraction.isBeingProcessed) {
    return;
  }
  
  selectInteraction.isBeingProcessed = true;
  
  try {
    // Safe defer with timeout
    await Promise.race([
      selectInteraction.deferUpdate(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
    ]);
    
    // Handle VIP purchase
    if (selectInteraction.customId === 'vip_purchase') {
      await handleVipPurchase(selectInteraction, selectInteraction.values[0]);
    }
    
  } catch (error) {
    if (!error.message.includes('acknowledged') && !error.message.includes('Timeout')) {
      console.error('VIP shop error:', error);
      // Try to respond only if safe to do so
      if (selectInteraction.deferred && !selectInteraction.replied) {
        try {
          await selectInteraction.editReply({
            content: \`❌ Lỗi: \${error.message}\`
          });
        } catch (e) { /* ignore */ }
      }
    }
  } finally {
    selectInteraction.isBeingProcessed = false;
  }
});
`;

console.log('🔧 VIP Shop Fix Template Ready!');
console.log('📋 Apply this fix to resolve interaction acknowledgment errors.');
console.log('💡 Key changes:');
console.log('  • Enhanced safety checks');
console.log('  • Timeout protection for deferUpdate');
console.log('  • Smart error handling');
console.log('  • Processing flag to prevent duplicates');