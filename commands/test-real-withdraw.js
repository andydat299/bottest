import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('test-real-withdraw')
    .setDescription('🧪 [ADMIN] Test withdraw notification với dữ liệu thật')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User để test')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('Số xu để test')
        .setRequired(true)
        .setMinValue(50000)
        .setMaxValue(1000000)
    ),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return await interaction.reply({
        content: '❌ Bạn không có quyền sử dụng lệnh này!',
        ephemeral: true
      });
    }

    const testUser = interaction.options.getUser('user');
    const testAmount = interaction.options.getInteger('amount');

    try {
      console.log('🧪 [TEST] Creating mock withdraw request...');
      
      // Tạo mock request object giống y chang real withdraw
      const mockRequest = {
        _id: { toString: () => `TEST${Date.now()}` },
        userId: testUser.id,
        username: testUser.username,
        amount: testAmount,
        fee: Math.floor(testAmount * 0.05),
        xuAfterFee: testAmount - Math.floor(testAmount * 0.05),
        vndAmount: testAmount - Math.floor(testAmount * 0.05),
        bankName: 'vietinbank',
        accountNumber: '105872781506',
        accountHolder: 'PHAM DANG KHOI',
        adminNote: '',
        status: 'pending',
        createdAt: new Date()
      };

      console.log('📊 [TEST] Mock request created:', {
        id: mockRequest._id.toString(),
        user: mockRequest.username,
        amount: mockRequest.vndAmount
      });

      // Import và test notification function
      const { sendWithdrawNotification } = await import('../utils/withdrawNotification.js');
      
      console.log('📤 [TEST] Testing withdraw notification...');
      const notificationSent = await sendWithdrawNotification(interaction, mockRequest);

      const resultEmbed = new EmbedBuilder()
        .setTitle('🧪 Test Real Withdraw Notification')
        .setDescription('**Kết quả test withdraw notification với module mới**')
        .addFields(
          { name: '👤 Test User', value: `<@${testUser.id}>\n\`${testUser.username}\``, inline: false },
          { name: '💰 Test Amount', value: `${testAmount.toLocaleString()} xu → ${mockRequest.vndAmount.toLocaleString()} VNĐ`, inline: false },
          { name: '📤 Notification Result', value: notificationSent ? '✅ Sent successfully!' : '❌ Failed to send', inline: false },
          { name: '🆔 Test ID', value: `\`${mockRequest._id.toString()}\``, inline: false }
        )
        .setColor(notificationSent ? '#00ff00' : '#ff0000')
        .setTimestamp();

      if (notificationSent) {
        const adminChannelId = process.env.ADMIN_CHANNEL_ID;
        resultEmbed.addFields({
          name: '📍 Admin Channel',
          value: `<#${adminChannelId}>\nKiểm tra channel để xem notification!`,
          inline: false
        });
      } else {
        resultEmbed.addFields({
          name: '🔧 Troubleshooting',
          value: 'Check console logs để xem lỗi chi tiết\nCó thể là permission issue hoặc channel không tồn tại',
          inline: false
        });
      }

      await interaction.reply({ embeds: [resultEmbed], ephemeral: true });

    } catch (error) {
      console.error('❌ [TEST] Error in test real withdraw:', error);
      await interaction.reply({
        content: `❌ **Lỗi khi test:**\n\`\`\`${error.message}\`\`\``,
        ephemeral: true
      });
    }
  }
};