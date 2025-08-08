import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getRodBenefits, getUpgradeInfo, getRodTierColor } from '../utils/rodManager.js';

export default {
  data: new SlashCommandBuilder()
    .setName('upgrade-rod-simple')
    .setDescription('🎣 Nâng cấp cần câu (simplified version)')
    .addIntegerOption(option =>
      option.setName('level')
        .setDescription('Level cần câu muốn nâng cấp')
        .setMinValue(2)
        .setMaxValue(20)
    ),
  prefixEnabled: true,

  async execute(interaction) {
    await interaction.deferReply();

    try {
      console.log('🎣 Simple upgrade started for:', interaction.user.username);
      
      const { User } = await import('../schemas/userSchema.js');
      
      // Get user data
      let user = await User.findOne({ discordId: interaction.user.id });
      if (!user) {
        console.log('❌ User not found');
        return await interaction.editReply({
          content: '❌ **Bạn cần có tài khoản trước!**\n\nHãy dùng lệnh `/fish` để tạo tài khoản.'
        });
      }

      const targetLevel = interaction.options.getInteger('level');
      const currentLevel = user.rodLevel || 1;
      const userBalance = user.balance || 0;
      const userVip = user.currentVipTier || user.vipTier || null;

      console.log('User stats:', { currentLevel, userBalance, userVip });

      // Determine upgrade target
      const upgradeToLevel = targetLevel || (currentLevel + 1);

      // Basic validations
      if (currentLevel >= 20) {
        return await interaction.editReply({
          content: '🏆 **Đã đạt level tối đa!**'
        });
      }

      if (upgradeToLevel <= currentLevel) {
        return await interaction.editReply({
          content: `❌ **Không thể downgrade!** Current: ${currentLevel}, Target: ${upgradeToLevel}`
        });
      }

      if (upgradeToLevel > currentLevel + 1) {
        return await interaction.editReply({
          content: `❌ **Phải nâng cấp tuần tự!** Next level: ${currentLevel + 1}`
        });
      }

      const nextRod = getRodBenefits(upgradeToLevel);
      console.log('Next rod:', nextRod.name, 'Cost:', nextRod.cost, 'VIP Required:', nextRod.vipRequired);

      // Check balance
      if (userBalance < nextRod.cost) {
        const missing = nextRod.cost - userBalance;
        return await interaction.editReply({
          content: `💰 **Không đủ xu!**\n\n` +
                   `**Cost:** ${nextRod.cost.toLocaleString()} xu\n` +
                   `**Your Balance:** ${userBalance.toLocaleString()} xu\n` +
                   `**Missing:** ${missing.toLocaleString()} xu`
        });
      }

      // Simple VIP check
      if (nextRod.vipRequired) {
        const vipMap = { bronze: 1, silver: 2, gold: 3, diamond: 4 };
        const requiredLevel = vipMap[nextRod.vipRequired] || 0;
        const userLevel = vipMap[userVip?.toLowerCase()] || 0;

        console.log('VIP Check:', { userVip, userLevel, requiredLevel });

        if (userLevel < requiredLevel) {
          return await interaction.editReply({
            content: `👑 **VIP Required!**\n\n` +
                     `**Rod:** ${nextRod.name}\n` +
                     `**Required:** VIP ${nextRod.vipRequired.toUpperCase()}\n` +
                     `**Your VIP:** ${userVip ? userVip.toUpperCase() : 'NONE'}\n\n` +
                     `Use \`/force-upgrade-rod level:${upgradeToLevel}\` to bypass.`
          });
        }
      }

      // Perform upgrade
      console.log('✅ Performing upgrade...');
      
      const oldRod = getRodBenefits(currentLevel);
      const newBalance = userBalance - nextRod.cost;

      // Update user data
      user.rodLevel = upgradeToLevel;
      user.balance = newBalance;
      user.rodDurability = nextRod.durability;

      // Update rodsOwned
      if (!user.rodsOwned || !Array.isArray(user.rodsOwned)) {
        user.rodsOwned = [];
      }
      
      if (!user.rodsOwned.includes(upgradeToLevel)) {
        user.rodsOwned.push(upgradeToLevel);
        user.rodsOwned.sort((a, b) => a - b);
      }

      // Save to database
      await user.save();
      console.log('✅ Upgrade saved to database');

      // Create success embed
      const embed = new EmbedBuilder()
        .setTitle('🎉 **ROD UPGRADE SUCCESSFUL!**')
        .setDescription(`**${interaction.user.username}** đã nâng cấp cần câu thành công!`)
        .setColor(getRodTierColor(nextRod.tier))
        .addFields({
          name: '📈 **Upgrade Summary**',
          value: `${oldRod.name} → **${nextRod.name}**\n` +
                 `Level ${currentLevel} → **Level ${upgradeToLevel}**\n` +
                 `${oldRod.tier} → **${nextRod.tier}** Tier`,
          inline: false
        })
        .addFields({
          name: '⚡ **Performance Boost**',
          value: `**Miss Reduction:** ${oldRod.missReduction}% → **${nextRod.missReduction}%** (+${nextRod.missReduction - oldRod.missReduction}%)\n` +
                 `**Rare Boost:** ${oldRod.rareBoost}% → **${nextRod.rareBoost}%** (+${nextRod.rareBoost - oldRod.rareBoost}%)\n` +
                 `**Durability:** ${oldRod.durability} → **${nextRod.durability}** (+${nextRod.durability - oldRod.durability})`,
          inline: false
        })
        .addFields({
          name: '💰 **Transaction**',
          value: `**Cost:** ${nextRod.cost.toLocaleString()} xu\n` +
                 `**New Balance:** ${newBalance.toLocaleString()} xu`,
          inline: true
        })
        .addFields({
          name: '🎣 **Rod Info**',
          value: `**Durability:** ${nextRod.durability}/${nextRod.durability}\n` +
                 `**VIP Status:** ${userVip ? userVip.toUpperCase() : 'Standard'}`,
          inline: true
        })
        .setTimestamp();

      // Add special messages for milestones
      if (upgradeToLevel === 11) {
        embed.addFields({
          name: '🎉 **Premium Tier Unlocked!**',
          value: 'Chúc mừng! Bạn đã bước vào thế giới cần câu premium!',
          inline: false
        });
      }

      await interaction.editReply({ embeds: [embed] });
      console.log('✅ Upgrade command completed successfully');

    } catch (error) {
      console.error('❌ Simple upgrade command error:', error);
      
      await interaction.editReply({
        content: `❌ **Upgrade failed:**\n\`\`\`${error.message}\`\`\`\n\n` +
                 `Try \`/force-upgrade-rod\` if this persists.`
      });
    }
  }
};