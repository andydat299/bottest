#!/usr/bin/env node

/**
 * Debug VIP Auto-Fishing Access
 * Check why VIP user cannot access auto-fishing
 */

import fs from 'fs';

console.log('🔍 DEBUGGING VIP AUTO-FISHING ACCESS\n');

// Create debug command to check VIP status
const debugVipContent = `import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('debug-vip-autofish')
    .setDescription('🔧 [DEBUG] Check VIP status for auto-fishing access'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const { VIP } = await import('../schemas/vipSchema.js');
      const { getAutoFishingLimits } = await import('../utils/autoFishingManager.js');
      
      const userId = interaction.user.id;
      console.log('🔍 Checking VIP status for user:', userId);
      
      // Get VIP data from database
      const vip = await VIP.findOne({ discordId: userId });
      console.log('📊 VIP Database Data:', vip);
      
      // Get auto-fishing limits
      const limits = getAutoFishingLimits(vip);
      console.log('🎯 Auto-fishing limits:', limits);
      
      const embed = new EmbedBuilder()
        .setTitle('🔧 VIP Auto-Fishing Debug')
        .setDescription(\`**\${interaction.user.username}** - VIP Status Analysis\`)
        .setColor(vip?.isActive ? '#00ff00' : '#ff0000')
        .setTimestamp();

      // VIP Database Status
      if (vip) {
        embed.addFields({
          name: '📊 VIP Database Record',
          value: \`**Exists:** ✅ Yes\\n\` +
                 \`**Tier:** \${vip.tier || 'N/A'}\\n\` +
                 \`**Active:** \${vip.isActive ? '✅ True' : '❌ False'}\\n\` +
                 \`**Start Date:** \${vip.startDate ? new Date(vip.startDate).toLocaleDateString() : 'N/A'}\\n\` +
                 \`**End Date:** \${vip.endDate ? new Date(vip.endDate).toLocaleDateString() : 'N/A'}\\n\` +
                 \`**Created:** \${vip.createdAt ? new Date(vip.createdAt).toLocaleDateString() : 'N/A'}\`,
          inline: false
        });
      } else {
        embed.addFields({
          name: '📊 VIP Database Record',
          value: '❌ **No VIP record found in database**\\n\\nThis means you don\\'t have VIP or it wasn\\'t properly saved.',
          inline: false
        });
      }
      
      // Auto-fishing limits analysis
      embed.addFields({
        name: '🎣 Auto-Fishing Access',
        value: \`**Enabled:** \${limits.enabled ? '✅ Yes' : '❌ No'}\\n\` +
               \`**VIP Name:** \${limits.name}\\n\` +
               \`**Daily Minutes:** \${limits.dailyMinutes} minutes\`,
        inline: false
      });
      
      // VIP tier requirements
      embed.addFields({
        name: '💎 VIP Tier Requirements',
        value: \`**Gold VIP:** 120 minutes/day (2 hours)\\n\` +
               \`**Diamond VIP:** 300 minutes/day (5 hours)\\n\` +
               \`**Platinum VIP:** 480 minutes/day (8 hours)\\n\\n\` +
               \`**Your tier needs to be:** gold, diamond, or platinum\`,
        inline: false
      });
      
      // Diagnosis
      let diagnosis = '';
      let fixes = [];
      
      if (!vip) {
        diagnosis = '❌ **No VIP Record Found**';
        fixes = [
          'Contact admin to add VIP to your account',
          'Use \`/set-vip\` command (admin only)',
          'Check if VIP was purchased but not activated'
        ];
      } else if (!vip.isActive) {
        diagnosis = '⚠️ **VIP Inactive**';
        fixes = [
          'Check if VIP expired',
          'Contact admin to reactivate VIP',
          'Renew VIP subscription'
        ];
      } else if (!['gold', 'diamond', 'platinum'].includes(vip.tier)) {
        diagnosis = '⚠️ **Wrong VIP Tier**';
        fixes = [
          \`Current tier: "\${vip.tier}" - Need: gold/diamond/platinum\`,
          'Upgrade VIP to Gold or higher',
          'Contact admin to fix VIP tier'
        ];
      } else {
        diagnosis = '✅ **VIP Should Work**';
        fixes = [
          'Try \`/auto-fishing start 5\` again',
          'Check if there are other errors',
          'Restart Discord and try again'
        ];
      }
      
      embed.addFields({
        name: '🔧 Diagnosis',
        value: diagnosis,
        inline: false
      });
      
      embed.addFields({
        name: '💡 Suggested Fixes',
        value: fixes.map((fix, index) => \`\${index + 1}. \${fix}\`).join('\\n'),
        inline: false
      });
      
      // Debug info for developers
      embed.addFields({
        name: '🐛 Debug Info',
        value: \`**User ID:** \${userId}\\n\` +
               \`**VIP Query:** \${vip ? 'Found' : 'Not found'}\\n\` +
               \`**Function Result:** \${JSON.stringify(limits)}\`,
        inline: false
      });

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('❌ Debug VIP error:', error);
      
      await interaction.editReply({
        content: \`❌ **Debug failed:**\\n\\\`\\\`\\\`\${error.message}\\\`\\\`\\\`\`
      });
    }
  }
};`;

fs.writeFileSync('./commands/debug-vip-autofish.js', debugVipContent);
console.log('✅ Created debug-vip-autofish.js');

// Also create VIP checker script
const vipCheckerContent = `#!/usr/bin/env node

/**
 * Check VIP Database Records
 * Verify VIP data integrity
 */

console.log('🔍 CHECKING VIP DATABASE RECORDS\\n');

try {
  // This would need to be run in environment with database access
  console.log('📊 To check VIP records:');
  console.log('1. Use /debug-vip-autofish command in Discord');
  console.log('2. Check Railway logs for VIP database queries');
  console.log('3. Verify VIP schema matches auto-fishing requirements');
  
  console.log('\\n🎯 Common VIP Issues:');
  console.log('❌ VIP tier is "basic" instead of "gold"');
  console.log('❌ VIP isActive = false (expired)');
  console.log('❌ VIP record not created properly');
  console.log('❌ Case sensitive tier names (Gold vs gold)');
  
  console.log('\\n✅ VIP tier must be exactly:');
  console.log('   • "gold" (lowercase)');
  console.log('   • "diamond" (lowercase)');
  console.log('   • "platinum" (lowercase)');
  
  console.log('\\n🔧 Manual fix commands:');
  console.log('   /set-vip @user tier:gold duration:30');
  console.log('   /debug-vip-autofish (to verify)');
  
} catch (error) {
  console.error('❌ VIP check error:', error);
}`;

fs.writeFileSync('./check-vip-db.js', vipCheckerContent);
console.log('✅ Created check-vip-db.js');

console.log('\n🎯 DEBUG TOOLS CREATED:');
console.log('1. /debug-vip-autofish - Discord command to check VIP status');
console.log('2. check-vip-db.js - Script with troubleshooting info');

console.log('\n🚀 NEXT STEPS:');
console.log('1. Deploy the debug command');
console.log('2. Use /debug-vip-autofish in Discord');
console.log('3. Check the results to see exact VIP issue');
console.log('4. Fix VIP based on diagnosis');

console.log('\n✅ VIP debug tools ready!');