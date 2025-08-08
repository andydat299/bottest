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
        .setTitle('🎣 **TRẠNG THÁI CẦN CÂU**')
        .setDescription(`**${interaction.user.username}** - Thông tin cần câu`)
        .setColor(getRodTierColor(currentRod.tier))
        .setThumbnail(interaction.user.displayAvatarURL())
        .addFields({
          name: '🎣 **Cần Câu Hiện Tại**',
          value: `**${currentRod.name}**\n` +
                 `**Cấp độ:** ${currentLevel}/20\n` +
                 `**Hạng:** ${currentRod.tier}`,
          inline: true
        })
        .addFields({
          name: '🔧 **Độ Bền**',
          value: `${durabilityBar}\n` +
                 `**${rodDurability}/${currentRod.durability}** (${durabilityPercent}%)\n` +
                 `${durabilityPercent <= 20 ? '⚠️ Sắp hỏng!' : durabilityPercent <= 50 ? '🔶 Tạm ổn' : '✅ Tốt'}`,
          inline: true
        })
        .addFields({
          name: '💰 **Số Dư**',
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
          name: '⬆️ **Nâng Cấp Tiếp Theo**',
          value: `**${nextRod.name}** (Cấp ${currentLevel + 1})\n` +
                 `**Chi phí:** ${nextRod.cost.toLocaleString()} xu\n` +
                 `**Yêu cầu VIP:** ${nextRod.vipRequired ? nextRod.vipRequired.toUpperCase() : 'Không'}\n` +
                 `**Có thể mua:** ${upgradeInfo.canUpgrade ? '✅ Có' : `❌ Thiếu ${upgradeInfo.missing.toLocaleString()} xu`}`,
          inline: false
        })
        .addFields({
          name: '🎯 **Thông Tin Cấp Tối Đa**',
          value: `**Tổng chi phí lên max:** ${totalCostToMax.toLocaleString()} xu\n` +
                 `**Số dư của bạn:** ${userBalance.toLocaleString()} xu\n` +
                 `**Có thể lên max:** ${userBalance >= totalCostToMax ? '✅ Có' : `❌ Thiếu ${(totalCostToMax - userBalance).toLocaleString()} xu`}`,
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
            name: '👑 **Trạng Thái VIP**',
            value: `**VIP của bạn:** ${userVipTier ? userVipTier.toUpperCase() : 'KHÔNG CÓ'}\n` +
                   `**Yêu cầu:** VIP ${nextRod.vipRequired.toUpperCase()}\n` +
                   `**Quyền truy cập:** ${hasVipAccess ? '✅ Đủ điều kiện' : '❌ Không đủ'}`,
            inline: true
          });
        }
      } else {
        // Max level reached
        embed.addFields({
          name: '🏆 **Cấp Độ Tối Đa**',
          value: `🎉 **Chúc mừng!**\n` +
                 `Bạn đã đạt cấp độ cần câu tối đa!\n` +
                 `Đã thành thạo hạng **Siêu Việt**.`,
          inline: false
        });
      }

      // Quick action buttons info
      embed.addFields({
        name: '⚡ **Hành Động Nhanh**',
        value: currentLevel < 20 ? 
               '• `/upgrade-rod` - Nâng cấp lên level tiếp theo\n• `/repair-rod` - Sửa chữa độ bền\n• `/rod-shop` - Xem tất cả cần câu' :
               '• `/repair-rod` - Sửa chữa độ bền\n• `/rod-collection` - Xem bộ sưu tập cần câu',
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