import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getRodBenefits, getUpgradeInfo, getRodTierColor } from '../utils/rodManager.js';

export default {
  data: new SlashCommandBuilder()
    .setName('rod-status')
    .setDescription('🎣 Xem thông tin cần câu hiện tại và chi phí nâng cấp'),
  prefixEnabled: true,

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const { User } = await import('../schemas/userSchema.js');
      
      // Get user data
      let user = await User.findOne({ discordId: interaction.user.id });
      if (!user) {
        return await interaction.editReply({
          content: '❌ **Bạn cần có tài khoản trước!**\n\nHãy dùng lệnh `/fish` để tạo tài khoản.'
        });
      }

      const currentLevel = user.rodLevel || 1;
      const userBalance = user.balance || 0;
      const rodDurability = user.rodDurability || 0;

      // Get current rod info
      const currentRod = getRodBenefits(currentLevel);
      
      // Calculate durability percentage
      const durabilityPercent = Math.round((rodDurability / currentRod.durability) * 100);
      const durabilityBar = '█'.repeat(Math.floor(durabilityPercent / 10)) + '░'.repeat(10 - Math.floor(durabilityPercent / 10));

      const embed = new EmbedBuilder()
        .setTitle('🎣 **ROD STATUS**')
        .setDescription(`**${interaction.user.username}** - Thông tin cần câu`)
        .setColor(getRodTierColor(currentRod.tier))
        .setThumbnail(interaction.user.displayAvatarURL())
        .addFields({
          name: '🎣 **Current Rod**',
          value: `**${currentRod.name}**\n` +
                 `**Level:** ${currentLevel}/20\n` +
                 `**Tier:** ${currentRod.tier}`,
          inline: true
        })
        .addFields({
          name: '🔧 **Durability**',
          value: `${durabilityBar}\n` +
                 `**${rodDurability}/${currentRod.durability}** (${durabilityPercent}%)\n` +
                 `${durabilityPercent <= 20 ? '⚠️ Low durability!' : durabilityPercent <= 50 ? '🔶 Medium' : '✅ Good'}`,
          inline: true
        })
        .addFields({
          name: '💰 **Balance**',
          value: `**${userBalance.toLocaleString()} xu**`,
          inline: true
        });

      // Add upgrade info if not at max level
      if (currentLevel < 20) {
        const nextRod = getRodBenefits(currentLevel + 1);
        const upgradeInfo = getUpgradeInfo(currentLevel, userBalance);

        // Calculate total cost for max level
        let totalCostToMax = 0;
        for (let level = currentLevel + 1; level <= 20; level++) {
          const rod = getRodBenefits(level);
          totalCostToMax += rod.cost;
        }

        embed.addFields({
          name: '⬆️ **Next Upgrade**',
          value: `**${nextRod.name}** (Level ${currentLevel + 1})\n` +
                 `**Cost:** ${nextRod.cost.toLocaleString()} xu\n` +
                 `**VIP Required:** ${nextRod.vipRequired ? nextRod.vipRequired.toUpperCase() : 'None'}\n` +
                 `**Can afford:** ${upgradeInfo.canUpgrade ? '✅ Yes' : `❌ Need ${upgradeInfo.missing.toLocaleString()} more`}`,
          inline: false
        })
        .addFields({
          name: '🎯 **Max Level Info**',
          value: `**Total cost to max:** ${totalCostToMax.toLocaleString()} xu\n` +
                 `**Your balance:** ${userBalance.toLocaleString()} xu\n` +
                 `**Can reach max:** ${userBalance >= totalCostToMax ? '✅ Yes' : `❌ Need ${(totalCostToMax - userBalance).toLocaleString()} more`}`,
          inline: false
        });

        // VIP status if needed for next upgrade
        if (nextRod.vipRequired) {
          const userVipTier = user.currentVipTier || user.vipTier || null;
          const vipHierarchy = { 'bronze': 1, 'silver': 2, 'gold': 3, 'diamond': 4 };
          const requiredVipLevel = vipHierarchy[nextRod.vipRequired.toLowerCase()] || 0;
          const userVipLevel = vipHierarchy[String(userVipTier || '').toLowerCase()] || 0;
          const hasVipAccess = userVipLevel >= requiredVipLevel;

          embed.addFields({
            name: '👑 **VIP Status**',
            value: `**Your VIP:** ${userVipTier ? userVipTier.toUpperCase() : 'NONE'}\n` +
                   `**Required:** VIP ${nextRod.vipRequired.toUpperCase()}\n` +
                   `**Access:** ${hasVipAccess ? '✅ Granted' : '❌ Insufficient'}`,
            inline: true
          });
        }
      } else {
        // Max level reached
        embed.addFields({
          name: '🏆 **Maximum Level**',
          value: `🎉 **Congratulations!**\n` +
                 `You've reached the maximum rod level!\n` +
                 `**Transcendent** tier mastery achieved.`,
          inline: false
        });
      }

      // Quick action buttons info
      embed.addFields({
        name: '⚡ **Quick Actions**',
        value: currentLevel < 20 ? 
               '• `/upgrade-rod` - Upgrade to next level\n• `/repair-rod` - Repair durability\n• `/rod-shop` - Browse all rods' :
               '• `/repair-rod` - Repair durability\n• `/rod-collection` - View all owned rods',
        inline: false
      });

      embed.setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('❌ Rod status command error:', error);
      
      await interaction.editReply({
        content: `❌ **Có lỗi khi xem thông tin cần câu:**\n\`\`\`${error.message}\`\`\``
      });
    }
  }
};