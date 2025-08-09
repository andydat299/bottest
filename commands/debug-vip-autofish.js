import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

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
      
      // Get VIP data from database with correct field
      const vip = await VIP.findOne({ userId: userId });
      console.log('📊 VIP Database Data:', vip);
      
      // Get auto-fishing limits
      const limits = getAutoFishingLimits(vip);
      console.log('🎯 Auto-fishing limits:', limits);
      
      const embed = new EmbedBuilder()
        .setTitle('🔧 VIP Auto-Fishing Debug')
        .setDescription(`**${interaction.user.username}** - VIP Status Analysis`)
        .setColor(vip?.isActive ? '#00ff00' : '#ff0000')
        .setTimestamp();

      // VIP Database Status
      if (vip) {
        const currentTier = vip.currentTier || vip.tier || 'N/A';
        const expiresAt = vip.expiresAt ? new Date(vip.expiresAt) : null;
        const isExpired = expiresAt ? new Date() > expiresAt : false;
        
        embed.addFields({
          name: '📊 VIP Database Record',
          value: `**Exists:** ✅ Yes\n` +
                 `**User ID:** ${vip.userId}\n` +
                 `**Tier:** ${currentTier}\n` +
                 `**Active:** ${vip.isActive ? '✅ True' : '❌ False'}\n` +
                 `**Expires:** ${expiresAt ? expiresAt.toLocaleDateString() : 'Never'}\n` +
                 `**Expired:** ${isExpired ? '❌ Yes' : '✅ No'}\n` +
                 `**Total Spent:** ${vip.totalSpent || 0} xu\n` +
                 `**Created:** ${vip.createdAt ? new Date(vip.createdAt).toLocaleDateString() : 'N/A'}`,
          inline: false
        });
        
        // Show VIP benefits
        if (vip.benefits) {
          embed.addFields({
            name: '🎁 VIP Benefits',
            value: `**Automation Hours:** ${vip.benefits.automationHours || 0} hours/day\n` +
                   `**Fishing Miss Reduction:** ${vip.benefits.fishingMissReduction || 0}%\n` +
                   `**Rare Fish Boost:** ${vip.benefits.rareFishBoost || 0}%\n` +
                   `**Daily Bonus:** ${vip.benefits.dailyBonus || 0} xu\n` +
                   `**Shop Discount:** ${vip.benefits.shopDiscount || 0}%`,
            inline: false
          });
        }
        
      } else {
        embed.addFields({
          name: '📊 VIP Database Record',
          value: `❌ **No VIP record found**\n\n**Possible Issues:**\n• No VIP purchased yet\n• Wrong userId field\n• Database sync issue\n\n**User ID searched:** ${userId}`,
          inline: false
        });
      }
      
      // Auto-fishing limits analysis
      embed.addFields({
        name: '🎣 Auto-Fishing Access',
        value: `**Enabled:** ${limits.enabled ? '✅ Yes' : '❌ No'}\n` +
               `**VIP Name:** ${limits.name}\n` +
               `**Daily Minutes:** ${limits.dailyMinutes} minutes\n` +
               `**Tier Required:** gold/diamond/platinum\n` +
               `**Current Tier:** ${vip?.currentTier || 'none'}\n` +
               `**Reason:** ${limits.reason || 'Access granted'}`,
        inline: false
      });
      
      // Schema compatibility check
      embed.addFields({
        name: '🔧 Schema Compatibility',
        value: `**Field Mapping:**\n` +
               `• userId: ${vip?.userId ? '✅' : '❌'} (required)\n` +
               `• currentTier: ${vip?.currentTier ? '✅' : '❌'} (required)\n` +
               `• isActive: ${vip?.isActive !== undefined ? '✅' : '❌'} (required)\n` +
               `• expiresAt: ${vip?.expiresAt ? '✅' : '⚪'} (optional)\n\n` +
               `**Auto-fishing supports:** currentTier and tier fields`,
        inline: false
      });
      
      // Diagnosis and fixes
      let diagnosis = '';
      let fixes = [];
      
      if (!vip) {
        diagnosis = '❌ **No VIP Record Found**';
        fixes = [
          'Contact admin to purchase VIP',
          'Use `/set-vip` command (admin only)',
          'Check if userId field is correct',
          'Verify database connection'
        ];
      } else if (!vip.isActive) {
        diagnosis = '⚠️ **VIP Inactive**';
        fixes = [
          'Contact admin to activate VIP',
          'Check if payment was processed',
          'Verify VIP purchase history'
        ];
      } else if (vip.expiresAt && new Date() > new Date(vip.expiresAt)) {
        diagnosis = '⚠️ **VIP Expired**';
        fixes = [
          `Expired on: ${new Date(vip.expiresAt).toLocaleDateString()}`,
          'Renew VIP subscription',
          'Contact admin for extension'
        ];
      } else if (!['gold', 'diamond', 'platinum', 'silver'].includes(vip.currentTier)) {
        diagnosis = '⚠️ **Wrong VIP Tier**';
        fixes = [
          `Current tier: "${vip.currentTier}" - Need: gold/diamond/platinum`,
          'Upgrade VIP to Gold or higher',
          'Contact admin to fix VIP tier',
          'Bronze tier does not include auto-fishing'
        ];
      } else if (vip.currentTier === 'silver') {
        diagnosis = '✅ **Limited Auto-Fishing Access**';
        fixes = [
          'Silver VIP: 60 minutes/day auto-fishing',
          'Upgrade to Gold for 120 minutes/day',
          'Consider Diamond (300 min) or Platinum (480 min)'
        ];
      } else {
        diagnosis = '✅ **VIP Should Work**';
        fixes = [
          'Try `/auto-fishing start 5` again',
          'Check Railway logs for detailed errors',
          'Restart Discord and try again',
          'Contact support if issue persists'
        ];
      }
      
      embed.addFields({
        name: '🔧 Diagnosis',
        value: diagnosis,
        inline: false
      });
      
      embed.addFields({
        name: '💡 Suggested Actions',
        value: fixes.map((fix, index) => `${index + 1}. ${fix}`).join('\n'),
        inline: false
      });
      
      // Debug info for developers
      embed.addFields({
        name: '🐛 Debug Info',
        value: `**User ID:** ${userId}\n` +
               `**VIP Query Result:** ${vip ? 'Found' : 'Not found'}\n` +
               `**Schema Version:** currentTier + userId format\n` +
               `**Function Result:** ${JSON.stringify({enabled: limits.enabled, minutes: limits.dailyMinutes})}`,
        inline: false
      });

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('❌ Debug VIP error:', error);
      
      await interaction.editReply({
        content: `❌ **Debug failed:**\n\`\`\`${error.message}\`\`\`\n\n**Possible causes:**\n• Database connection issue\n• Schema import error\n• VIP collection not found`
      });
    }
  }
};