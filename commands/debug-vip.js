import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getAvailableRods, getRodBenefits } from '../utils/rodManager.js';

export default {
  data: new SlashCommandBuilder()
    .setName('debug-vip')
    .setDescription('🔧 Debug VIP status and rod access'),
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

      const userVipTier = user.vipTier || null;
      const userBalance = user.balance || 0;
      const currentRodLevel = user.rodLevel || 1;

      const embed = new EmbedBuilder()
        .setTitle('🔧 **VIP DEBUG INFORMATION**')
        .setDescription(`**${interaction.user.username}** - Debug thông tin VIP`)
        .setColor('#3498db')
        .setTimestamp();

      // User VIP info with comprehensive field checking
      const allVipFields = {
        vipTier: user.vipTier,
        vipLevel: user.vipLevel,
        vip: user.vip,
        premium: user.premium,
        subscription: user.subscription,
        tier: user.tier,
        rank: user.rank,
        status: user.status
      };

      // Filter out null/undefined values
      const existingVipFields = Object.entries(allVipFields)
        .filter(([key, value]) => value !== null && value !== undefined)
        .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
        .join('\n');

      // Detect actual VIP value
      const possibleVipValues = Object.values(allVipFields).filter(Boolean);
      const detectedVip = possibleVipValues.find(vip => 
        ['bronze', 'silver', 'gold', 'diamond'].includes(String(vip).toLowerCase())
      );

      const userVipTier = detectedVip || user.vipTier || null;

      embed.addFields({
        name: '👑 **VIP Status**',
        value: `**Primary VIP Tier:** ${userVipTier ? userVipTier.toUpperCase() : 'NONE'}\n` +
               `**Detected VIP:** ${detectedVip ? detectedVip.toUpperCase() : 'NONE'}\n` +
               `**Balance:** ${userBalance.toLocaleString()} xu\n` +
               `**Current Rod Level:** ${currentRodLevel}`,
        inline: false
      });

      embed.addFields({
        name: '🔍 **All VIP Fields in Database**',
        value: existingVipFields || 'No VIP fields found',
        inline: false
      });

      // VIP hierarchy
      const vipHierarchy = {
        'bronze': 1,
        'silver': 2,
        'gold': 3,
        'diamond': 4
      };

      const userVipLevel = vipHierarchy[userVipTier?.toLowerCase()] || 0;

      embed.addFields({
        name: '🎯 **VIP Level Mapping**',
        value: `**Your VIP Level:** ${userVipLevel}\n` +
               `**Bronze Level:** 1\n` +
               `**Silver Level:** 2\n` +
               `**Gold Level:** 3\n` +
               `**Diamond Level:** 4`,
        inline: true
      });

      // Check specific rods
      const testLevels = [10, 11, 15, 20];
      let rodAccess = '';

      testLevels.forEach(level => {
        const rod = getRodBenefits(level);
        
        let hasAccess = true;
        if (rod.vipRequired) {
          const requiredVipLevel = vipHierarchy[rod.vipRequired.toLowerCase()] || 0;
          hasAccess = userVipLevel >= requiredVipLevel;
        }

        const accessIcon = hasAccess ? '✅' : '❌';
        const vipReq = rod.vipRequired ? rod.vipRequired.toUpperCase() : 'NONE';
        
        rodAccess += `${accessIcon} **Level ${level}** - VIP ${vipReq} required\n`;
      });

      embed.addFields({
        name: '🎣 **Rod Access Test**',
        value: rodAccess,
        inline: true
      });

      // Available rods count
      const availableRods = getAvailableRods(userBalance, userVipTier);
      const accessibleRods = availableRods.filter(rod => rod.hasVipAccess);
      const affordableRods = availableRods.filter(rod => rod.canAfford && rod.hasVipAccess);

      embed.addFields({
        name: '📊 **Access Summary**',
        value: `**Total Rods:** 20\n` +
               `**VIP Accessible:** ${accessibleRods.length}/20\n` +
               `**Can Afford:** ${affordableRods.length}/20\n` +
               `**Next Rod (${currentRodLevel + 1}):** ${currentRodLevel < 20 ? 
                 (availableRods[currentRodLevel].hasVipAccess ? '✅ VIP Access' : '❌ VIP Blocked') : 'Max Level'}`,
        inline: false
      });

      // Debug raw data
      embed.addFields({
        name: '🔍 **Raw Debug Data**',
        value: `\`\`\`json\n` +
               `{\n` +
               `  "vipTier": ${JSON.stringify(user.vipTier)},\n` +
               `  "vipType": "${typeof user.vipTier}",\n` +
               `  "vipLevel": ${userVipLevel},\n` +
               `  "rodLevel": ${currentRodLevel},\n` +
               `  "balance": ${userBalance}\n` +
               `}\`\`\``,
        inline: false
      });

      // Recommended actions
      if (userVipTier === 'bronze' || userVipTier === 'silver' || userVipTier === 'gold' || userVipTier === 'diamond') {
        embed.addFields({
          name: '✅ **VIP Status OK**',
          value: 'VIP đã được nhận diện chính xác.\n' +
                 'Nếu vẫn không thể nâng cấp, hãy thử:\n' +
                 '• Restart bot\n' +
                 '• Check database connection\n' +
                 '• Verify rod costs',
          inline: false
        });
      } else {
        embed.addFields({
          name: '❌ **VIP Issue Detected**',
          value: 'VIP tier không được nhận diện.\n' +
                 'Recommended actions:\n' +
                 '• Contact admin để set VIP\n' +
                 '• Check database field spelling\n' +
                 '• Verify VIP assignment process',
          inline: false
        });
      }

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('❌ Debug VIP command error:', error);
      
      await interaction.editReply({
        content: `❌ **Debug VIP failed:**\n\`\`\`${error.message}\`\`\``
      });
    }
  }
};