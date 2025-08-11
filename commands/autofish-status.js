import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { activeAutoFishing } from './auto-fishing.js';
import { getOrCreateVIP, getVIPPerks } from '../utils/vip.js';

export default {
  data: new SlashCommandBuilder()
    .setName('autofish-status')
    .setDescription('📊 Xem trạng thái auto-fishing hiện tại'),
  async execute(interaction) {
    try {
      // Kiểm tra user có đang auto-fishing không
      if (!activeAutoFishing.has(interaction.user.id)) {
        await interaction.reply({
          content: '❌ Bạn không có phiên auto-fishing nào đang chạy!\n💡 Sử dụng `/auto-fishing` để bắt đầu.',
          flags: 64
        });
        return;
      }

      // Lấy thông tin phiên auto-fishing
      const session = activeAutoFishing.get(interaction.user.id);
      const currentTime = Date.now();
      const elapsedTime = currentTime - session.startTime;
      const remainingTime = session.endTime - currentTime;
      
      const elapsedMinutes = Math.floor(elapsedTime / (60 * 1000));
      const remainingMinutes = Math.max(0, Math.ceil(remainingTime / (60 * 1000)));
      const totalMinutes = session.duration;
      const progress = Math.min(elapsedTime / (totalMinutes * 60 * 1000), 1);
      const percentage = Math.floor(progress * 100);

      // Tạo thanh tiến trình
      const filledBars = Math.floor(progress * 10);
      const emptyBars = 10 - filledBars;
      const progressBar = '▰'.repeat(filledBars) + '▱'.repeat(emptyBars);

      // Ước tính kết quả hiện tại
      const estimatedFish = Math.floor(progress * (Math.floor(Math.random() * (totalMinutes * 2)) + totalMinutes));
      const baseCoinsPerFish = Math.floor(Math.random() * 50) + 25;
      let estimatedCoins = estimatedFish * baseCoinsPerFish;

      // Lấy VIP perks
      const vip = await getOrCreateVIP(interaction.user.id, interaction.user.username);
      const vipPerks = getVIPPerks(vip);
      if (vipPerks) {
        estimatedCoins = Math.floor(estimatedCoins * vipPerks.coinMultiplier);
      }

      const embed = new EmbedBuilder()
        .setTitle('📊 Trạng Thái Auto-Fishing')
        .setDescription('**Thông tin phiên auto-fishing đang chạy:**')
        .setColor(vipPerks?.color || '#3498db')
        .addFields(
          { name: '⏱️ Thời gian', value: `${elapsedMinutes}/${totalMinutes} phút`, inline: true },
          { name: '⏳ Còn lại', value: `${remainingMinutes} phút`, inline: true },
          { name: '📊 Tiến độ', value: `${percentage}%`, inline: true },
          { name: '📈 Thanh tiến trình', value: `${progressBar} ${percentage}%`, inline: false },
          { name: '🐟 Ước tính cá', value: `~${estimatedFish} con`, inline: true },
          { name: '💰 Ước tính tiền', value: `~${estimatedCoins.toLocaleString()} xu`, inline: true },
          { name: '👑 VIP Status', value: vipPerks ? `${vipPerks.tier} (x${vipPerks.coinMultiplier})` : 'Không có VIP', inline: true }
        )
        .setFooter({ text: 'Sử dụng /stop-autofish để dừng sớm' })
        .setTimestamp();

      // Thêm thông tin thời gian bắt đầu và kết thúc
      const startTime = Math.floor(session.startTime / 1000);
      const endTime = Math.floor(session.endTime / 1000);
      
      embed.addFields(
        { name: '🕐 Bắt đầu', value: `<t:${startTime}:R>`, inline: true },
        { name: '🕐 Kết thúc', value: `<t:${endTime}:R>`, inline: true },
        { name: '📊 Hiệu suất', value: `${elapsedMinutes > 0 ? Math.round(estimatedFish / elapsedMinutes) : 0} cá/phút`, inline: true }
      );

      // Thông báo nếu sắp hoàn thành
      if (remainingMinutes <= 5 && remainingMinutes > 0) {
        embed.setDescription('**🔔 Sắp hoàn thành! Auto-fishing sẽ kết thúc trong vài phút.**');
      } else if (remainingMinutes <= 0) {
        embed.setDescription('**✅ Auto-fishing đã hoàn thành! Đang xử lý kết quả...**');
        embed.setColor('#00FF00');
      }

      await interaction.reply({ embeds: [embed], flags: 64 });

    } catch (error) {
      console.error('Auto-fish status error:', error);
      await interaction.reply({
        content: '❌ Có lỗi khi lấy trạng thái auto-fishing!',
        flags: 64
      });
    }
  }
};