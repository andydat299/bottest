import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('test-qr')
    .setDescription('🧪 [ADMIN] Test tạo QR code chuyển khoản')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
      option.setName('bank')
        .setDescription('Tên ngân hàng')
        .setRequired(true)
        .addChoices(
          { name: 'Vietcombank', value: 'vietcombank' },
          { name: 'Techcombank', value: 'techcombank' },
          { name: 'BIDV', value: 'bidv' },
          { name: 'VietinBank', value: 'vietinbank' },
          { name: 'Agribank', value: 'agribank' },
          { name: 'MBBank', value: 'mbbank' }
        )
    )
    .addStringOption(option =>
      option.setName('account')
        .setDescription('Số tài khoản')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('name')
        .setDescription('Tên chủ tài khoản')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('Số tiền (VNĐ)')
        .setRequired(true)
        .setMinValue(1000)
        .setMaxValue(10000000)
    ),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return await interaction.reply({
        content: '❌ Bạn không có quyền sử dụng lệnh này!',
        ephemeral: true
      });
    }

    const bank = interaction.options.getString('bank');
    const account = interaction.options.getString('account');
    const name = interaction.options.getString('name').toUpperCase();
    const amount = interaction.options.getInteger('amount');

    try {
      const { generateBankQR, generateBankingLinks } = await import('../utils/bankQR.js');
      
      // Tạo mock request object
      const mockRequest = {
        _id: { toString: () => 'TEST12345678' },
        bankName: bank,
        accountNumber: account,
        accountHolder: name,
        vndAmount: amount
      };

      const qrUrl = generateBankQR(
        {
          bankName: bank,
          accountNumber: account,
          accountHolder: name
        },
        amount,
        `Test transfer - ID:TEST1234`
      );

      const bankingLink = generateBankingLinks(
        {
          bankName: bank,
          accountNumber: account,
          accountHolder: name
        },
        amount,
        `Test transfer - ID:TEST1234`
      );

      const qrEmbed = new EmbedBuilder()
        .setTitle('🧪 TEST QR CODE CHUYỂN KHOẢN')
        .setDescription('**Đây là QR code test - KHÔNG CHUYỂN TIỀN THẬT!**')
        .addFields(
          { name: '🏦 Ngân hàng', value: bank.toUpperCase(), inline: true },
          { name: '🔢 Số tài khoản', value: `\`${account}\``, inline: true },
          { name: '👤 Tên người nhận', value: name, inline: true },
          { name: '💰 Số tiền', value: `**${amount.toLocaleString()} VNĐ**`, inline: true },
          { name: '📝 Nội dung CK', value: `\`Test transfer - ID:TEST1234\``, inline: true },
          { name: '📱 Mở App Banking', value: `[Chuyển khoản nhanh](${bankingLink})`, inline: true }
        )
        .setImage(qrUrl)
        .setColor('#ffd700')
        .setFooter({ text: 'QR Test Mode - Chỉ để kiểm tra giao diện' })
        .setTimestamp();

      await interaction.reply({ 
        embeds: [qrEmbed], 
        ephemeral: true 
      });

    } catch (error) {
      console.error('Error generating test QR:', error);
      await interaction.reply({
        content: '❌ Có lỗi khi tạo QR code test!',
        ephemeral: true
      });
    }
  }
};