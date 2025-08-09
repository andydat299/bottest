import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('autofish-jobs-status')
    .setDescription('🔧 [ADMIN] Check auto-fishing background jobs status'),

  async execute(interaction) {
    // Admin check
    if (!interaction.member.permissions.has('Administrator')) {
      return await interaction.reply({
        content: '❌ Only administrators can use this command!',
        ephemeral: true
      });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const { getAutoFishingJobStatus } = await import('../utils/autoFishingJobs.js');
      
      const status = await getAutoFishingJobStatus();
      
      const embed = new EmbedBuilder()
        .setTitle('🤖 Auto-Fishing Background Jobs Status')
        .setDescription('Current status of auto-fishing background processing')
        .setColor(status.error ? '#ff0000' : '#00ff00')
        .setTimestamp();

      if (status.error) {
        embed.addFields({
          name: '❌ Error',
          value: `\`\`\`${status.error}\`\`\``,
          inline: false
        });
      } else {
        embed.addFields([
          {
            name: '⚡ Job Status',
            value: `**Currently Running:** ${status.jobRunning ? '✅ Yes' : '⚪ No'}\n**Last Check:** <t:${Math.floor(status.lastCheck.getTime()/1000)}:R>`,
            inline: true
          },
          {
            name: '📊 Session Counts',
            value: `**Active Sessions:** ${status.activeSessions}\n**Expired (Pending):** ${status.expiredSessions}\n**Processed Today:** ${status.processedToday}`,
            inline: true
          },
          {
            name: '🔄 Background Jobs',
            value: `**Expired Sessions:** Every 30 seconds\n**Cleanup Old Records:** Every 24 hours\n**Auto-completion:** ✅ Enabled`,
            inline: false
          }
        ]);
        
        // Add status indicators
        let statusIndicator = '';
        if (status.expiredSessions > 0) {
          statusIndicator += `⚠️ ${status.expiredSessions} sessions waiting for processing\n`;
        }
        if (status.activeSessions > 0) {
          statusIndicator += `🟢 ${status.activeSessions} sessions currently active\n`;
        }
        if (status.processedToday > 0) {
          statusIndicator += `✅ ${status.processedToday} sessions completed today\n`;
        }
        
        if (statusIndicator) {
          embed.addFields({
            name: '📈 Current Activity',
            value: statusIndicator,
            inline: false
          });
        }
      }
      
      embed.addFields({
        name: '💡 How It Works',
        value: '• Users start auto-fishing with `/auto-fishing start`\n• Background jobs check every 30 seconds for expired sessions\n• When session expires, rewards are automatically calculated\n• Users receive fish and xu even if they forget to stop\n• Old records are cleaned up automatically',
        inline: false
      });

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('❌ Auto-fishing jobs status error:', error);
      
      await interaction.editReply({
        content: `❌ **Failed to get jobs status:**\n\`\`\`${error.message}\`\`\``
      });
    }
  }
};