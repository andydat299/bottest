import { Events } from 'discord.js';

// EMERGENCY VERSION - Basic functionality only
// Use this to get bot working again, then add features gradually

export default {
  name: Events.InteractionCreate,
  async execute(interaction) {
    try {
      // Handle slash commands
      if (interaction.isChatInputCommand()) {
        console.log(`💬 Command: ${interaction.commandName} by ${interaction.user.username}`);

        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
          console.error(`❌ No command matching ${interaction.commandName} was found.`);
          await interaction.reply({
            content: '❌ **Lệnh không tồn tại!**',
            ephemeral: true
          });
          return;
        }

        try {
          await command.execute(interaction);
          console.log(`✅ Command ${interaction.commandName} executed successfully`);
        } catch (commandError) {
          console.error(`❌ Error executing command ${interaction.commandName}:`, commandError);
          
          const errorMessage = '❌ **Có lỗi xảy ra khi thực hiện lệnh!**';
          
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: errorMessage, ephemeral: true });
          } else {
            await interaction.reply({ content: errorMessage, ephemeral: true });
          }
        }
      }

      // Handle button interactions  
      else if (interaction.isButton()) {
        console.log(`🔘 Button: ${interaction.customId} by ${interaction.user.username}`);

        try {
          // Import handlers only when needed to avoid import errors
          if (interaction.customId.startsWith('withdraw_') || 
              interaction.customId.startsWith('confirm_withdraw_') ||
              interaction.customId.startsWith('cancel_withdraw_')) {
            
            const { handleWithdrawPanelButtons, handleWithdrawModal } = await import('../handlers/withdrawPanelHandler.js');
            await handleWithdrawPanelButtons(interaction);
          }
          else if (interaction.customId.startsWith('proposal_') || 
                   interaction.customId.startsWith('divorce_')) {
            
            const { handleMarriageButtons } = await import('../handlers/marriageHandlers.js');
            await handleMarriageButtons(interaction);
          }
          else {
            console.log(`⚠️ Unhandled button interaction: ${interaction.customId}`);
            await interaction.reply({
              content: '❌ **Button không được hỗ trợ!**',
              ephemeral: true
            });
          }
        } catch (buttonError) {
          console.error(`❌ Error handling button ${interaction.customId}:`, buttonError);
          
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
              content: '❌ **Có lỗi xảy ra khi xử lý button!**',
              ephemeral: true
            });
          }
        }
      }

      // Handle modal submissions
      else if (interaction.isModalSubmit()) {
        console.log(`📝 Modal: ${interaction.customId} by ${interaction.user.username}`);

        try {
          if (interaction.customId.startsWith('withdrawModal_')) {
            const { handleWithdrawModal } = await import('../handlers/withdrawPanelHandler.js');
            await handleWithdrawModal(interaction);
          } else {
            console.log(`⚠️ Unhandled modal interaction: ${interaction.customId}`);
            await interaction.reply({
              content: '❌ **Modal không được hỗ trợ!**',
              ephemeral: true
            });
          }
        } catch (modalError) {
          console.error(`❌ Error handling modal ${interaction.customId}:`, modalError);
          
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
              content: '❌ **Có lỗi xảy ra khi xử lý modal!**',
              ephemeral: true
            });
          }
        }
      }

      // Handle autocomplete
      else if (interaction.isAutocomplete()) {
        const command = interaction.client.commands.get(interaction.commandName);
        
        if (!command || !command.autocomplete) {
          return;
        }

        try {
          await command.autocomplete(interaction);
        } catch (autocompleteError) {
          console.error(`❌ Error handling autocomplete for ${interaction.commandName}:`, autocompleteError);
        }
      }

    } catch (error) {
      console.error('❌ Critical interaction error:', error);
      
      // Emergency error handling
      try {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: '❌ **Đã xảy ra lỗi nghiêm trọng!**',
            ephemeral: true
          });
        }
      } catch (emergencyError) {
        console.error('❌ Emergency error handling failed:', emergencyError);
      }
    }
  }
};

// NOTE: This is the BASIC version
// To add multi-server features later:
// 1. Test this version works first
// 2. Add guildManager import
// 3. Add guild checks one by one  
// 4. Add mention filter
// 5. Add feature toggles