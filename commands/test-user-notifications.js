// File đã bị xóa để làm nhẹ code
// User notifications đã được test và hoạt động ổn

export default {
  data: new SlashCommandBuilder()
    .setName('test-user-notifications')
    .setDescription('🧪 [ADMIN] Test approve/reject notifications gửi cho user')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User để test notification')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Loại notification')
        .setRequired(true)
        .addChoices(
          { name: 'Approve (Duyệt)', value: 'approve' },
          { name: 'Reject (Từ chối)', value: 'reject' },
          { name: 'Both (Cả hai)', value: 'both' }
        )
    ),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return await interaction.reply({
        content: '❌ Bạn không có quyền sử dụng lệnh này!',
        ephemeral: true
      });
    }

    const testUser = interaction.options.getUser('user');
    const notificationType = interaction.options.getString('type');

    try {
      const { createWithdrawApproveEmbed, createWithdrawRejectEmbed } = await import('../utils/adminUtils.js');
      
      // Mock request object for testing
      const mockRequest = {
        _id: { toString: () => `TEST${Date.now()}` },
        userId: testUser.id,
        username: testUser.username,
        amount: 100000,
        fee: 5000,
        xuAfterFee: 95000,
        vndAmount: 95000,
        bankName: 'vietcombank',
        accountNumber: '1234567890',
        accountHolder: 'NGUYEN VAN TEST',
        adminNote: 'Test notification from admin',
        status: 'pending',
        createdAt: new Date(),
        processedAt: new Date()
      };

      console.log('🧪 Testing user notifications...');
      console.log('👤 Target user:', testUser.username, testUser.id);
      console.log('📧 Notification type:', notificationType);

      let sentCount = 0;

      if (notificationType === 'approve' || notificationType === 'both') {
        try {
          console.log('📤 Sending approve notification...');
          const approveEmbed = createWithdrawApproveEmbed(EmbedBuilder, mockRequest);
          await testUser.send({ 
            content: '🧪 **TEST NOTIFICATION - APPROVE**\n*Đây là test notification từ admin*',
            embeds: [approveEmbed] 
          });
          console.log('✅ Approve notification sent successfully');
          sentCount++;
        } catch (approveError) {
          console.error('❌ Failed to send approve notification:', approveError.message);
        }
      }

      if (notificationType === 'reject' || notificationType === 'both') {
        try {
          console.log('📤 Sending reject notification...');
          const rejectEmbed = createWithdrawRejectEmbed(EmbedBuilder, mockRequest);
          await testUser.send({ 
            content: '🧪 **TEST NOTIFICATION - REJECT**\n*Đây là test notification từ admin*',
            embeds: [rejectEmbed] 
          });
          console.log('✅ Reject notification sent successfully');
          sentCount++;
        } catch (rejectError) {
          console.error('❌ Failed to send reject notification:', rejectError.message);
        }
      }

      const resultEmbed = new EmbedBuilder()
        .setTitle('🧪 Test User Notifications')
        .setDescription('**Kết quả test gửi notification cho user**')
        .addFields(
          { name: '👤 Target User', value: `<@${testUser.id}>\n\`${testUser.username}\``, inline: false },
          { name: '📧 Notification Type', value: notificationType.toUpperCase(), inline: true },
          { name: '📊 Result', value: `✅ Sent ${sentCount} notification${sentCount > 1 ? 's' : ''}`, inline: true },
          { name: '💡 Note', value: 'Check DMs của user để xem notifications\nNếu không nhận được, có thể user đã tắt DMs', inline: false }
        )
        .setColor(sentCount > 0 ? '#00ff00' : '#ff0000')
        .setTimestamp();

      await interaction.reply({ embeds: [resultEmbed], ephemeral: true });

    } catch (error) {
      console.error('❌ Error testing user notifications:', error);
      await interaction.reply({
        content: `❌ **Lỗi khi test notifications:**\n\`\`\`${error.message}\`\`\``,
        ephemeral: true
      });
    }
  }
};