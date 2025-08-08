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

      let statusText = `🎣 **${currentRod.name}** (Level ${currentLevel}/20)\n`;
      statusText += `🔧 **Durability:** ${rodDurability}/${currentRod.durability} (${durabilityPercent}%)\n`;
      statusText += `💰 **Balance:** ${userBalance.toLocaleString()} xu\n\n`;

      if (currentLevel < 20) {
        const nextRod = getRodBenefits(currentLevel + 1);
        const upgradeInfo = getUpgradeInfo(currentLevel, userBalance);

        statusText += `⬆️ **Next:** ${nextRod.name} (Level ${currentLevel + 1})\n`;
        statusText += `💸 **Cost:** ${nextRod.cost.toLocaleString()} xu\n`;
        
        if (nextRod.vipRequired) {
          const userVipTier = user.currentVipTier || user.vipTier || null;
          statusText += `👑 **VIP Required:** ${nextRod.vipRequired.toUpperCase()} (You: ${userVipTier ? userVipTier.toUpperCase() : 'NONE'})\n`;
        }

        statusText += `✅ **Can upgrade:** ${upgradeInfo.canUpgrade ? 'Yes' : `No (need ${upgradeInfo.missing.toLocaleString()} more xu)`}\n\n`;

        // Calculate total to max
        let totalToMax = 0;
        for (let level = currentLevel + 1; level <= 20; level++) {
          totalToMax += getRodBenefits(level).cost;
        }
        
        statusText += `🎯 **Total to max level:** ${totalToMax.toLocaleString()} xu\n`;
        statusText += `${userBalance >= totalToMax ? '✅ Can reach max!' : `❌ Need ${(totalToMax - userBalance).toLocaleString()} more for max`}`;
      } else {
        statusText += `🏆 **MAX LEVEL REACHED!**\n`;
        statusText += `🎉 Transcendent tier mastery!`;
      }

      const embed = new EmbedBuilder()
        .setTitle('🎣 **Rod Quick Status**')
        .setDescription(statusText)
        .setColor(getRodTierColor(currentRod.tier))
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('❌ Rod quick status error:', error);
      await interaction.editReply({
        content: `❌ **Error:** ${error.message}`
      });
    }
  }
};