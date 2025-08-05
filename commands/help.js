import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Xem hướng dẫn sử dụng bot và danh sách lệnh 📖'),
  prefixEnabled: true, // Cho phép sử dụng với prefix

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('📖 Hướng dẫn sử dụng Fishbot')
      .setDescription('**Chào mừng đến với hệ thống câu cá!** 🎣\n\n✨ **Bạn có thể sử dụng 2 cách:**\n• **Slash Commands:** `/fish`, `/profile`, `/help`...\n• **Prefix Commands:** `f!fish`, `f!profile`, `f!help`...\n\nNhấn vào các nút hoặc sử dụng lệnh bên dưới:')
      .addFields(
        {
          name: '🎣 Lệnh câu cá',
          value: '• `/fish` hoặc `f!fish` - Bắt đầu câu cá\n• `/inventory` hoặc `f!inventory` - Xem kho cá của bạn\n• `/sell` hoặc `f!sell` - Bán toàn bộ cá để lấy xu\n• `/cooldown` - Kiểm tra thời gian chờ\n• `/quests` - Xem nhiệm vụ hàng ngày',
          inline: true
        },
        {
          name: '👤 Lệnh thông tin',
          value: '• `/profile` hoặc `f!profile` - Xem hồ sơ cá nhân\n• `/fishstats` hoặc `f!fishstats` - Thống kê câu cá chi tiết\n• `/list` - Xem danh sách tất cả loại cá\n• `/stats` - Xem thống kê cộng đồng\n• `/rates` - Xem cá có thể câu được\n• `/chatstats` hoặc `f!chatstats` - Xem thống kê chat',
          inline: true
        },
        {
          name: '⚙️ Lệnh hệ thống',
          value: '• `/upgrade` hoặc `f!upgrade` - Nâng cấp cần câu\n• `/upgrades` - Xem bảng giá nâng cấp\n• `/reset` - Reset toàn bộ dữ liệu\n• `/help` hoặc `f!help` - Xem hướng dẫn này',
          inline: false
        },
        {
          name: '💡 Mẹo chơi',
          value: '1. **5 lần đầu câu cá MIỄN PHÍ!** 🆓\n2. Sau đó mỗi lần câu tốn **10 xu**\n3. Có tỷ lệ câu hụt (~20%, giảm theo rod level)\n4. Bán cá để có xu mua nâng cấp\n5. Nâng cấp cần câu để giảm tỷ lệ câu hụt\n6. **Cooldown 1 phút** giữa các lần câu cá\n7. Hoàn thành quest hàng ngày để có thêm xu!',
          inline: false
        }
      )
      .setTimestamp()
      .setFooter({ 
        text: 'Fishbot - Nhấn nút để sử dụng lệnh!', 
        iconURL: interaction.client.user.displayAvatarURL() 
      });

    // Tạo các nút để chạy lệnh
    const row1 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('help_fish')
          .setLabel('🎣 Câu cá')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('help_inventory')
          .setLabel('🎒 Kho cá')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('help_sell')
          .setLabel('💰 Bán cá')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('help_profile')
          .setLabel('👤 Hồ sơ')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('help_upgrade')
          .setLabel('⬆️ Nâng cấp')
          .setStyle(ButtonStyle.Danger)
      );

    const row2 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('help_list')
          .setLabel('📋 Danh sách cá')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('help_stats')
          .setLabel('📊 Thống kê')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('help_reset')
          .setLabel('🔄 Reset')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('help_refresh')
          .setLabel('🔄 Làm mới')
          .setStyle(ButtonStyle.Primary)
      );

    await interaction.reply({
      embeds: [embed],
      components: [row1, row2]
    });
  }
};
