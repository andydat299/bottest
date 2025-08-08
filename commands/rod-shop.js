import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { FISHING_RODS, getAvailableRods, getRodTierColor, getRodBenefits } from '../utils/rodManager.js';

export default {
  data: new SlashCommandBuilder()
    .setName('rod-shop')
    .setDescription('🏪 Xem cửa hàng cần câu và mua cần câu mới')
    .addStringOption(option =>
      option.setName('filter')
        .setDescription('Lọc cần câu theo tiêu chí')
        .addChoices(
          { name: '🆓 Free Access (Levels 1-10)', value: 'standard' },
          { name: '💎 VIP Required (Levels 11-20)', value: 'premium' },
          { name: '💰 Affordable Only', value: 'affordable' },
          { name: '🔒 VIP Locked', value: 'vip_locked' },
          { name: '📊 All Rods', value: 'all' }
        )
    )
    .addIntegerOption(option =>
      option.setName('level')
        .setDescription('Xem thông tin chi tiết của level cần câu cụ thể')
        .setMinValue(1)
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

      const userBalance = user.balance || 0;
      const userVipTier = user.vipTier || null;
      const currentRodLevel = user.rodLevel || 1;
      const filter = interaction.options.getString('filter') || 'all';
      const specificLevel = interaction.options.getInteger('level');

      // Initialize rodsOwned if not exists
      if (!user.rodsOwned || !Array.isArray(user.rodsOwned)) {
        user.rodsOwned = [];
        for (let i = 1; i <= currentRodLevel; i++) {
          if (!user.rodsOwned.includes(i)) {
            user.rodsOwned.push(i);
          }
        }
      }

      // If specific level requested, show detailed view
      if (specificLevel) {
        return await showRodDetails(interaction, specificLevel, userBalance, userVipTier, user.rodsOwned);
      }

      // Get available rods based on filter
      const availableRods = getAvailableRods(userBalance, userVipTier);
      let filteredRods = availableRods;

      switch (filter) {
        case 'standard':
          filteredRods = availableRods.filter(rod => rod.level <= 10);
          break;
        case 'premium':
          filteredRods = availableRods.filter(rod => rod.level > 10);
          break;
        case 'affordable':
          filteredRods = availableRods.filter(rod => rod.canAfford);
          break;
        case 'vip_locked':
          filteredRods = availableRods.filter(rod => rod.vipRequired && !rod.hasVipAccess);
          break;
        case 'all':
        default:
          filteredRods = availableRods;
          break;
      }

      // Create shop embed
      const embed = new EmbedBuilder()
        .setTitle('🏪 **FISHING ROD SHOP**')
        .setDescription(`**${interaction.user.username}** - Cửa hàng cần câu`)
        .setColor('#3498db')
        .setThumbnail(interaction.user.displayAvatarURL())
        .setTimestamp();

      // Add user info
      embed.addFields({
        name: '👤 **Your Info**',
        value: `**Balance:** ${userBalance.toLocaleString()} xu\n` +
               `**VIP Tier:** ${userVipTier ? userVipTier.toUpperCase() : 'None'}\n` +
               `**Current Rod:** Level ${currentRodLevel} - ${getRodBenefits(currentRodLevel).name}\n` +
               `**Rods Owned:** ${user.rodsOwned.length}/20`,
        inline: false
      });

      // Add filter info
      const filterNames = {
        'standard': '🆓 Free Access Rods (Levels 1-10)',
        'premium': '💎 VIP Required Rods (Levels 11-20)',
        'affordable': '💰 Affordable Rods Only',
        'vip_locked': '🔒 VIP Locked Rods',
        'all': '📊 All Fishing Rods'
      };

      embed.addFields({
        name: '🔍 **Current Filter**',
        value: filterNames[filter] || 'All Rods',
        inline: true
      });

      embed.addFields({
        name: '📊 **Shop Statistics**',
        value: `**Total Rods:** ${filteredRods.length}\n` +
               `**Affordable:** ${filteredRods.filter(r => r.canAfford).length}\n` +
               `**VIP Access:** ${filteredRods.filter(r => r.hasVipAccess).length}\n` +
               `**Can Purchase:** ${filteredRods.filter(r => r.canPurchase).length}`,
        inline: true
      });

      // Group rods by tier for better display
      const tierGroups = {};
      filteredRods.forEach(rod => {
        if (!tierGroups[rod.tier]) {
          tierGroups[rod.tier] = [];
        }
        tierGroups[rod.tier].push(rod);
      });

      // Display rods by tier
      for (const [tier, rods] of Object.entries(tierGroups)) {
        const tierEmoji = {
          'Starter': '🟢',
          'Basic': '🔵',
          'Advanced': '🟣',
          'Premium': '🔴',
          'Legendary': '🟡',
          'Mythical': '🟠',
          'Transcendent': '🌸'
        };

        let tierValue = '';
        rods.forEach(rod => {
          const owned = user.rodsOwned.includes(rod.level) ? '✅' : '⬜';
          const affordable = rod.canAfford ? '💰' : '❌';
          const vipAccess = rod.hasVipAccess ? '🔓' : '🔒';
          const canBuy = rod.canPurchase ? '🛒' : '⛔';

          tierValue += `${owned}${affordable}${vipAccess}${canBuy} **Lv.${rod.level}** ${rod.name}\n`;
          tierValue += `     💸 ${rod.cost.toLocaleString()} xu | `;
          tierValue += `⚡ ${rod.missReduction}% miss | 🌟 ${rod.rareBoost}% rare\n`;
          
          if (rod.vipRequired) {
            tierValue += `     🎫 VIP ${rod.vipRequired.toUpperCase()} required\n`;
          }
          tierValue += '\n';
        });

        if (tierValue) {
          embed.addFields({
            name: `${tierEmoji[tier] || '⚪'} **${tier} Tier**`,
            value: tierValue.trim(),
            inline: false
          });
        }
      }

      // Add legend
      embed.addFields({
        name: '📋 **Legend**',
        value: '✅ Owned | ⬜ Not Owned\n' +
               '💰 Can Afford | ❌ Too Expensive\n' +
               '🔓 VIP Access | 🔒 VIP Locked\n' +
               '🛒 Can Purchase | ⛔ Cannot Purchase',
        inline: true
      });

      // Add quick stats
      const totalCost = filteredRods.reduce((sum, rod) => sum + rod.cost, 0);
      const ownedCount = filteredRods.filter(rod => user.rodsOwned.includes(rod.level)).length;
      const affordableCount = filteredRods.filter(rod => rod.canAfford).length;

      embed.addFields({
        name: '📈 **Collection Progress**',
        value: `**Owned:** ${ownedCount}/${filteredRods.length} rods\n` +
               `**Can Afford:** ${affordableCount} rods\n` +
               `**Total Value:** ${totalCost.toLocaleString()} xu`,
        inline: true
      });

      // Add usage instructions
      embed.addFields({
        name: '💡 **How to Use**',
        value: '• Use `/rod-shop level:<number>` for detailed rod info\n' +
               '• Use `/upgrade-rod` to buy next rod level\n' +
               '• Use `/rod-shop filter:<type>` to filter rods\n' +
               '• Purchase VIP to unlock premium rods (11-20)',
        inline: false
      });

      // Create action buttons
      const actionRow = new ActionRowBuilder();

      // Quick upgrade button if next level is affordable
      if (currentRodLevel < 20) {
        const nextRod = getRodBenefits(currentRodLevel + 1);
        const canUpgrade = userBalance >= nextRod.cost && 
                          (!nextRod.vipRequired || userVipTier);

        actionRow.addComponents(
          new ButtonBuilder()
            .setCustomId('quick_upgrade')
            .setLabel(`Upgrade to Level ${currentRodLevel + 1}`)
            .setEmoji('⬆️')
            .setStyle(canUpgrade ? ButtonStyle.Success : ButtonStyle.Secondary)
            .setDisabled(!canUpgrade)
        );
      }

      // Filter buttons
      actionRow.addComponents(
        new ButtonBuilder()
          .setCustomId('filter_affordable')
          .setLabel('Affordable Only')
          .setEmoji('💰')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('filter_premium')
          .setLabel('Premium Rods')
          .setEmoji('💎')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('refresh_shop')
          .setLabel('Refresh')
          .setEmoji('🔄')
          .setStyle(ButtonStyle.Secondary)
      );

      await interaction.editReply({ 
        embeds: [embed],
        components: [actionRow]
      });

    } catch (error) {
      console.error('❌ Rod shop command error:', error);
      
      await interaction.editReply({
        content: `❌ **Có lỗi khi hiển thị shop:**\n\`\`\`${error.message}\`\`\``
      });
    }
  }
};

// Show detailed information for a specific rod
async function showRodDetails(interaction, level, userBalance, userVipTier, rodsOwned) {
  const rod = getRodBenefits(level);
  
  const embed = new EmbedBuilder()
    .setTitle(`🎣 **${rod.name}** - Level ${level}`)
    .setDescription(`Detailed information for ${rod.tier} tier fishing rod`)
    .setColor(getRodTierColor(rod.tier))
    .setThumbnail(interaction.user.displayAvatarURL())
    .setTimestamp();

  // Basic info
  embed.addFields({
    name: '📊 **Basic Information**',
    value: `**Level:** ${level}/20\n` +
           `**Tier:** ${rod.tier}\n` +
           `**Cost:** ${rod.cost.toLocaleString()} xu\n` +
           `**VIP Required:** ${rod.vipRequired ? rod.vipRequired.toUpperCase() : 'None'}`,
    inline: true
  });

  // Performance stats
  embed.addFields({
    name: '⚡ **Performance Stats**',
    value: `**Miss Reduction:** ${rod.missReduction}%\n` +
           `**Rare Fish Boost:** ${rod.rareBoost}%\n` +
           `**Durability:** ${rod.durability}\n` +
           `**Maintenance:** ${level <= 10 ? 'Low (5%)' : 'High (15%)'}`,
    inline: true
  });

  // Ownership status
  const owned = rodsOwned.includes(level);
  const canAfford = userBalance >= rod.cost;
  const hasVipAccess = !rod.vipRequired || userVipTier === rod.vipRequired ||
                      (userVipTier === 'diamond') ||
                      (userVipTier === 'gold' && ['bronze', 'silver'].includes(rod.vipRequired)) ||
                      (userVipTier === 'silver' && rod.vipRequired === 'bronze');

  embed.addFields({
    name: '🎯 **Acquisition Status**',
    value: `**Owned:** ${owned ? '✅ Yes' : '❌ No'}\n` +
           `**Can Afford:** ${canAfford ? '✅ Yes' : `❌ Need ${(rod.cost - userBalance).toLocaleString()} more xu`}\n` +
           `**VIP Access:** ${hasVipAccess ? '✅ Yes' : `❌ Need VIP ${rod.vipRequired?.toUpperCase()}`}\n` +
           `**Can Purchase:** ${!owned && canAfford && hasVipAccess ? '✅ Yes' : '❌ No'}`,
    inline: false
  });

  // Comparison with current rod if different
  const currentLevel = Math.max(...rodsOwned);
  if (level !== currentLevel) {
    const currentRod = getRodBenefits(currentLevel);
    const missImprovement = rod.missReduction - currentRod.missReduction;
    const rareImprovement = rod.rareBoost - currentRod.rareBoost;
    const durabilityImprovement = rod.durability - currentRod.durability;

    embed.addFields({
      name: `📈 **Upgrade Benefits (vs Level ${currentLevel})**`,
      value: `**Miss Reduction:** ${currentRod.missReduction}% → ${rod.missReduction}% (${missImprovement >= 0 ? '+' : ''}${missImprovement}%)\n` +
             `**Rare Boost:** ${currentRod.rareBoost}% → ${rod.rareBoost}% (${rareImprovement >= 0 ? '+' : ''}${rareImprovement}%)\n` +
             `**Durability:** ${currentRod.durability} → ${rod.durability} (${durabilityImprovement >= 0 ? '+' : ''}${durabilityImprovement})`,
      inline: false
    });
  }

  // Description and lore
  embed.addFields({
    name: '📖 **Description**',
    value: rod.description,
    inline: false
  });

  // ROI calculation
  if (!owned) {
    const expectedDailyIncome = 135 * (1 - Math.max(0.20 - rod.missReduction/100, 0.01)) * (1 + rod.rareBoost/100) * 10; // 10 fish per day
    const daysToROI = Math.ceil(rod.cost / expectedDailyIncome);
    
    embed.addFields({
      name: '💹 **Return on Investment**',
      value: `**Expected Daily Income:** ${Math.round(expectedDailyIncome).toLocaleString()} xu\n` +
             `**Days to Break Even:** ${daysToROI} days\n` +
             `**Weekly Profit:** ${Math.round(expectedDailyIncome * 7).toLocaleString()} xu`,
      inline: false
    });
  }

  return await interaction.editReply({ embeds: [embed] });
}