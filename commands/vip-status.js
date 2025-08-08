import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('vip-status')
    .setDescription('👑 Xem trạng thái VIP của bạn'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const { VIP } = await import('../schemas/vipSchema.js');
      const { getUserVipStatus, VIP_TIERS } = await import('../utils/vipManager.js');

      const vipStatus = await getUserVipStatus(VIP, interaction.user.id);

      if (!vipStatus.isVip) {
        const embed = new EmbedBuilder()
          .setTitle('👤 VIP Status')
          .setDescription(`**${interaction.user.username}** chưa có VIP`)
          .addFields(
            { name: '👑 Trạng thái', value: 'Không có VIP', inline: true },
            { name: '🎯 Tier', value: 'None', inline: true },
            { name: '⏰ Thời gian', value: 'N/A', inline: true },
            { name: '🛒 Mua VIP', value: 'Dùng `/vip-shop` để mua VIP và nhận đặc quyền!', inline: false }
          )
          .setColor('#95a5a6')
          .setThumbnail(interaction.user.displayAvatarURL())
          .setTimestamp();

        return await interaction.editReply({ embeds: [embed] });
      }

      // Get tier config
      const tierConfig = VIP_TIERS[vipStatus.tier];
      const benefits = vipStatus.benefits;

      // Calculate time remaining
      const now = new Date();
      const timeRemaining = vipStatus.expiresAt ? vipStatus.expiresAt - now : null;
      const daysRemaining = timeRemaining ? Math.ceil(timeRemaining / (1000 * 60 * 60 * 24)) : null;

      const embed = new EmbedBuilder()
        .setTitle('👑 VIP Status')
        .setDescription(`**${interaction.user.username}** - ${tierConfig?.name || vipStatus.tier}`)
        .addFields(
          { name: '👑 VIP Tier', value: tierConfig?.name || vipStatus.tier, inline: true },
          { name: '⏰ Thời gian còn lại', value: daysRemaining ? `${daysRemaining} ngày` : 'Vĩnh viễn', inline: true },
          { name: '📅 Hết hạn', value: vipStatus.expiresAt ? `<t:${Math.floor(vipStatus.expiresAt.getTime()/1000)}:F>` : 'Không bao giờ', inline: true }
        )
        .setColor('#ffd700')
        .setThumbnail(interaction.user.displayAvatarURL())
        .setTimestamp();

      // Add benefits
      const benefitsList = [];
      
      if (benefits.fishingMissReduction > 0) {
        benefitsList.push(`🎣 Fishing miss rate: **-${benefits.fishingMissReduction}%**`);
      }
      
      if (benefits.rareFishBoost > 0) {
        benefitsList.push(`🐟 Rare fish chance: **+${benefits.rareFishBoost}%**`);
      }
      
      if (benefits.dailyBonus > 0) {
        benefitsList.push(`🎁 Daily bonus: **+${benefits.dailyBonus.toLocaleString()} xu**`);
      }
      
      if (benefits.casinoWinBoost > 0) {
        benefitsList.push(`🎰 Casino win rate: **+${benefits.casinoWinBoost}%**`);
      }
      
      if (benefits.cooldownReduction > 0) {
        benefitsList.push(`⏰ Cooldown reduction: **-${benefits.cooldownReduction}%**`);
      }
      
      if (benefits.shopDiscount > 0) {
        benefitsList.push(`🏪 Shop discount: **${benefits.shopDiscount}%**`);
      }
      
      if (benefits.mysteryBoxChance > 0) {
        benefitsList.push(`🎁 Daily mystery box chance: **${benefits.mysteryBoxChance}%**`);
      }
      
      if (benefits.automationHours > 0) {
        benefitsList.push(`🤖 Auto-fishing: **${benefits.automationHours}h/day**`);
      }
      
      if (benefits.hasNoCooldowns) {
        benefitsList.push(`🚀 **No cooldowns**`);
      }
      
      if (benefits.hasFullAutomation) {
        benefitsList.push(`🤖 **Full automation**`);
      }
      
      if (benefits.accessVipTables) {
        benefitsList.push(`🎰 **VIP tables access**`);
      }
      
      if (benefits.accessPrivateRooms) {
        benefitsList.push(`🏠 **Private rooms access**`);
      }

      if (benefitsList.length > 0) {
        embed.addFields({
          name: '🎁 Đặc Quyền Hiện Tại',
          value: benefitsList.join('\n'),
          inline: false
        });
      }

      // Add purchase history if available
      try {
        const vipRecord = await VIP.findOne({ userId: interaction.user.id });
        if (vipRecord && vipRecord.purchaseHistory.length > 0) {
          const latestPurchase = vipRecord.purchaseHistory[vipRecord.purchaseHistory.length - 1];
          embed.addFields({
            name: '📊 Thông Tin Mua Gần Nhất',
            value: `**Tier:** ${latestPurchase.tier}\n**Cost:** ${latestPurchase.cost.toLocaleString()} xu\n**Date:** <t:${Math.floor(latestPurchase.purchasedAt.getTime()/1000)}:F>`,
            inline: false
          });

          embed.addFields({
            name: '💰 Tổng Chi Tiêu VIP',
            value: `${vipRecord.totalSpent.toLocaleString()} xu`,
            inline: true
          });
        }
      } catch (error) {
        console.error('Error fetching VIP history:', error);
      }

      // Add renewal info
      if (daysRemaining && daysRemaining <= 7) {
        embed.addFields({
          name: '⚠️ Sắp Hết Hạn',
          value: `VIP của bạn sẽ hết hạn trong **${daysRemaining} ngày**!\nDùng \`/vip-shop\` để gia hạn.`,
          inline: false
        });
        embed.setColor('#ff9900');
      }

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('❌ VIP status error:', error);
      
      await interaction.editReply({
        content: `❌ **Có lỗi khi xem VIP status:**\n\`\`\`${error.message}\`\`\``
      });
    }
  }
};