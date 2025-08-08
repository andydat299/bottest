import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { FISHING_RODS, getRodBenefits, getRodTierColor, getUpgradeInfo } from '../utils/rodManager.js';

export default {
  data: new SlashCommandBuilder()
    .setName('upgrade-rod')
    .setDescription('⬆️ Nâng cấp cần câu lên level cao hơn')
    .addIntegerOption(option =>
      option.setName('level')
        .setDescription('Level cần câu muốn nâng cấp (2-20)')
        .setRequired(true)
        .setMinValue(2)
        .setMaxValue(20)
    ),

  async execute(interaction) {
    const targetLevel = interaction.options.getInteger('level');
    
    await interaction.deferReply();

    try {
      const { User } = await import('../schemas/userSchema.js');
      const { VIP } = await import('../schemas/vipSchema.js');

      // Get user data
      let user = await User.findOne({ discordId: interaction.user.id });
      if (!user) {
        return await interaction.editReply({
          content: '❌ **Bạn cần có tài khoản trước!**\n\nHãy dùng lệnh `/fish` để tạo tài khoản.'
        });
      }

      // Get VIP status
      let vipTier = null;
      const vipRecord = await VIP.findOne({ userId: interaction.user.id, isActive: true });
      if (vipRecord && (!vipRecord.expiresAt || new Date() <= vipRecord.expiresAt)) {
        vipTier = vipRecord.currentTier;
      }

      const currentLevel = user.rodLevel || 1;
      const rodsOwned = user.rodsOwned || [1];
      const userBalance = user.balance || 0;

      // Validation checks
      if (targetLevel <= currentLevel) {
        return await interaction.editReply({
          content: `❌ **Không thể nâng cấp!**\n\nBạn đang ở level ${currentLevel}. Chỉ có thể nâng cấp lên level cao hơn.`
        });
      }

      if (targetLevel > currentLevel + 1) {
        return await interaction.editReply({
          content: `❌ **Chỉ có thể nâng cấp từng level một!**\n\nLevel hiện tại: ${currentLevel}\nLevel tiếp theo: ${currentLevel + 1}`
        });
      }

      const targetRod = FISHING_RODS[targetLevel];
      if (!targetRod) {
        return await interaction.editReply({
          content: '❌ **Level cần câu không hợp lệ!**'
        });
      }

      // Check VIP requirement
      const hasVipAccess = !targetRod.vipRequired || 
                          vipTier === targetRod.vipRequired ||
                          (vipTier === 'diamond') ||
                          (vipTier === 'gold' && ['bronze', 'silver'].includes(targetRod.vipRequired)) ||
                          (vipTier === 'silver' && targetRod.vipRequired === 'bronze');

      if (!hasVipAccess) {
        return await interaction.editReply({
          content: `❌ **Cần VIP để mua cần câu này!**\n\n` +
                   `**${targetRod.name}** yêu cầu **VIP ${targetRod.vipRequired.toUpperCase()}** trở lên.\n` +
                   `VIP hiện tại của bạn: ${vipTier ? vipTier.toUpperCase() : 'None'}\n\n` +
                   `Hãy dùng \`/vip-shop\` để nâng cấp VIP!`
        });
      }

      // Check balance
      if (userBalance < targetRod.cost) {
        const missingXu = targetRod.cost - userBalance;
        return await interaction.editReply({
          content: `❌ **Không đủ xu để nâng cấp!**\n\n` +
                   `**Cần:** ${targetRod.cost.toLocaleString()} xu\n` +
                   `**Có:** ${userBalance.toLocaleString()} xu\n` +
                   `**Thiếu:** ${missingXu.toLocaleString()} xu\n\n` +
                   `💡 Hãy câu cá thêm để kiếm xu!`
        });
      }

      // Perform upgrade
      const currentRod = FISHING_RODS[currentLevel];
      user.balance -= targetRod.cost;
      user.rodLevel = targetLevel;
      
      // Add to owned rods if not already owned
      if (!rodsOwned.includes(targetLevel)) {
        user.rodsOwned.push(targetLevel);
      }

      await user.save();

      // Create success embed
      const embed = new EmbedBuilder()
        .setTitle('⬆️ **NÂNG CẤP CẦN CÂU THÀNH CÔNG!**')
        .setDescription(`**${interaction.user.username}** đã nâng cấp cần câu!`)
        .setColor(getRodTierColor(targetRod.tier))
        .setThumbnail(interaction.user.displayAvatarURL())
        .setTimestamp();

      // Before & After comparison
      embed.addFields({
        name: '📈 **TRƯỚC VÀ SAU**',
        value: `**Trước:** Level ${currentLevel} - ${currentRod.name}\n` +
               `├ Miss Reduction: -${currentRod.missReduction}%\n` +
               `├ Rare Boost: +${currentRod.rareBoost}%\n` +
               `└ Durability: ${currentRod.durability}\n\n` +
               `**Sau:** Level ${targetLevel} - ${targetRod.name}\n` +
               `├ Miss Reduction: -${targetRod.missReduction}% *(+${targetRod.missReduction - currentRod.missReduction}%)*\n` +
               `├ Rare Boost: +${targetRod.rareBoost}% *(+${targetRod.rareBoost - currentRod.rareBoost}%)*\n` +
               `└ Durability: ${targetRod.durability} *(+${targetRod.durability - currentRod.durability})*`,
        inline: false
      });

      // Transaction details
      embed.addFields({
        name: '💰 **CHI TIẾT GIAO DỊCH**',
        value: `**Chi phí nâng cấp:** ${targetRod.cost.toLocaleString()} xu\n` +
               `**Số dư trước:** ${(userBalance).toLocaleString()} xu\n` +
               `**Số dư sau:** ${user.balance.toLocaleString()} xu`,
        inline: true
      });

      // New tier achievement
      if (targetRod.tier !== currentRod.tier) {
        embed.addFields({
          name: '🏆 **TIER MỚI ĐÃ MỞ KHÓA!**',
          value: `**${targetRod.tier} Tier** - ${targetRod.description}`,
          inline: true
        });
      }

      // Progress info
      const totalRods = Object.keys(FISHING_RODS).length;
      const progressPercent = (targetLevel / totalRods * 100).toFixed(1);
      
      embed.addFields({
        name: '📊 **TIẾN ĐỘ COLLECTION**',
        value: `**Level:** ${targetLevel}/${totalRods} (${progressPercent}%)\n` +
               `**Rods Owned:** ${user.rodsOwned.length}/${totalRods}\n` +
               `**Current Tier:** ${targetRod.tier}`,
        inline: false
      });

      // Next upgrade preview
      if (targetLevel < 20) {
        const nextRod = FISHING_RODS[targetLevel + 1];
        const canAffordNext = user.balance >= nextRod.cost;
        const hasNextVipAccess = !nextRod.vipRequired || 
                                vipTier === nextRod.vipRequired ||
                                (vipTier === 'diamond') ||
                                (vipTier === 'gold' && ['bronze', 'silver'].includes(nextRod.vipRequired)) ||
                                (vipTier === 'silver' && nextRod.vipRequired === 'bronze');

        embed.addFields({
          name: '👀 **NÂNG CẤP TIẾP THEO**',
          value: `**Level ${targetLevel + 1}:** ${nextRod.name}\n` +
                 `**Cost:** ${nextRod.cost.toLocaleString()} xu\n` +
                 `**VIP Required:** ${nextRod.vipRequired ? nextRod.vipRequired.toUpperCase() : 'None'}\n` +
                 `**Status:** ${canAffordNext && hasNextVipAccess ? '✅ Sẵn sàng!' : 
                              !hasNextVipAccess ? '🔒 Cần VIP' : '💰 Cần thêm xu'}`,
          inline: false
        });
      } else {
        embed.addFields({
          name: '🏆 **CHÚC MỪNG!**',
          value: '**Bạn đã đạt cần câu tối đa!**\n✨ **TRANSCENDENT TIER** ✨\n🎣 Master của nghệ thuật câu cá!',
          inline: false
        });
      }

      // Achievement badges
      const achievements = [];
      if (targetLevel === 5) achievements.push('🎯 **Basic Master** - Đạt Level 5');
      if (targetLevel === 10) achievements.push('⚡ **Advanced Fisher** - Đạt Level 10');
      if (targetLevel === 15) achievements.push('🏆 **Legendary Angler** - Đạt Level 15');
      if (targetLevel === 20) achievements.push('✨ **Transcendent God** - Đạt Level 20');
      if (targetRod.tier !== currentRod.tier) achievements.push(`🆙 **Tier Unlock** - ${targetRod.tier}`);

      if (achievements.length > 0) {
        embed.addFields({
          name: '🎉 **THÀNH TỰU MỚI**',
          value: achievements.join('\n'),
          inline: false
        });
      }

      await interaction.editReply({ embeds: [embed] });

      // Log the upgrade
      console.log(`⬆️ Rod upgrade: ${interaction.user.username} upgraded from Level ${currentLevel} to Level ${targetLevel} for ${targetRod.cost.toLocaleString()} xu`);

    } catch (error) {
      console.error('❌ Upgrade rod command error:', error);
      
      await interaction.editReply({
        content: `❌ **Có lỗi khi nâng cấp cần câu:**\n\`\`\`${error.message}\`\`\``
      });
    }
  }
};