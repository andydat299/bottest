import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getRodBenefits, getUpgradeInfo, getRodTierColor } from '../utils/rodManager.js';

export default {
  data: new SlashCommandBuilder()
    .setName('force-upgrade-rod')
    .setDescription('🔧 [DEBUG] Force upgrade rod bypassing VIP checks')
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
        for (let i = 1; i <= currentLevel; i++) {
          if (!user.rodsOwned.includes(i)) {
            user.rodsOwned.push(i);
          }
        }
      }

      // Determine upgrade target
      let upgradeToLevel;
      if (targetLevel) {
        upgradeToLevel = targetLevel;
        
        if (upgradeToLevel <= currentLevel) {
          return await interaction.editReply({
            content: `❌ **Không thể nâng cấp!**\n\nBạn đã ở Level ${currentLevel}, không thể nâng cấp xuống Level ${upgradeToLevel}.`
          });
        }
      } else {
        upgradeToLevel = currentLevel + 1;
      }

      // Check if already at max level
      if (currentLevel >= 20) {
        return await interaction.editReply({
          content: '🏆 **Đã đạt level tối đa!**\n\nBạn đã sở hữu cần câu mạnh nhất!'
        });
      }

      const nextRod = getRodBenefits(upgradeToLevel);
      const upgradeInfo = getUpgradeInfo(currentLevel, userBalance);

      // BYPASS VIP CHECK FOR TESTING
      console.log('🔧 FORCE UPGRADE - BYPASSING VIP CHECKS');
      console.log(`User: ${interaction.user.username}`);
      console.log(`Current Level: ${currentLevel}`);
      console.log(`Target Level: ${upgradeToLevel}`);
      console.log(`Rod Required VIP: ${nextRod.vipRequired}`);
      console.log('VIP Check: BYPASSED');

      // Check if can afford
      if (!upgradeInfo.canUpgrade) {
        return await interaction.editReply({
          content: `❌ **Không đủ xu!**\n\n` +
                   `**Cost:** ${nextRod.cost.toLocaleString()} xu\n` +
                   `**Your Balance:** ${userBalance.toLocaleString()} xu\n` +
                   `**Missing:** ${upgradeInfo.missing.toLocaleString()} xu`
        });
      }

      // Perform upgrade
      const oldRod = getRodBenefits(currentLevel);
      const newBalance = userBalance - nextRod.cost;

      // Update user data
      user.rodLevel = upgradeToLevel;
      user.balance = newBalance;
      
      // Add new rod to owned rods
      if (!user.rodsOwned.includes(upgradeToLevel)) {
        user.rodsOwned.push(upgradeToLevel);
        user.rodsOwned.sort((a, b) => a - b);
      }

      // Set full durability for new rod
      user.rodDurability = nextRod.durability;

      // Save to database
      await user.save();

      // Create success embed
      const embed = new EmbedBuilder()
        .setTitle('🔧 **FORCE UPGRADE SUCCESSFUL!**')
        .setDescription(`**${interaction.user.username}** đã force upgrade cần câu (bypass VIP)`)
        .setColor(getRodTierColor(nextRod.tier))
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
          name: '💰 **Transaction**',
          value: `**Cost:** ${nextRod.cost.toLocaleString()} xu\n` +
                 `**New Balance:** ${newBalance.toLocaleString()} xu`,
          inline: true
        })
        .addFields({
          name: '🔧 **Debug Info**',
          value: `**VIP Required:** ${nextRod.vipRequired || 'None'}\n` +
                 `**VIP Check:** BYPASSED\n` +
                 `**Force Upgrade:** ✅ Success`,
          inline: true
        })
        .setTimestamp();

      // Add warning
      embed.addFields({
        name: '⚠️ **DEBUG COMMAND WARNING**',
        value: 'This is a debug command that bypasses VIP checks.\n' +
               'Use only for testing VIP issues.\n' +
               'Normal upgrades should use `/upgrade-rod`',
        inline: false
      });

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('❌ Force upgrade command error:', error);
      
      await interaction.editReply({
        content: `❌ **Force upgrade failed:**\n\`\`\`${error.message}\`\`\``
      });
    }
  }
};