import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('mystery-box')
    .setDescription('🎁 Mua và mở Mystery Box')
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Loại Mystery Box')
        .setRequired(true)
        .addChoices(
          { name: '🎁 Hộp Bí Ẩn Cơ Bản (10,000 xu)', value: 'basic' },
          { name: '🎊 Hộp Bí Ẩn Khổng Lồ (50,000 xu)', value: 'mega' },
          { name: '💎 Hộp Bí Ẩn Kim Cương (200,000 xu - Chỉ VIP)', value: 'diamond' }
        )
    )
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('Số lượng box muốn mua (1-10)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(10)
    ),

  async execute(interaction) {
    // Mystery Box system tạm thời bị vô hiệu hóa
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle('🚧 Mystery Box Tạm Thời Bảo Trì')
          .setDescription('**Mystery Box system hiện đang được bảo trì và cập nhật.**')
          .addFields(
            { name: '⏰ Trạng thái', value: 'Tạm thời vô hiệu hóa', inline: true },
            { name: '🔧 Lý do', value: 'Đang cập nhật hệ thống', inline: true },
            { name: '📅 Dự kiến', value: 'Sớm trở lại', inline: true },
            { name: '💡 Thay thế', value: 'Hãy thử:\n• `/fish` - Câu cá kiếm xu\n• `/daily` - Nhận thưởng hàng ngày\n• `/blackjack` - Chơi casino\n• `/balance` - Xem số dư', inline: false }
          )
          .setColor('#ff9900')
          .setTimestamp()
      ],
      ephemeral: true
    });

    console.log(`🚧 ${interaction.user.username} tried to use disabled mystery-box command`);
    return;

    /*
    // MYSTERY BOX SYSTEM - TEMPORARILY DISABLED
    // Original mystery box code has been commented out for maintenance
    // To re-enable: uncomment this block and remove the maintenance message above
    */
  }
};