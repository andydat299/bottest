import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getRodBenefits, getUpgradeInfo, getRodTierColor } from '../utils/rodManager.js';

export default {
  data: new SlashCommandBuilder()
    .setName('upgrade-rod')
    .setDescription('🎣 Nâng cấp cần câu lên level tiếp theo')
    .addIntegerOption(option =>
      option.setName('level')
        .setDescription('Level cần câu muốn nâng cấp (để trống = nâng cấp tiếp theo)')
        .setMinValue(2)
        .setMaxValue(20)
    ),
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

      const targetLevel = interaction.options.getInteger('level');
      const currentLevel = user.rodLevel || 1;
      const userBalance = user.balance || 0;

      // Initialize rodsOwned if not exists
      if (!user.rodsOwned || !Array.isArray(user.rodsOwned)) {
        user.rodsOwned = [];
        // Add all rods up to current level
        for (let i = 1; i <= currentLevel; i++) {
          if (!user.rodsOwned.includes(i)) {
            user.rodsOwned.push(i);
          }
        }
      }

      // Initialize rodDurability if not exists
      if (user.rodDurability === undefined || user.rodDurability === null) {
        const currentRod = getRodBenefits(currentLevel);
        user.rodDurability = currentRod.durability;
      }

      // Determine upgrade target
      let upgradeToLevel;
      if (targetLevel) {
        // User specified a level
        upgradeToLevel = targetLevel;
        
        // Check if they can skip to this level
        if (upgradeToLevel <= currentLevel) {
          return await interaction.editReply({
            content: `❌ **Không thể nâng cấp!**\n\nBạn đã ở Level ${currentLevel}, không thể nâng cấp xuống Level ${upgradeToLevel}.`
          });
        }
        
        // Check if they're trying to skip levels
        if (upgradeToLevel > currentLevel + 1) {
          return await interaction.editReply({
            content: `❌ **Không thể bỏ qua level!**\n\nBạn đang ở Level ${currentLevel}, chỉ có thể nâng cấp lên Level ${currentLevel + 1}.\n\nHãy nâng cấp tuần tự: ${currentLevel} → ${currentLevel + 1} → ... → ${upgradeToLevel}`
          });
        }
      } else {
        // Auto upgrade to next level
        upgradeToLevel = currentLevel + 1;
      }

      // Check if already at max level
      if (currentLevel >= 20) {
        const currentRod = getRodBenefits(currentLevel);
        const embed = new EmbedBuilder()
          .setTitle('🏆 **MAXIMUM LEVEL REACHED**')
          .setDescription(`**${interaction.user.username}** - Đã đạt cấp độ tối đa!`)
          .setColor(getRodTierColor(currentRod.tier))
          .addFields({
            name: '✨ **Current Rod**',
            value: `**${currentRod.name}**\n` +
                   `**Level:** ${currentLevel}/20 (MAX)\n` +
                   `**Benefits:** -${currentRod.missReduction}% miss, +${currentRod.rareBoost}% rare\n` +
                   `**Tier:** ${currentRod.tier}`,
            inline: false
          })
          .addFields({
            name: '🎉 **Congratulations!**',
            value: 'Bạn đã sở hữu cần câu mạnh nhất trong game!\n' +
                   '• Tỷ lệ hụt câu thấp nhất\n' +
                   '• Tỷ lệ câu cá hiếm cao nhất\n' +
                   '• Độ bền cao nhất\n' +
                   '• Đẳng cấp Transcendent',
            inline: false
          })
          .setTimestamp();

        return await interaction.editReply({ embeds: [embed] });
      }

      const nextRod = getRodBenefits(upgradeToLevel);
      const upgradeInfo = getUpgradeInfo(currentLevel, userBalance);

      // Check VIP requirements
      if (nextRod.vipRequired) {
        const userVipTier = user.vipTier || null;
        
        // VIP hierarchy check - more comprehensive
        const vipHierarchy = {
          'bronze': 1,
          'silver': 2, 
          'gold': 3,
          'diamond': 4
        };
        
        const requiredVipLevel = vipHierarchy[nextRod.vipRequired.toLowerCase()] || 0;
        const userVipLevel = vipHierarchy[userVipTier?.toLowerCase()] || 0;
        
        const hasVipAccess = userVipLevel >= requiredVipLevel;

        if (!hasVipAccess) {
          const embed = new EmbedBuilder()
            .setTitle('👑 **VIP REQUIRED**')
            .setDescription(`**${interaction.user.username}** - Cần VIP để nâng cấp!`)
            .setColor('#e74c3c')
            .addFields({
              name: '🎣 **Next Rod**',
              value: `**${nextRod.name}**\n` +
                     `Level ${upgradeToLevel}/20\n` +
                     `Tier: ${nextRod.tier}`,
              inline: true
            })
            .addFields({
              name: '👑 **VIP Requirements**',
              value: `**Required:** VIP ${nextRod.vipRequired.toUpperCase()} or higher\n` +
                     `**Your VIP:** ${userVipTier ? userVipTier.toUpperCase() : 'NONE'}\n` +
                     `**Status:** ${hasVipAccess ? '✅ Access Granted' : '❌ Insufficient VIP'}`,
              inline: true
            })
            .addFields({
              name: '💡 **How to Get VIP**',
              value: '• Purchase VIP Bronze to unlock premium rods\n' +
                     '• VIP Bronze unlocks all rods (Levels 11-20)\n' +
                     '• Higher VIP tiers include additional benefits\n' +
                     '• Contact administrators for VIP upgrade',
              inline: false
            })
            .setTimestamp();

          return await interaction.editReply({ embeds: [embed] });
        }
        
        // Debug log for VIP checking
        console.log(`VIP Check - User: ${userVipTier}, Required: ${nextRod.vipRequired}, Access: ${hasVipAccess}`);
      }

      // Check if can afford
      if (!upgradeInfo.canUpgrade) {
        const currentRod = getRodBenefits(currentLevel);
        const embed = new EmbedBuilder()
          .setTitle('💰 **INSUFFICIENT FUNDS**')
          .setDescription(`**${interaction.user.username}** - Không đủ xu để nâng cấp`)
          .setColor('#e74c3c')
          .addFields({
            name: '🎣 **Current Rod**',
            value: `**${currentRod.name}**\n` +
                   `Level ${currentLevel}/20`,
            inline: true
          })
          .addFields({
            name: '⬆️ **Next Upgrade**',
            value: `**${nextRod.name}**\n` +
                   `Level ${upgradeToLevel}/20`,
            inline: true
          })
          .addFields({
            name: '💸 **Cost Analysis**',
            value: `**Cost:** ${nextRod.cost.toLocaleString()} xu\n` +
                   `**Your Balance:** ${userBalance.toLocaleString()} xu\n` +
                   `**Missing:** ${upgradeInfo.missing.toLocaleString()} xu`,
            inline: false
          })
          .addFields({
            name: '💡 **How to Get More Xu**',
            value: '• Fish more with `/fish`\n' +
                   '• Complete daily challenges\n' +
                   '• Sell rare fish\n' +
                   '• Participate in events',
            inline: false
          })
          .setTimestamp();

        return await interaction.editReply({ embeds: [embed] });
      }

      // Perform upgrade
      const oldRod = getRodBenefits(currentLevel);
      const newBalance = userBalance - nextRod.cost;

      // Update user data
      user.rodLevel = upgradeToLevel;
      user.balance = newBalance;
      
      // Add new rod to owned rods if not already owned
      if (!user.rodsOwned.includes(upgradeToLevel)) {
        user.rodsOwned.push(upgradeToLevel);
        user.rodsOwned.sort((a, b) => a - b); // Keep sorted
      }

      // Set full durability for new rod
      user.rodDurability = nextRod.durability;

      // Save to database
      await user.save();

      // Create success embed
      const embed = new EmbedBuilder()
        .setTitle('🎉 **ROD UPGRADE SUCCESSFUL!**')
        .setDescription(`**${interaction.user.username}** đã nâng cấp cần câu thành công!`)
        .setColor(getRodTierColor(nextRod.tier))
        .setThumbnail(interaction.user.displayAvatarURL())
        .addFields({
          name: '📈 **Upgrade Summary**',
          value: `${oldRod.name} → **${nextRod.name}**\n` +
                 `Level ${currentLevel} → **Level ${upgradeToLevel}**\n` +
                 `${oldRod.tier} → **${nextRod.tier}** Tier`,
          inline: false
        })
        .addFields({
          name: '⚡ **Performance Improvements**',
          value: `**Miss Reduction:** ${oldRod.missReduction}% → **${nextRod.missReduction}%** (+${nextRod.missReduction - oldRod.missReduction}%)\n` +
                 `**Rare Boost:** ${oldRod.rareBoost}% → **${nextRod.rareBoost}%** (+${nextRod.rareBoost - oldRod.rareBoost}%)\n` +
                 `**Durability:** ${oldRod.durability} → **${nextRod.durability}** (+${nextRod.durability - oldRod.durability})`,
          inline: false
        })
        .addFields({
          name: '💰 **Transaction Details**',
          value: `**Cost:** ${nextRod.cost.toLocaleString()} xu\n` +
                 `**Old Balance:** ${userBalance.toLocaleString()} xu\n` +
                 `**New Balance:** ${newBalance.toLocaleString()} xu`,
          inline: true
        })
        .addFields({
          name: '🎣 **New Rod Stats**',
          value: `**Durability:** ${nextRod.durability}/${nextRod.durability} (100%)\n` +
                 `**VIP Required:** ${nextRod.vipRequired ? nextRod.vipRequired.toUpperCase() : 'None'}\n` +
                 `**Description:** ${nextRod.description}`,
          inline: true
        })
        .setTimestamp();

      // Add tier-specific messages
      if (upgradeToLevel === 11) {
        embed.addFields({
          name: '🌟 **Premium Tier Unlocked!**',
          value: 'Chúc mừng! Bạn đã bước vào thế giới cần câu premium!\n' +
                 '• Legendary tier rods\n' +
                 '• Significantly improved benefits\n' +
                 '• Exclusive VIP content',
          inline: false
        });
      } else if (upgradeToLevel === 16) {
        embed.addFields({
          name: '🏆 **Mythical Tier Achieved!**',
          value: 'Incredible! Bạn đã đạt đến tầm cao mới!\n' +
                 '• Elite fishing performance\n' +
                 '• Mythical tier recognition\n' +
                 '• Top-tier fishing equipment',
          inline: false
        });
      } else if (upgradeToLevel === 20) {
        embed.addFields({
          name: '✨ **TRANSCENDENT MASTER!**',
          value: '🎉 **ULTIMATE ACHIEVEMENT UNLOCKED!** 🎉\n' +
                 '• Maximum fishing rod level\n' +
                 '• Transcendent tier mastery\n' +
                 '• Ultimate fishing legend status\n' +
                 '• You are now a Fishing God!',
          inline: false
        });
      }

      // Add next upgrade info if not at max
      if (upgradeToLevel < 20) {
        const nextUpgrade = getRodBenefits(upgradeToLevel + 1);
        embed.addFields({
          name: '🔮 **Next Upgrade Available**',
          value: `**${nextUpgrade.name}** (Level ${upgradeToLevel + 1})\n` +
                 `**Cost:** ${nextUpgrade.cost.toLocaleString()} xu\n` +
                 `**Can afford:** ${newBalance >= nextUpgrade.cost ? '✅ Yes' : `❌ Need ${(nextUpgrade.cost - newBalance).toLocaleString()} more xu`}`,
          inline: false
        });
      }

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('❌ Upgrade rod command error:', error);
      
      await interaction.editReply({
        content: `❌ **Có lỗi khi nâng cấp cần câu:**\n\`\`\`${error.message}\`\`\``
      });
    }
  }
};