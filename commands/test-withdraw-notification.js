import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('test-withdraw-notification')
    .setDescription('🧪 [ADMIN] Test gửi withdraw notification đến admin channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return await interaction.reply({
        content: '❌ Bạn không có quyền sử dụng lệnh này!',
        ephemeral: true
      });
    }

    const adminChannelId = process.env.ADMIN_CHANNEL_ID;
    const adminRoleId = process.env.ADMIN_ROLE_ID;

    if (!adminChannelId) {
      return await interaction.reply({
        content: '❌ ADMIN_CHANNEL_ID không được cấu hình!',
        ephemeral: true
      });
    }

    const adminChannel = interaction.client.channels.cache.get(adminChannelId);
    if (!adminChannel) {
      return await interaction.reply({
        content: `❌ Không tìm thấy admin channel với ID: ${adminChannelId}`,
        ephemeral: true
      });
    }

    try {
      // Tạo mock withdraw request
      const mockRequest = {
        _id: { toString: () => 'TEST12345678' },
        userId: interaction.user.id,
        username: interaction.user.username,
        amount: 100000,
        fee: 5000,
        xuAfterFee: 95000,
        vndAmount: 95000,
        bankName: 'vietcombank',
        accountNumber: '1234567890',
        accountHolder: 'NGUYEN VAN TEST',
        adminNote: 'Test withdraw notification',
        status: 'pending',
        createdAt: new Date()
      };

      // Tạo test embed
      const testEmbed = new EmbedBuilder()
        .setTitle('🧪 TEST WITHDRAW NOTIFICATION')
        .setDescription('**Đây là test withdraw request để kiểm tra hệ thống**')
        .addFields(
          { name: '👤 Người dùng', value: `<@${mockRequest.userId}>\n\`${mockRequest.username}\` (${mockRequest.userId})`, inline: false },
          { name: '💰 Chi tiết giao dịch', value: `**Xu gốc:** ${mockRequest.amount.toLocaleString()} xu\n**Phí:** ${mockRequest.fee.toLocaleString()} xu (5%)\n**VNĐ chuyển:** **${mockRequest.vndAmount.toLocaleString()} VNĐ**`, inline: false },
          { name: '🏦 Thông tin nhận tiền', value: `**Ngân hàng:** ${mockRequest.bankName}\n**Số TK:** \`${mockRequest.accountNumber}\`\n**Tên:** ${mockRequest.accountHolder}`, inline: false },
          { name: '📝 Ghi chú', value: mockRequest.adminNote, inline: false },
          { name: '🧪 Test Mode', value: 'Đây là test notification - KHÔNG CHUYỂN TIỀN THẬT', inline: false }
        )
        .setColor('#ffd700')
        .setThumbnail(interaction.user.displayAvatarURL())
        .setFooter({ text: `Test ID: ${mockRequest._id.toString()} • Test Mode` })
        .setTimestamp();

      // Tạo test buttons
      const testButtons = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`test_qr_${mockRequest._id.toString()}`)
            .setLabel('📱 Test QR')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(`test_approve_${mockRequest._id.toString()}`)
            .setLabel('✅ Test Duyệt')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`test_reject_${mockRequest._id.toString()}`)
            .setLabel('❌ Test Từ chối')
            .setStyle(ButtonStyle.Danger)
        );

      // Gửi test notification
      const mention = adminRoleId ? `<@&${adminRoleId}>` : '@Admin';
      await adminChannel.send({
        content: `${mention} 🧪 **TEST WITHDRAW NOTIFICATION**`,
        embeds: [testEmbed],
        components: [testButtons]
      });

      await interaction.reply({
        content: `✅ **Test notification đã được gửi thành công!**\n📍 Kiểm tra channel: <#${adminChannelId}>`,
        ephemeral: true
      });

    } catch (error) {
      console.error('Error sending test notification:', error);
      await interaction.reply({
        content: `❌ Lỗi khi gửi test notification: ${error.message}`,
        ephemeral: true
      });
    }
  }
};