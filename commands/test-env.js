import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('test-env')
    .setDescription('🧪 [ADMIN] Test environment variables ngay lập tức')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return await interaction.reply({
        content: '❌ Bạn không có quyền sử dụng lệnh này!',
        ephemeral: true
      });
    }

    // Direct check variables
    const adminChannelId = process.env.ADMIN_CHANNEL_ID;
    const adminRoleId = process.env.ADMIN_ROLE_ID;
    const adminIds = process.env.ADMIN_IDS;

    console.log('🧪 Direct ENV check:');
    console.log('ADMIN_CHANNEL_ID:', adminChannelId);
    console.log('ADMIN_ROLE_ID:', adminRoleId);
    console.log('ADMIN_IDS:', adminIds);

    const testEmbed = new EmbedBuilder()
      .setTitle('🧪 Direct Environment Test')
      .setDescription('**Kiểm tra trực tiếp process.env**')
      .addFields(
        {
          name: '💰 Withdraw Variables',
          value: `**ADMIN_CHANNEL_ID:**\n\`${adminChannelId || 'undefined'}\`\n**ADMIN_ROLE_ID:**\n\`${adminRoleId || 'undefined'}\`\n**ADMIN_IDS:**\n\`${adminIds || 'undefined'}\``,
          inline: false
        },
        {
          name: '✅ Status Check',
          value: `**Channel ID exists:** ${!!adminChannelId ? '✅ YES' : '❌ NO'}\n**Role ID exists:** ${!!adminRoleId ? '✅ YES' : '❌ NO'}\n**Admin IDs exists:** ${!!adminIds ? '✅ YES' : '❌ NO'}`,
          inline: false
        }
      )
      .setColor(adminChannelId ? '#00ff00' : '#ff0000')
      .setTimestamp();

    // Test channel access
    if (adminChannelId) {
      const channel = interaction.client.channels.cache.get(adminChannelId);
      testEmbed.addFields({
        name: '🔍 Channel Test',
        value: channel ? `✅ Channel found: ${channel.name}` : '❌ Channel not accessible',
        inline: false
      });

      // Test send message to admin channel
      if (channel) {
        try {
          await channel.send('🧪 **Test message from test-env command**\nWithdraw system is ready to work!');
          testEmbed.addFields({
            name: '📤 Send Test',
            value: '✅ Successfully sent test message to admin channel',
            inline: false
          });
        } catch (error) {
          testEmbed.addFields({
            name: '📤 Send Test',
            value: `❌ Failed to send: ${error.message}`,
            inline: false
          });
        }
      }
    }

    await interaction.reply({ embeds: [testEmbed], ephemeral: true });
  }
};