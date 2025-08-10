import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('stop-autofish')
    .setDescription('🛑 Dừng phiên auto-fishing đang chạy'),
  async execute(interaction) {
    try {
      // Dynamic import để tránh circular dependency
      const autoFishModule = await import('./auto-fishing.js');
      const activeAutoFishing = autoFishModule.activeAutoFishing;
      
      if (!activeAutoFishing || !activeAutoFishing.has(interaction.user.id)) {
        await interaction.reply({
          content: '❌ Bạn không có phiên auto-fishing nào đang chạy.',
          flags: 64
        });
        return;
      }

      // Xóa user khỏi danh sách auto-fishing
      const session = activeAutoFishing.get(interaction.user.id);
      activeAutoFishing.delete(interaction.user.id);

      const elapsed = Math.floor((Date.now() - session.startTime) / 60000);
      
      const embed = new EmbedBuilder()
        .setTitle('🛑 Đã Dừng Auto-Fishing')
        .setDescription('Phiên auto-fishing đã được dừng.')
        .setColor('#FF6600')
        .addFields(
          { name: '⏱️ Thời gian đã chạy', value: `${elapsed} phút`, inline: true },
          { name: '⏱️ Thời gian dự kiến', value: `${session.duration} phút`, inline: true },
          { name: '📊 Trạng thái', value: 'Đã dừng', inline: true }
        )
        .setFooter({ text: 'Bạn có thể bắt đầu auto-fishing mới.' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed], flags: 64 });
      
    } catch (error) {
      console.error('Stop auto-fishing error:', error);
      await interaction.reply({
        content: '❌ Có lỗi xảy ra khi dừng auto-fishing!',
        flags: 64
      });
    }
  }
};