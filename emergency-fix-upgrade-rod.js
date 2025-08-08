#!/usr/bin/env node

/**
 * Emergency Fix for upgrade-rod.js
 * Replace completely broken file with working version
 */

import fs from 'fs';

console.log('🚨 EMERGENCY FIX FOR UPGRADE-ROD\n');

const workingCode = `import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
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
          content: '❌ **Bạn cần có tài khoản trước!**\\n\\nHãy dùng lệnh \`/fish\` để tạo tài khoản.'
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

      // Initialize rodDurability if not exists
      if (user.rodDurability === undefined || user.rodDurability === null) {
        const currentRod = getRodBenefits(currentLevel);
        user.rodDurability = currentRod.durability;
      }

      // Determine upgrade target
      let upgradeToLevel;
      if (targetLevel) {
        upgradeToLevel = targetLevel;
        
        if (upgradeToLevel <= currentLevel) {
          return await interaction.editReply({
            content: \`❌ **Không thể nâng cấp!**\\n\\nBạn đã ở Level \${currentLevel}, không thể nâng cấp xuống Level \${upgradeToLevel}.\`
          });
        }
        
        if (upgradeToLevel > currentLevel + 1) {
          return await interaction.editReply({
            content: \`❌ **Không thể bỏ qua level!**\\n\\nBạn đang ở Level \${currentLevel}, chỉ có thể nâng cấp lên Level \${currentLevel + 1}.\\n\\nHãy nâng cấp tuần tự: \${currentLevel} → \${currentLevel + 1} → ... → \${upgradeToLevel}\`
          });
        }
      } else {
        upgradeToLevel = currentLevel + 1;
      }

      // Check if already at max level
      if (currentLevel >= 20) {
        const currentRod = getRodBenefits(currentLevel);
        const embed = new EmbedBuilder()
          .setTitle('🏆 **MAXIMUM LEVEL REACHED**')
          .setDescription(\`**\${interaction.user.username}** - Đã đạt cấp độ tối đa!\`)
          .setColor(getRodTierColor(currentRod.tier))
          .setTimestamp();

        return await interaction.editReply({ embeds: [embed] });
      }

      const nextRod = getRodBenefits(upgradeToLevel);
      const upgradeInfo = getUpgradeInfo(currentLevel, userBalance);

      // Check VIP requirements
      if (nextRod.vipRequired) {
        const userVipTier = user.currentVipTier || user.vipTier || null;
        
        const vipHierarchy = {
          'bronze': 1,
          'silver': 2, 
          'gold': 3,
          'diamond': 4
        };
        
        const requiredVipLevel = vipHierarchy[nextRod.vipRequired.toLowerCase()] || 0;
        const userVipLevel = vipHierarchy[String(userVipTier || '').toLowerCase()] || 0;
        
        const hasVipAccess = userVipLevel >= requiredVipLevel;

        if (!hasVipAccess) {
          return await interaction.editReply({
            content: \`👑 **VIP Required!**\\n\\n\` +
                     \`**\${nextRod.name}** requires **VIP \${nextRod.vipRequired.toUpperCase()}** or higher.\\n\\n\` +
                     \`**Your VIP:** \${userVipTier ? userVipTier.toUpperCase() : 'NONE'}\\n\` +
                     \`**Required:** VIP \${nextRod.vipRequired.toUpperCase()}\`
          });
        }
      }

      // Check if can afford
      if (!upgradeInfo.canUpgrade) {
        return await interaction.editReply({
          content: \`💰 **Insufficient Funds!**\\n\\n\` +
                   \`**Cost:** \${nextRod.cost.toLocaleString()} xu\\n\` +
                   \`**Your Balance:** \${userBalance.toLocaleString()} xu\\n\` +
                   \`**Missing:** \${upgradeInfo.missing.toLocaleString()} xu\`
        });
      }

      // Perform upgrade
      const oldRod = getRodBenefits(currentLevel);
      const newBalance = userBalance - nextRod.cost;

      // Update user data
      user.rodLevel = upgradeToLevel;
      user.balance = newBalance;
      
      if (!user.rodsOwned.includes(upgradeToLevel)) {
        user.rodsOwned.push(upgradeToLevel);
        user.rodsOwned.sort((a, b) => a - b);
      }

      user.rodDurability = nextRod.durability;

      // Save to database
      await user.save();

      // Create success embed
      const embed = new EmbedBuilder()
        .setTitle('🎉 **ROD UPGRADE SUCCESSFUL!**')
        .setDescription(\`**\${interaction.user.username}** đã nâng cấp cần câu thành công!\`)
        .setColor(getRodTierColor(nextRod.tier))
        .addFields({
          name: '📈 **Upgrade Summary**',
          value: \`\${oldRod.name} → **\${nextRod.name}**\\n\` +
                 \`Level \${currentLevel} → **Level \${upgradeToLevel}**\\n\` +
                 \`\${oldRod.tier} → **\${nextRod.tier}** Tier\`,
          inline: false
        })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('❌ Upgrade rod command error:', error);
      
      await interaction.editReply({
        content: \`❌ **Có lỗi khi nâng cấp cần câu:**\\n\\\`\\\`\\\`\${error.message}\\\`\\\`\\\`\`
      });
    }
  }
};`;

try {
  // Backup broken file
  const backupName = `./commands/upgrade-rod-broken-${Date.now()}.js`;
  if (fs.existsSync('./commands/upgrade-rod.js')) {
    fs.copyFileSync('./commands/upgrade-rod.js', backupName);
    console.log(`📋 Backed up broken file to: ${backupName}`);
  }

  // Write working code
  fs.writeFileSync('./commands/upgrade-rod.js', workingCode);
  console.log('✅ Replaced upgrade-rod.js with WORKING version');

  console.log('\n🎉 EMERGENCY FIX COMPLETED!');
  console.log('🚀 Restart your bot NOW');
  console.log('🎣 /upgrade-rod should work properly');

} catch (error) {
  console.error('❌ Emergency fix failed:', error.message);
  console.log('\n💡 Manual steps:');
  console.log('1. Delete commands/upgrade-rod.js');
  console.log('2. Use /upgrade-rod-fixed command instead');
}

console.log('\n✅ Emergency fix script completed!');