import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { fishTypes } from '../utils/fishTypes.js';
import { GlobalStats } from '../schemas/globalStatsSchema.js';
import { getFishProbabilities } from '../utils/fishingLogic.js';

export default {
  data: new SlashCommandBuilder()
    .setName('list')
    .setDescription('Xem danh sách các loại cá có thể câu được 🐟'),

  async execute(interaction) {
    // Lấy thống kê toàn cục
    let globalStats = null;
    let totalCaught = 0;
    try {
      globalStats = await GlobalStats.findOne({ statsId: 'global' });
      if (globalStats) {
        totalCaught = Array.from(globalStats.totalFishCaught.values()).reduce((sum, count) => sum + count, 0);
      }
    } catch (error) {
      console.error('Error fetching global stats:', error);
    }

    // Tạo embed để hiển thị danh sách cá đẹp mắt
    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('🐟 Danh sách các loại cá')
      .setDescription(`Dưới đây là tất cả các loại cá bạn có thể câu được:\n${totalCaught > 0 ? `📊 **Tổng cá đã câu được:** ${totalCaught.toLocaleString()} con` : ''}`)
      .setTimestamp()
      .setFooter({ text: 'Fishbot - Hệ thống câu cá', iconURL: interaction.client.user.displayAvatarURL() });

    // Chia danh sách cá thành các nhóm theo rarity
    const commonFish = fishTypes.filter(fish => fish.rarity === 'common');
    const rareFish = fishTypes.filter(fish => fish.rarity === 'rare');
    const legendaryFish = fishTypes.filter(fish => fish.rarity === 'legendary');
    const mythicalFish = fishTypes.filter(fish => fish.rarity === 'mythical');

    // Lấy tỷ lệ với rod level 1 (cơ bản)
    const probabilities = getFishProbabilities(1);
    const probMap = new Map(probabilities.map(p => [p.name, { probability: p.probability, ratio: p.ratio }]));

    // Function để format thông tin cá với thống kê và tỷ lệ
    const formatFishWithStats = (fish) => {
      const rarityEmoji = { 'common': '🐟', 'rare': '🐠', 'legendary': '🐋', 'mythical': '⭐' };
      const emoji = rarityEmoji[fish.rarity] || '🐟';
      const prob = probMap.get(fish.name);
      
      let info = `${emoji} **${fish.name}** - ${fish.price} xu *(1/${prob.ratio})*`;
      if (globalStats && totalCaught > 0) {
        const caught = globalStats.totalFishCaught.get(fish.name) || 0;
        const percentage = ((caught / totalCaught) * 100).toFixed(1);
        info += ` - Đã câu: ${caught} (${percentage}%)`;
      }
      return info;
    };

    // Thêm field cho cá thường
    if (commonFish.length > 0) {
      const commonList = commonFish.map(formatFishWithStats).join('\n');
      embed.addFields({
        name: '🐟 Cá thường (~70% tỷ lệ)',
        value: commonList,
        inline: false
      });
    }

    // Thêm field cho cá hiếm
    if (rareFish.length > 0) {
      const rareList = rareFish.map(formatFishWithStats).join('\n');
      embed.addFields({
        name: '🐠 Cá hiếm (~25% tỷ lệ)',
        value: rareList,
        inline: false
      });
    }

    // Thêm field cho cá huyền thoại
    if (legendaryFish.length > 0) {
      const legendaryList = legendaryFish.map(formatFishWithStats).join('\n');
      embed.addFields({
        name: '🐋 Cá huyền thoại (~4.5% tỷ lệ)',
        value: legendaryList,
        inline: false
      });
    }

    // Thêm field cho cá cực hiếm
    if (mythicalFish.length > 0) {
      const mythicalList = mythicalFish.map(formatFishWithStats).join('\n');
      embed.addFields({
        name: '⭐ Cá cực hiếm (0.05% tỷ lệ)',
        value: mythicalList,
        inline: false
      });
    }

    // Thêm field thống kê tổng hợp
    if (globalStats && totalCaught > 0) {
      // Tìm 3 loại cá được câu nhiều nhất
      const sortedFish = fishTypes
        .map(fish => ({
          name: fish.name,
          caught: globalStats.totalFishCaught.get(fish.name) || 0,
          percentage: (((globalStats.totalFishCaught.get(fish.name) || 0) / totalCaught) * 100).toFixed(1)
        }))
        .filter(fish => fish.caught > 0)
        .sort((a, b) => b.caught - a.caught)
        .slice(0, 3);

      if (sortedFish.length > 0) {
        const topFishList = sortedFish.map((fish, index) => {
          const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
          return `${medal} **${fish.name}**: ${fish.caught} lần (${fish.percentage}%)`;
        }).join('\n');

        embed.addFields({
          name: '📊 Top 3 cá được câu nhiều nhất',
          value: topFishList,
          inline: false
        });
      }
    }

    // Thêm thông tin bổ sung
    embed.addFields({
      name: '💡 Mẹo',
      value: '• Nâng cấp cần câu để tăng cơ hội câu được cá hiếm hơn!\n• Sử dụng `/upgrade` để nâng cấp cần câu\n• Sử dụng `/fish` để bắt đầu câu cá',
      inline: false
    });

    await interaction.reply({ embeds: [embed] });
  }
};
