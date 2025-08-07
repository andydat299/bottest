import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('post-withdraw')
    .setDescription('💰 [ADMIN] Đăng panel đổi tiền')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('Kênh để đăng panel (mặc định: kênh hiện tại)')
        .setRequired(false)
    ),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return await interaction.reply({
        content: '❌ Bạn không có quyền sử dụng lệnh này!',
        ephemeral: true
      });
    }

    const targetChannel = interaction.options.getChannel('channel') || interaction.channel;

    // Tạo embed panel đổi tiền
    const withdrawEmbed = new EmbedBuilder()
      .setTitle('💰 HỆ THỐNG ĐỔI TIỀN')
      .setDescription('**Đổi xu trong game thành tiền VNĐ thật!**')
      .addFields(
        {
          name: '💎 Tỷ giá quy đổi',
          value: '• **1 xu = 1 VNĐ** (1:1)\n• **Tối thiểu**: 50,000 xu\n• **Tối đa**: 1,000,000 xu/lần',
          inline: false
        },
        {
          name: '💸 Phí giao dịch',
          value: '• **Phí rút**: 5% số xu\n• **Ví dụ**: Rút 100,000 xu → Nhận 95,000 VNĐ',
          inline: false
        },
        {
          name: '🏦 Phương thức thanh toán',
          value: '• Chuyển khoản ngân hàng\n• Vietcombank, Techcombank, BIDV\n• VietinBank, Agribank, MBBank\n• TPBank, Sacombank',
          inline: false
        },
        {
          name: '⏰ Thời gian xử lý',
          value: '• **1-24 giờ** (ngày thường)\n• **24-48 giờ** (cuối tuần)\n• Xử lý thủ công bởi admin',
          inline: false
        },
        {
          name: '⚠️ Lưu ý quan trọng',
          value: '• Kiểm tra kỹ thông tin ngân hàng\n• Xu sẽ bị trừ ngay khi tạo yêu cầu\n• Không thể hủy sau khi gửi\n• Liên hệ admin nếu có vấn đề',
          inline: false
        }
      )
      .setColor('#ffd700')
      .setFooter({ 
        text: 'Hệ thống đổi tiền an toàn và tin cậy • Được xử lý bởi admin' 
      })
      .setTimestamp();

    // Tạo button
    const withdrawButton = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('open_withdraw_panel')
          .setLabel('💰 ĐỔI TIỀN NGAY')
          .setStyle(ButtonStyle.Success)
          .setEmoji('💎'),
        new ButtonBuilder()
          .setCustomId('withdraw_status_check')
          .setLabel('📊 Kiểm tra trạng thái')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🔍'),
        new ButtonBuilder()
          .setCustomId('withdraw_history_view')
          .setLabel('📜 Lịch sử giao dịch')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('📋')
      );

    try {
      await targetChannel.send({
        embeds: [withdrawEmbed],
        components: [withdrawButton]
      });

      await interaction.reply({
        content: `✅ **Đã đăng panel đổi tiền thành công!**\n📍 Kênh: ${targetChannel}`,
        ephemeral: true
      });

    } catch (error) {
      console.error('Error posting withdraw panel:', error);
      await interaction.reply({
        content: '❌ Có lỗi khi đăng panel đổi tiền!',
        ephemeral: true
      });
    }
  }
};