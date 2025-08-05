import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { fishTypes } from '../utils/fishTypes.js';
import { GlobalStats } from '../schemas/globalStatsSchema.js';
import { User } from '../schemas/userSchema.js';

export default {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Xem thống kê chi tiết về việc câu cá của cộng đồng 📊'),

  async execute(interaction) {
    try {
      // Lấy thống kê toàn cục
      const globalStats = await GlobalStats.findOne({ statsId: 'global' });
      const totalPlayers = await User.countDocuments();
      
      if (!globalStats) {
        return interaction.reply({
          content: '📊 Chưa có dữ liệu thống kê nào! Hãy bắt đầu câu cá để tạo thống kê.',
        });
      }

      const totalCaught = Array.from(globalStats.totalFishCaught.values()).reduce((sum, count) => sum + count, 0);

      const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('📊 Thống kê câu cá cộng đồng')
        .setDescription(`**Tổng quan hệ thống câu cá**`)
        .setTimestamp()
        .setFooter({ text: 'Fishbot - Thống kê cộng đồng', iconURL: interaction.client.user.displayAvatarURL() });

      // Thông tin tổng quan
      embed.addFields({
        name: '🎯 Tổng quan',
        value: `🎣 **Tổng người chơi:** ${totalPlayers.toLocaleString()}\n🐟 **Tổng cá đã câu:** ${totalCaught.toLocaleString()}\n📅 **Cập nhật lần cuối:** <t:${Math.floor(globalStats.lastUpdated.getTime() / 1000)}:R>`,
        inline: false
      });

      // Thống kê theo loại cá (tất cả cá có số liệu)
      const allFishStats = fishTypes
        .map(fish => ({
          name: fish.name,
          price: fish.price,
          caught: globalStats.totalFishCaught.get(fish.name) || 0,
          percentage: totalCaught > 0 ? (((globalStats.totalFishCaught.get(fish.name) || 0) / totalCaught) * 100).toFixed(1) : '0.0'
        }))
        .filter(fish => fish.caught > 0)
        .sort((a, b) => b.caught - a.caught);

      if (allFishStats.length > 0) {
        // Chia thành 2 cột để hiển thị gọn hơn
        const half = Math.ceil(allFishStats.length / 2);
        const firstHalf = allFishStats.slice(0, half);
        const secondHalf = allFishStats.slice(half);

        const formatFishStat = (fish, index) => {
          const rank = allFishStats.findIndex(f => f.name === fish.name) + 1;
          return `**${rank}.** ${fish.name}: ${fish.caught} (${fish.percentage}%)`;
        };

        embed.addFields({
          name: '🐟 Thống kê đầy đủ (Phần 1)',
          value: firstHalf.map(formatFishStat).join('\n') || 'Không có dữ liệu',
          inline: true
        });

        if (secondHalf.length > 0) {
          embed.addFields({
            name: '🐟 Thống kê đầy đủ (Phần 2)',
            value: secondHalf.map(formatFishStat).join('\n'),
            inline: true
          });
        }
      }

      // Thống kê theo độ hiếm
      const commonCaught = fishTypes.filter(f => f.price <= 50).reduce((sum, fish) => sum + (globalStats.totalFishCaught.get(fish.name) || 0), 0);
      const rareCaught = fishTypes.filter(f => f.price > 50 && f.price <= 200).reduce((sum, fish) => sum + (globalStats.totalFishCaught.get(fish.name) || 0), 0);
      const legendaryCaught = fishTypes.filter(f => f.price > 200).reduce((sum, fish) => sum + (globalStats.totalFishCaught.get(fish.name) || 0), 0);

      if (totalCaught > 0) {
        embed.addFields({
          name: '🎯 Thống kê theo độ hiếm',
          value: `🐟 **Cá thường:** ${commonCaught} (${((commonCaught / totalCaught) * 100).toFixed(1)}%)\n🐠 **Cá hiếm:** ${rareCaught} (${((rareCaught / totalCaught) * 100).toFixed(1)}%)\n🐋 **Cá huyền thoại:** ${legendaryCaught} (${((legendaryCaught / totalCaught) * 100).toFixed(1)}%)`,
          inline: false
        });
      }

      await interaction.reply({ embeds: [embed] });

    } catch (error) {
      console.error('Error in stats command:', error);
      await interaction.reply({
        content: '❌ Có lỗi xảy ra khi lấy thống kê. Vui lòng thử lại sau!',
      });
    }
  }
};
