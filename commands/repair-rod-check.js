import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getRodBenefits } from '../utils/rodManager.js';

export default {
  data: new SlashCommandBuilder()
    .setName('repair-rod-check')
    .setDescription('🔧 Check và sửa lỗi repair rod system'),

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

      const rodLevel = user.rodLevel || 1;
      const currentDurability = user.rodDurability || 0;
      const currentRod = getRodBenefits(rodLevel);

      console.log('🔧 REPAIR CHECK DEBUG:');
      console.log('User:', user.username || interaction.user.username);
      console.log('Rod Level:', rodLevel);
      console.log('Current Durability:', currentDurability);
      console.log('Rod Max Durability (from rodManager):', currentRod.durability);
      console.log('Rod Name:', currentRod.name);
      console.log('Rod Tier:', currentRod.tier);

      // Check if durability system is broken
      const isDurabilityBroken = currentDurability > currentRod.durability;
      const isMaxDurabilityWrong = currentRod.durability !== expectedDurabilityForLevel(rodLevel);

      function expectedDurabilityForLevel(level) {
        // Based on rod levels 1-20 durability progression
        const durabilityMap = {
          1: 100, 2: 120, 3: 140, 4: 160, 5: 180,
          6: 200, 7: 220, 8: 240, 9: 260, 10: 280,
          11: 500, 12: 550, 13: 600, 14: 650, 15: 700,
          16: 800, 17: 900, 18: 1000, 19: 1200, 20: 1500
        };
        return durabilityMap[level] || 100;
      }

      const expectedMaxDurability = expectedDurabilityForLevel(rodLevel);
      const durabilityPercent = Math.round((currentDurability / currentRod.durability) * 100);

      const embed = new EmbedBuilder()
        .setTitle('🔧 **REPAIR SYSTEM CHECK**')
        .setDescription(`**${interaction.user.username}** - Kiểm tra hệ thống sửa chữa`)
        .setColor(isDurabilityBroken ? '#ff0000' : isMaxDurabilityWrong ? '#ffa500' : '#00ff00')
        .addFields({
          name: '🎣 **Rod Information**',
          value: `**Name:** ${currentRod.name}\n` +
                 `**Level:** ${rodLevel}/20\n` +
                 `**Tier:** ${currentRod.tier}`,
          inline: true
        })
        .addFields({
          name: '🔧 **Durability Analysis**',
          value: `**Current:** ${currentDurability}\n` +
                 `**Max (System):** ${currentRod.durability}\n` +
                 `**Expected Max:** ${expectedMaxDurability}\n` +
                 `**Percentage:** ${durabilityPercent}%`,
          inline: true
        });

      // Issue detection
      let issues = [];
      let fixes = [];

      if (isDurabilityBroken) {
        issues.push(`❌ Current durability (${currentDurability}) > Max durability (${currentRod.durability})`);
        fixes.push(`Set current durability to max: ${currentRod.durability}`);
      }

      if (isMaxDurabilityWrong) {
        issues.push(`⚠️ Max durability (${currentRod.durability}) ≠ Expected (${expectedMaxDurability})`);
        fixes.push(`Update rodManager.js durability for level ${rodLevel}`);
      }

      if (currentDurability <= 0) {
        issues.push(`❌ Invalid durability: ${currentDurability}`);
        fixes.push(`Set durability to 80% of max: ${Math.floor(expectedMaxDurability * 0.8)}`);
      }

      if (issues.length > 0) {
        embed.addFields({
          name: '🚨 **Issues Detected**',
          value: issues.join('\n'),
          inline: false
        });

        embed.addFields({
          name: '🔧 **Suggested Fixes**',
          value: fixes.join('\n'),
          inline: false
        });

        // Auto-fix option
        embed.addFields({
          name: '⚡ **Auto-Fix Available**',
          value: '**Commands to fix:**\n' +
                 '• `/sync-rod` - Sync rod data with system\n' +
                 '• `/fix-durability` - Fix durability overflow\n' +
                 '• `/repair-rod` - Standard repair',
          inline: false
        });
      } else {
        embed.addFields({
          name: '✅ **System Status**',
          value: 'Repair system working correctly!\n' +
                 'All durability values are valid.',
          inline: false
        });
      }

      // Repair cost calculation
      const repairNeeded = expectedMaxDurability - currentDurability;
      const repairCost = Math.max(0, repairNeeded * 10);

      embed.addFields({
        name: '💰 **Repair Information**',
        value: `**Repair Needed:** ${Math.max(0, repairNeeded)} points\n` +
               `**Repair Cost:** ${repairCost.toLocaleString()} xu\n` +
               `**Full Repair:** ${currentDurability < expectedMaxDurability ? 'Available' : 'Not needed'}`,
        inline: true
      });

      // Debug information
      embed.addFields({
        name: '🐛 **Debug Info**',
        value: `**getRodBenefits(${rodLevel}):** ${currentRod.durability}\n` +
               `**expectedDurabilityForLevel(${rodLevel}):** ${expectedMaxDurability}\n` +
               `**Match:** ${currentRod.durability === expectedMaxDurability ? '✅' : '❌'}`,
        inline: true
      });

      embed.setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('❌ Repair check error:', error);
      
      await interaction.editReply({
        content: `❌ **Có lỗi khi kiểm tra repair system:**\n\`\`\`${error.message}\`\`\``
      });
    }
  }
};