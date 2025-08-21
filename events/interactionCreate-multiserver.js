import { Events } from 'discord.js';
import { handleWithdrawPanelButtons, handleWithdrawModal } from '../handlers/withdrawPanelHandler.js';
import { handleMarriageButtons } from '../handlers/marriageHandlers.js';
import { checkGuildBan, isFeatureEnabled, getGuildSettings } from '../utils/guildManager.js';
import { isInteractionBlocked } from '../utils/mentionFilter.js';

export default {
  name: Events.InteractionCreate,
  async execute(interaction) {
    try {
      // Handle slash commands
      if (interaction.isChatInputCommand()) {
        console.log(`💬 Command: ${interaction.commandName} by ${interaction.user.username} in guild: ${interaction.guild?.name || 'DM'}`);

        // Skip guild checks for DMs
        if (!interaction.guild) {
          await interaction.reply({
            content: '❌ **Bot chỉ hoạt động trong server, không hỗ trợ DM!**',
            ephemeral: true
          });
          return;
        }

        // STEP 1: Check for mass mentions (silent block)
        if (isInteractionBlocked(interaction)) {
          console.log(`🔇 [FILTER] Blocked command from ${interaction.user.username} due to mass mentions`);
          return; // Silent block - no response
        }

        // STEP 2: Check if user is banned in this guild
        const banStatus = await checkGuildBan(interaction.guildId, interaction.user.id);
        if (banStatus.isBanned) {
          const timeLeft = banStatus.expiresAt ? 
            `Hết hạn: ${new Date(banStatus.expiresAt).toLocaleString()}` : 
            'Vĩnh viễn';
            
          await interaction.reply({
            content: [
              '🚫 **Bạn đã bị cấm sử dụng bot trong server này!**',
              '',
              `📝 **Lý do:** ${banStatus.reason}`,
              `👮 **Ban bởi:** ${banStatus.bannedBy}`,
              `⏰ **Thời gian:** ${timeLeft}`,
              '',
              '💡 **Liên hệ admin server để biết thêm chi tiết.**'
            ].join('\n'),
            ephemeral: true
          });
          return;
        }

        // STEP 3: Check if feature is enabled for this guild
        const commandName = interaction.commandName;
        const featureMap = {
          'fish': 'fishing',
          'auto-fishing': 'fishing',
          'balance': 'fishing', // Part of economy
          'transfer': 'transfer',
          'transfer-history': 'transfer',
          'transfer-leaderboard': 'transfer',
          'marry': 'marriage',
          'ring-shop': 'marriage',
          'withdraw': 'withdraw'
        };

        const requiredFeature = featureMap[commandName];
        if (requiredFeature) {
          const isEnabled = await isFeatureEnabled(interaction.guildId, requiredFeature);
          if (!isEnabled) {
            await interaction.reply({
              content: `❌ **Tính năng "${requiredFeature}" đã bị tắt trong server này!**\n\n💡 Admin có thể bật lại bằng \`/guild-setup features\``,
              ephemeral: true
            });
            return;
          }
        }

        // STEP 4: Execute command
        const command = interaction.client.commands.get(commandName);

        if (!command) {
          console.error(`❌ No command matching ${commandName} was found.`);
          await interaction.reply({
            content: '❌ **Lệnh không tồn tại!**',
            ephemeral: true
          });
          return;
        }

        try {
          await command.execute(interaction);
          console.log(`✅ Command ${commandName} executed successfully for ${interaction.user.username}`);
        } catch (commandError) {
          console.error(`❌ Error executing command ${commandName}:`, commandError);
          
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

        // Skip guild checks for DMs
        if (!interaction.guild) {
          await interaction.reply({
            content: '❌ **Buttons chỉ hoạt động trong server!**',
            ephemeral: true
          });
          return;
        }

        // Check for mass mentions on buttons too (optional)
        if (isInteractionBlocked(interaction)) {
          console.log(`🔇 [FILTER] Blocked button from ${interaction.user.username} due to mass mentions`);
          return;
        }

        // Check guild ban for buttons
        const banStatus = await checkGuildBan(interaction.guildId, interaction.user.id);
        if (banStatus.isBanned) {
          await interaction.reply({
            content: '🚫 **Bạn đã bị cấm sử dụng bot trong server này!**',
            ephemeral: true
          });
          return;
        }

        // Handle different button types
        try {
          if (interaction.customId.startsWith('withdraw_') || 
              interaction.customId.startsWith('confirm_withdraw_') ||
              interaction.customId.startsWith('cancel_withdraw_')) {
            await handleWithdrawPanelButtons(interaction);
          }
          else if (interaction.customId.startsWith('proposal_') || 
                   interaction.customId.startsWith('divorce_')) {
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

        if (!interaction.guild) {
          await interaction.reply({
            content: '❌ **Modals chỉ hoạt động trong server!**',
            ephemeral: true
          });
          return;
        }

        try {
          if (interaction.customId.startsWith('withdrawModal_')) {
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