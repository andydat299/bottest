import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('debug-withdraw')
    .setDescription('🔧 [ADMIN] Debug hệ thống withdraw')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return await interaction.reply({
        content: '❌ Bạn không có quyền sử dụng lệnh này!',
        ephemeral: true
      });
    }

    const { debugWithdrawNotification } = await import('../utils/debugWithdraw.js');
    const debugInfo = debugWithdrawNotification();

    const debugEmbed = new EmbedBuilder()
      .setTitle('🔧 Debug Withdraw System')
      .setDescription('**Thông tin cấu hình hệ thống withdraw (Railway)**')
      .addFields(
        {
          name: '� Railway Environment Variables',
          value: `**ADMIN_CHANNEL_ID:** ${debugInfo.adminChannelId || '❌ Chưa cấu hình'}\n**ADMIN_ROLE_ID:** ${debugInfo.adminRoleId || '❌ Chưa cấu hình'}`,
          inline: false
        },
        {
          name: '✅ Trạng thái',
          value: debugInfo.configured ? '✅ Đã cấu hình trên Railway' : '❌ Chưa cấu hình',
          inline: true
        },
        {
          name: '🔍 Channel Check',
          value: debugInfo.adminChannelId ? 
            (interaction.client.channels.cache.get(debugInfo.adminChannelId) ? '✅ Channel tìm thấy' : '❌ Channel không tồn tại') : 
            '❌ Chưa cấu hình',
          inline: true
        },
        {
          name: '🌐 Platform',
          value: '🚀 **Railway Deployment**\nVariables được load từ Railway Dashboard',
          inline: false
        }
      )
      .setColor(debugInfo.configured ? '#00ff00' : '#ff0000')
      .setTimestamp();

    if (!debugInfo.configured) {
      debugEmbed.addFields({
        name: '� Railway Troubleshooting Steps',
        value: '**1.** Kiểm tra Railway Dashboard → Service → Variables\n**2.** Verify tên variables: `ADMIN_CHANNEL_ID`, `ADMIN_ROLE_ID`\n**3.** Click "Redeploy" để restart service\n**4.** Đợi 1-2 phút để deployment hoàn thành\n**5.** Chạy lại `/debug-withdraw`',
        inline: false
      });
      
      debugEmbed.addFields({
        name: '📋 Required Variables',
        value: '```\nADMIN_CHANNEL_ID=1234567890123456789\nADMIN_ROLE_ID=9876543210987654321\n```',
        inline: false
      });
    }

    // Test send message nếu đã cấu hình
    if (debugInfo.configured) {
      try {
        const adminChannel = interaction.client.channels.cache.get(debugInfo.adminChannelId);
        if (adminChannel) {
          const testEmbed = new EmbedBuilder()
            .setTitle('🧪 TEST WITHDRAW NOTIFICATION')
            .setDescription('Đây là test message để kiểm tra hệ thống withdraw notification')
            .setColor('#00ff00')
            .setTimestamp();

          await adminChannel.send({ embeds: [testEmbed] });
          
          debugEmbed.addFields({
            name: '🧪 Test Result',
            value: '✅ Test message sent successfully!',
            inline: false
          });
        }
      } catch (error) {
        debugEmbed.addFields({
          name: '🧪 Test Result',
          value: `❌ Error: ${error.message}`,
          inline: false
        });
      }
    }

    await interaction.reply({ embeds: [debugEmbed], ephemeral: true });
  }
};