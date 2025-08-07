import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('test-withdraw-embeds')
    .setDescription('🧪 [ADMIN] Test approve/reject embeds cho withdraw')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Test loại nào')
        .setRequired(true)
        .addChoices(
          { name: 'Approve Embed', value: 'approve' },
          { name: 'Reject Embed', value: 'reject' },
          { name: 'Both', value: 'both' }
        )
    ),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return await interaction.reply({
        content: '❌ Bạn không có quyền sử dụng lệnh này!',
        ephemeral: true
      });
    }

    const testType = interaction.options.getString('type');

    try {
      const { createWithdrawApproveEmbed, createWithdrawRejectEmbed } = await import('../utils/adminUtils.js');
      
      // Mock request object for testing
      const mockRequest = {
        _id: { toString: () => 'TEST67890123' },
        userId: interaction.user.id,
        username: interaction.user.username,
        amount: 100000,
        fee: 5000,
        xuAfterFee: 95000,
        vndAmount: 95000,
        bankName: 'vietcombank',
        accountNumber: '1234567890',
        accountHolder: 'NGUYEN VAN TEST',
        adminNote: 'Test withdraw embed',
        status: 'pending',
        createdAt: new Date(),
        processedAt: new Date()
      };

      const embeds = [];

      if (testType === 'approve' || testType === 'both') {
        console.log('🧪 Testing approve embed...');
        const approveEmbed = createWithdrawApproveEmbed(EmbedBuilder, mockRequest);
        embeds.push(approveEmbed);
      }

      if (testType === 'reject' || testType === 'both') {
        console.log('🧪 Testing reject embed...');
        const rejectEmbed = createWithdrawRejectEmbed(EmbedBuilder, mockRequest);
        embeds.push(rejectEmbed);
      }

      await interaction.reply({
        content: `🧪 **Test Withdraw ${testType.toUpperCase()} Embeds**\n\n**Đây là embeds sẽ được gửi cho user khi admin approve/reject:**`,
        embeds: embeds,
        ephemeral: true
      });

      console.log('✅ Withdraw embeds test completed');

    } catch (error) {
      console.error('❌ Error testing withdraw embeds:', error);
      await interaction.reply({
        content: `❌ **Lỗi khi test embeds:**\n\`\`\`${error.message}\`\`\``,
        ephemeral: true
      });
    }
  }
};