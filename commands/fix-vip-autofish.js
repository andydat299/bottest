import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('fix-vip-autofish')
    .setDescription('🔧 [ADMIN] Fix VIP auto-fishing access issues')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to fix VIP for')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('action')
        .setDescription('Fix action to perform')
        .setRequired(true)
        .addChoices(
          { name: 'Check VIP Status', value: 'check' },
          { name: 'Fix Tier Case', value: 'fix-case' },
          { name: 'Activate VIP', value: 'activate' },
          { name: 'Set Gold VIP', value: 'set-gold' }
        )
    ),

  async execute(interaction) {
    // Admin check
    if (!interaction.member.permissions.has('Administrator')) {
      return await interaction.reply({
        content: '❌ Only administrators can use this command!',
        ephemeral: true
      });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const { VIP } = await import('../schemas/vipSchema.js');
      const { getAutoFishingLimits } = await import('../utils/autoFishingManager.js');
      
      const targetUser = interaction.options.getUser('user');
      const action = interaction.options.getString('action');
      
      console.log(`🔧 Admin fixing VIP for user: ${targetUser.id}, action: ${action}`);
      
      // Get current VIP status
      let vip = await VIP.findOne({ discordId: targetUser.id });
      console.log('📊 Current VIP data:', vip);
      
      const embed = new EmbedBuilder()
        .setTitle('🔧 VIP Auto-Fishing Fix')
        .setDescription(`**${targetUser.username}** - Admin VIP Fix`)
        .setColor('#ffa500')
        .setTimestamp();

      let resultMessage = '';
      
      switch (action) {
        case 'check':
          const limits = getAutoFishingLimits(vip);
          
          embed.addFields({
            name: '📊 Current VIP Status',
            value: vip ? 
              `**Exists:** ✅ Yes\n**Tier:** ${vip.tier}\n**Active:** ${vip.isActive ? '✅' : '❌'}\n**Auto-fishing:** ${limits.enabled ? '✅' : '❌'}` :
              '❌ No VIP record found',
            inline: false
          });
          
          resultMessage = 'VIP status checked';
          break;
          
        case 'fix-case':
          if (!vip) {
            resultMessage = '❌ No VIP record to fix';
            break;
          }
          
          // Fix common case issues
          const tierFixes = {
            'Gold': 'gold',
            'GOLD': 'gold', 
            'Diamond': 'diamond',
            'DIAMOND': 'diamond',
            'Platinum': 'platinum',
            'PLATINUM': 'platinum'
          };
          
          const originalTier = vip.tier;
          if (tierFixes[vip.tier]) {
            vip.tier = tierFixes[vip.tier];
            await vip.save();
            resultMessage = `✅ Fixed tier: ${originalTier} → ${vip.tier}`;
          } else {
            resultMessage = `⚠️ Tier "${vip.tier}" doesn't need case fix`;
          }
          break;
          
        case 'activate':
          if (!vip) {
            resultMessage = '❌ No VIP record to activate';
            break;
          }
          
          vip.isActive = true;
          if (!vip.endDate || vip.endDate < new Date()) {
            // Extend VIP by 30 days if expired
            vip.endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          }
          await vip.save();
          resultMessage = '✅ VIP activated and extended';
          break;
          
        case 'set-gold':
          if (!vip) {
            // Create new VIP record
            const startDate = new Date();
            const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
            
            vip = new VIP({
              discordId: targetUser.id,
              tier: 'gold',
              isActive: true,
              startDate,
              endDate
            });
          } else {
            // Update existing
            vip.tier = 'gold';
            vip.isActive = true;
            if (!vip.endDate || vip.endDate < new Date()) {
              vip.endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            }
          }
          
          await vip.save();
          resultMessage = '✅ Set to Gold VIP (30 days)';
          break;
      }
      
      // Get updated status
      vip = await VIP.findOne({ discordId: targetUser.id });
      const finalLimits = getAutoFishingLimits(vip);
      
      embed.addFields({
        name: '🔧 Action Performed',
        value: resultMessage,
        inline: false
      });
      
      if (vip) {
        embed.addFields({
          name: '📊 Updated VIP Status',
          value: `**Tier:** ${vip.tier}\n**Active:** ${vip.isActive ? '✅' : '❌'}\n**End Date:** ${vip.endDate ? new Date(vip.endDate).toLocaleDateString() : 'N/A'}\n**Auto-fishing:** ${finalLimits.enabled ? '✅' : '❌'}\n**Daily Minutes:** ${finalLimits.dailyMinutes}`,
          inline: false
        });
      }
      
      embed.addFields({
        name: '🎣 Auto-Fishing Test',
        value: `User can now try: \`/auto-fishing start 5\`\nShould ${finalLimits.enabled ? '✅ work' : '❌ still fail'}`,
        inline: false
      });

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('❌ Fix VIP error:', error);
      
      await interaction.editReply({
        content: `❌ **Fix failed:**\n\`\`\`${error.message}\`\`\``
      });
    }
  }
};