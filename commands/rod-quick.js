import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getRodBenefits, getUpgradeInfo, getRodTierColor } from '../utils/rodManager.js';

export default {
  data: new SlashCommandBuilder()
    .setName('rod')
    .setDescription('🎣 Xem thông tin cần câu (quick view)'),
  prefixEnabled: true,

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const { User } = await import('../schemas/userSchema.js');
      
      let user = await User.findOne({ discordId: interaction.user.id });
      if (!user) {
        return await interaction.editReply({
          content: '❌ **Bạn cần có tài khoản trước!**\n\nHãy dùng lệnh `/fish` để tạo tài khoản.'
        });
      }

      const currentLevel = user.rodLevel || 1;
      const userBalance = user.balance || 0;
      const rodDurability = user.rodDurability || 0;

      const currentRod = getRodBenefits(currentLevel);
      const durabilityPercent = Math.round((rodDurability / currentRod.durability) * 100);

      let statusText = `🎣 **${currentRod.name}** (Cấp ${currentLevel}/20)\n`;
      statusText += `🔧 **Độ bền:** ${rodDurability}/${currentRod.durability} (${durabilityPercent}%)\n`;
      statusText += `💰 **Số dư:** ${userBalance.toLocaleString()} xu\n\n`;

      if (currentLevel < 20) {
        const nextRod = getRodBenefits(currentLevel + 1);
        const upgradeInfo = getUpgradeInfo(currentLevel, userBalance);

        statusText += `⬆️ **Tiếp theo:** ${nextRod.name} (Cấp ${currentLevel + 1})\n`;
        statusText += `💸 **Chi phí:** ${nextRod.cost.toLocaleString()} xu\n`;
        
        if (nextRod.vipRequired) {
          const userVipTier = user.currentVipTier || user.vipTier || null;
          statusText += `👑 **Yêu cầu VIP:** ${nextRod.vipRequired.toUpperCase()} (Bạn: ${userVipTier ? userVipTier.toUpperCase() : 'KHÔNG CÓ'})\n`;
        }

        statusText += `✅ **Có thể nâng cấp:** ${upgradeInfo.canUpgrade ? 'Có' : `Không (thiếu ${upgradeInfo.missing.toLocaleString()} xu)`}\n\n`;

        // Calculate total to max
        let totalToMax = 0;
        for (let level = currentLevel + 1; level <= 20; level++) {
          totalToMax += getRodBenefits(level).cost;
        }
        
        statusText += `🎯 **Tổng chi phí lên max:** ${totalToMax.toLocaleString()} xu\n`;
        statusText += `${userBalance >= totalToMax ? '✅ Có thể lên max!' : `❌ Thiếu ${(totalToMax - userBalance).toLocaleString()} xu để lên max`}`;
      } else {
        statusText += `🏆 **ĐÃ ĐẠT CẤP TỐI ĐA!**\n`;
        statusText += `🎉 Thành thạo hạng Siêu Việt!`;
      }

      const embed = new EmbedBuilder()
        .setTitle('🎣 **Trạng Thái Cần Câu Nhanh**')
        .setDescription(statusText)
        .setColor(getRodTierColor(currentRod.tier))
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('❌ Rod quick status error:', error);
      await interaction.editReply({
        content: `❌ **Lỗi:** ${error.message}`
      });
    }
  }
};