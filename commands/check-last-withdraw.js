import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('check-last-withdraw')
    .setDescription('🔍 [ADMIN] Check withdraw request gần nhất và debug')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return await interaction.reply({
        content: '❌ Bạn không có quyền sử dụng lệnh này!',
        ephemeral: true
      });
    }

    try {
      const { WithdrawRequest } = await import('../schemas/withdrawSchema.js');
      
      // Tìm withdraw request mới nhất
      const lastRequest = await WithdrawRequest.findOne({}).sort({ createdAt: -1 });
      
      if (!lastRequest) {
        return await interaction.reply({
          content: '❌ Không tìm thấy withdraw request nào!',
          ephemeral: true
        });
      }

      console.log('🔍 Checking last withdraw request:', lastRequest._id);
      console.log('📊 Request details:', {
        id: lastRequest._id,
        userId: lastRequest.userId,
        amount: lastRequest.amount,
        vndAmount: lastRequest.vndAmount,
        status: lastRequest.status,
        createdAt: lastRequest.createdAt
      });

      // Test gửi admin notification cho request này
      const adminChannelId = process.env.ADMIN_CHANNEL_ID;
      const adminChannel = interaction.client.channels.cache.get(adminChannelId);
      
      const debugEmbed = new EmbedBuilder()
        .setTitle('🔍 Last Withdraw Request Debug')
        .setDescription('**Thông tin withdraw request gần nhất**')
        .addFields(
          { name: '🆔 Request ID', value: `\`${lastRequest._id}\``, inline: false },
          { name: '👤 User', value: `<@${lastRequest.userId}> (\`${lastRequest.userId}\`)`, inline: false },
          { name: '💰 Transaction', value: `**${lastRequest.amount.toLocaleString()} xu** → **${lastRequest.vndAmount.toLocaleString()} VNĐ**`, inline: false },
          { name: '🏦 Bank Info', value: `${lastRequest.bankName.toUpperCase()}\n${lastRequest.accountNumber}\n${lastRequest.accountHolder}`, inline: false },
          { name: '📅 Created', value: `<t:${Math.floor(lastRequest.createdAt.getTime()/1000)}:F>`, inline: true },
          { name: '📊 Status', value: lastRequest.status.toUpperCase(), inline: true },
          { name: '📍 Admin Channel', value: adminChannel ? `✅ Found: ${adminChannel.name}` : '❌ Not found', inline: false }
        )
        .setColor(lastRequest.status === 'pending' ? '#ffd700' : '#00ff00')
        .setTimestamp();

      // Thử gửi notification lại cho request này nếu pending
      if (lastRequest.status === 'pending' && adminChannel) {
        try {
          console.log('🔄 Attempting to resend admin notification...');
          
          const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = await import('discord.js');
          
          const retryEmbed = new EmbedBuilder()
            .setTitle('🔄 RETRY WITHDRAW NOTIFICATION')
            .setDescription('**Admin notification bị miss - gửi lại**')
            .addFields(
              { name: '👤 User', value: `<@${lastRequest.userId}>\n\`${lastRequest.username || 'Unknown'}\``, inline: false },
              { name: '💰 Amount', value: `**${lastRequest.vndAmount.toLocaleString()} VNĐ**`, inline: true },
              { name: '🏦 Bank', value: `${lastRequest.bankName}\n${lastRequest.accountNumber}`, inline: true },
              { name: '🆔 ID', value: `\`${lastRequest._id}\``, inline: false }
            )
            .setColor('#ff6b6b')
            .setTimestamp();

          const buttons = new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setCustomId(`withdraw_qr_${lastRequest._id}`)
                .setLabel('📱 Tạo QR')
                .setStyle(ButtonStyle.Primary),
              new ButtonBuilder()
                .setCustomId(`withdraw_approve_${lastRequest._id}`)
                .setLabel('✅ Duyệt')
                .setStyle(ButtonStyle.Success),
              new ButtonBuilder()
                .setCustomId(`withdraw_reject_${lastRequest._id}`)
                .setLabel('❌ Từ chối')
                .setStyle(ButtonStyle.Danger)
            );

          const adminRoleId = process.env.ADMIN_ROLE_ID;
          const mention = adminRoleId ? `<@&${adminRoleId}>` : '@Admin';

          const sentMessage = await adminChannel.send({
            content: `${mention} 🔄 **RETRY NOTIFICATION**`,
            embeds: [retryEmbed],
            components: [buttons]
          });

          console.log('✅ Retry notification sent:', sentMessage.id);
          
          debugEmbed.addFields({
            name: '🔄 Retry Result',
            value: `✅ Đã gửi lại notification thành công!\nMessage ID: \`${sentMessage.id}\``,
            inline: false
          });

        } catch (retryError) {
          console.error('❌ Retry notification failed:', retryError);
          debugEmbed.addFields({
            name: '🔄 Retry Result',
            value: `❌ Lỗi khi gửi lại: \`${retryError.message}\``,
            inline: false
          });
        }
      }

      await interaction.reply({ embeds: [debugEmbed], ephemeral: true });

    } catch (error) {
      console.error('Error checking last withdraw:', error);
      await interaction.reply({
        content: `❌ **Lỗi khi check withdraw:**\n\`\`\`${error.message}\`\`\``,
        ephemeral: true
      });
    }
  }
};