import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { FISHING_RODS, getRodBenefits, getRodTierColor, getRodProgression } from '../utils/rodManager.js';

export default {
  data: new SlashCommandBuilder()
    .setName('fishing-rods')
    .setDescription('🎣 Xem tất cả cần câu và thông tin nâng cấp')
    .addStringOption(option =>
      option.setName('tier')
        .setDescription('Lọc theo tier cần câu')
        .setRequired(false)
        .addChoices(
          { name: '🆕 Starter (Level 1)', value: 'Starter' },
          { name: '🔰 Basic (Level 2-4)', value: 'Basic' },
          { name: '⚡ Advanced (Level 5-7)', value: 'Advanced' },
          { name: '💎 Premium (Level 8-10)', value: 'Premium' },
          { name: '🏆 Legendary (Level 11-15)', value: 'Legendary' },
          { name: '🌟 Mythical (Level 16-19)', value: 'Mythical' },
          { name: '✨ Transcendent (Level 20)', value: 'Transcendent' }
        )
    ),

  async execute(interaction) {
    const tierFilter = interaction.options.getString('tier');
    
    await interaction.deferReply();

    try {
      const { User } = await import('../schemas/userSchema.js');
      const { VIP } = await import('../schemas/vipSchema.js');

      // Get user data
      let user = await User.findOne({ discordId: interaction.user.id });
      if (!user) {
        user = new User({
          discordId: interaction.user.id,
          username: interaction.user.username,
          rodLevel: 1,
          rodsOwned: [1]
        });
        await user.save();
      }

      // Get VIP status
      let vipTier = null;
      const vipRecord = await VIP.findOne({ userId: interaction.user.id, isActive: true });
      if (vipRecord && (!vipRecord.expiresAt || new Date() <= vipRecord.expiresAt)) {
        vipTier = vipRecord.currentTier;
      }

      const currentRodLevel = user.rodLevel || 1;
      const rodsOwned = user.rodsOwned || [1];
      const userBalance = user.balance || 0;

      // Filter rods by tier if specified
      let rodsToShow = [];
      for (let level = 1; level <= 20; level++) {
        const rod = FISHING_RODS[level];
        if (!tierFilter || rod.tier === tierFilter) {
          rodsToShow.push({
            level,
            ...rod,
            owned: rodsOwned.includes(level),
            current: level === currentRodLevel,
            canAfford: userBalance >= rod.cost,
            hasVipAccess: !rod.vipRequired || 
                         vipTier === rod.vipRequired ||
                         (vipTier === 'diamond') ||
                         (vipTier === 'gold' && ['bronze', 'silver'].includes(rod.vipRequired)) ||
                         (vipTier === 'silver' && rod.vipRequired === 'bronze')
          });
        }
      }

      // Create main embed
      const embed = new EmbedBuilder()
        .setTitle('🎣 **FISHING RODS COLLECTION**')
        .setDescription(`**${interaction.user.username}** - Rod Progression System`)
        .setColor(getRodTierColor(FISHING_RODS[currentRodLevel].tier))
        .setThumbnail(interaction.user.displayAvatarURL())
        .setTimestamp();

      // Current rod info
      const currentRod = FISHING_RODS[currentRodLevel];
      const progression = getRodProgression(currentRodLevel);
      
      embed.addFields({
        name: '🎯 **Current Rod**',
        value: `${currentRod.name}\n` +
               `**Level:** ${currentRodLevel}/20 (${progression.progressPercent}%)\n` +
               `**Tier:** ${currentRod.tier}\n` +
               `**Miss Reduction:** -${currentRod.missReduction}%\n` +
               `**Rare Boost:** +${currentRod.rareBoost}%\n` +
               `**Durability:** ${currentRod.durability}`,
        inline: false
      });

      // Show filtered rods (max 10 per page)
      const maxPerPage = 8;
      const startIndex = 0;
      const endIndex = Math.min(startIndex + maxPerPage, rodsToShow.length);
      const displayRods = rodsToShow.slice(startIndex, endIndex);

      if (displayRods.length > 0) {
        const rodList = displayRods.map(rod => {
          const status = rod.current ? '🔸 **ĐANG SỬ DỤNG**' :
                        rod.owned ? '✅ **ĐÃ SỞ HỮU**' :
                        rod.canAfford && rod.hasVipAccess ? '💰 **CÓ THỂ MUA**' :
                        !rod.hasVipAccess ? '🔒 **CẦN VIP**' :
                        '❌ **KHÔNG ĐỦ XU**';
          
          const vipReq = rod.vipRequired ? ` (VIP ${rod.vipRequired.toUpperCase()})` : '';
          
          return `**${rod.level}.** ${rod.name}${vipReq}\n` +
                 `├ **Cost:** ${rod.cost.toLocaleString()} xu\n` +
                 `├ **Benefits:** -${rod.missReduction}% miss, +${rod.rareBoost}% rare\n` +
                 `└ ${status}`;
        }).join('\n\n');

        const tierTitle = tierFilter ? `🎣 **${tierFilter} Tier Rods**` : '🎣 **All Fishing Rods**';
        embed.addFields({
          name: tierTitle,
          value: rodList.length > 1024 ? rodList.substring(0, 1020) + '...' : rodList,
          inline: false
        });
      }

      // User stats
      embed.addFields({
        name: '📊 **Your Progress**',
        value: `**Balance:** ${userBalance.toLocaleString()} xu\n` +
               `**VIP Status:** ${vipTier ? vipTier.toUpperCase() : 'None'}\n` +
               `**Rods Owned:** ${rodsOwned.length}/20\n` +
               `**Collection:** ${(rodsOwned.length / 20 * 100).toFixed(1)}%`,
        inline: true
      });

      // Next upgrade info if not max level
      if (currentRodLevel < 20) {
        const nextRod = FISHING_RODS[currentRodLevel + 1];
        const canUpgrade = userBalance >= nextRod.cost &&
                          (!nextRod.vipRequired || 
                           vipTier === nextRod.vipRequired ||
                           (vipTier === 'diamond') ||
                           (vipTier === 'gold' && ['bronze', 'silver'].includes(nextRod.vipRequired)) ||
                           (vipTier === 'silver' && nextRod.vipRequired === 'bronze'));

        embed.addFields({
          name: '⬆️ **Next Upgrade**',
          value: `${nextRod.name}\n` +
                 `**Cost:** ${nextRod.cost.toLocaleString()} xu\n` +
                 `**Improvement:** +${nextRod.missReduction - currentRod.missReduction}% miss reduction\n` +
                 `**Status:** ${canUpgrade ? '✅ Ready to upgrade!' : '❌ Requirements not met'}`,
          inline: true
        });
      } else {
        embed.addFields({
          name: '🏆 **Maximum Level**',
          value: '**Congratulations!**\nYou have reached the ultimate fishing rod!\n✨ **TRANSCENDENT TIER** ✨',
          inline: true
        });
      }

      // Instructions
      embed.addFields({
        name: '💡 **Commands**',
        value: '• `/upgrade-rod level:<level>` - Nâng cấp cần câu\n' +
               '• `/rod-shop` - Mua cần câu mới\n' +
               '• `/fishing-rods tier:<tier>` - Lọc theo tier\n' +
               '• `/fishstats` - Xem thống kê fishing',
        inline: false
      });

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('❌ Fishing rods command error:', error);
      
      await interaction.editReply({
        content: `❌ **Có lỗi khi tải thông tin cần câu:**\n\`\`\`${error.message}\`\`\``
      });
    }
  }
};