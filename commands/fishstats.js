import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { User } from '../schemas/userSchema.js';

export default {
  data: new SlashCommandBuilder()
    .setName('fishstats')
    .setDescription('Xem thống kê câu cá chi tiết của bạn 📊'),
  prefixEnabled: true, // Cho phép sử dụng với prefix

  async execute(interaction) {
    const user = await User.findOne({ discordId: interaction.user.id });
    
    if (!user || !user.fishingStats || user.fishingStats.totalFishingAttempts === 0) {
      return interaction.reply({
        content: '🎣 Bạn chưa có thống kê câu cá nào!\n💡 Hãy thử lệnh `/fish` để bắt đầu câu cá.',
        ephemeral: true
      });
    }

    const stats = user.fishingStats;
    const totalAttempts = stats.totalFishingAttempts || 0;
    const successfulCatches = stats.successfulCatches || 0;
    const missedCatches = stats.missedCatches || 0;
    const successRate = totalAttempts > 0 ? ((successfulCatches / totalAttempts) * 100).toFixed(1) : '0.0';
    const missRate = totalAttempts > 0 ? ((missedCatches / totalAttempts) * 100).toFixed(1) : '0.0';

    // Tính tỷ lệ câu hụt hiện tại với 20 levels
    const baseMissRate = 0.20; // 20% base miss rate
    const rodLevel = user.rodLevel || 1;
    
    // Rod miss rate reduction system (1-20 levels)
    let missRateReduction = 0;
    if (rodLevel <= 10) {
      // Level 1-10: 2% reduction per level
      missRateReduction = (rodLevel - 1) * 0.02;
    } else {
      // Level 11-20: Additional 1% reduction per level beyond 10
      missRateReduction = 0.18 + ((rodLevel - 10) * 0.01); // 18% from first 10 + extra from 11-20
    }
    
    const currentMissRate = Math.max(baseMissRate - missRateReduction, 0.01); // Min 1% miss rate
    const currentMissRatePercent = (currentMissRate * 100).toFixed(1);

    const embed = new EmbedBuilder()
      .setColor('#1E90FF')
      .setTitle('🎣 Thống kê câu cá chi tiết')
      .setDescription(`Báo cáo câu cá của **${interaction.user.username}**`)
      .addFields(
        {
          name: '📊 Tổng quan',
          value: `• Tổng lần câu: **${totalAttempts}**\n• Thành công: **${successfulCatches}** (${successRate}%)\n• Câu hụt: **${missedCatches}** (${missRate}%)`,
          inline: false
        },
        {
          name: '🎯 Tỷ lệ hiện tại',
          value: `• Tỷ lệ câu hụt: **${currentMissRatePercent}%**\n• Rod Level: **${rodLevel}/20**\n• Giảm: **${(missRateReduction * 100).toFixed(1)}%** nhờ nâng cấp`,
          inline: true
        },
        {
          name: '💰 Chi phí',
          value: `• Lần miễn phí: ${totalAttempts < 5 ? `**${5 - totalAttempts}** còn lại` : '**Đã hết**'}\n• Phí hiện tại: **10 xu/lần**\n• Tổng chi phí: **${Math.max(totalAttempts - 5, 0) * 10} xu**`,
          inline: true
        }
      )
      .setTimestamp()
      .setThumbnail(interaction.user.displayAvatarURL())
      .setFooter({ 
        text: 'Fishbot - Fishing Statistics',
        iconURL: interaction.client.user.displayAvatarURL() 
      });

    // Progress bar cho success rate
    const successProgressBar = createProgressBar(successfulCatches, totalAttempts, 15);
    embed.addFields({
      name: '📈 Tiến độ thành công',
      value: `${successProgressBar}\n**${successfulCatches}/${totalAttempts}** lần thành công`,
      inline: false
    });

    // Thông tin về nâng cấp
    if (rodLevel < 20) {
      let nextLevelMissRate;
      let improvementText;
      
      if (rodLevel < 10) {
        // Level 1-9: Next level still in first tier
        nextLevelMissRate = Math.max(baseMissRate - (rodLevel * 0.02), 0.02);
        improvementText = `• Rod Level ${rodLevel + 1}: Giảm tỷ lệ câu hụt xuống **${(nextLevelMissRate * 100).toFixed(1)}%**\n• Cải thiện: **2%** ít câu hụt hơn`;
      } else {
        // Level 10-19: In second tier
        const currentReduction = 0.18 + ((rodLevel - 10) * 0.01);
        const nextReduction = 0.18 + ((rodLevel - 9) * 0.01);
        nextLevelMissRate = Math.max(baseMissRate - nextReduction, 0.01);
        improvementText = `• Rod Level ${rodLevel + 1}: Giảm tỷ lệ câu hụt xuống **${(nextLevelMissRate * 100).toFixed(1)}%**\n• Cải thiện: **1%** ít câu hụt hơn`;
      }
      
      embed.addFields({
        name: '⬆️ Nâng cấp tiếp theo',
        value: improvementText,
        inline: false
      });
    } else {
      embed.addFields({
        name: '🏆 Rod tối đa',
        value: '• Bạn đã đạt **Rod Level 20** - LEGENDARY!\n• Tỷ lệ câu hụt tối thiểu: **1%**\n• Đã đạt đỉnh cao nghệ thuật câu cá! 🎣✨',
        inline: false
      });
    }

    await interaction.reply({ embeds: [embed] });
  }
};

// Tạo progress bar
function createProgressBar(current, total, length = 15) {
  if (total === 0) return '▒'.repeat(length);
  const percentage = current / total;
  const filled = Math.round(length * percentage);
  const empty = length - filled;
  
  return '█'.repeat(filled) + '▒'.repeat(empty);
}
