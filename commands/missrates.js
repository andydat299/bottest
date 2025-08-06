import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { User } from '../schemas/userSchema.js';

export default {
  data: new SlashCommandBuilder()
    .setName('missrates')
    .setDescription('Xem thông tin chi tiết về tỷ lệ câu hụt theo rod level'),

  async execute(interaction) {
    const user = await User.findOne({ discordId: interaction.user.id }) || await User.create({ discordId: interaction.user.id });
    const currentRodLevel = user.rodLevel || 1;

    const embed = new EmbedBuilder()
      .setColor('#FF6B6B')
      .setTitle('📊 Thống kê tỷ lệ câu hụt')
      .setDescription('Tỷ lệ câu hụt thay đổi theo cấp cần câu của bạn')
      .setTimestamp()
      .setFooter({ 
        text: `${interaction.user.username} - Rod Level ${currentRodLevel}`, 
        iconURL: interaction.user.displayAvatarURL() 
      });

    // Tính toán tỷ lệ cho từng rod level (1-10)
    let ratesInfo = '';
    for (let rodLevel = 1; rodLevel <= 10; rodLevel++) {
      const baseMissRate = 0.20; // 20% cơ bản
      const missRateReduction = (rodLevel - 1) * 0.02; // Giảm 2% mỗi level
      const finalMissRate = Math.max(baseMissRate - missRateReduction, 0.05); // Tối thiểu 5%
      const missRatePercent = (finalMissRate * 100).toFixed(1);
      const successRate = (100 - parseFloat(missRatePercent)).toFixed(1);
      
      const indicator = rodLevel === currentRodLevel ? '👉 ' : '   ';
      const emoji = rodLevel === currentRodLevel ? '🎣' : '🔸';
      
      ratesInfo += `${indicator}${emoji} **Cấp ${rodLevel}:** Hụt ${missRatePercent}% | Thành công ${successRate}%\n`;
    }

    embed.addFields({
      name: '🎯 Tỷ lệ theo Rod Level',
      value: ratesInfo,
      inline: false
    });

    // Thống kê cá nhân
    const totalAttempts = user.fishingStats?.totalFishingAttempts || 0;
    const successfulCatches = user.fishingStats?.successfulCatches || 0;
    const missedCatches = user.fishingStats?.missedCatches || 0;
    const personalSuccessRate = totalAttempts > 0 ? ((successfulCatches / totalAttempts) * 100).toFixed(1) : '0.0';

    if (totalAttempts > 0) {
      embed.addFields({
        name: '📈 Thống kê cá nhân',
        value: `• **Tổng lần câu:** ${totalAttempts.toLocaleString()}\n• **Thành công:** ${successfulCatches.toLocaleString()}\n• **Câu hụt:** ${missedCatches.toLocaleString()}\n• **Tỷ lệ thành công thực tế:** ${personalSuccessRate}%`,
        inline: false
      });
    }

    embed.addFields({
      name: '💡 Thông tin hữu ích',
      value: '• **Tỷ lệ cơ bản:** 20% câu hụt\n• **Giảm tỷ lệ:** -2% mỗi rod level\n• **Tối thiểu:** 5% câu hụt (Rod level 8+)\n• **Nâng cấp cần câu** để giảm tỷ lệ câu hụt!\n• Timeout cũng tính là câu hụt',
      inline: false
    });

    await interaction.reply({ embeds: [embed] });
  }
};
