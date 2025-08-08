import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getRodBenefits, getRodDurabilityStatus, getRodDurabilityInfo, calculateRepairCost } from '../utils/rodManager.js';

export default {
  data: new SlashCommandBuilder()
    .setName('rod-status')
    .setDescription('🔧 Kiểm tra tình trạng và độ bền của cần câu'),
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

      const rodLevel = user.rodLevel || 1;
      const currentDurability = user.rodDurability || 100;
      const rod = getRodBenefits(rodLevel);
      const maxDurability = rod.durability;
      
      // Get durability status
      const durabilityStatus = getRodDurabilityStatus(currentDurability, maxDurability);
      const durabilityInfo = getRodDurabilityInfo(rodLevel);
      const repairCost = calculateRepairCost(rodLevel, currentDurability, maxDurability);

      const embed = new EmbedBuilder()
        .setTitle('🔧 **ROD STATUS & DURABILITY**')
        .setDescription(`**${interaction.user.username}** - Tình trạng cần câu`)
        .setColor(durabilityStatus.durabilityPercent >= 60 ? '#2ecc71' : 
                 durabilityStatus.durabilityPercent >= 30 ? '#f39c12' : '#e74c3c')
        .setThumbnail(interaction.user.displayAvatarURL())
        .setTimestamp();

      // Current rod info
      embed.addFields({
        name: '🎣 **Current Rod**',
        value: `**${rod.name}**\n` +
               `**Level:** ${rodLevel}/20\n` +
               `**Tier:** ${rod.tier}\n` +
               `**Benefits:** -${rod.missReduction}% miss, +${rod.rareBoost}% rare`,
        inline: true
      });

      // Durability status
      const durabilityBar = createDurabilityBar(currentDurability, maxDurability, 15);
      embed.addFields({
        name: `${durabilityStatus.emoji} **Durability Status**`,
        value: `**Status:** ${durabilityStatus.status}\n` +
               `**Durability:** ${currentDurability}/${maxDurability} (${durabilityStatus.durabilityPercent}%)\n` +
               `${durabilityBar}\n` +
               `${durabilityStatus.warning ? `⚠️ **${durabilityStatus.warning}**` : '✅ **Rod in good condition**'}`,
        inline: true
      });

      // Maintenance info
      embed.addFields({
        name: '🔧 **Maintenance Info**',
        value: `**Tier:** ${durabilityInfo.tier}\n` +
               `**Maintenance:** ${durabilityInfo.maintenance}\n` +
               `**Durability Loss:** ${durabilityInfo.durabilityPerUse} per use\n` +
               `**Break Chance:** ${durabilityInfo.breakChance}\n` +
               `**Expected Uses:** ~${durabilityInfo.expectedUses} before repair`,
        inline: false
      });

      // Repair cost
      if (currentDurability < maxDurability) {
        embed.addFields({
          name: '💰 **Repair Information**',
          value: `**Repair Cost:** ${repairCost.toLocaleString()} xu\n` +
                 `**Full Repair Cost:** ${durabilityInfo.repairCost}\n` +
                 `**Damage:** ${((maxDurability - currentDurability) / maxDurability * 100).toFixed(1)}% damaged\n` +
                 `💡 Use \`/repair-rod\` to fix your rod`,
          inline: false
        });
      }

      // Tier-specific advice
      if (rodLevel <= 10) {
        embed.addFields({
          name: '💡 **Standard Tier Tips**',
          value: '• Low maintenance costs\n' +
                 '• Reliable and durable\n' +
                 '• Perfect for regular fishing\n' +
                 '• Repair when durability drops below 50%',
          inline: true
        });
      } else {
        embed.addFields({
          name: '⚡ **Premium Tier Tips**',
          value: '• High performance, high maintenance\n' +
                 '• Monitor durability closely\n' +
                 '• Repair when durability drops below 70%\n' +
                 '• Consider backup rod for safety',
          inline: true
        });
      }

      // Durability tier comparison
      embed.addFields({
        name: '📊 **Rod Performance Trade-offs**',
        value: `**Pros:** ${durabilityInfo.pros.join(', ')}\n` +
               `**Cons:** ${durabilityInfo.cons.join(', ')}\n` +
               `**Description:** ${durabilityInfo.description}`,
        inline: false
      });

      // Action recommendations
      const actions = [];
      if (durabilityStatus.durabilityPercent < 20) {
        actions.push('🚨 **Immediate repair required!**');
      } else if (durabilityStatus.durabilityPercent < 40) {
        actions.push('🔧 **Schedule repair soon**');
      } else if (durabilityStatus.durabilityPercent < 60) {
        actions.push('⏰ **Plan for upcoming repair**');
      } else {
        actions.push('✅ **No immediate action needed**');
      }

      if (rodLevel > 10 && durabilityStatus.durabilityPercent < 70) {
        actions.push('💎 **Premium rod needs frequent care**');
      }

      if (actions.length > 0) {
        embed.addFields({
          name: '🎯 **Recommended Actions**',
          value: actions.join('\n'),
          inline: false
        });
      }

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('❌ Rod status command error:', error);
      
      await interaction.editReply({
        content: `❌ **Có lỗi khi kiểm tra tình trạng cần câu:**\n\`\`\`${error.message}\`\`\``
      });
    }
  }
};

// Create durability bar
function createDurabilityBar(current, max, length = 15) {
  const percentage = current / max;
  const filled = Math.round(length * percentage);
  const empty = length - filled;
  
  let fillChar = '█';
  let emptyChar = '▒';
  
  // Color coding based on durability
  if (percentage >= 0.8) {
    fillChar = '🟢'; // Green
  } else if (percentage >= 0.6) {
    fillChar = '🟡'; // Yellow
  } else if (percentage >= 0.4) {
    fillChar = '🟠'; // Orange
  } else {
    fillChar = '🔴'; // Red
  }
  
  return fillChar.repeat(Math.max(0, filled)) + emptyChar.repeat(Math.max(0, empty));
}